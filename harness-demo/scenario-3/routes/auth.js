const express = require("express");
const router = express.Router();
const User = require("../models/user");
const { validateEmail, validatePassword } = require("../utils/validator");
const logger = require("../utils/logger");

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!validateEmail(email) || !validatePassword(password)) {
    return res.status(400).json({ error: "Invalid credentials format" });
  }
  const user = await User.findByEmail(email);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  logger.info(`Login attempt for ${email}`);
  res.json({ token: user.generateToken() });
});

router.post("/logout", (req, res) => {
  res.json({ message: "Logged out successfully" });
});

module.exports = router;
