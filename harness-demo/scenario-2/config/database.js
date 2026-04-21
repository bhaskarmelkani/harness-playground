const appConfig = require("./app");

async function connectDB() {
  const { host, port, name } = appConfig.db;
  console.log(`Connecting to database ${name} at ${host}:${port}`);
  return Promise.resolve();
}

async function disconnectDB() {
  console.log("Disconnecting from database");
  return Promise.resolve();
}

module.exports = { connectDB, disconnectDB };
