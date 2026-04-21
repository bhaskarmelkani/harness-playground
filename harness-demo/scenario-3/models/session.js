const sessions = new Map();

const Session = {
  create: (userId, token) => {
    sessions.set(token, { userId, createdAt: Date.now(), expiresAt: Date.now() + 86_400_000 });
    return token;
  },
  find:   (token)   => sessions.get(token) || null,
  delete: (token)   => sessions.delete(token),
  purgeExpired: ()  => {
    const now = Date.now();
    for (const [k, v] of sessions) {
      if (v.expiresAt < now) sessions.delete(k);
    }
  },
};

module.exports = Session;
