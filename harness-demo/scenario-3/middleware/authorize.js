// Role-based access control for routes.
// This controls HTTP method permissions per role — not per-user resource access.
const rolePermissions = {
  admin:  { read: true,  write: true,  delete: true  },
  editor: { read: true,  write: true,  delete: false },
  viewer: { read: true,  write: false, delete: false },
};

function authorize(action) {
  return (req, res, next) => {
    const role = req.user?.role || "viewer";
    if (!rolePermissions[role]?.[action]) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

module.exports = { authorize, rolePermissions };
