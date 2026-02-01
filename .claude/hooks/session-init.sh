#!/bin/bash
# Session Initializer Hook v4.1
# Loads cross-session memory and prepares session context

CLAUDE_PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
MEMORY_DIR="$CLAUDE_PROJECT_DIR/.claude/memory"
STATE_DIR="$CLAUDE_PROJECT_DIR/.claude/state"

# Ensure directories exist
mkdir -p "$MEMORY_DIR" "$STATE_DIR"

# Cleanup stale tsc-cache sessions (older than 7 days)
TSC_CACHE_DIR="$CLAUDE_PROJECT_DIR/.claude/tsc-cache"
if [ -d "$TSC_CACHE_DIR" ]; then
  find "$TSC_CACHE_DIR" -maxdepth 1 -type d -mtime +7 -exec rm -rf {} + 2>/dev/null || true
fi

# Initialize session context file
SESSION_ID="session-$(date +%Y%m%d-%H%M%S)-$$"
SESSION_FILE="$STATE_DIR/session-context.json"

# Get git info
GIT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
GIT_STATUS=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')

# Count and load learnings
LEARNINGS_COUNT=0
LEARNINGS_CONTENT=""
if [ -f "$MEMORY_DIR/learnings.json" ]; then
  LEARNINGS_COUNT=$(python3 -c "import json; d=json.load(open('$MEMORY_DIR/learnings.json')); print(len(d.get('entries', [])))" 2>/dev/null || echo "0")
  
  # Extract recent learnings (last 10) for context injection
  if [ "$LEARNINGS_COUNT" -gt 0 ]; then
    LEARNINGS_CONTENT=$(python3 -c "
import json
with open('$MEMORY_DIR/learnings.json') as f:
    data = json.load(f)
entries = data.get('entries', [])[-10:]  # Last 10 learnings
for e in entries:
    print(f\"- [{e.get('category', 'general')}] {e.get('lesson', '')}\"[:200])
" 2>/dev/null || echo "")
  fi
fi

# Count decisions
DECISIONS_COUNT=0
if [ -f "$MEMORY_DIR/decisions.json" ]; then
  DECISIONS_COUNT=$(python3 -c "import json; d=json.load(open('$MEMORY_DIR/decisions.json')); print(len(d.get('decisions', [])))" 2>/dev/null || echo "0")
fi

# Create session context JSON
cat > "$SESSION_FILE" << EOF
{
  "session_id": "$SESSION_ID",
  "started_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "git": {
    "branch": "$GIT_BRANCH",
    "uncommitted_files": $GIT_STATUS
  },
  "memory": {
    "learnings_count": $LEARNINGS_COUNT,
    "decisions_count": $DECISIONS_COUNT
  }
}
EOF

# Output to stderr for hook system (visible in logs)
echo "Session initialized: $SESSION_ID" >&2

# Output memory summary to stdout (injected into Claude context)
if [ "$LEARNINGS_COUNT" -gt 0 ] || [ "$DECISIONS_COUNT" -gt 0 ]; then
  echo ""
  echo "## Cross-Session Memory Loaded"
  echo ""
  echo "**Learnings:** $LEARNINGS_COUNT | **Decisions:** $DECISIONS_COUNT"
  echo ""
  
  if [ -n "$LEARNINGS_CONTENT" ]; then
    echo "### Recent Learnings"
    echo "$LEARNINGS_CONTENT"
    echo ""
  fi
  
  echo "Use \`/remember\` to save new learnings during this session."
fi

exit 0
