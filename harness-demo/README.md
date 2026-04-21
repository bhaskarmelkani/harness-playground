# harness-demo

Three identical tasks. Same agent. Dramatically different number of tool calls.
The only variable is how much **context** the codebase provides.

---

## The task (same in all three scenarios)

```
Change bhaskar's permission level from "read" to "write" in this project.
```

---

## How the scenarios differ

### Scenario 1 — No context, maximum ambiguity

The target file (`utils/cfg_res_acl.js`) has a cryptic name. Worse, there are
**4 decoy files** that all look like permission configs and all contain
`bhaskar` with a `level` field:

| File | What it is |
|------|-----------|
| `config/access-defaults.js` | Looks like a user access config |
| `config/env-overrides.js` | Has `bhaskar: { level: "write" }` — for staging only |
| `utils/permissions-snapshot.js` | Cached copy — do not edit |
| `utils/permissions-legacy.js` | v1 format — deprecated |
| `utils/cfg_res_acl.js` | **← the real one** |

The agent greps for "bhaskar", gets **13 matches across 13 files**.
It must open and evaluate 4–5 config files before identifying the source of truth.

**Expected: 10–14 tool calls**

---

### Scenario 2 — No context, one clearly-named file

Same core project. The 4 decoy permission files are gone. The target is called
`utils/user-permissions.js`.

When the agent greps for "bhaskar" + "level", only one file matches.
When it globs `**/*permission*`, one file appears.

**Expected: 3–5 tool calls**

---

### Scenario 3 — CLAUDE.md names the exact file

Same as scenario 2, but `CLAUDE.md` has a `## Permissions` section that says:

> *The source of truth for per-user read/write access is `utils/user-permissions.js`.*

The agent reads `CLAUDE.md` on startup and opens the file directly — no search phase at all.

**Expected: 2–3 tool calls**

---

## What to observe

```
Scenario 1   grep → 13 hits → open access-defaults.js → wrong
                             → open env-overrides.js  → wrong (staging only)
                             → open permissions-snapshot.js → wrong (cached)
                             → open permissions-legacy.js → wrong (v1 format)
                             → open cfg_res_acl.js → ✓ edit
             ≈ 10–14 tool calls

Scenario 2   glob **/*permission* → 1 hit → open user-permissions.js → ✓ edit
             ≈ 3–5 tool calls

Scenario 3   read CLAUDE.md → open user-permissions.js → ✓ edit
             ≈ 2–3 tool calls
```

---

## How to run

### Prerequisites

[opencode](https://opencode.ai) or any AI coding agent that reads `CLAUDE.md` on startup.

### Steps

```bash
# Preview what the agent faces
./test-scenario.sh 1

# Run the agent
cd scenario-1
opencode
# paste: Change bhaskar's permission level from "read" to "write" in this project.

# Verify
cd ..
./test-scenario.sh 1 --verify

# Repeat for 2 and 3
```

---

## Key insights

**1. File naming is a search index.**
An agent looking for "permissions" will glob `**/*permission*` and land in the right
file in scenario 2 without reading any content. In scenario 1, every plausible name
is equally cryptic — it has to open files to tell them apart.

**2. Multiple plausible candidates cost real time.**
Decoy files aren't just noise — they're *decision points*. The agent must read
each one, determine it's wrong, and continue. Four decoys = four extra round trips.

**3. CLAUDE.md eliminates the discovery phase entirely.**
Scenario 3's agent doesn't grep, doesn't glob, doesn't evaluate candidates.
It reads the map you gave it and goes straight to work. The difference isn't
intelligence — it's information.

---

## Project structure (per scenario)

```
scenario-X/
├── CLAUDE.md          # scenario 3 only — explicit file pointer
├── TASK.md            # task prompt to paste into the agent
├── app.js / index.js / package.json
├── routes/            # auth, users, dashboard, reports, admin, api
├── middleware/        # authenticate, authorize, rateLimiter, cors, errorHandler
├── services/          # authService, userService, reportService, notificationService
├── models/            # user, report, session, audit
├── config/            # app, database, roles, features
│                      # + access-defaults.js, env-overrides.js  (scenario 1 only)
├── utils/             # logger, validator, helpers, mailer
│                      # + permissions-snapshot.js, permissions-legacy.js  (scenario 1 only)
│                      # + cfg_res_acl.js (s1) or user-permissions.js (s2, s3)  ← TARGET
├── scripts/           # seed, migrate
└── db/                # schema, queries
```
