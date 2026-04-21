#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

usage() {
  echo "Usage: $0 <scenario> [--verify]"
  echo ""
  echo "  scenario   1, 2, or 3"
  echo "  --verify   Check if bhaskar's permission was changed to 'write'"
  echo ""
  echo "Examples:"
  echo "  $0 1           # Show scenario 1 setup"
  echo "  $0 1 --verify  # Check if scenario 1 was completed"
  exit 1
}

[[ $# -lt 1 ]] && usage

SCENARIO="$1"
VERIFY=false
[[ "${2:-}" == "--verify" ]] && VERIFY=true

case "$SCENARIO" in
  1)
    DIR="$SCRIPT_DIR/scenario-1"
    TARGET="utils/cfg_res_acl.js"
    HAS_CLAUDE="No"
    FRICTION="High — 'bhaskar' appears in 6 files; target filename gives no hint"
    ;;
  2)
    DIR="$SCRIPT_DIR/scenario-2"
    TARGET="utils/user-permissions.js"
    HAS_CLAUDE="No"
    FRICTION="Medium — filename 'user-permissions.js' is a strong glob target"
    ;;
  3)
    DIR="$SCRIPT_DIR/scenario-3"
    TARGET="utils/user-permissions.js"
    HAS_CLAUDE="Yes"
    FRICTION="Low — CLAUDE.md names the exact file in its Permissions section"
    ;;
  *)
    echo "Error: scenario must be 1, 2, or 3"; usage ;;
esac

[[ ! -d "$DIR" ]] && { echo "Error: $DIR not found"; exit 1; }

# ── verify mode ────────────────────────────────────────────────────────────────
if $VERIFY; then
  echo "=== Verifying scenario $SCENARIO ==="
  FULL="$DIR/$TARGET"
  [[ ! -f "$FULL" ]] && { echo "FAIL: $FULL not found"; exit 1; }
  if grep -q '"write"' "$FULL" && grep -q 'bhaskar' "$FULL"; then
    echo "PASS: bhaskar's level is set to \"write\""
    echo ""
    grep -A1 'bhaskar' "$FULL"
  else
    echo "FAIL: permission not changed to \"write\""
    echo ""
    cat "$FULL"
    exit 1
  fi
  exit 0
fi

# ── info mode ──────────────────────────────────────────────────────────────────
cat <<EOF
════════════════════════════════════════════════════
 HARNESS DEMO — Scenario $SCENARIO
════════════════════════════════════════════════════
 Target file : $TARGET
 CLAUDE.md   : $HAS_CLAUDE
 Friction    : $FRICTION

EOF

echo "── Files in this project ──"
find "$DIR" -type f | sed "s|$DIR/||" | sort
echo ""

echo "── Where 'bhaskar' appears ──"
grep -rl "bhaskar" "$DIR" | sed "s|$DIR/||" | sort
echo ""

echo "── Task prompt (paste into the agent) ──"
cat "$DIR/TASK.md"
echo ""

echo "── Current state of $TARGET ──"
cat "$DIR/$TARGET"
echo ""

if [[ "$HAS_CLAUDE" == "Yes" ]]; then
  echo "── CLAUDE.md (what the agent sees on startup) ──"
  cat "$DIR/CLAUDE.md"
  echo ""
fi

echo "── To run ──"
REL=$(python3 -c "import os,sys; print(os.path.relpath(sys.argv[1], os.getcwd()))" "$DIR" 2>/dev/null || echo "$DIR")
echo "  cd $REL"
echo "  opencode   # paste the task prompt above"
echo ""
echo "  Then verify:"
echo "  $(basename "$0") $SCENARIO --verify"
