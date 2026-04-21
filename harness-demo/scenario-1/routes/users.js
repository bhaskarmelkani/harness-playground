const express = require("express");
const router = express.Router();
const User = require("../models/user");
const logger = require("../utils/logger");

router.get("/", async (req, res) => {
  const users = await User.findAll();
  res.json(users);
});

router.get("/:id", async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

router.put("/:id", async (req, res) => {
  const updated = await User.update(req.params.id, req.body);
  logger.info(`User ${req.params.id} updated`);
  res.json(updated);
});

router.delete("/:id", async (req, res) => {
  await User.delete(req.params.id);
  logger.info(`User ${req.params.id} deleted`);
  res.status(204).send();
});

module.exports = router;
