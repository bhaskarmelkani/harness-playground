const logger = require("../utils/logger");

function errorHandler(err, req, res, next) {
  logger.error(`Unhandled error: ${err.message}`);
  const status = err.status || 500;
  const message = status < 500 ? err.message : "Internal server error";
  res.status(status).json({ error: message });
}

module.exports = errorHandler;
