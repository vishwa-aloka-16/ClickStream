const crypto = require("crypto");
const userRepository = require("../repositories/user.repository");

function createServiceError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function passwordMatches(password, storedPassword) {
  const [salt, storedHash] = storedPassword.split(":");
  if (!salt || !storedHash) return false;

  const suppliedHash = crypto.scryptSync(password, salt, 64);
  const savedHash = Buffer.from(storedHash, "hex");
  return suppliedHash.length === savedHash.length && crypto.timingSafeEqual(suppliedHash, savedHash);
}

async function register({ name, email, password }) {
  const cleanName = String(name || "").trim();
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanPassword = String(password || "");

  if (!cleanName || !cleanEmail || !cleanPassword) {
    throw createServiceError("Name, email, and password are required.", 400);
  }

  try {
    return await userRepository.createUser({
      name: cleanName,
      email: cleanEmail,
      password: hashPassword(cleanPassword),
    });
  } catch (error) {
    if (error.code === "23505") {
      throw createServiceError("An account with this email already exists.", 409);
    }
    throw error;
  }
}

async function login({ email, password }) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanPassword = String(password || "");

  if (!cleanEmail || !cleanPassword) {
    throw createServiceError("Email and password are required.", 400);
  }

  const user = await userRepository.findUserByEmail(cleanEmail);
  if (!user || !passwordMatches(cleanPassword, user.password)) {
    throw createServiceError("Email or password is incorrect.", 401);
  }

  delete user.password;
  return user;
}

module.exports = { register, login };
