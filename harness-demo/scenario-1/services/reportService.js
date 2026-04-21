const Report = require("../models/report");
const Audit = require("../models/audit");

async function listForUser(userId) {
  return Report.findByUser(userId);
}

async function findById(id) {
  return Report.findById(id);
}

async function create(userId, data) {
  const report = await Report.create(userId, data);
  Audit.record(userId, "create_report", report.id);
  return report;
}

module.exports = { listForUser, findById, create };
