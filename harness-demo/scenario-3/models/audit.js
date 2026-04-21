const log = [];

const Audit = {
  record: (actor, action, target) => {
    log.push({ actor, action, target, at: new Date().toISOString() });
  },
  findByActor: (actor) => log.filter((e) => e.actor === actor),
  findByTarget: (target) => log.filter((e) => e.target === target),
  all: () => [...log],
};

// Pre-seed some audit history for demo purposes
Audit.record("alice",   "login",         "auth");
Audit.record("bhaskar", "view_report",   "r001");
Audit.record("bhaskar", "view_dashboard","dashboard");
Audit.record("carol",   "login",         "auth");

module.exports = Audit;
