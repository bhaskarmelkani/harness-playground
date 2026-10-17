# harness-demo

A one-hour, mostly live session on how a coding agent works. The same task runs
again and again with the same agent and model. The only thing that changes is
the repo around it: names, `AGENTS.md`, a project tool, and a fast "System 1"
model.

```
Change bhaskar's permission level from "read" to "write" in this project.
```

- **Deck:** `presentation.html`, served by `node tools/demo.mjs serve`. Every
  slide has a terminal tray at the bottom with the commands for that moment:
  click one or press its number to copy it.
- **Runbook:** [`PRESENTER_PREP.md`](PRESENTER_PREP.md): setup, the run loop,
  fallbacks.
- **Run of show:** [`PRESENTATION.md`](PRESENTATION.md): timings and the talk
  track per act.

## Quick start

```bash
cd harness-demo
node tools/demo.mjs doctor   # preflight: agent on PATH, credentials, clean fixtures
node tools/demo.mjs init     # reset every fixture and the scoreboard
node tools/demo.mjs serve    # keep running; open http://localhost:4177/presentation
```

The agent command is the same for every run. It defaults to
`opencode --model github-copilot/claude-haiku-4.5` (what the recordings used).
Change it in the deck (press <kbd>S</kbd>) and for the CLI with
`HARNESS_AGENT="pi --provider anthropic --model claude-haiku-4-5"`.

## What's in here

| Path | What it is |
|------|------------|
| `concepts/01-explore-loop` | 3 files. Ask a question, then ask for a change, and compare. |
| `concepts/02-file-names` | `utils/u.js` vs `utils/user-permissions.js` |
| `concepts/03-variable-names` | `lv: "r"` vs `permissionLevel: "read"` |
| `concepts/04-coldstart-doc` | the same look-alikes with and without `AGENTS.md` |
| `concepts/probe.sh` | runs the agent's first search without a model: lands or cold |
| `scenario-1` | Express API, cryptic target name, 4 look-alike permission files |
| `scenario-2` | look-alikes removed, target renamed `utils/user-permissions.js` |
| `scenario-3` | scenario-2 plus an `AGENTS.md` that names the file |
| `scenario-4` | scenario-1's files plus `tools/find-permission.js` and a hand-written registry |
| `scenario-5` | scenario-1's files plus `tools/system1.mjs`, a generic ranker backed by a fast model |
| `recordings/` | real opencode transcripts of s1–s4 (Claude Haiku 4.5) |
| `tools/demo.mjs` | stage manager: doctor, init, serve, stage, verify, trace, score |
| `tools/session-table.mjs` | parses the recordings into the eval table |

The look-alikes in scenario-1, 4 and 5:

| File | What it really is |
|------|-------------------|
| `utils/cfg_res_acl.js` | **the production source of truth (target)** |
| `config/access-defaults.js` | defaults for new accounts |
| `config/env-overrides.js` | staging and dev only (bhaskar is already `write` there) |
| `utils/permissions-snapshot.js` | auto-generated cache |
| `utils/permissions-legacy.js` | deprecated v1 format |

## Recorded results

Same model (Claude Haiku 4.5 in opencode), same prompt:

| Run | Lever | Tool calls | Model time | File edited |
|-----|-------|-----------:|-----------:|-------------|
| s1 | none | 9 | 32.8 s | `config/access-defaults.js` (**wrong**) |
| s2 | naming | 6 | 16.9 s | `utils/user-permissions.js` |
| s3 | `AGENTS.md` | 2 | 15.6 s | `utils/user-permissions.js` |
| s4 | `AGENTS.md` + project tool | 3 | 23.8 s | `utils/cfg_res_acl.js` |
| s5 | `AGENTS.md` + System 1 | not recorded yet | | |

`node tools/demo.mjs trace 1` replays a recording turn by turn.
`node tools/session-table.mjs --details` prints the table above with every search
the agent ran.

## System 1: `scenario-5/tools/system1.mjs`

A coding agent spends most of its turns on quick decisions: which file, which
tool, what kind of request. `system1.mjs` hands those to a decision model,
[Cloudflare Clef-flash](https://developers.cloudflare.com/workers-ai/models/clef-flash/),
which answers typed questions with a probability per option in tens of
milliseconds, and leaves the big model to read and edit.

```bash
node scenario-5/tools/system1.mjs route "How does this app decide what bhaskar is allowed to do?"
node scenario-5/tools/system1.mjs tools "Why did checkout start failing in production last night?"
node scenario-5/tools/system1.mjs rank  "where is bhaskar's permission level defined"
```

- `route`: question, change or run? Plus "multi-file?" and "risky?".
- `tools`: one yes/no question per tool, 14 in one request; prints which tool
  definitions to load.
- `rank`: grep gathers candidate files (deterministic), then one choice question
  picks the file the request is about.

To use the real model, export `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`
(a Workers AI token). Without them, or if the call fails, the script runs an
offline keyword stand-in and says so on its first line. `--raw` prints the API
response, `--json` prints machine-readable output, `SYSTEM1_MODEL` switches model
(for example `@cf/cloudflare/clef`).

The request shape follows Cloudflare's published examples (`state` plus
`questions` of type `choice` / `noul`). It was tested against a local mock of
several response shapes, not against the live API, so run one call with `--raw`
before the session.

## Keep the scenarios clean

- Recordings live in `recordings/`, not in the scenario folders. A live agent
  that greps its scenario must never find a previous run's answer.
- Don't add an `AGENTS.md` or `CLAUDE.md` above the scenario folders. Agents can
  pick these files up from parent directories too, which would leak hints into
  every scenario.
- `node tools/demo.mjs doctor` lists any fixture file that differs from git.
