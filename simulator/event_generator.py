from confluent_kafka import Producer
from datetime import datetime, timezone
from urllib.error import HTTPError, URLError
from urllib.parse import quote_plus
from urllib.request import urlopen
import argparse
import json
import os
import random
import time
import uuid


DEFAULT_API_URL = os.getenv("PRODUCT_API_URL", "http://localhost:3000")
DEFAULT_KAFKA_BROKER = os.getenv("KAFKA_BROKER", "localhost:9092")
DEFAULT_KAFKA_TOPIC = os.getenv("KAFKA_TOPIC", "clickstream-events")


def load_products(api_url):
    """Load and normalize the current product catalog from the application API."""
    endpoint = f"{api_url.rstrip('/')}/api/products"

    try:
        with urlopen(endpoint, timeout=10) as response:
            payload = json.load(response)
    except HTTPError as error:
        raise RuntimeError(
            f"Product API returned HTTP {error.code}: {endpoint}"
        ) from error
    except URLError as error:
        raise RuntimeError(
            f"Could not reach the product API at {endpoint}. Start the API first."
        ) from error

    database_products = payload.get("products")
    if not isinstance(database_products, list):
        raise RuntimeError("Product API response does not contain a products list.")

    products = []
    for row in database_products:
        try:
            products.append({
                "id": str(row["id"]),
                "name": str(row["name"]),
                "category": str(row.get("category") or "Bags"),
                "price": float(row["price"]),
            })
        except (KeyError, TypeError, ValueError):
            print(f"Skipping invalid database product: {row}")

    if not products:
        raise RuntimeError(
            "The database has no valid products. Add or seed products before simulation."
        )

    return products


def create_event(event_type, user_id, session_id, device, country, product=None, **extra):
    event = {
        "event_id": str(uuid.uuid4()),
        "event_type": event_type,
        "event_timestamp": datetime.now(timezone.utc).isoformat(),
        "user_id": user_id,
        "session_id": session_id,
        "device": device,
        "country": country,
    }

    if product:
        event.update({
            "product_id": product["id"],
            "product_name": product["name"],
            "category": product["category"],
            "price": product["price"],
        })

    event.update(extra)
    return event


def build_search_terms(products):
    terms = {product["name"].lower() for product in products}
    terms.update(product["category"].lower() for product in products)
    return sorted(terms)


def simulate_session(number, products, producer, topic, delivery_errors):
    user_id = f"user_{random.randint(1, 200):03d}"
    session_id = str(uuid.uuid4())
    device = random.choice(["mobile", "desktop", "tablet"])
    country = "Sri Lanka"
    product = random.choice(products)
    search_terms = build_search_terms(products)

    def delivery_report(error, _message):
        if error:
            delivery_errors.append(str(error))

    def send(event_type, selected_product=None, **details):
        event = create_event(
            event_type,
            user_id,
            session_id,
            device,
            country,
            selected_product,
            **details,
        )
        producer.produce(
            topic,
            key=user_id,
            value=json.dumps(event),
            callback=delivery_report,
        )
        producer.poll(0)

    send("page_view", page_url="/search")

    if random.random() < 0.65:
        search_term = random.choice(search_terms)
        send(
            "search",
            search_term=search_term,
            page_url=f"/search?q={quote_plus(search_term)}",
        )

    product_page = f"/product/{product['id']}"
    send("product_view", product, page_url=product_page)

    if random.random() < 0.55:
        quantity = random.randint(1, 3)
        send("add_to_cart", product, page_url=product_page, quantity=quantity)

        if random.random() < 0.65:
            send("checkout_started", product, page_url="/checkout", quantity=quantity)

            if random.random() < 0.80:
                order_id = f"ORD-{uuid.uuid4().hex[:8].upper()}"
                total_price = round(product["price"] * quantity, 2)
                purchase_details = {
                    "page_url": "/checkout",
                    "quantity": quantity,
                    "price": total_price,
                    "order_id": order_id,
                }
                send("payment_success", product, **purchase_details)
                send("order_created", product, **purchase_details)
            else:
                send(
                    "payment_failed",
                    product,
                    page_url="/checkout",
                    quantity=quantity,
                )

    print(f"Session {number} created for {user_id} using product {product['id']}")


def parse_args():
    parser = argparse.ArgumentParser(
        description="Generate clickstream events using products from the live database."
    )
    parser.add_argument("--sessions", type=int, default=100)
    parser.add_argument("--delay", type=float, default=0.05)
    parser.add_argument("--api-url", default=DEFAULT_API_URL)
    parser.add_argument("--kafka-broker", default=DEFAULT_KAFKA_BROKER)
    parser.add_argument("--kafka-topic", default=DEFAULT_KAFKA_TOPIC)
    parser.add_argument("--seed", type=int, help="Optional seed for reproducible data.")
    args = parser.parse_args()

    if args.sessions < 1:
        parser.error("--sessions must be at least 1")
    if args.delay < 0:
        parser.error("--delay cannot be negative")

    return args


def main():
    args = parse_args()
    if args.seed is not None:
        random.seed(args.seed)

    products = load_products(args.api_url)
    producer = Producer({"bootstrap.servers": args.kafka_broker})
    delivery_errors = []

    print(f"Loaded {len(products)} current database products from {args.api_url}.")
    print(f"Publishing synthetic events to {args.kafka_topic} at {args.kafka_broker}.")

    for session_number in range(1, args.sessions + 1):
        simulate_session(
            session_number,
            products,
            producer,
            args.kafka_topic,
            delivery_errors,
        )
        time.sleep(args.delay)

    undelivered = producer.flush(15)
    if undelivered or delivery_errors:
        sample_error = delivery_errors[0] if delivery_errors else "delivery timed out"
        raise RuntimeError(
            f"Kafka did not deliver {max(undelivered, len(delivery_errors))} event(s): "
            f"{sample_error}"
        )

    print(f"\nFinished creating {args.sessions} customer sessions.")


if __name__ == "__main__":
    main()
