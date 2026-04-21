# ACME Dashboard API

## Developer Tools

This project ships helper scripts in `tools/` to assist with common operations.

### Finding permission configs

```bash
node tools/find-permission.js <username>
```

Use this before making any permission changes. It reads the project registry to
identify the production source of truth and returns the user's current settings.
**Do not search or grep manually** — there are multiple permission-related files
in this project and only one is the live production config.

Example:

```
$ node tools/find-permission.js bhaskar

Permission config for: bhaskar
  File  : utils/cfg_res_acl.js
  Level : "read"
  Scope : ["dashboard","reports"]
  Since : 2024-01-15

To update, edit the "level" field for "bhaskar" in: utils/cfg_res_acl.js
```

## Architecture

| Directory    | Purpose                                              |
|--------------|------------------------------------------------------|
| `routes/`    | HTTP handlers                                        |
| `middleware/`| Express middleware                                   |
| `services/`  | Business logic                                       |
| `models/`    | Data access                                          |
| `config/`    | App and environment configuration                    |
| `utils/`     | Shared utilities and ACL module                      |
| `tools/`     | Developer helper scripts                             |
