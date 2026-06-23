# 03 — Variable & value names matter (clean code is harness)

**Prompt (same for both variants):**
```
Change bhaskar's permission from "read" to "write".
```

Here the **file name is identical** (`access.js`) and findable in both. The
difference is *inside* the file — the symbol and value names.

| Variant | The code | `grep -i "permission\|level\|read"` |
|---|---|---|
| `cryptic/` | `const d = { bhaskar: { lv: "r" } }` | **0 hits → COLD** |
| `clean/` | `const userPermissions = { bhaskar: { permissionLevel: "read" } }` | **hits → LANDS** |

**What we test:** the agent greps for the *concept* the user named ("permission",
"read"). Clean code uses those words, so the search lands. Cryptic code encodes the
same data as `lv: "r"`, so the search finds nothing — the agent has to open files
blind and *infer* that `lv:"r"` means "permission level: read". It might get it
wrong, or change the wrong key.

**Expected behavior:** `clean/` → direct grep → edit. `cryptic/` → failed grep →
blind reads → ambiguity (is `lv` the thing? is `"r"` read?).

**Say this:** "The model reads English. Your variable names *are* the search terms.
`lv:"r"` isn't just ugly — it's invisible to the exact query the agent runs. Clean,
descriptive naming is a harness feature, not a style preference."
