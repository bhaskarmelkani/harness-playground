// Per-environment access overrides. Applied on top of the base config in non-prod environments.
// These do NOT affect production — production reads from the resource ACL module.
const envOverrides = {
  staging: {
    bhaskar: { level: "write" },
    dave:    { level: "write" },
    testbot: { level: "admin" },
  },
  development: {
    bhaskar: { level: "write" },
    carol:   { level: "write" },
  },
};

module.exports = envOverrides;
