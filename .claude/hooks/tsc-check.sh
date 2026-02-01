#!/bin/bash
# TSC Check - TypeScript Build Verification on Stop
#
# Runs TypeScript checks only on repos that were modified during the session.
# Reads from session cache created by post-tool-use-tracker.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$SCRIPT_DIR/../.." && pwd)}"

# Read session_id from stdin
read -r INPUT
SESSION_ID=$(echo "$INPUT" | grep -o '"session_id"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*: *"//' | sed 's/"$//' || echo "default")

CACHE_DIR="$PROJECT_ROOT/.claude/tsc-cache/$SESSION_ID"
COMMANDS_FILE="$CACHE_DIR/commands.txt"
ERRORS_FILE="$CACHE_DIR/last-errors.txt"

# No session cache = nothing to check
if [ ! -f "$COMMANDS_FILE" ]; then
    exit 0
fi

# Read unique commands
mapfile -t COMMANDS < "$COMMANDS_FILE"

if [ ${#COMMANDS[@]} -eq 0 ]; then
    exit 0
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
echo "🔍 TSC CHECK - Verifying TypeScript in modified repos" >&2
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2

FAILED=0
> "$ERRORS_FILE"

for CMD in "${COMMANDS[@]}"; do
    if [ -z "$CMD" ]; then
        continue
    fi

    REPO=$(echo "$CMD" | grep -o '\-\-filter [^ ]*' | sed 's/--filter //')
    echo "  → Checking: $REPO" >&2

    cd "$PROJECT_ROOT"
    if ! $CMD 2>&1 | tee -a "$ERRORS_FILE"; then
        FAILED=1
        echo "  ❌ FAILED: $REPO" >&2
    else
        echo "  ✅ OK: $REPO" >&2
    fi
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2

if [ $FAILED -eq 1 ]; then
    echo "" >&2
    echo "⚠️  WE DO NOT LEAVE A MESS BEHIND" >&2
    echo "    Please fix TypeScript errors before proceeding." >&2
    echo "" >&2
    # Output to stdout for Claude context injection
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "❌ TSC CHECK FAILED"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "TypeScript errors were found in modified files."
    echo "Please fix them before completing this task."
    echo ""
    echo "Run 'pnpm typecheck' to see all errors."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 1
fi

# Cleanup old cache (older than 7 days)
find "$PROJECT_ROOT/.claude/tsc-cache" -type d -mtime +7 -exec rm -rf {} + 2>/dev/null || true

exit 0
