# Inside the Harness: run of show

60 minutes, five acts, mostly live. The deck (`presentation.html`) holds the
commands for every moment in its bottom tray and the full talk track in its
speaker notes (<kbd>N</kbd>). This file is the overview.

| Min | Slides | Act | Live |
|-----|--------|-----|------|
| 0–3 | 1–2 | Opening | – |
| 3–13 | 3–7 | How an agent works: a question vs a change | `concepts/01-explore-loop` twice |
| 13–27 | 8–15 | Code is still the interface | `probe.sh`, scenario-1, scenario-2 (concepts 02/03 if time) |
| 27–39 | 16–20 | `AGENTS.md` and project tools | scenario-3, scenario-4 |
| 39–52 | 21–28 | Fast and slow: a System 1 model | `system1.mjs route / tools / rank`, scenario-5 |
| 52–60 | 29–31 | Scoreboard, takeaways, questions | – |

Slides 32–33 are backups.

## Act 1: how an agent works

- An agent is a loop: the model writes a tool call as text, the harness runs it
  and appends the result, the model is called again with everything so far.
- Live: ask the 3-file repo a question, then (fresh session) ask for a change.
  Both start with the same search. A question ends in text nobody checks; a
  change ends in a diff you can verify.
- Line to land: "Finding the code is most of the work."

## Act 2: code is still the interface

- `concepts/probe.sh` runs the agent's first search without a model: cold or
  lands.
- File names and variable names are the agent's search terms.
- scenario-1: four look-alike permission files. The recording edited the wrong
  one and said "Done!". scenario-2: one good file name, correct in 6 calls.
- Line to land: "It wasn't slow. It was wrong."

## Act 3: AGENTS.md and project tools

- `AGENTS.md` is in the system prompt on every turn. scenario-3: no search at
  all, 2 calls.
- scenario-4: scenario-1's files plus a helper script and a hand-written
  registry. Correct in 3 calls.
- Line to land: "Identical files. One doc and one script." Then: "But somebody
  had to write that registry."

## Act 4: fast and slow

- Most of s1's turns were quick decisions (which file?) paid for at big-model
  prices.
- Clef-flash is a decision model: state plus typed questions in, probabilities
  out, ~39 ms median.
- Live: `route` (question or change), `tools` (14 yes/no questions in one
  request), `rank` (which file), then scenario-5: the messy files with no
  registry, only a generic ranker.
- Line to land: "Let System 1 decide what System 2 looks at."

## Act 5: wrap-up

1. An agent is a loop: search, read, act. Most turns are finding.
2. Names are the index. Clean code is agent infrastructure.
3. `AGENTS.md` is the cheapest upgrade. It is in every prompt.
4. Tools encode what you know. A fast model adds judgment on the fly.
5. "Done!" isn't proof. Verify the diff.

Likely questions and answers are in the notes of slide 31.
