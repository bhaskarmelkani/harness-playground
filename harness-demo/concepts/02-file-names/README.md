# 02 — File names are a search index

**Prompt (same for both variants):**
```
Change bhaskar's permission from "read" to "write".
```

Two identical projects. The only difference is the **name of the file** that holds
the permissions.

| Variant | Target file | `glob **/*permission*` |
|---|---|---|
| `bad/` | `utils/u.js` (+ decoy `settings.js`) | **0 hits → COLD** |
| `good/` | `utils/user-permissions.js` | **1 hit → LANDS** |

**What we test:** whether the agent's filename search finds the target. In `bad/`
the agent's `glob` returns nothing useful, so it falls back to opening files one by
one. In `good/` the filename *is* the answer.

**Expected behavior:** `good/` finishes in fewer calls than `bad/`, with no wrong
turns. Run `./probe.sh` (one level up) to show the hit-count contrast live.

**Say this:** "Same code, same model. A searchable name turned a discovery problem
into a one-line lookup."
