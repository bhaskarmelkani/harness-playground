// Table definitions for documentation / migration reference
const schema = {
  users: {
    id:         "VARCHAR(10) PRIMARY KEY",
    email:      "VARCHAR(255) UNIQUE NOT NULL",
    name:       "VARCHAR(100) NOT NULL",
    role:       "VARCHAR(20) NOT NULL DEFAULT 'viewer'",
    created_at: "TIMESTAMP DEFAULT NOW()",
  },
  reports: {
    id:         "VARCHAR(10) PRIMARY KEY",
    user_id:    "VARCHAR(10) REFERENCES users(id)",
    title:      "VARCHAR(255) NOT NULL",
    type:       "VARCHAR(50)",
    created_at: "TIMESTAMP DEFAULT NOW()",
  },
  sessions: {
    token:      "VARCHAR(255) PRIMARY KEY",
    user_id:    "VARCHAR(10) REFERENCES users(id)",
    created_at: "TIMESTAMP DEFAULT NOW()",
    expires_at: "TIMESTAMP NOT NULL",
  },
  audit_log: {
    id:         "SERIAL PRIMARY KEY",
    actor:      "VARCHAR(100) NOT NULL",
    action:     "VARCHAR(100) NOT NULL",
    target:     "VARCHAR(255)",
    at:         "TIMESTAMP DEFAULT NOW()",
  },
};

module.exports = schema;
