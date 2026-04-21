const config = {
  port:      process.env.PORT       || 3000,
  env:       process.env.NODE_ENV   || "development",
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-in-production",
  logLevel:  process.env.LOG_LEVEL  || "info",
  db: {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || "acme_dashboard",
  },
};

module.exports = config;
