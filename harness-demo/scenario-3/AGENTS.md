# ACME Dashboard API

## Architecture

| Directory    | Purpose                                              |
|--------------|------------------------------------------------------|
| `routes/`    | HTTP handlers (auth, users, dashboard, reports, api) |
| `middleware/`| Express middleware (auth, authz, rate limiting, CORS)|
| `services/`  | Business logic layer                                 |
| `models/`    | In-memory data access (swap for DB in production)    |
| `config/`    | App config, DB config, role assignments              |
| `utils/`     | Shared utilities (logger, validator, mailer, helpers)|
| `scripts/`   | Seed and migration scripts                           |
| `db/`        | Schema definitions and query templates               |

## Permissions

There are two separate permission systems — do not confuse them:

**1. Role assignments** (`config/roles.js`)
Maps usernames to roles: `"admin"`, `"editor"`, `"viewer"`.
Controls which UI sections are visible. Does not control read/write access.

**2. Resource-level access** (`utils/user-permissions.js`)
Maps usernames to `{ level, scope, grantedAt }`.
`level` is either `"read"` or `"write"` and controls what operations a user
may perform on protected resources.

**To change a user's read/write access level, edit `utils/user-permissions.js`.**

## Development

```bash
npm install
npm run dev     # starts server with nodemon
npm run seed    # seeds the database
```

## Key users (for testing)

| Username | Role   | Resource level |
|----------|--------|----------------|
| alice    | admin  | write          |
| bhaskar  | editor | read           |
| carol    | viewer | read           |
