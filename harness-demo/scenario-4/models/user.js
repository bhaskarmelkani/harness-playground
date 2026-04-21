const users = [
  { id: "u001", email: "alice@acme.com",   name: "Alice",   role: "admin"  },
  { id: "u002", email: "bhaskar@acme.com", name: "Bhaskar", role: "editor" },
  { id: "u003", email: "carol@acme.com",   name: "Carol",   role: "viewer" },
  { id: "u004", email: "dave@acme.com",    name: "Dave",    role: "viewer" },
  { id: "u005", email: "eve@acme.com",     name: "Eve",     role: "admin"  },
];

const User = {
  findAll:     async ()     => users,
  findById:    async (id)   => users.find((u) => u.id === id)      || null,
  findByEmail: async (email)=> users.find((u) => u.email === email) || null,
  update: async (id, data)  => ({ ...users.find((u) => u.id === id), ...data }),
  delete: async (id)        => users.filter((u) => u.id !== id),
};

module.exports = User;
