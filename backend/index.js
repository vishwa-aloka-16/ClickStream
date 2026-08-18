const express = require("express");
const cors = require("cors");
const path = require("path");
const pool = require("./config/db");
const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const orderRoutes = require("./routes/order.routes");
const productRoutes = require("./routes/product.routes");
const eventRoutes = require("./routes/event.routes");
const healthController = require("./controllers/health.controller");
const userRepository = require("./repositories/user.repository");
const productRepository = require("./repositories/product.repository");
const adminRepository = require("./repositories/admin.repository");
const orderRepository = require("./repositories/order.repository");
const adminService = require("./services/admin.service");
const { disconnectProducer } = require("./config/kafka");


const app = express();
const port = Number(process.env.PORT || 3000);

const allowedOrigins = new Set([
  process.env.FRONTEND_URL || "http://localhost:5173",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
]);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS."));
  },
}));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/health", healthController.getHealth);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/products", productRoutes);
app.use("/api/events", eventRoutes);

app.use((error, _req, res, _next) => {
  console.error("Request error:", error.message);
  return res.status(error.statusCode || 500).json({
    message: error.statusCode ? error.message : "Could not process the request.",
  });
});

async function shutdown(signal) {
  console.log(`${signal} received. Closing connections...`);
  await Promise.allSettled([disconnectProducer(), pool.end()]);
  process.exit(0);
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));

async function startServer() {
  await userRepository.createUsersTable();
  await productRepository.createProductsTable();
  await adminRepository.createAdminsTable();
  await orderRepository.createOrdersTable();
  await adminService.initializeDefaultAdmin();

  app.listen(port, () => {
    console.log(`API running at http://localhost:${port}`);
    console.log("Connected to PostgreSQL");
  });
}

startServer().catch(async (error) => {
  console.error("Startup error:", error);
  await pool.end();
  process.exit(1);
});
