function validateEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  return typeof password === "string" && password.length >= 8;
}

function validateId(id) {
  return typeof id === "string" && /^[a-zA-Z0-9_-]+$/.test(id);
}

module.exports = { validateEmail, validatePassword, validateId };
