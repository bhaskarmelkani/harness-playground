---
name: harness-demo-presenter
description: Presentation assistant for the harness playground demo. Use manually via /skill:harness-demo-presenter to show the recommended talk flow, run the session comparison table, or prepare scenario-specific presenter cues for scenarios 1, 2, and 4.
disable-model-invocation: true
---

# Harness Demo Presenter

This skill is a manual, presentation-only assistant for the harness playground repo.

Assume the current repo root is:

`/Users/bhaskar.melkani/Documents/Projects/bhaskar/harness-playground`

Always stay concise and presenter-focused. Do not drift into generic coding advice.

## Command Modes

The user will invoke this skill manually with one of these forms:

- `/skill:harness-demo-presenter overview`
- `/skill:harness-demo-presenter table`
- `/skill:harness-demo-presenter scenario 1`
- `/skill:harness-demo-presenter scenario 2`
- `/skill:harness-demo-presenter scenario 4`
- `/skill:harness-demo-presenter talk-track`

Interpret the appended `User:` line to decide which mode to execute.

## Mode: `overview`

Give the final recommended presentation flow:

1. 10-minute explanation of what a harness is
2. 3 live demos in this order:
   - scenario 1
   - scenario 2
   - scenario 4
3. short Piper promotion close:
   - Piper is where you encode harness choices
   - this presentation assistant is itself part of that harness

Also mention:

- scenario 3 is supporting material, not a main live demo
- the same task prompt is reused across demos
- the point is not the model, but the surrounding harness: naming, docs, and tools

## Mode: `table`

Run this exact command from the repo root:

```bash
node harness-demo/tools/session-table.mjs
```

After running it:

- summarize the key comparison in 3-5 short bullets
- call out that scenario 1 made the wrong edit
- call out that scenario 4 gets low exploration on the same messy repo
- keep the explanation anchored in harness improvements, not “smarter model” framing

If the user asks for raw detail, use:

```bash
node harness-demo/tools/session-table.mjs --details
```

If the user asks for machine-readable output, use:

```bash
node harness-demo/tools/session-table.mjs --format json
```

## Mode: `scenario 1`

Provide:

- working directory:
  `/Users/bhaskar.melkani/Documents/Projects/bhaskar/harness-playground/harness-demo/scenario-1`
- prompt to paste:
  `Change bhaskar's permission level from "read" to "write" in this project.`
- one-sentence point:
  “Without good context, the agent has to explore and can still edit the wrong file.”
- what to watch:
  - discovery-first behavior
  - multiple reads
  - confusion between plausible permission files
  - risk is correctness, not just latency
- what to say after:
  “The harness problem here is ambiguity. The agent is doing reasonable search, but the repo is not helping it land on the source of truth.”

## Mode: `scenario 2`

Provide:

- working directory:
  `/Users/bhaskar.melkani/Documents/Projects/bhaskar/harness-playground/harness-demo/scenario-2`
- prompt to paste:
  `Change bhaskar's permission level from "read" to "write" in this project.`
- one-sentence point:
  “A better filename acts like an index and removes most of the exploration.”
- what to watch:
  - filename-based discovery
  - fewer tool calls
  - direct read then edit path
- what to say after:
  “Nothing magical changed in the model. We improved the harness by making the repo easier to search.”

## Mode: `scenario 4`

Provide:

- working directory:
  `/Users/bhaskar.melkani/Documents/Projects/bhaskar/harness-playground/harness-demo/scenario-4`
- prompt to paste:
  `Change bhaskar's permission level from "read" to "write" in this project.`
- one-sentence point:
  “A custom tool can beat manual exploration, even on a messy codebase.”
- what to watch:
  - tool-first behavior
  - the helper script identifying the real source of truth
  - low exploration despite the same ambiguity as scenario 1
- what to say after:
  “This is the harness getting smarter. We encoded repo knowledge once, and now the agent starts with that advantage every time.”

## Mode: `talk-track`

Produce a short presenter script for:

- the 10-minute harness explanation
- the transition into live demos
- the transitions between scenarios 1, 2, and 4
- the Piper promotion close

Keep it tight, natural, and presentation-ready. Use short paragraphs, not long outlines.

Make sure the close reinforces:

- Piper is not just another coding agent
- Piper is the place where we shape search, context, tools, and workflow
- this presenter skill is itself an example of building that harness layer

## Guardrails

- Do not invent other scenario orders
- Do not turn scenario 3 into a primary live demo
- Do not give abstract advice when the repo already provides exact commands
- Prefer exact commands and exact paths over summaries when setup is involved
