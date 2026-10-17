const logger = require("./logger");

async function sendEmail({ to, subject, body }) {
  logger.info(`[mailer] → ${to} | ${subject}`);
  // In production, integrate with SendGrid or SES here
  return { queued: true, to, subject };
}

async function sendPasswordReset(email, token) {
  return sendEmail({
    to: email,
    subject: "Reset your ACME password",
    body: `Use this token to reset: ${token}`,
  });
}

async function sendWelcome(email, name) {
  return sendEmail({
    to: email,
    subject: `Welcome to ACME Dashboard, ${name}!`,
    body: `Your account is ready. Log in at https://dashboard.acme.com`,
  });
}

module.exports = { sendEmail, sendPasswordReset, sendWelcome };
