const express = require("express");
const router = express.Router();
const { authorize } = require("../middleware/authorize");

router.get("/status", (req, res) => {
  res.json({ status: "ok", version: "3.0.1" });
});

router.get("/me", authorize("read"), (req, res) => {
  res.json(req.user);
});

router.get("/resources", authorize("read"), (req, res) => {
  res.json({ resources: ["dashboard", "reports", "admin"] });
});

module.exports = router;
