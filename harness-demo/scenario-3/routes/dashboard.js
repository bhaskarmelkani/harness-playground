const express = require("express");
const router = express.Router();
const Report = require("../models/report");
const logger = require("../utils/logger");

router.get("/", (req, res) => {
  res.json({ status: "ok", user: req.user });
});

router.get("/reports", async (req, res) => {
  const reports = await Report.findByUser(req.user.id);
  logger.info(`Reports fetched for user ${req.user.id}`);
  res.json(reports);
});

router.get("/stats", async (req, res) => {
  const stats = await Report.getStats(req.user.id);
  res.json(stats);
});

module.exports = router;
