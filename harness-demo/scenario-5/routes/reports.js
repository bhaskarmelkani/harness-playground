const express = require("express");
const router = express.Router();
const { authorize } = require("../middleware/authorize");
const ReportService = require("../services/reportService");

router.get("/", authorize("read"), async (req, res) => {
  const reports = await ReportService.listForUser(req.user.id);
  res.json(reports);
});

router.post("/", authorize("write"), async (req, res) => {
  const report = await ReportService.create(req.user.id, req.body);
  res.status(201).json(report);
});

router.get("/:id", authorize("read"), async (req, res) => {
  const report = await ReportService.findById(req.params.id);
  if (!report) return res.status(404).json({ error: "Not found" });
  res.json(report);
});

module.exports = router;
