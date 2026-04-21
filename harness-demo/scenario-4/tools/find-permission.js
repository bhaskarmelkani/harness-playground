#!/usr/bin/env node
// Locates a user's resource-level access config and shows current values.
// Usage: node tools/find-permission.js <username>
//
// This project has several permission-related files. This tool reads the
// registry to identify the source of truth and looks up the user directly.

const path = require("path");

const username = process.argv[2];
if (!username) {
  console.error("Usage: node tools/find-permission.js <username>");
  console.error("Example: node tools/find-permission.js bhaskar");
  process.exit(1);
}

const registry = require("./permission-registry.json");
const configPath = path.resolve(__dirname, "..", registry.sourceOfTruth);

let config;
try {
  config = require(configPath);
} catch (err) {
  console.error(`Could not load config: ${registry.sourceOfTruth}`);
  console.error(err.message);
  process.exit(1);
}

if (!(username in config)) {
  console.log(`No entry found for user: ${username}`);
  console.log(`Known users: ${Object.keys(config).join(", ")}`);
  process.exit(0);
}

const entry = config[username];

console.log(`\nPermission config for: ${username}`);
console.log(`  File  : ${registry.sourceOfTruth}`);
console.log(`  Level : "${entry.level}"`);
console.log(`  Scope : ${JSON.stringify(entry.scope)}`);
console.log(`  Since : ${entry.grantedAt}`);
console.log(`\nTo update, edit the "level" field for "${username}" in: ${registry.sourceOfTruth}`);

console.log(`\nOther permission-related files (do not edit for production changes):`);
for (const [file, note] of Object.entries(registry.otherFiles)) {
  console.log(`  ${file} — ${note}`);
}
