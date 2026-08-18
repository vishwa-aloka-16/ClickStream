from pathlib import Path
import pandas as pd

base_folder = Path(__file__).parent

silver_file = base_folder / "data" / "silver" / "clean_clickstream_events.parquet"
gold_folder = base_folder / "data" / "gold"

gold_folder.mkdir(parents=True, exist_ok=True)

df = pd.read_parquet(silver_file)

# Create a date column for daily reporting
df["event_date"] = pd.to_datetime(df["event_timestamp"], utc=True).dt.date

# ----------------------------
# 1. Session-level funnel
# ----------------------------
session_funnel = (
    df.groupby("session_id")["event_type"]
    .agg(lambda events: set(events))
    .reset_index()
)

session_funnel["product_viewed"] = session_funnel["event_type"].apply(
    lambda events: "product_view" in events
)
session_funnel["added_to_cart"] = session_funnel["event_type"].apply(
    lambda events: "add_to_cart" in events
)
session_funnel["checkout_started"] = session_funnel["event_type"].apply(
    lambda events: "checkout_started" in events
)
session_funnel["purchased"] = session_funnel["event_type"].apply(
    lambda events: "payment_success" in events
)

total_sessions = len(session_funnel)
product_view_sessions = session_funnel["product_viewed"].sum()
cart_sessions = session_funnel["added_to_cart"].sum()
checkout_sessions = session_funnel["checkout_started"].sum()
purchase_sessions = session_funnel["purchased"].sum()

funnel_summary = pd.DataFrame([{
    "total_sessions": total_sessions,
    "product_view_sessions": product_view_sessions,
    "cart_sessions": cart_sessions,
    "checkout_sessions": checkout_sessions,
    "purchase_sessions": purchase_sessions,
    "cart_abandonment_sessions": cart_sessions - purchase_sessions,
    "product_to_cart_rate_pct": round(cart_sessions / product_view_sessions * 100, 2)
        if product_view_sessions else 0,
    "cart_to_checkout_rate_pct": round(checkout_sessions / cart_sessions * 100, 2)
        if cart_sessions else 0,
    "checkout_to_purchase_rate_pct": round(purchase_sessions / checkout_sessions * 100, 2)
        if checkout_sessions else 0,
    "overall_conversion_rate_pct": round(purchase_sessions / total_sessions * 100, 2)
        if total_sessions else 0
}])

# ----------------------------
# 2. Product performance
# ----------------------------
product_events = df[df["product_id"].notna()].copy()

product_performance = (
    product_events.groupby(["product_id", "product_name", "category"], dropna=False)
    .agg(
        product_views=("event_type", lambda x: (x == "product_view").sum()),
        add_to_carts=("event_type", lambda x: (x == "add_to_cart").sum()),
        purchases=("event_type", lambda x: (x == "payment_success").sum()),
        revenue=("price", lambda x: x[
            product_events.loc[x.index, "event_type"] == "payment_success"
        ].sum())
    )
    .reset_index()
)

# ----------------------------
# Save Gold tables
# ----------------------------
funnel_summary.to_parquet(
    gold_folder / "funnel_summary.parquet",
    index=False
)

product_performance.to_parquet(
    gold_folder / "product_performance.parquet",
    index=False
)

# CSV copies are convenient to view or load into Power BI
funnel_summary.to_csv(gold_folder / "funnel_summary.csv", index=False)
product_performance.to_csv(gold_folder / "product_performance.csv", index=False)

print("Gold layer created successfully.")
print("\nFunnel summary:")
print(funnel_summary.to_string(index=False))