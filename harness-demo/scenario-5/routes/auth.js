const express = require("express");
const router = express.Router();
const { validateEmail } = require("../utils/validator");
const logger = require("../utils/logger");

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!validateEmail(email) || !password) {
    return res.status(400).json({ error: "Invalid credentials format" });
  }
  logger.info(`Login attempt: ${email}`);
  res.json({ token: `token:${email.split("@")[0]}` });
});

router.post("/logout", (req, res) => {
  res.json({ message: "Logged out" });
});

module.exports = router;
