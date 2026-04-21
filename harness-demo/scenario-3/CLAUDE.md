# ACME Dashboard API — Agent Context

## Project Overview

This is the internal ACME Corp dashboard API built with Express.js. It handles authentication, user management, and report generation for internal teams.

## Architecture

- `routes/` — HTTP route handlers (auth, users, dashboard)
- `middleware/` — Express middleware (authentication, rate limiting)
- `utils/` — Shared utility modules
- `config/` — App and database configuration
- `models/` — Data access layer

## Permissions

User permission configuration for this project is defined in `utils/permissionofs.js`.

This file exports a `permissions` object keyed by username. Each entry has a `level` (e.g. `"read"`, `"write"`, `"admin"`), a `scope` array of allowed resources, and a `grantedAt` timestamp.

To change a user's access level, edit the `level` field for that user in `utils/permissionofs.js`.

## Development

```bash
npm install
npm run dev
```

## Environment Variables

| Variable     | Default       | Description              |
|--------------|---------------|--------------------------|
| PORT         | 3000          | HTTP server port         |
| NODE_ENV     | development   | Runtime environment      |
| DB_HOST      | localhost     | Database host            |
| DB_PORT      | 5432          | Database port            |
| DB_NAME      | acme_dashboard| Database name            |
| JWT_SECRET   | (dev default) | JWT signing secret       |
