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
  echo "  $0 1           # Show what the agent will face"
  echo "  $0 1 --verify  # Check if the task was completed correctly"
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
    STORY="No context. Cryptic target name. 4 decoy permission files all containing bhaskar+level."
    EXPECTED="10–14 tool calls — agent opens multiple plausible files before finding the right one"
    ;;
  2)
    DIR="$SCRIPT_DIR/scenario-2"
    TARGET="utils/user-permissions.js"
    HAS_CLAUDE="No"
    STORY="No context. No decoys. Target filename is self-documenting."
    EXPECTED="3–5 tool calls — agent finds it via filename glob or immediately in grep results"
    ;;
  3)
    DIR="$SCRIPT_DIR/scenario-3"
    TARGET="utils/user-permissions.js"
    HAS_CLAUDE="Yes"
    STORY="CLAUDE.md names the exact file in its Permissions section."
    EXPECTED="2–3 tool calls — agent reads CLAUDE.md and goes straight to the file"
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
    echo "PASS: bhaskar's level is now \"write\""
    echo ""
    grep -B1 -A4 'bhaskar' "$FULL" | head -10
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
 Story    : $STORY
 Expected : $EXPECTED
 Target   : $TARGET
 CLAUDE.md: $HAS_CLAUDE

EOF

TOTAL_FILES=$(find "$DIR" -type f | wc -l | tr -d ' ')
BHASKAR_FILES=$(grep -rl "bhaskar" "$DIR" | wc -l | tr -d ' ')

# Files where BOTH bhaskar and level appear
BOTH_COUNT=0
BOTH_LIST=""
for f in $(grep -rl "bhaskar" "$DIR"); do
  if grep -q "level" "$f"; then
    BOTH_COUNT=$((BOTH_COUNT + 1))
    BOTH_LIST="$BOTH_LIST\n    $(echo "$f" | sed "s|$DIR/||")"
  fi
done

echo "── Noise profile ──"
echo "  Total files    : $TOTAL_FILES"
echo "  'bhaskar' hits : $BHASKAR_FILES files"
echo "  bhaskar+level  : $BOTH_COUNT files (agent must evaluate each)"
echo -e "$BOTH_LIST"
echo ""

echo "── Task prompt (paste into the agent) ──"
cat "$DIR/TASK.md"
echo ""

echo "── Current state of $TARGET ──"
cat "$DIR/$TARGET"
echo ""

if [[ "$HAS_CLAUDE" == "Yes" ]]; then
  echo "── CLAUDE.md ──"
  cat "$DIR/CLAUDE.md"
  echo ""
fi

REL=$(python3 -c "import os,sys; print(os.path.relpath(sys.argv[1], os.getcwd()))" "$DIR" 2>/dev/null || echo "$DIR")
echo "── To run ──"
echo "  cd $REL && opencode"
echo "  Then verify: $(basename "$0") $SCENARIO --verify"
