#!/usr/bin/env bash
# probe.sh — model-free eval for the concept exercises.
#
# An agent's first move is almost always a search. So we can measure harness
# quality WITHOUT running a model: run the search the agent would run, and see
# whether it LANDS on the target or comes back COLD (forcing the agent to guess).
set -uo pipefail
shopt -s globstar nullglob 2>/dev/null || true

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

bold()  { printf "\033[1m%s\033[0m\n" "$1"; }
land()  { printf "  \033[32mLANDS\033[0m  %s\n" "$1"; }
cold()  { printf "  \033[31mCOLD \033[0m  %s\n" "$1"; }

# count files matching a glob (null-safe)
count_glob() { local n=0; for f in $1; do [[ -e "$f" ]] && n=$((n+1)); done; echo "$n"; }
# count lines matching a regex under a dir
count_grep() { grep -rIiE "$2" "$1" 2>/dev/null | wc -l | tr -d ' ' || true; }

echo
bold "════════ Concept probe — what does the agent's first search return? ════════"

# ── 02 file-names ────────────────────────────────────────────────────────────
echo
bold "02 file-names — agent runs:  glob '**/*permission*'"
bad=$(count_glob "02-file-names/bad/**/*permission*")
good=$(count_glob "02-file-names/good/**/*permission*")
[[ "$bad"  -gt 0 ]] && land "bad/  → $bad file(s)"  || cold "bad/  → $bad files  (name has no searchable term; agent must open files blind)"
[[ "$good" -gt 0 ]] && land "good/ → $good file(s) (user-permissions.js — found in one step)" || cold "good/ → $good files"

# ── 03 variable-names ────────────────────────────────────────────────────────
echo
bold "03 variable-names — agent runs:  grep -i 'permission|level|read'"
cry=$(count_grep "03-variable-names/cryptic" "permission|level|read")
cln=$(count_grep "03-variable-names/clean"   "permission|level|read")
[[ "$cry" -gt 0 ]] && land "cryptic/ → $cry hit(s)" || cold "cryptic/ → $cry hits  (data hidden as lv:\"r\"; agent can't find the concept by name)"
[[ "$cln" -gt 0 ]] && land "clean/   → $cln hit(s) (descriptive names match the query)" || cold "clean/   → $cln hits"

# ── 04 cold-start doc ────────────────────────────────────────────────────────
echo
bold "04 cold-start — agent reads startup doc (AGENTS.md) before doing anything"
if [[ -f "04-coldstart-doc/without/AGENTS.md" ]]; then
  land "without/ → AGENTS.md present"
else
  cold "without/ → no AGENTS.md  (agent must explore acl.js vs cache.js and guess)"
fi
if grep -qsE "acl\.js" "04-coldstart-doc/with/AGENTS.md" 2>/dev/null; then
  land "with/    → AGENTS.md names utils/acl.js as source of truth (no search needed)"
else
  cold "with/    → AGENTS.md does not name the target"
fi

echo
bold "Takeaway: LANDS = harness did the work up front.  COLD = the model has to guess."
echo
