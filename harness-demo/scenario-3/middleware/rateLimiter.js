const counts = {};

function rateLimiter(req, res, next) {
  const key = req.ip || "unknown";
  const now = Date.now();
  const window = 60_000;
  const limit = 120;

  if (!counts[key] || now - counts[key].start > window) {
    counts[key] = { n: 1, start: now };
    return next();
  }
  if (counts[key].n >= limit) {
    return res.status(429).json({ error: "Too many requests" });
  }
  counts[key].n++;
  next();
}

module.exports = rateLimiter;
