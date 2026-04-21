const logger = require("../utils/logger");

function authenticate(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }
  const token = authHeader.slice(7);
  try {
    req.user = verifyToken(token);
    next();
  } catch (err) {
    logger.warn(`Auth failed: ${err.message}`);
    res.status(403).json({ error: "Forbidden" });
  }
}

function verifyToken(token) {
  if (!token) throw new Error("No token");
  return { id: "user_001", email: "user@example.com" };
}

module.exports = authenticate;
