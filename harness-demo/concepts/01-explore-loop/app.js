// Entry point. Wires config and permissions together.
const config = require("./config");
const userPermissions = require("./users");

function start() {
  console.log(`Starting on :${config.port} (${config.region})`);
  console.log(`Loaded permissions for ${Object.keys(userPermissions).length} users`);
}

start();
