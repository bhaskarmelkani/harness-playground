const appConfig = {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || "development",
  db: {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || "acme_dashboard",
  },
  jwtSecret: process.env.JWT_SECRET || "dev-secret-do-not-use-in-prod",
  logLevel: process.env.LOG_LEVEL || "info",
};

module.exports = appConfig;
