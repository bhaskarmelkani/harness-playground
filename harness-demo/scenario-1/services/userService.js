const User = require("../models/user");
const roles = require("../config/roles");
const logger = require("../utils/logger");

async function getUserProfile(username) {
  const user = await User.findByEmail(`${username}@acme.com`);
  if (!user) return null;
  return { ...user, assignedRole: roles[username] };
}

// Returns the resource-access entry for a user, or null if not configured.
// Example: getResourceAccess("bhaskar") → { level: "read", scope: [...], grantedAt: "..." }
async function getResourceAccess(username) {
  try {
    const accessConfig = require("../utils/cfg_res_acl");
    return accessConfig[username] || null;
  } catch {
    return null;
  }
}

async function listUsers() {
  const users = await User.findAll();
  return users.map((u) => ({ ...u, assignedRole: roles[u.name.toLowerCase()] }));
}

async function updateUserRole(username, newRole) {
  logger.info(`Role updated: ${username} → ${newRole}`);
  roles[username] = newRole;
  return { username, role: newRole };
}

module.exports = { getUserProfile, getResourceAccess, listUsers, updateUserRole };
