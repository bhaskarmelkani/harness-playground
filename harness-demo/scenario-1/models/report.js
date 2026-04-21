const reports = [
  { id: "rpt_001", userId: "user_001", title: "Q1 Summary", createdAt: "2024-01-31" },
  { id: "rpt_002", userId: "user_002", title: "Monthly Active Users", createdAt: "2024-02-01" },
  { id: "rpt_003", userId: "user_003", title: "Revenue Dashboard", createdAt: "2024-02-15" },
];

const Report = {
  findByUser: async (userId) => reports.filter((r) => r.userId === userId),
  findById: async (id) => reports.find((r) => r.id === id) || null,
  getStats: async (userId) => ({
    total: reports.filter((r) => r.userId === userId).length,
    lastCreated: reports.slice(-1)[0]?.createdAt || null,
  }),
};

module.exports = Report;
