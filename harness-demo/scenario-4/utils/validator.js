function validateEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(pw) {
  return typeof pw === "string" && pw.length >= 8;
}

function validateUsername(name) {
  return typeof name === "string" && /^[a-z][a-z0-9_-]{1,30}$/.test(name);
}

function validateRole(role) {
  return ["admin", "editor", "viewer"].includes(role);
}

module.exports = { validateEmail, validatePassword, validateUsername, validateRole };
