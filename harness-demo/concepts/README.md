# Concepts — simple exercises that show *how* a coding agent works

These are deliberately tiny playgrounds (2–4 files each). Their only job is to make
four ideas obvious to an audience, in order:

1. **A coding agent is not magic.** To change code it must first *find* it — by
   searching files and words, then reading. (`01-explore-loop`)
2. **File names are a search index.** (`02-file-names`)
3. **Variable & value names are part of that index — clean code still matters.**
   (`03-variable-names`)
4. **A startup doc (`AGENTS.md`/`CLAUDE.md`) removes the cold-start search.**
   (`04-coldstart-doc`)

The same task is used everywhere, mirroring the main demo:

```
Change bhaskar's permission from "read" to "write".
```

> These `concepts/` exercises are for the **teaching** half of the talk (watch the
> mechanism live). The `scenario-1..5/` app + `tools/session-table.mjs` is the
> **proof** half (real agent runs, counted). Same lesson, two altitudes.

---

## How each exercise is structured

Each folder has:
- the toy code (the **scaffold** / play scenario),
- a `README.md` stating **what we test** and the **expected agent behavior**,
- where relevant, a `before/` (bad) and `after/` (good) variant so the contrast is
  side-by-side.

## The eval — `probe.sh` (no agent required)

The agent's *first move* is almost always a search. So we can measure harness
quality without running a model at all: run the search the agent would run, and
count the hits. Good harness = the obvious search lands on the target. Bad harness
= the obvious search returns nothing (or noise), which is exactly when the agent
starts guessing.

```bash
cd harness-demo/concepts
./probe.sh
```

It prints, per exercise, the search an agent would naturally run and whether it
**LANDS** (findable in one step) or goes **COLD** (agent must explore/guess).

| Exercise | Agent's natural search | Bad variant | Good variant |
|---|---|---|---|
| 02 file-names | `glob **/*permission*` | 0 hits → COLD | 1 hit → LANDS |
| 03 variable-names | `grep -i "permission\|level\|read"` | 0 hits → COLD | hits → LANDS |
| 04 cold-start | read `AGENTS.md` on startup | absent → COLD | names the file → LANDS |

---

## Suggested live flow (first half of the talk)

1. `01-explore-loop` — narrate the loop: *the agent has to search before it can
   edit. That's all an agent is — find, read, act, repeat.*
2. `02` then `03` — run `./probe.sh` and let the COLD vs LANDS contrast make the
   "naming matters" point for you.
3. `04` — show that one doc turns every future COLD start into a LANDS.
4. Hand off to the `scenario-1..5` app + `session-table.mjs` for the counted proof.
