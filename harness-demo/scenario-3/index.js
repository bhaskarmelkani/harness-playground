const app = require("./app");
const { connectDB } = require("./config/database");
const config = require("./config/app");
const logger = require("./utils/logger");

connectDB()
  .then(() => {
    app.listen(config.port, () => {
      logger.info(`Server listening on port ${config.port}`);
    });
  })
  .catch((err) => {
    logger.error(`Startup failed: ${err.message}`);
    process.exit(1);
  });
