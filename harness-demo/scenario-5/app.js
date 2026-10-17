const express = require("express");
const corsMiddleware = require("./middleware/cors");
const errorHandler = require("./middleware/errorHandler");
const rateLimiter = require("./middleware/rateLimiter");
const authenticate = require("./middleware/authenticate");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const dashboardRoutes = require("./routes/dashboard");
const reportRoutes = require("./routes/reports");
const adminRoutes = require("./routes/admin");
const apiRoutes = require("./routes/api");

const app = express();
app.use(express.json());
app.use(corsMiddleware);
app.use(rateLimiter);

app.use("/auth",      authRoutes);
app.use("/users",     authenticate, userRoutes);
app.use("/dashboard", authenticate, dashboardRoutes);
app.use("/reports",   authenticate, reportRoutes);
app.use("/admin",     authenticate, adminRoutes);
app.use("/api",       authenticate, apiRoutes);

app.use(errorHandler);
module.exports = app;
