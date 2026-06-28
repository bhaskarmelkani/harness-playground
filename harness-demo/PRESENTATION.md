# The Harness Around the Model
### A 30-minute talk on why context — not the model — decides agent behavior

> **One-line thesis:** The model is fixed. Everything that makes an agent useful, safe, and fast lives in the *harness* around it — and most of that harness is **context engineering**: naming, docs, skills, tools, MCP, and prompts.

**Task used in every demo (never changes):**
```
Change bhaskar's permission level from "read" to "write" in this project.
```

**Timing (30 min):**

| Section | Time | What happens |
|---|---|---|
| 1. What a harness is | 8 min | Concept: model → scaffold → agent → harness |
| 2. The real argument: contextual harness | 5 min | MCP, prompts, skills, docs, naming |
| 3. Live exercises | 10 min | Scenarios 1 → 2 → 4 |
| 4. Evals: prove it with numbers | 5 min | `session-table.mjs` |
| 5. Close: Piper | 2 min | Where you encode the harness |

---

## Section 1 — What a harness is (8 min)

Start with the layered mental model. Draw this top-to-bottom on a slide/whiteboard:

```
                ┌─────────────────────────────────────────┐
                │        CONTEXTUAL HARNESS                 │   ← the part nobody talks about
                │  naming · docs · skills · tools · MCP ·   │
                │  prompts · permissions · memory           │
                ├─────────────────────────────────────────┤
                │              AGENT                        │   ← goal + loop: plan, act, observe
                ├─────────────────────────────────────────┤
                │             SCAFFOLD                      │   ← tools, parsing, retries, sandbox
                ├─────────────────────────────────────────┤
                │              MODEL                        │   ← fixed weights; same for everyone
                └─────────────────────────────────────────┘
```

**Talk track:**

- **Model.** The weights. You don't change them. Everyone calling the same model
  gets the same raw capability. If the model were the whole story, every coding
  agent would be identical. They're not.
- **Scaffold.** The plumbing that turns a text-predictor into something that can
  *act*: the tool definitions, the parser that turns model output into tool calls,
  retries, the sandbox, the file/edit primitives. This is what most people mean
  when they say "agent framework."
- **Agent.** The loop. A goal, plus *plan → act → observe → repeat* until done.
  Scaffold + loop is the minimum to do work.
- **The punchline:** *this is not it.* Two teams can run the **identical model and
  the identical agent loop** and get wildly different results. The difference is
  the **contextual harness** — the layer that tells the agent *what's true about
  this specific project*. That's the layer we can actually engineer, and it's what
  the rest of this talk is about.

> Transition line: "Let me show you that the model is not the variable. We'll hold
> the model and the agent constant, and only change the context around it."

**Optional live warm-up (2 min) — show the mechanism first.** Before the harness
argument, prove "an agent is not magic" with the tiny `concepts/` playgrounds:

```bash
cd harness-demo/concepts && ./probe.sh
```

`probe.sh` is a **model-free eval**: it runs the exact search an agent runs first
(`glob **/*permission*`, `grep -i "permission|level|read"`, read `AGENTS.md`) and
shows whether it **LANDS** on the target or comes back **COLD**. Use it to make the
point that bad names/values are *invisible to the query the agent actually runs* —
no model needed. See `concepts/README.md` for the four single-concept exercises
(explore loop, file names, variable names, cold-start doc).

---

## Section 2 — The contextual harness (5 min)

These are the levers. All of them are "context" — they shape what the agent knows
before and during the loop, without touching the model.

| Lever | What it is | What it buys you |
|---|---|---|
| **Naming** | File/symbol names that match how you'd search | The repo becomes its own search index |
| **Docs** | `CLAUDE.md` / `AGENTS.md` read on startup | Skips the discovery phase entirely |
| **Skills** | Project-specific helper tools/scripts | Encodes senior-engineer knowledge once |
| **MCP** | Servers exposing live systems (DB, tickets, browser) | Agent reads ground truth instead of guessing |
| **Prompts** | Slash commands / reusable workflows | Standardizes *how* a task is done, every time |
| **Permissions** | Allow/deny + sandbox | Safety and fewer interruptions |
| **Memory** | Persisted facts across sessions | Doesn't re-learn the project every time |

**The claim we're about to prove:**
> Improving any of these — *without changing the model* — measurably reduces tool
> calls, eliminates wrong answers, and makes behavior repeatable.

Today's live demos isolate three of these levers — **naming**, **docs**, and
**skills/tools** — because they're the easiest to measure. MCP and prompts are the
same idea applied to live systems and repeatable workflows; I'll point to where
they fit as we go.

---

## Section 3 — Live exercises (10 min)

**Setup before the talk** (do this off-stage):
```bash
cd /Users/bhaskar.melkani/Documents/Projects/bhaskar/harness-playground/harness-demo
node tools/demo.mjs init
node tools/demo.mjs serve
```

Open two browser tabs:

- `http://localhost:4177/presentation`
- `http://localhost:4177/results`

Every demo pastes the **same prompt**. The only thing that changes between runs is
the harness. To preview what the agent faces in any scenario:
```bash
./test-scenario.sh 1   # or 2, 4   (shows noise profile, target, CLAUDE.md, tool output)
```

> If running live agents is risky for timing, the recorded sessions
> (`scenario-N/session-N.md`) are the fallback — they're real runs and they feed
> the eval in Section 4.

### Exercise A — Scenario 1: no context, maximum ambiguity (lever: *none*)

```bash
node /Users/bhaskar.melkani/Documents/Projects/bhaskar/harness-playground/harness-demo/tools/demo.mjs stage 1
cd scenario-1 && opencode
# paste: Change bhaskar's permission level from "read" to "write" in this project.
node /Users/bhaskar.melkani/Documents/Projects/bhaskar/harness-playground/harness-demo/tools/demo.mjs verify 1
```
- **The repo:** cryptic target filename (`utils/cfg_res_acl.js`) + **4 decoy files**
  that all contain `bhaskar` and a `level` field.
- **What to watch:** the agent greps, gets a pile of hits, and opens file after
  file trying to tell them apart.
- **The kicker — say this out loud:** in the recorded run it edited
  **`config/access-defaults.js` — the WRONG file** (provisioning defaults, not the
  live config). *This isn't slow; it's incorrect.* The harness failure here is
  ambiguity, and the cost is correctness, not just latency.

### Exercise B — Scenario 2: one good filename (lever: *naming*)

```bash
node /Users/bhaskar.melkani/Documents/Projects/bhaskar/harness-playground/harness-demo/tools/demo.mjs stage 2
cd ../scenario-2 && opencode
# paste the same prompt
node /Users/bhaskar.melkani/Documents/Projects/bhaskar/harness-playground/harness-demo/tools/demo.mjs verify 2
```
- **Only change vs s1:** decoys gone, target renamed to `utils/user-permissions.js`.
- **What to watch:** `glob **/*permission*` returns exactly one file. Read → edit.
- **Say this:** "Nothing about the model changed. We made the repo searchable. The
  filename *is* an index."

### Exercise C — Scenario 4: custom tool on the messy repo (lever: *skills/tools*)

```bash
node /Users/bhaskar.melkani/Documents/Projects/bhaskar/harness-playground/harness-demo/tools/demo.mjs stage 4
cd ../scenario-4 && opencode
# paste the same prompt
node /Users/bhaskar.melkani/Documents/Projects/bhaskar/harness-playground/harness-demo/tools/demo.mjs verify 4
```
- **The repo is identical to scenario 1** — same cryptic name, same 4 decoys.
- **The difference:** a `CLAUDE.md` (a doc!) that says *don't grep — run
  `node tools/find-permission.js <user>`*, plus the tool itself, which reads a
  registry and names the production source of truth.
- **What to watch:** the agent runs the tool, is told the exact file + current
  value, and edits it. Same mess as s1, but it lands correctly in ~3 calls.
- **Say this:** "This is the harness getting *smarter*. We encoded the
  disambiguation a senior engineer would tell you on day one — once — and now every
  task in this repo starts with that advantage. This is exactly what an **MCP
  server** or a **slash-command prompt** does at larger scale: it hands the agent
  ground truth instead of making it rediscover it."

> Scenario 3 (CLAUDE.md points straight at the file) is **supporting material**, not
> a primary live demo — mention it as the "docs-only" midpoint between s2 and s4.

---

## Section 4 — Evals: prove it with numbers (5 min)

Don't ask the audience to take the demos on faith. Run the eval:

```bash
cd /Users/bhaskar.melkani/Documents/Projects/bhaskar/harness-playground
node harness-demo/tools/demo.mjs score
```

The live results tab updates as each `verify` command runs. The recorded eval still
comes from `session-table.mjs`, and the scoreboard shows those numbers beside the
live status:

| scenario | lever added | total tool calls | correct file? | notes |
|---|---|---|---|---|
| s1 | none | **9** | **❌ NO** | edited `access-defaults.js` (wrong) |
| s2 | naming | 6 | ✅ | filename reduces exploration |
| s3 | docs (CLAUDE.md) | **2** | ✅ | context file short-circuits discovery |
| s4 | skill/tool | 3 | ✅ | correct on the *same messy repo* as s1 |

**The three things to say while this is on screen:**

1. **Same model, same agent, same task — every row.** The only variable is the
   harness. Tool calls drop from 9 → 2, and the *wrong answer in s1 becomes right*.
2. **s1 didn't just take longer — it was wrong.** Better context isn't an
   optimization; it's the difference between a correct and an incorrect change to a
   permissions file.
3. **s1 vs s4 is the money comparison.** Identical messy codebase. s1 flails and
   edits the wrong file; s4 nails it in 3 calls. The delta is *one tool + one doc* —
   pure harness.

For raw detail during Q&A:
```bash
node harness-demo/tools/session-table.mjs --details      # show the search queries each run made
node harness-demo/tools/session-table.mjs --format json  # machine-readable
```

If the live agent runs are taking too long, load the recorded outcomes into the
scoreboard and continue the talk:

```bash
node harness-demo/tools/demo.mjs recorded
```

---

## Section 5 — Close: where you encode the harness (2 min)

- The model is a commodity; **the harness is your leverage.** Naming, docs, skills,
  MCP, prompts — that's where the wins in these numbers came from.
- **Piper** is where those harness choices live: it's the place you shape search,
  context, tools, and workflow — not "another coding agent."
- Meta-point worth landing: the assistant that helped build and present this demo
  (the `harness-demo-presenter` skill) **is itself a piece of the harness.** We
  didn't get a better model. We gave it better context.

> Final line: "Stop tuning the model you can't change. Engineer the context you can."

---

## Appendix — Presenter cheat sheet

**Reset between dry runs:**
```bash
cd harness-demo && node tools/demo.mjs init
```

**Verify a scenario landed correctly (if running live):**
```bash
node tools/demo.mjs verify 1   # PASS only if the *right* file now says "write"
```

**Numbers to memorize:** 9 (wrong) → 6 → 2 → 3 (right, on the messy repo).

**If asked "isn't this just prompt engineering?"** — No. Naming and tools change
the *environment* the agent searches, not just the instruction. The agent in s4 was
never told the filename; the tool told it. That's the harness doing the work.

**If asked "why not just use a bigger model?"** — A bigger model in s1 still faces
4 plausible files and no signal for which is production. It guesses better, but it
still guesses. The harness removes the guess.
