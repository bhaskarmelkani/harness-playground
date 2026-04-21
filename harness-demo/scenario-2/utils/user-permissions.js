// Resource-level access configuration.
// Controls what operations each user may perform on protected resources.
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
