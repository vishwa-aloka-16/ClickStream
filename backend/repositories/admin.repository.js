const pool = require("../config/db");

async function createAdminsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id BIGSERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function createDefaultAdmin({ name, email, password }) {
  await pool.query(
    `INSERT INTO admins (name, email, password)
     VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE
     SET name = EXCLUDED.name, password = EXCLUDED.password`,
    [name, email, password],
  );
}

async function findAdminByEmail(email) {
  const result = await pool.query(
    "SELECT id, name, email, password, created_at FROM admins WHERE email = $1",
    [email],
  );
  return result.rows[0] || null;
}

module.exports = { createAdminsTable, createDefaultAdmin, findAdminByEmail };
