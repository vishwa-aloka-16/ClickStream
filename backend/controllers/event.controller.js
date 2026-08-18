const eventService = require("../services/event.services");

async function captureEvent(req, res, next) {
  try {
    const {
      event_type: eventType,
      session_id: sessionId,
      user_id: userId = null,
      ...details
    } = req.body || {};

    const event = await eventService.trackEvent({
      eventType,
      sessionId,
      userId,
      details,
    });

    return res.status(202).json({
      message: "Event sent to Kafka.",
      event_id: event.event_id,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { captureEvent };
