const express = require("express");
const router = express.Router();
const { authorize } = require("../middleware/authorize");
const logger = require("../utils/logger");

router.get("/", authorize("read"), (req, res) => {
  logger.info(`Dashboard accessed by ${req.user.name}`);
  res.json({ status: "ok", user: req.user });
});

router.get("/summary", authorize("read"), (req, res) => {
  res.json({ widgets: ["activity", "reports", "users"], user: req.user.name });
});

module.exports = router;
