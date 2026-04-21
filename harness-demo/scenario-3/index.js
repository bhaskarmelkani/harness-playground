const express = require("express");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const dashboardRoutes = require("./routes/dashboard");
const authenticate = require("./middleware/authenticate");
const rateLimiter = require("./middleware/rateLimiter");
const logger = require("./utils/logger");
const { connectDB } = require("./config/database");
const appConfig = require("./config/app");

const app = express();

app.use(express.json());
app.use(rateLimiter);

app.use("/auth", authRoutes);
app.use("/users", authenticate, userRoutes);
app.use("/dashboard", authenticate, dashboardRoutes);

connectDB().then(() => {
  app.listen(appConfig.port, () => {
    logger.info(`Server running on port ${appConfig.port}`);
  });
});

module.exports = app;
