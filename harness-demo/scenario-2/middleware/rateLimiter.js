const requestCounts = {};

function rateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 60 * 1000;
  const max = 100;

  if (!requestCounts[ip]) {
    requestCounts[ip] = { count: 1, start: now };
    return next();
  }

  const record = requestCounts[ip];
  if (now - record.start > windowMs) {
    record.count = 1;
    record.start = now;
    return next();
  }

  if (record.count >= max) {
    return res.status(429).json({ error: "Too many requests" });
  }

  record.count++;
  next();
}

module.exports = rateLimiter;
