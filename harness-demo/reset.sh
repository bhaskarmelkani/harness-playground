#!/usr/bin/env bash
# reset.sh — restore every demo fixture before a run.
# Puts bhaskar back to "read" in all scenarios and concept playgrounds.
# config/env-overrides.js is left alone on purpose: its staging "write" is a decoy.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

reset_file() {
  local file="$1"
  # Only bhaskar's entry changes, in compact or multiline objects.
  # Covers level / permission / permissionLevel ("write" -> "read") and the
  # cryptic concept file's lv ("w" or "write" -> "r").
  python3 -c "
import re, sys
path = sys.argv[1]
text = open(path).read()
text = re.sub(
    r'(bhaskar\s*:\s*\{[^}]*?\b(?:level|permission|permissionLevel)\s*:\s*)[\"\\']write[\"\\']',
    r'\1\"read\"',
    text,
    flags=re.DOTALL,
)
text = re.sub(
    r'(bhaskar\s*:\s*\{[^}]*?\blv\s*:\s*)[\"\\'](?:w|write)[\"\\']',
    r'\1\"r\"',
    text,
    flags=re.DOTALL,
)
open(path, 'w').write(text)
" "$file"
}

reset_if_exists() {
  local rel="$1"
  if [[ -f "$SCRIPT_DIR/$rel" ]]; then
    reset_file "$SCRIPT_DIR/$rel"
    echo "  - $rel"
  fi
}

echo "Resetting permission files..."

for n in 1 4 5; do
  reset_if_exists "scenario-$n/utils/cfg_res_acl.js"
  reset_if_exists "scenario-$n/config/access-defaults.js"
  reset_if_exists "scenario-$n/utils/permissions-snapshot.js"
  reset_if_exists "scenario-$n/utils/permissions-legacy.js"
done
reset_if_exists "scenario-2/utils/user-permissions.js"
reset_if_exists "scenario-3/utils/user-permissions.js"

reset_if_exists "concepts/01-explore-loop/users.js"
reset_if_exists "concepts/02-file-names/bad/utils/u.js"
reset_if_exists "concepts/02-file-names/good/utils/user-permissions.js"
reset_if_exists "concepts/03-variable-names/clean/access.js"
reset_if_exists "concepts/03-variable-names/cryptic/access.js"
for v in with without; do
  reset_if_exists "concepts/04-coldstart-doc/$v/utils/acl.js"
  reset_if_exists "concepts/04-coldstart-doc/$v/utils/cache.js"
done

echo ""
echo "All fixtures reset."
echo "Anything else an agent changed (new files, other edits) is listed by:"
echo "  node tools/demo.mjs doctor"
