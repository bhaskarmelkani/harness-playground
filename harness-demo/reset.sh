#!/usr/bin/env bash
# reset.sh — restore all scenarios to their initial state before a demo run.
# Resets bhaskar's permission level back to "read" in all four scenarios.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

reset_file() {
  local file="$1"
  # Replace level: "write" → "read" for bhaskar (works on macOS BSD sed + GNU sed)
  python3 -c "
import re, sys
path = sys.argv[1]
text = open(path).read()
# Only replace inside the bhaskar block
def fix(m): return m.group(0).replace('level: \"write\"', 'level: \"read\"')
result = re.sub(r'bhaskar:.*?grantedAt:[^}]+}', fix, text, flags=re.DOTALL)
open(path,'w').write(result)
" "$file"
}

echo "Resetting permission files..."

reset_file "$SCRIPT_DIR/scenario-1/utils/cfg_res_acl.js"
echo "  ✓ scenario-1/utils/cfg_res_acl.js"

reset_file "$SCRIPT_DIR/scenario-2/utils/user-permissions.js"
echo "  ✓ scenario-2/utils/user-permissions.js"

reset_file "$SCRIPT_DIR/scenario-3/utils/user-permissions.js"
echo "  ✓ scenario-3/utils/user-permissions.js"

reset_file "$SCRIPT_DIR/scenario-4/utils/cfg_res_acl.js"
echo "  ✓ scenario-4/utils/cfg_res_acl.js"

echo ""
echo "All scenarios reset. Run each demo from inside its directory:"
echo ""
echo "  cd scenario-1 && opencode   # ← must cd in first"
echo "  cd scenario-2 && opencode"
echo "  cd scenario-3 && opencode"
echo "  cd scenario-4 && opencode"
echo ""
echo "Verify after each run:"
echo "  ./test-scenario.sh 1 --verify"
echo "  ./test-scenario.sh 2 --verify"
echo "  ./test-scenario.sh 3 --verify"
echo "  ./test-scenario.sh 4 --verify"
