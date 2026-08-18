const orderService = require("../services/order.service");

async function createOrder(req, res) {
  try {
    const order = await orderService.createOrder(req.body);
    return res.status(201).json({ message: "Payment verified. Your order is on the way.", order });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : "Could not place the order.",
    });
  }
}

async function getOrders(req, res) {
  try {
    const orders = await orderService.getOrders(req.query.userId);
    return res.json({ orders });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : "Could not load orders.",
    });
  }
}

module.exports = { createOrder, getOrders };
