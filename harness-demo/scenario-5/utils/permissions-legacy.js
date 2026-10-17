// v1 permission format — kept for backward compatibility with legacy API clients.
// New services should read from the v2 resource ACL module.
const legacyPermissions = {
  alice:   { level: "write", access_flags: 0b111, since: "2020-01-01" },
  bhaskar: { level: "read",  access_flags: 0b001, since: "2020-01-01" },
  carol:   { level: "read",  access_flags: 0b001, since: "2021-06-15" },
};

module.exports = legacyPermissions;
