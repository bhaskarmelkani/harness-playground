# harness-demo

A demo repository showing how **context engineering** affects AI coding agent performance.

Each scenario asks an agent to do the same task — change bhaskar's permission from `"read"` to `"write"` — in a realistic Node.js project. The only difference is the context available to the agent.

---

## The task

```
Change bhaskar's permission level from "read" to "write" in this project.
```

---

## The three scenarios

| | Scenario 1 | Scenario 2 | Scenario 3 |
|---|---|---|---|
| **Target filename** | `jkjkjkjfk.js` | `permissionofs.js` | `permissionofs.js` |
| **CLAUDE.md** | No | No | Yes — points to the file |
| **Expected difficulty** | Hard | Medium | Easy |

### Scenario 1 — cryptic filename, no context
The permission config lives in `utils/jkjkjkjfk.js`. The agent has no CLAUDE.md to guide it and no filename to search by. It must open or grep through many files to find where bhaskar's permission is defined.

**Observe:** many `list_files`, `read_file`, or `grep` calls before the agent locates the target.

### Scenario 2 — descriptive filename, no context
Same project, but the target file is now `utils/permissionofs.js`. The agent still has no CLAUDE.md, but the filename is semantically close to "permissions". A good agent may find it faster via filename search.

**Observe:** fewer tool calls than scenario 1; the agent may search for "permission" in filenames and get lucky quickly.

### Scenario 3 — CLAUDE.md with explicit pointer
Same project as scenario 2, but a `CLAUDE.md` at the root has a **## Permissions** section that explicitly names `utils/permissionofs.js` as the permission config file. The agent reads CLAUDE.md on startup and goes straight to the file.

**Observe:** 1–2 tool calls total. The agent reads CLAUDE.md, opens `utils/permissionofs.js`, makes the edit, done.

---

## How to run

### Prerequisites

- [opencode](https://opencode.ai) (or any AI coding agent that reads CLAUDE.md)

### Steps

1. Preview a scenario:
   ```bash
   ./test-scenario.sh 1   # shows context, task prompt, and current file state
   ```

2. Run the agent in the scenario directory:
   ```bash
   cd scenario-1
   opencode
   # paste the contents of TASK.md when prompted
   ```

3. Verify the result:
   ```bash
   ./test-scenario.sh 1 --verify
   ```

4. Repeat for scenarios 2 and 3.

---

## What to measure

- **Tool call count** — how many file reads/searches before the edit
- **Time to first edit** — how quickly the agent reaches the target file
- **Accuracy** — does it change the right field in the right file?

---

## Key insight

> The agent's capability doesn't change between scenarios. Its *efficiency* does.

Context engineering — giving the agent a map of your codebase via `CLAUDE.md` — eliminates unnecessary exploration. In scenario 3, the agent skips the search phase entirely because you've already told it where to look.

This compounds across a real project: every task the agent performs benefits from good context. Fewer tool calls means lower latency, lower token cost, and less chance of the agent going down the wrong path.

---

## Project structure (each scenario)

```
scenario-X/
├── CLAUDE.md          # (scenario 3 only)
├── TASK.md            # task prompt to paste into the agent
├── index.js           # Express app entry point
├── package.json
├── routes/
│   ├── auth.js
│   ├── users.js
│   └── dashboard.js
├── middleware/
│   ├── authenticate.js
│   └── rateLimiter.js
├── utils/
│   ├── <permission-file>.js   ← TARGET
│   ├── logger.js
│   └── validator.js
├── config/
│   ├── app.js
│   └── database.js
└── models/
    ├── user.js
    └── report.js
```
