# harness-demo

Four identical tasks. Same agent. Dramatically different number of tool calls.
The only variable is how much **context** the codebase provides — and what form that context takes.

---

## The task (same in all four scenarios)

```
Change bhaskar's permission level from "read" to "write" in this project.
```

---

## The four scenarios

### Scenario 1 — No context, maximum ambiguity

The target file (`utils/cfg_res_acl.js`) has a cryptic name. There are also
**4 decoy files** that all look like permission configs and all contain `bhaskar`
with a `level` field:

| File | What it is |
|------|-----------|
| `config/access-defaults.js` | Provisioning defaults — not the live config |
| `config/env-overrides.js` | `bhaskar: { level: "write" }` — staging env only |
| `utils/permissions-snapshot.js` | Auto-generated cache — do not edit directly |
| `utils/permissions-legacy.js` | Deprecated v1 format — legacy API only |
| `utils/cfg_res_acl.js` | **← the production source of truth** |

Even `glob **/*permission*` misleads: it returns the snapshot and legacy files — not the target.

The agent greps for "bhaskar", gets 13 hits across 13 files, and must open and
evaluate 4–5 configs before finding the right one.

**Expected: 10–14 tool calls**

---

### Scenario 2 — No context, one clearly-named file

Same core project. The 4 decoy files are gone. The target is `utils/user-permissions.js`.

`glob **/*permission*` → 1 file → the target, immediately.

**Expected: 3–5 tool calls**

---

### Scenario 3 — CLAUDE.md points directly to the file

Same as scenario 2, plus `CLAUDE.md` explicitly names `utils/user-permissions.js`
as the permission source of truth. The agent reads it on startup and goes straight there.

**Expected: 2–3 tool calls**

---

### Scenario 4 — Custom skill on a messy codebase

**Same messy codebase as scenario 1** (all 4 decoys, cryptic filename) — but with
`tools/find-permission.js`, a project-specific helper script.

`CLAUDE.md` tells the agent: "use `node tools/find-permission.js <username>` — don't search manually."

The agent runs the skill, gets back:

```
Permission config for: bhaskar
  File  : utils/cfg_res_acl.js
  Level : "read"
  ...
To update, edit the "level" field for "bhaskar" in: utils/cfg_res_acl.js
```

It then makes the edit. The 4 decoy files are irrelevant — the tool already knows which file is the source of truth via `tools/permission-registry.json`.

**Expected: 3–4 tool calls** — on the identical messy codebase that took 10–14 in scenario 1.

---

## What to observe

```
Scenario 1   grep → 13 hits → open access-defaults.js  → wrong (provisioning only)
                             → open env-overrides.js   → wrong (staging only)
                             → open permissions-snapshot.js → wrong (cached)
                             → open permissions-legacy.js   → wrong (v1 format)
                             → open cfg_res_acl.js → ✓ edit
             ≈ 10–14 tool calls

Scenario 2   glob **/*permission* → 1 hit → open user-permissions.js → ✓ edit
             ≈ 3–5 tool calls

Scenario 3   read CLAUDE.md → open user-permissions.js → ✓ edit
             ≈ 2–3 tool calls

Scenario 4   read CLAUDE.md → run tools/find-permission.js bhaskar
                             → told: utils/cfg_res_acl.js, level "read"
                             → edit cfg_res_acl.js → ✓
             ≈ 3–4 tool calls  (on scenario 1's codebase)
```

---

## How to run

```bash
# Preview what the agent faces in each scenario
./test-scenario.sh 1
./test-scenario.sh 4

# Run the agent
cd scenario-1
opencode
# paste the task prompt

# Verify
cd ..
./test-scenario.sh 1 --verify

# Repeat for 2, 3, 4
```

---

## Key insights

**1. File naming is a search index.**
`glob **/*permission*` returns the target immediately in scenario 2 and nothing useful in scenario 1.
Good names aren't just readable — they're machine-searchable.

**2. Multiple plausible candidates each cost a round trip.**
Decoy files force the agent to read, evaluate, and discard. Four decoys ≈ four extra tool calls.
The problem isn't that the agent is slow — it's that it has no way to skip steps it doesn't know are wrong.

**3. CLAUDE.md eliminates the discovery phase.**
The agent doesn't search at all in scenario 3. It reads the map you gave it and goes to work.
The cost of writing one good CLAUDE.md is paid back on every task the agent ever runs in this repo.

**4. A skill can substitute for a clean codebase.**
Scenario 4 has the same mess as scenario 1, but the agent achieves scenario 3 efficiency.
A well-written tool encodes the knowledge a senior engineer would share on day one:
"don't look at the snapshot or the legacy file — use `cfg_res_acl.js`."
The skill does the disambiguation so the agent doesn't have to.

---

## Project structure

```
scenario-1/  scenario-4/          ← messy: 4 decoys + cryptic target
├── config/
│   ├── access-defaults.js        ← DECOY (provisioning defaults)
│   └── env-overrides.js          ← DECOY (staging overrides, bhaskar has "write")
├── utils/
│   ├── cfg_res_acl.js            ← TARGET (hard to find by name)
│   ├── permissions-snapshot.js   ← DECOY (cached copy)
│   └── permissions-legacy.js     ← DECOY (deprecated v1 format)
└── tools/                        ← scenario-4 only
    ├── find-permission.js        ← skill: looks up the source of truth for any user
    └── permission-registry.json  ← registry: records which file is production

scenario-2/  scenario-3/          ← clean: no decoys, semantic target name
└── utils/
    └── user-permissions.js       ← TARGET (findable by glob in one step)

scenario-3/  scenario-4/          ← have CLAUDE.md
└── CLAUDE.md                     ← s3: points to the file  |  s4: documents the tool
```
