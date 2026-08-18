const crypto = require("crypto");
const { publishEvent } = require("../config/kafka");

const VALID_EVENT_TYPES = new Set([
  "page_view",
  "search",
  "product_view",
  "add_to_cart",
  "checkout_started",
  "payment_success",
  "payment_failed",
  "order_created",
  "user_login",
]);

const ALLOWED_DETAIL_FIELDS = new Set([
  "page_url",
  "device",
  "country",
  "search_term",
  "product_id",
  "product_name",
  "category",
  "price",
  "quantity",
  "order_id",
  "login_method",
]);

function serviceError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function cleanDetails(details) {
  return Object.fromEntries(
    Object.entries(details || {})
      .filter(([key, value]) => ALLOWED_DETAIL_FIELDS.has(key) && value !== undefined)
      .map(([key, value]) => [key, key === "product_id" ? String(value) : value]),
  );
}

async function trackEvent({ eventType, sessionId, userId = null, details = {} }) {
  if (!VALID_EVENT_TYPES.has(eventType)) {
    throw serviceError("Invalid event type.", 400);
  }
  if (!String(sessionId || "").trim()) {
    throw serviceError("A session_id is required.", 400);
  }

  const event = {
    event_id: crypto.randomUUID(),
    event_type: eventType,
    event_timestamp: new Date().toISOString(),
    user_id: userId === null || userId === undefined ? null : String(userId),
    session_id: String(sessionId),
    ...cleanDetails(details),
  };

  await publishEvent(event);
  return event;
}

module.exports = { VALID_EVENT_TYPES, trackEvent };
