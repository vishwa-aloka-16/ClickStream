const orderRepository = require("../repositories/order.repository");
const productRepository = require("../repositories/product.repository");

function serviceError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function createOrder({ userId, customerName, email, shippingAddress, items }) {
  if (!userId || !customerName || !email || !shippingAddress || !Array.isArray(items) || !items.length) {
    throw serviceError("Customer, shipping, and cart details are required.", 400);
  }

  const productIds = [...new Set(items.map((item) => String(item.productId)))];
  const products = await productRepository.findProductsByIds(productIds);
  const productMap = new Map(products.map((product) => [String(product.id), product]));

  const orderItems = items.map((item) => {
    const product = productMap.get(String(item.productId));
    const quantity = Math.max(1, Number.parseInt(item.quantity, 10) || 1);
    if (!product) throw serviceError("One or more cart products no longer exist.", 400);
    return {
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      quantity,
      imageUrl: product.image_url,
    };
  });

  const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return orderRepository.createOrder({
    userId,
    customerName: String(customerName).trim(),
    email: String(email).trim().toLowerCase(),
    shippingAddress: String(shippingAddress).trim(),
    items: orderItems,
    total,
  });
}

async function getOrders(userId) {
  if (!userId) throw serviceError("User ID is required.", 400);
  return orderRepository.findOrdersByUserId(userId);
}

async function getAllOrders() {
  return orderRepository.findAllOrders();
}

async function completeOrder(id) {
  const order = await orderRepository.completeOrder(id);
  if (!order) throw serviceError("Order not found.", 404);
  return order;
}

module.exports = { createOrder, getOrders, getAllOrders, completeOrder };
