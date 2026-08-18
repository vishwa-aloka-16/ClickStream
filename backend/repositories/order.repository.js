const pool = require("../config/db");

async function createOrdersTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
      customer_name VARCHAR(150) NOT NULL,
      email VARCHAR(255) NOT NULL,
      shipping_address TEXT NOT NULL,
      items JSONB NOT NULL,
      total NUMERIC(12, 2) NOT NULL,
      payment_status VARCHAR(50) NOT NULL DEFAULT 'Verified',
      order_status VARCHAR(100) NOT NULL DEFAULT 'Order on the way',
      estimated_delivery DATE NOT NULL DEFAULT (CURRENT_DATE + 5),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function createOrder({ userId, customerName, email, shippingAddress, items, total }) {
  const result = await pool.query(
    `INSERT INTO orders (user_id, customer_name, email, shipping_address, items, total)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6)
     RETURNING *`,
    [userId, customerName, email, shippingAddress, JSON.stringify(items), total],
  );
  return result.rows[0];
}

async function findOrdersByUserId(userId) {
  const result = await pool.query(
    "SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC",
    [userId],
  );
  return result.rows;
}

async function findAllOrders() {
  const result = await pool.query("SELECT * FROM orders ORDER BY created_at DESC");
  return result.rows;
}

async function completeOrder(id) {
  const result = await pool.query(
    `UPDATE orders
     SET order_status = 'Completed'
     WHERE id = $1
     RETURNING *`,
    [id],
  );
  return result.rows[0] || null;
}

module.exports = { createOrdersTable, createOrder, findOrdersByUserId, findAllOrders, completeOrder };
