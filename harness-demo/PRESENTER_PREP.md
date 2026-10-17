# Presenter runbook

Thesis: the model is fixed; the harness around it decides what it finds, how
fast, and whether it edits the right file.

## The day before

1. Install the agent you will use and log in. The recordings used opencode
   with `github-copilot/claude-haiku-4.5`; use the same model for every run.
2. Optional, for the real System 1 model: create a Workers AI API token in the
   Cloudflare dashboard and export it in the shell you will present from.

   ```bash
   export CLOUDFLARE_ACCOUNT_ID=...
   export CLOUDFLARE_API_TOKEN=...
   node scenario-5/tools/system1.mjs route "test" --raw   # check the response parses
   ```

   Without credentials every System 1 command prints "offline stand-in" and uses
   a keyword heuristic. The demo still works; say so on stage.
3. Rehearse once end to end with the deck. Then record scenario-5 (see below).

## 15 minutes before

```bash
cd harness-demo
node tools/demo.mjs doctor   # fix anything marked FAIL
node tools/demo.mjs init     # reset fixtures and scoreboard
node tools/demo.mjs serve    # second terminal tab; leave it running
```

Screen layout: browser with `http://localhost:4177/presentation` on the left
half, terminal on the right half. Terminal font 18pt or larger.

If you use pi or Claude Code instead of opencode, press <kbd>S</kbd> in the deck
and pick the preset (or type your command), and start the server with
`HARNESS_AGENT="..." node tools/demo.mjs serve` so the CLI prints the same.

## Driving the deck

| Key | Does |
|-----|------|
| <kbd>→</kbd> / <kbd>←</kbd> | next / previous slide |
| <kbd>1</kbd>–<kbd>9</kbd> | copy that command from the tray at the bottom |
| <kbd>T</kbd> | start or pause the timer; the header pill says if you are behind plan |
| <kbd>N</kbd> | speaker notes: what to say, what to watch, what to do if it goes wrong |
| <kbd>P</kbd> | presenter window (notes, timer, next slide), synced with the deck |
| <kbd>H</kbd> | hide the tray |
| <kbd>S</kbd> | settings: agent command, demo folder |

Copied shell commands start with `cd "<demo folder>" &&`, so they work from any
terminal tab. Agent prompts (marked ▸) are copied as plain text to paste into
the agent. Copied commands get a ✓ so you can see where you are.

## The run loop (every live scenario)

1. `node tools/demo.mjs stage N`: marks it running on the scoreboard.
2. `cd scenario-N && <agent>`: start the agent.
3. Paste the prompt. Narrate the tool calls as they appear.
4. Quit the agent (`/exit` or Ctrl+C).
5. `node tools/demo.mjs verify N`: checks which file changed.

The tray on each scenario slide has exactly these, in this order.

## If something goes wrong

| Problem | Do this |
|---------|---------|
| A live run misbehaves or takes too long | quit it, `node tools/demo.mjs trace N` (s1–s4), move on |
| s1 picks the right file live | say so: live runs vary, that's why we verify and keep recordings |
| Scoreboard empty before act 5 | `node tools/demo.mjs recorded` |
| Files already say "write" | `node tools/demo.mjs init` |
| Deck can't reach the server | restart `serve`; port busy: `serve --port 4188` |

The last two slides are backups: recovery commands and all recordings on one
scale.

## Record scenario-5 after rehearsal

There is no recording of s5 yet; the deck shows its expected path as a dashed
bar. After a good rehearsal run in opencode, export the session as markdown
(`/export`) and save it as `recordings/session-5.md`. `session-table.mjs` and
`trace 5` pick it up automatically. To show it in the deck too, add an entry to
`RECORDED` in `presentation.html` (the numbers come from
`node tools/session-table.mjs --format json`).

## Numbers to remember

```
s1  9 calls  32.8 s  WRONG file (config/access-defaults.js)
s2  6 calls  16.9 s  correct
s3  2 calls  15.6 s  correct
s4  3 calls  23.8 s  correct, on s1's messy files
s1: 6 of 9 turns were spent looking for the file
```

Clef-flash: 9B decision model on Workers AI, released 1 Oct 2026, 38.8 ms
median (Cloudflare's figure), up to 64 questions per request.
