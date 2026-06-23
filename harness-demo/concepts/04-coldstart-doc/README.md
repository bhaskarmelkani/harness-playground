# 04 — A startup doc removes the cold-start search

**Prompt (same for both variants):**
```
Change bhaskar's permission from "read" to "write".
```

Both variants are the *same* slightly-messy project: the real config is
`utils/acl.js` (cryptic name) and there's a look-alike decoy `utils/cache.js` that
also contains `bhaskar` and a level. Searching is ambiguous on purpose.

| Variant | Startup doc | What the agent does first |
|---|---|---|
| `without/` | none | explores, finds two candidates, must pick — COLD start |
| `with/` | `AGENTS.md` names `utils/acl.js` as the source of truth | reads the doc, goes straight there — LANDS |

**What we test:** the value of the document an agent reads *before it does anything*.
In `with/`, the discovery phase disappears: the map was handed to it.

**Expected behavior:** `without/` spends calls disambiguating `acl.js` vs `cache.js`
(and may pick the cache by mistake); `with/` reads `AGENTS.md` → edits `acl.js`.

**Say this:** "Every agent cold-starts with zero knowledge of your repo. `AGENTS.md`
/ `CLAUDE.md` is the one file it reads first. Writing it once pays back on every task
forever — and it's the cheapest harness upgrade you can make."
