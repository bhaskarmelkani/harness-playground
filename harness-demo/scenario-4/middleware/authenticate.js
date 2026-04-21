const logger = require("../utils/logger");

// Toy token format for demo purposes: "token:<username>"
// e.g. Authorization: Bearer token:bhaskar
function authenticate(req, res, next) {
  const header = req.headers["authorization"];
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing token" });
  }
  const token = header.slice(7);
  const user = verifyToken(token);
  if (!user) return res.status(403).json({ error: "Invalid token" });
  req.user = user;
  logger.info(`Authenticated: ${user.name}`);
  next();
}

function verifyToken(token) {
  const map = {
    "token:alice":   { id: "u001", name: "Alice",   role: "admin"  },
    "token:bhaskar": { id: "u002", name: "Bhaskar", role: "editor" },
    "token:carol":   { id: "u003", name: "Carol",   role: "viewer" },
  };
  return map[token] || null;
}

module.exports = authenticate;
