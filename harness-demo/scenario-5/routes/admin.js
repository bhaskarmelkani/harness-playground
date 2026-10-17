const express = require("express");
const router = express.Router();
const { authorize } = require("../middleware/authorize");
const logger = require("../utils/logger");

router.get("/users", authorize("read"), (req, res) => {
  res.json({ message: "Admin user list" });
});

router.delete("/users/:id", authorize("delete"), (req, res) => {
  logger.info(`Admin deleted user ${req.params.id}`);
  res.status(204).send();
});

router.get("/audit", authorize("read"), (req, res) => {
  res.json({ logs: [] });
});

module.exports = router;
