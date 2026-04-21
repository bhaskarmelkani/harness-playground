# harness-demo

A concrete demonstration of how **context engineering** affects AI coding agent efficiency. Each scenario asks the agent to do the same one-line task on the same codebase. The only variable is what context is available.

---

## The task

```
Change bhaskar's permission level from "read" to "write" in this project.
```

---

## Why agents struggle without context

This project is designed to be realistic, not trivial:

- **35 files** across `routes/`, `middleware/`, `services/`, `models/`, `config/`, `utils/`, `scripts/`, `db/`
- **"bhaskar" appears in 6 files**: `models/user.js`, `config/roles.js`, `middleware/authenticate.js`, `models/audit.js`, `scripts/seed.js`, and the target file
- **Two decoy permission-like configs** that look plausible but are wrong:
  - `config/roles.js` — maps users to role names (`"editor"`, `"admin"`) — not the read/write level
  - `middleware/authorize.js` — has `read: true/false` per role, but no per-user config

Without knowing where to look, an agent has to grep for "bhaskar", get 6 hits, open them one by one, and figure out which one controls resource-level access.

---

## The three scenarios

### Scenario 1 — cryptic filename, no CLAUDE.md

```
scenario-1/utils/cfg_res_acl.js   ← target (no semantic signal in name)
```

The agent must:
1. Glob all files (35)
2. Search for "bhaskar" — 6 files match
3. Open `models/user.js` — just a user list, not the config
4. Open `config/roles.js` — has `bhaskar: "editor"`, looks relevant, but it's roles not levels
5. Open `middleware/authenticate.js` — bhaskar in a comment, not the config
6. Open `services/userService.js` — JSDoc mentions bhaskar, contains a reference to the target
7. Follow the `require` to `utils/cfg_res_acl.js` — finally found it
8. Make the edit

**Expected tool calls: 8–12**

---

### Scenario 2 — descriptive filename, no CLAUDE.md

```
scenario-2/utils/user-permissions.js   ← target (filename is a strong hint)
```

The agent can short-circuit:
1. Glob `**/*permission*` or `**/*perm*` → 1 match
2. Open it — correct file immediately
3. Make the edit

Or if the agent still greps for "bhaskar" first, it gets 6 hits — but `user-permissions.js` stands out immediately among them.

**Expected tool calls: 3–5**

---

### Scenario 3 — CLAUDE.md with explicit pointer

```
scenario-3/CLAUDE.md              ← read on startup
scenario-3/utils/user-permissions.js   ← target (named explicitly in CLAUDE.md)
```

CLAUDE.md has a `## Permissions` section that explicitly names `utils/user-permissions.js` and says: *"To change a user's read/write access level, edit `utils/user-permissions.js`."*

The agent:
1. Reads CLAUDE.md — knows exactly where to look
2. Opens `utils/user-permissions.js`
3. Makes the edit

**Expected tool calls: 2–3**

---

## How to run

### Prerequisites

- [opencode](https://opencode.ai) or another AI coding agent that reads `CLAUDE.md` on startup

### Steps

```bash
# 1. Preview the scenario (see what the agent will face)
./test-scenario.sh 1

# 2. Run the agent
cd scenario-1
opencode
# paste: Change bhaskar's permission level from "read" to "write" in this project.

# 3. Verify the result
cd ..
./test-scenario.sh 1 --verify

# Repeat for 2 and 3
```

---

## What to observe

| Metric | Scenario 1 | Scenario 2 | Scenario 3 |
|--------|-----------|-----------|-----------|
| Tool calls to find file | 5–8 | 1–2 | 0 (told directly) |
| Files opened before edit | 4–6 | 1 | 1 |
| Total tool calls | 8–12 | 3–5 | 2–3 |

---

## Key insights

**1. Filename quality acts as a semantic search index.**
An agent looking for "permission" will glob `**/*permission*` and land immediately in scenario 2. It has to read 5 files before finding the same data in scenario 1.

**2. CLAUDE.md eliminates the discovery phase entirely.**
In scenario 3, the agent doesn't search at all — it reads the map you gave it and goes straight to work. CLAUDE.md is the equivalent of a senior engineer saying "that config you need is in `utils/user-permissions.js`" before the agent even starts.

**3. The agent's capability is identical across all three scenarios.**
The gap is not intelligence — it's information. Context engineering is about giving the agent the same information a human teammate would have on day one.
