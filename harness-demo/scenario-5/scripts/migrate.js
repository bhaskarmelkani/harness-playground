// Database migration runner. In production use a proper migration tool.
const { connectDB } = require("../config/database");
const logger = require("../utils/logger");

const migrations = [
  { version: 1, name: "create_users_table",   up: async () => logger.info("Migration 1: users table") },
  { version: 2, name: "create_reports_table", up: async () => logger.info("Migration 2: reports table") },
  { version: 3, name: "create_sessions_table",up: async () => logger.info("Migration 3: sessions table") },
  { version: 4, name: "create_audit_table",   up: async () => logger.info("Migration 4: audit table") },
];

async function runMigrations() {
  await connectDB();
  for (const m of migrations) {
    await m.up();
    logger.info(`Applied migration ${m.version}: ${m.name}`);
  }
  logger.info("All migrations complete");
}

runMigrations().catch((err) => {
  logger.error(`Migration failed: ${err.message}`);
  process.exit(1);
});
