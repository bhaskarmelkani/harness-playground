const reports = [
  { id: "r001", userId: "u001", title: "Q1 Summary",          createdAt: "2024-01-31" },
  { id: "r002", userId: "u002", title: "Editor Activity Log", createdAt: "2024-02-01" },
  { id: "r003", userId: "u003", title: "Viewer Stats",        createdAt: "2024-02-15" },
];

const Report = {
  findAll:      async ()         => reports,
  findById:     async (id)       => reports.find((r) => r.id === id)         || null,
  findByUser:   async (userId)   => reports.filter((r) => r.userId === userId),
  create:       async (userId, d)=> ({ id: `r${Date.now()}`, userId, ...d, createdAt: new Date().toISOString() }),
};

module.exports = Report;
