# Presenter Runbook — The Harness Around the Model

**Thesis:** The model is fixed. The harness is your leverage. Same prompt, same
model, same agent every run — only the *repo context* changes, and behaviour,
speed, and **correctness** change with it.

**The prompt (never changes):**
```
Change bhaskar's permission level from "read" to "write" in this project.
```

---

## The one rule that keeps you honest

The scoreboard's **tool-call counts (9 / 6 / 2 / 3) are the recorded eval.** A live
`verify` only flips **correctness** (which file actually changed). So don't say
"watch the count drop live." Say:

> "The live run proves it lands on the **right file**. The **counts** come from the
> recorded eval."

## Same model every run

Pin the same fast model on all three live runs so the *only* variable is the
harness (this is also the model the recording used, so s1 reliably fails):

```
opencode --model github-copilot/claude-haiku-4.5
```

---

## Setup (once, before the talk)

```bash
cd /Users/bhaskar.melkani/Documents/Projects/bhaskar/harness-playground/harness-demo
node tools/demo.mjs init      # resets all scenarios to "read"
node tools/demo.mjs serve     # keep this terminal open
```
Open two tabs: `http://localhost:4177/presentation` and `.../results`.
Deck keys: **→/space** next · **←** back · **N** speaker notes · **F** fullscreen.

Warm-up (optional, slide 5, no model needed):
```bash
cd concepts && ./probe.sh     # shows COLD vs LANDS
```

---

## Run loop (do this for s1 → s2 → s4)

For each scenario N, in a second terminal:
```bash
node tools/demo.mjs stage N
cd scenario-N && opencode --model github-copilot/claude-haiku-4.5
#   paste the prompt above, let it finish, then Ctrl-C / quit opencode
node tools/demo.mjs verify N     # flips the live row on the results tab
```
Then switch to the results tab and point at the row.

| # | Slide | What to watch | The one line to say |
|---|---|---|---|
| **s1** | "Maximum ambiguity" | greps, opens 4 decoys, edits **`config/access-defaults.js` — the WRONG file** | "No harness. It's not just slow — it's *wrong*." |
| **s2** | "One good filename" | `glob **/*permission*` → 1 hit → edit | "Nothing about the model changed. We made the repo searchable." |
| **s4** | "Same mess + a tool" | reads `CLAUDE.md` → runs `find-permission.js` → edits the right file | "Same messy repo as s1. One doc + one tool. Pure harness." |

> **s3** (CLAUDE.md points straight at the file, 2 calls) is *supporting* material —
> mention it as the docs-only midpoint; no need to run it live.

**The money slide is s1 vs s4:** identical messy repo; s1 edits the wrong file, s4
nails it in 3 calls. Don't rush it.

---

## If a live run misbehaves

Agents are probabilistic. If **s1 happens to succeed** (a good sign the wrong file
*looked* plausible but it got lucky), don't fight it — load the controlled result
and move on:
```bash
node tools/demo.mjs recorded     # fills the board from the recorded sessions
```
Say: "Live runs vary; the recorded eval is our controlled measurement, and the
verifier is what we trust." Same fallback if timing gets tight.

Other quick fixes:
- Results page blank → confirm `serve` is running; refresh.
- Port busy → `node tools/demo.mjs serve --port 4188` (open `:4188/...`).
- Scenarios look already-changed → `node tools/demo.mjs init` again.

---

## Numbers to memorize

```
s1: 9 calls, WRONG file   s2: 6, correct   s3: 2, correct   s4: 3, correct (on s1's messy repo)
```

## Three answers to have ready

- **"Isn't this just prompt engineering?"** No — the prompt is identical every run.
  We changed the *environment* the agent searches: names, docs, tools. That's
  context engineering.
- **"Why not just use a bigger model?"** A bigger model in s1 still faces 4
  plausible files with no signal for which is production. It guesses better, but it
  still guesses. The harness removes the guess.
- **"Scaffold vs harness?"** Scaffold = generic machinery (tool calls, parsing,
  sandbox). Harness = *this repo's* signals: what's the source of truth, what not
  to edit, which helper to run.

**Close:** "Stop tuning the model you can't change. Engineer the context you can."
Piper is where those harness choices live.
```
