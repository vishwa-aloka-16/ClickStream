const authService = require("../services/auth.service");

async function register(req, res) {
  try {
    const user = await authService.register(req.body);
    return res.status(201).json({ message: "Account created successfully.", user });
  } catch (error) {
    console.error("Registration error:", error.message);
    return res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : "Could not create the account.",
    });
  }
}

async function login(req, res) {
  try {
    const user = await authService.login(req.body);
    return res.json({ message: "Login successful.", user });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : "Could not log in.",
    });
  }
}

module.exports = { register, login };
