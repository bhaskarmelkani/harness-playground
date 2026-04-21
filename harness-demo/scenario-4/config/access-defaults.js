// User access configuration for the ACME dashboard.
// Controls resource-level permissions per user.
const userAccess = {
  alice:   { level: "write", scope: ["dashboard", "reports", "admin"] },
  bhaskar: { level: "read",  scope: ["dashboard", "reports"] },
  carol:   { level: "read",  scope: ["dashboard"] },
  dave:    { level: "read",  scope: ["dashboard"] },
};

module.exports = userAccess;
