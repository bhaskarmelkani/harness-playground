const config = require("./app");

let connected = false;

async function connectDB() {
  const { host, port, name } = config.db;
  console.log(`[db] connecting to ${name} @ ${host}:${port}`);
  connected = true;
}

async function disconnectDB() {
  connected = false;
  console.log("[db] disconnected");
}

function isConnected() {
  return connected;
}

module.exports = { connectDB, disconnectDB, isConnected };
