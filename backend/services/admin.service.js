const crypto = require("crypto");
const adminRepository = require("../repositories/admin.repository");

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  return `${salt}:${crypto.scryptSync(password, salt, 64).toString("hex")}`;
}

function passwordMatches(password, storedPassword) {
  const [salt, storedHash] = storedPassword.split(":");
  if (!salt || !storedHash) return false;
  const suppliedHash = crypto.scryptSync(password, salt, 64);
  const savedHash = Buffer.from(storedHash, "hex");
  return suppliedHash.length === savedHash.length && crypto.timingSafeEqual(suppliedHash, savedHash);
}

function serviceError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function initializeDefaultAdmin() {
  const email = String(process.env.ADMIN_EMAIL || "admin@vantage.com").toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD || "");
  if (!password) {
    throw new Error("ADMIN_PASSWORD must be set before the API can start.");
  }
  await adminRepository.createDefaultAdmin({
    name: process.env.ADMIN_NAME || "Vantage Admin",
    email,
    password: hashPassword(password),
  });
}

async function login({ email, password }) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanPassword = String(password || "");
  if (!cleanEmail || !cleanPassword) throw serviceError("Email and password are required.", 400);

  const admin = await adminRepository.findAdminByEmail(cleanEmail);
  if (!admin || !passwordMatches(cleanPassword, admin.password)) {
    throw serviceError("Admin email or password is incorrect.", 401);
  }
  delete admin.password;
  return admin;
}

module.exports = { initializeDefaultAdmin, login };
