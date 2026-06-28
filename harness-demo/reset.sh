#!/usr/bin/env bash
# reset.sh — restore all scenarios to their initial state before a demo run.
# Resets bhaskar's permission level back to "read" in all four scenarios.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

reset_file() {
  local file="$1"
  # Replace only bhaskar's level back to "read" in either compact or multiline objects.
  python3 -c "
import re, sys
path = sys.argv[1]
text = open(path).read()
result = re.sub(
    r'(bhaskar\s*:\s*\{[^}]*?level\s*:\s*)[\"\\']write[\"\\']',
    r'\1\"read\"',
    text,
    flags=re.DOTALL,
)
open(path,'w').write(result)
" "$file"
}

reset_if_exists() {
  local file="$1"
  local label="$2"
  if [[ -f "$file" ]]; then
    reset_file "$file"
    echo "  - $label"
  fi
}

echo "Resetting permission files..."

reset_if_exists "$SCRIPT_DIR/scenario-1/utils/cfg_res_acl.js" "scenario-1/utils/cfg_res_acl.js"
reset_if_exists "$SCRIPT_DIR/scenario-1/config/access-defaults.js" "scenario-1/config/access-defaults.js"
reset_if_exists "$SCRIPT_DIR/scenario-1/utils/permissions-snapshot.js" "scenario-1/utils/permissions-snapshot.js"
reset_if_exists "$SCRIPT_DIR/scenario-1/utils/permissions-legacy.js" "scenario-1/utils/permissions-legacy.js"

reset_if_exists "$SCRIPT_DIR/scenario-2/utils/user-permissions.js" "scenario-2/utils/user-permissions.js"

reset_if_exists "$SCRIPT_DIR/scenario-3/utils/user-permissions.js" "scenario-3/utils/user-permissions.js"

reset_if_exists "$SCRIPT_DIR/scenario-4/utils/cfg_res_acl.js" "scenario-4/utils/cfg_res_acl.js"
reset_if_exists "$SCRIPT_DIR/scenario-4/config/access-defaults.js" "scenario-4/config/access-defaults.js"
reset_if_exists "$SCRIPT_DIR/scenario-4/utils/permissions-snapshot.js" "scenario-4/utils/permissions-snapshot.js"
reset_if_exists "$SCRIPT_DIR/scenario-4/utils/permissions-legacy.js" "scenario-4/utils/permissions-legacy.js"

echo ""
echo "All scenarios reset. Run each demo from inside its directory."
echo "Pin the SAME model every run so only the harness varies:"
echo ""
echo "  cd scenario-1 && opencode --model github-copilot/claude-haiku-4.5   # ← must cd in first"
echo "  cd scenario-2 && opencode --model github-copilot/claude-haiku-4.5"
echo "  cd scenario-3 && opencode --model github-copilot/claude-haiku-4.5"
echo "  cd scenario-4 && opencode --model github-copilot/claude-haiku-4.5"
echo ""
echo "Verify after each run (updates the live scoreboard):"
echo "  node tools/demo.mjs verify 1"
echo "  node tools/demo.mjs verify 2"
echo "  node tools/demo.mjs verify 3"
echo "  node tools/demo.mjs verify 4"
