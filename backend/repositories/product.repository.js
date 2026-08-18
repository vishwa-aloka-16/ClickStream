const pool = require("../config/db");

async function createProductsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id BIGSERIAL PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      category VARCHAR(100) NOT NULL DEFAULT 'Bags',
      price NUMERIC(12, 2) NOT NULL,
      image_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`
    ALTER TABLE products
    ADD COLUMN IF NOT EXISTS category VARCHAR(100) NOT NULL DEFAULT 'Bags'
  `);
}

async function createProduct({ name, description, category, price, imageUrl }) {
  const result = await pool.query(
    `INSERT INTO products (name, description, category, price, image_url)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, description, category, price, image_url, created_at`,
    [name, description, category, price, imageUrl],
  );

  return result.rows[0];
}

async function findAllProducts() {
  const result = await pool.query(
    `SELECT id, name, description, category, price, image_url, created_at
     FROM products
     ORDER BY created_at DESC`,
  );

  return result.rows;
}

async function findProductById(id) {
  const result = await pool.query(
    `SELECT id, name, description, category, price, image_url, created_at
     FROM products WHERE id = $1`,
    [id],
  );
  return result.rows[0] || null;
}

async function findProductsByIds(ids) {
  const result = await pool.query(
    `SELECT id, name, description, category, price, image_url, created_at
     FROM products WHERE id = ANY($1::bigint[])`,
    [ids],
  );
  return result.rows;
}

module.exports = {
  createProductsTable,
  createProduct,
  findAllProducts,
  findProductById,
  findProductsByIds,
};
