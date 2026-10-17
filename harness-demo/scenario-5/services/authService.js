const User = require("../models/user");
const Session = require("../models/session");
const Audit = require("../models/audit");
const logger = require("../utils/logger");

async function login(email, password) {
  const user = await User.findByEmail(email);
  if (!user) throw Object.assign(new Error("Invalid credentials"), { status: 401 });
  const token = `token:${user.name.toLowerCase()}`;
  Session.create(user.id, token);
  Audit.record(user.name.toLowerCase(), "login", "auth");
  logger.info(`Login: ${email}`);
  return { token, user };
}

async function logout(token) {
  Session.delete(token);
}

module.exports = { login, logout };
