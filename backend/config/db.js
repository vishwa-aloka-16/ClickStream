const { Pool } = require("pg");

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://clickstream:clickstream@localhost:5432/clickstream",
});

module.exports = pool;
