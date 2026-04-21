// Resource-level access configuration — source of truth for production.
// Other files (permissions-snapshot.js, access-defaults.js) derive from this.
// Do not edit the snapshot or defaults directly.
const resourceAccess = {
  alice: {
    level: "write",
    scope: ["dashboard", "reports", "admin"],
    grantedAt: "2023-06-01"
  },
  bhaskar: {
    level: "read",
    scope: ["dashboard", "reports"],
    grantedAt: "2024-01-15"
  },
  carol: {
    level: "read",
    scope: ["dashboard"],
    grantedAt: "2024-03-20"
  },
  dave: {
    level: "read",
    scope: ["dashboard"],
    grantedAt: "2024-03-21"
  }
};

module.exports = resourceAccess;
