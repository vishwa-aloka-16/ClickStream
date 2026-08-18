const adminService = require("../services/admin.service");
const orderService = require("../services/order.service");

async function login(req, res) {
  try {
    const admin = await adminService.login(req.body);
    return res.json({ message: "Admin login successful.", admin });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : "Could not log in as admin.",
    });
  }
}

async function getOrders(_req, res) {
  try {
    const orders = await orderService.getAllOrders();
    return res.json({ orders });
  } catch {
    return res.status(500).json({ message: "Could not load admin orders." });
  }
}

async function completeOrder(req, res) {
  try {
    const order = await orderService.completeOrder(req.params.id);
    return res.json({ message: "Order marked as completed.", order });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : "Could not complete the order.",
    });
  }
}

module.exports = { login, getOrders, completeOrder };
