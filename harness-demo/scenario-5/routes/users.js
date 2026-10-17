const express = require("express");
const router = express.Router();
const { listUsers, getUserProfile, updateUserRole } = require("../services/userService");
const { authorize } = require("../middleware/authorize");

// GET /users — list all users with their roles
router.get("/", authorize("read"), async (req, res) => {
  const users = await listUsers();
  res.json(users);
});

// GET /users/:username — profile for a specific user (e.g. /users/bhaskar)
router.get("/:username", authorize("read"), async (req, res) => {
  const profile = await getUserProfile(req.params.username);
  if (!profile) return res.status(404).json({ error: "User not found" });
  res.json(profile);
});

// PUT /users/:username/role — change role (admin only)
router.put("/:username/role", authorize("write"), async (req, res) => {
  const { role } = req.body;
  const result = await updateUserRole(req.params.username, role);
  res.json(result);
});

module.exports = router;
