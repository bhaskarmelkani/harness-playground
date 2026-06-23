# 01 — The explore loop ("an agent is not magic")

**Prompt to paste:**
```
Change bhaskar's permission from "read" to "write".
```

**Scaffold:** three tiny files. Only one (`users.js`) mentions `bhaskar`. The agent
is not told which file — exactly like a real repo.

**What we test:** that the agent cannot edit until it has *located* the code. Watch
the loop:

```
find / list files  →  grep "bhaskar"  →  read the one hit  →  edit  →  done
```

**Expected behavior:** ~3 tool calls. The point to say out loud:

> "It didn't 'know' where bhaskar was. No model does. It searched for the word,
> found the one file that had it, read it, and edited. Find → read → act. That's the
> whole trick — and everything we do to the harness is just making each of those
> steps cheaper."

This is the clean baseline. The next three exercises show what happens to that
search step when names are bad, and how a doc skips it entirely.
