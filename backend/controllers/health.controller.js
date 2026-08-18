const pool = require("../config/db");

async function getHealth(_req, res) {
  try {
    await pool.query("SELECT 1");
    return res.json({ status: "ok", database: "connected" });
  } catch {
    return res.status(503).json({ status: "error", database: "disconnected" });
  }
}

module.exports = { getHealth };
