const express = require("express");
const adminController = require("../controllers/admin.controller");

const router = express.Router();
router.post("/login", adminController.login);
router.get("/orders", adminController.getOrders);
router.patch("/orders/:id/complete", adminController.completeOrder);

module.exports = router;
