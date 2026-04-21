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
  echo "  $0 1           # Show scenario 1 context and task"
  echo "  $0 2 --verify  # Check if scenario 2 was completed"
  exit 1
}

if [[ $# -lt 1 ]]; then usage; fi

SCENARIO="$1"
VERIFY=false
if [[ "${2:-}" == "--verify" ]]; then VERIFY=true; fi

case "$SCENARIO" in
  1)
    SCENARIO_DIR="$SCRIPT_DIR/scenario-1"
    TARGET_FILE="utils/jkjkjkjfk.js"
    DESCRIPTION="No CLAUDE.md. Target file has a cryptic name: jkjkjkjfk.js"
    EXPECTED_DIFFICULTY="Hard — agent must search all files to find the permission config"
    ;;
  2)
    SCENARIO_DIR="$SCRIPT_DIR/scenario-2"
    TARGET_FILE="utils/permissionofs.js"
    DESCRIPTION="No CLAUDE.md. Target file has a descriptive name: permissionofs.js"
    EXPECTED_DIFFICULTY="Medium — agent can find the file via semantic search on the filename"
    ;;
  3)
    SCENARIO_DIR="$SCRIPT_DIR/scenario-3"
    TARGET_FILE="utils/permissionofs.js"
    DESCRIPTION="CLAUDE.md present with explicit pointer to utils/permissionofs.js"
    EXPECTED_DIFFICULTY="Easy — agent reads CLAUDE.md first and goes straight to the file"
    ;;
  *)
    echo "Error: scenario must be 1, 2, or 3"
    usage
    ;;
esac

if [[ ! -d "$SCENARIO_DIR" ]]; then
  echo "Error: scenario directory not found: $SCENARIO_DIR"
  exit 1
fi

if $VERIFY; then
  echo "=== Verifying scenario $SCENARIO ==="
  echo ""
  FULL_PATH="$SCENARIO_DIR/$TARGET_FILE"
  if [[ ! -f "$FULL_PATH" ]]; then
    echo "FAIL: Target file not found: $FULL_PATH"
    exit 1
  fi
  if grep -q '"write"' "$FULL_PATH"; then
    echo "PASS: bhaskar's permission is set to \"write\""
    echo ""
    echo "Current content of $TARGET_FILE:"
    cat "$FULL_PATH"
  else
    echo "FAIL: Permission has not been changed to \"write\""
    echo ""
    echo "Current content of $TARGET_FILE:"
    cat "$FULL_PATH"
    exit 1
  fi
  exit 0
fi

echo "============================================"
echo " HARNESS DEMO — Scenario $SCENARIO"
echo "============================================"
echo ""
echo "Description : $DESCRIPTION"
echo "Difficulty  : $EXPECTED_DIFFICULTY"
echo "Target file : $TARGET_FILE"
echo ""

echo "--- Context available to the agent ---"
if [[ -f "$SCENARIO_DIR/CLAUDE.md" ]]; then
  echo "CLAUDE.md: PRESENT"
  echo ""
  echo "Contents:"
  echo "----------"
  cat "$SCENARIO_DIR/CLAUDE.md"
  echo "----------"
else
  echo "CLAUDE.md: NOT PRESENT"
fi
echo ""

echo "--- Task prompt (paste this into the agent) ---"
cat "$SCENARIO_DIR/TASK.md"
echo ""

echo "--- Current state of target file ($TARGET_FILE) ---"
cat "$SCENARIO_DIR/$TARGET_FILE"
echo ""

echo "--- How to run ---"
echo "  cd $(realpath --relative-to="$PWD" "$SCENARIO_DIR" 2>/dev/null || echo "$SCENARIO_DIR")"
echo "  opencode   # then paste the task prompt above"
echo ""
echo "  After the agent finishes, verify with:"
echo "  $0 $SCENARIO --verify"
