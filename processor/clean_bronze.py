from pathlib import Path
import json
import pandas as pd

base_folder = Path(__file__).parent

bronze_file = base_folder / "data" / "bronze" / "clickstream_events.jsonl"
silver_folder = base_folder / "data" / "silver"
rejected_folder = base_folder / "data" / "rejected"

silver_folder.mkdir(parents=True, exist_ok=True)
rejected_folder.mkdir(parents=True, exist_ok=True)

valid_event_types = {
    "page_view",
    "search",
    "product_view",
    "add_to_cart",
    "checkout_started",
    "payment_success",
    "payment_failed",
    "order_created",
    "user_login",
}

required_fields = {
    "event_id",
    "event_type",
    "event_timestamp",
    "user_id",
    "session_id"
}

valid_events = []
rejected_events = []

if bronze_file.exists():
    lines = bronze_file.read_text(encoding="utf-8").splitlines()
else:
    lines = []

for line_number, line in enumerate(lines, start=1):
    if not line.strip():
        continue
    try:
        event = json.loads(line)

        missing_fields = required_fields - event.keys()

        if missing_fields:
            event["rejection_reason"] = f"Missing fields: {sorted(missing_fields)}"
            rejected_events.append(event)

        elif not str(event.get("session_id") or "").strip():
            event["rejection_reason"] = "session_id cannot be empty"
            rejected_events.append(event)

        elif event["event_type"] not in valid_event_types:
            event["rejection_reason"] = "Invalid event type"
            rejected_events.append(event)

        else:
            valid_events.append(event)

    except json.JSONDecodeError:
        rejected_events.append({
            "line_number": line_number,
            "rejection_reason": "Invalid JSON",
            "raw_value": line.strip()
        })

expected_columns = [
    "event_id", "event_type", "event_timestamp", "user_id", "session_id",
    "page_url", "device", "country", "search_term", "product_id",
    "product_name", "category", "price", "quantity", "order_id",
    "login_method",
]
df = pd.DataFrame(valid_events).reindex(columns=expected_columns)

# Convert timestamp and reject invalid timestamps
df["event_timestamp"] = pd.to_datetime(
    df["event_timestamp"],
    errors="coerce",
    utc=True
)

invalid_timestamp_rows = df[df["event_timestamp"].isna()].copy()
invalid_timestamp_rows["rejection_reason"] = "Invalid timestamp"

df = df.dropna(subset=["event_timestamp"])

# Keep product identifiers consistent between simulated and browser events.
df["product_id"] = df["product_id"].astype("string")
df["price"] = pd.to_numeric(df["price"], errors="coerce")
df["quantity"] = pd.to_numeric(df["quantity"], errors="coerce")

# Remove duplicate events using event_id
before_deduplication = len(df)
df = df.drop_duplicates(subset=["event_id"])
duplicates_removed = before_deduplication - len(df)

# Save cleaned data as Parquet
silver_file = silver_folder / "clean_clickstream_events.parquet"
df.to_parquet(silver_file, index=False)

# Save rejected records
all_rejected = rejected_events + invalid_timestamp_rows.to_dict("records")

rejected_file = rejected_folder / "rejected_clickstream_events.jsonl"
if all_rejected:
    with open(rejected_file, "w", encoding="utf-8") as file:
        for event in all_rejected:
            file.write(json.dumps(event, default=str) + "\n")
elif rejected_file.exists():
    rejected_file.unlink()

print("Cleaning completed")
print(f"Valid records saved: {len(df)}")
print(f"Duplicate records removed: {duplicates_removed}")
print(f"Rejected records: {len(all_rejected)}")
print(f"Silver file: {silver_file}")
