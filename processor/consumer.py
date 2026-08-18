from confluent_kafka import Consumer
from pathlib import Path
import argparse
import json
import os

# Create the raw-data folder automatically, regardless of the launch directory.
base_folder = Path(__file__).resolve().parent
output_folder = base_folder / "data" / "bronze"
output_folder.mkdir(parents=True, exist_ok=True)

output_file = output_folder / "clickstream_events.jsonl"

parser = argparse.ArgumentParser(description="Write Kafka clickstream events to Bronze JSONL.")
parser.add_argument(
    "--max-messages",
    type=int,
    default=None,
    help="Stop after this many messages; omit to consume continuously.",
)
args = parser.parse_args()

if args.max_messages is not None and args.max_messages < 1:
    parser.error("--max-messages must be at least 1")

consumer = Consumer({
    "bootstrap.servers": os.getenv("KAFKA_BROKER", "localhost:9092"),
    "group.id": os.getenv("KAFKA_CONSUMER_GROUP", "clickstream-raw-writer"),
    "auto.offset.reset": "earliest",
    "enable.auto.commit": False,
})

consumer.subscribe([os.getenv("KAFKA_TOPIC", "clickstream-events")])

print("Saving Kafka events into:", output_file)
messages_saved = 0

try:
    while True:
        message = consumer.poll(1.0)

        if message is None:
            continue

        if message.error():
            print("Kafka error:", message.error())
            continue

        try:
            event = json.loads(message.value().decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as error:
            print("Skipping malformed Kafka message:", error)
            consumer.commit(message=message, asynchronous=False)
            continue

        # Save one JSON event per line
        with open(output_file, "a", encoding="utf-8") as file:
            file.write(json.dumps(event) + "\n")

        # Commit only after the Bronze record has been written successfully.
        consumer.commit(message=message, asynchronous=False)
        print("Saved:", event.get("event_type", "unknown"))
        messages_saved += 1

        if args.max_messages is not None and messages_saved >= args.max_messages:
            break

finally:
    consumer.close()
