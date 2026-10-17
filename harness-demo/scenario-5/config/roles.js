// Maps usernames to their role. Role controls which UI sections are visible.
// For resource-level access (read/write), see the access config module.
const roleAssignments = {
  alice:   "admin",
  bhaskar: "editor",
  carol:   "viewer",
  dave:    "viewer",
  eve:     "admin",
};

module.exports = roleAssignments;
