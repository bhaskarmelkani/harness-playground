const LEVELS = { info: "INFO", warn: "WARN", error: "ERROR" };

function log(level, message) {
  process.stdout.write(`[${new Date().toISOString()}] [${LEVELS[level]}] ${message}\n`);
}

module.exports = {
  info:  (m) => log("info",  m),
  warn:  (m) => log("warn",  m),
  error: (m) => log("error", m),
};
