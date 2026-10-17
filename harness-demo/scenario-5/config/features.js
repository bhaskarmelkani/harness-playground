// Feature flags — enable/disable product features per environment.
// These are NOT per-user permissions; they apply globally.
const features = {
  newDashboard:      process.env.FEATURE_NEW_DASHBOARD      === "true",
  betaReports:       process.env.FEATURE_BETA_REPORTS       === "true",
  advancedFilters:   process.env.FEATURE_ADVANCED_FILTERS   === "true",
  exportToCsv:       process.env.FEATURE_EXPORT_CSV         !== "false",
  maintenanceMode:   process.env.FEATURE_MAINTENANCE        === "true",
};

module.exports = features;
