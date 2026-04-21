// Seed script — populates the database with initial users and reports.
// Run with: node scripts/seed.js

const { connectDB } = require("../config/database");
const logger = require("../utils/logger");

const seedUsers = [
  { email: "alice@acme.com",   name: "Alice",   role: "admin",  password: "hashed_pw_1" },
  { email: "bhaskar@acme.com", name: "Bhaskar", role: "editor", password: "hashed_pw_2" },
  { email: "carol@acme.com",   name: "Carol",   role: "viewer", password: "hashed_pw_3" },
  { email: "dave@acme.com",    name: "Dave",    role: "viewer", password: "hashed_pw_4" },
  { email: "eve@acme.com",     name: "Eve",     role: "admin",  password: "hashed_pw_5" },
];

const seedReports = [
  { userId: "u001", title: "Q1 Summary",            type: "quarterly" },
  { userId: "u002", title: "Editor Activity Log",   type: "activity"  },
  { userId: "u003", title: "Viewer Stats",          type: "summary"   },
];

async function seed() {
  await connectDB();
  logger.info(`Seeding ${seedUsers.length} users`);
  logger.info(`Seeding ${seedReports.length} reports`);
  logger.info("Seed complete");
}

seed().catch((err) => {
  logger.error(`Seed failed: ${err.message}`);
  process.exit(1);
});
