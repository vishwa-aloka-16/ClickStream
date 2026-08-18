const express = require("express");
const { captureEvent } = require("../controllers/event.controller");

const router = express.Router();

router.post("/", captureEvent);

module.exports = router;