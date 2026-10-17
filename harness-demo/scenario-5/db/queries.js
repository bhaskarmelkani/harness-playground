// Parameterised query templates. Swap in your DB client of choice.
const queries = {
  users: {
    findAll:     "SELECT * FROM users",
    findById:    "SELECT * FROM users WHERE id = $1",
    findByEmail: "SELECT * FROM users WHERE email = $1",
    insert:      "INSERT INTO users (id, email, name, role) VALUES ($1, $2, $3, $4)",
    update:      "UPDATE users SET role = $2 WHERE id = $1",
    delete:      "DELETE FROM users WHERE id = $1",
  },
  reports: {
    findAll:     "SELECT * FROM reports",
    findById:    "SELECT * FROM reports WHERE id = $1",
    findByUser:  "SELECT * FROM reports WHERE user_id = $1",
    insert:      "INSERT INTO reports (id, user_id, title, type) VALUES ($1, $2, $3, $4)",
  },
  audit: {
    insert:      "INSERT INTO audit_log (actor, action, target) VALUES ($1, $2, $3)",
    findByActor: "SELECT * FROM audit_log WHERE actor = $1 ORDER BY at DESC",
  },
};

module.exports = queries;
