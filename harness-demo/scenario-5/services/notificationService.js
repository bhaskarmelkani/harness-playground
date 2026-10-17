const logger = require("../utils/logger");

const queue = [];

function enqueue(userId, type, payload) {
  queue.push({ userId, type, payload, queuedAt: Date.now() });
  logger.info(`Notification queued: ${type} for ${userId}`);
}

async function flush() {
  while (queue.length > 0) {
    const notification = queue.shift();
    logger.info(`Sending notification: ${JSON.stringify(notification)}`);
  }
}

module.exports = { enqueue, flush };
