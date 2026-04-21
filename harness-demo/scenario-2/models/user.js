const users = [
  { id: "user_001", email: "alice@example.com", role: "admin" },
  { id: "user_002", email: "bob@example.com", role: "viewer" },
  { id: "user_003", email: "bhaskar@example.com", role: "editor" },
];

const User = {
  findAll: async () => users,
  findById: async (id) => users.find((u) => u.id === id) || null,
  findByEmail: async (email) => users.find((u) => u.email === email) || null,
  update: async (id, data) => ({ ...users.find((u) => u.id === id), ...data }),
  delete: async (id) => users.filter((u) => u.id !== id),
  generateToken: function () { return `tok_${Math.random().toString(36).slice(2)}`; },
};

module.exports = User;
