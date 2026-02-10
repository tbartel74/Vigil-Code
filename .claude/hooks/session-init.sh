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

# Cleanup old audit logs (older than 90 days, aligned with audit-logger.py RETENTION_DAYS)
AUDIT_LOG_DIR="$CLAUDE_PROJECT_DIR/.claude/audit_logs"
if [ -d "$AUDIT_LOG_DIR" ]; then
  find "$AUDIT_LOG_DIR" -maxdepth 1 -name "*.jsonl" -type f -mtime +90 -delete 2>/dev/null || true
fi

# Initialize session context file
SESSION_ID="session-$(date +%Y%m%d-%H%M%S)-$$"
SESSION_FILE="$STATE_DIR/session-context.json"

# Get git info
GIT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
GIT_STATUS=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')

# Count learnings and decisions for session context
LEARNINGS_COUNT=0
DECISIONS_COUNT=0
if [ -f "$MEMORY_DIR/learnings.json" ]; then
  LEARNINGS_COUNT=$(python3 -c "import json; d=json.load(open('$MEMORY_DIR/learnings.json')); print(len(d.get('entries', [])))" 2>/dev/null || echo "0")
fi
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

# Output memory summary to stdout using progressive disclosure (Layer 1: Summary)
# This reduces token usage from ~500-800 to ~50-100 tokens
LIB_DIR="$CLAUDE_PROJECT_DIR/.claude/lib"
if [ -f "$LIB_DIR/memory-loader.py" ]; then
  python3 "$LIB_DIR/memory-loader.py" --layer=summary 2>/dev/null
elif [ "$LEARNINGS_COUNT" -gt 0 ] || [ "$DECISIONS_COUNT" -gt 0 ]; then
  # Fallback if memory-loader.py not available
  echo ""
  echo "## Cross-Session Memory Loaded"
  echo ""
  echo "**Learnings:** $LEARNINGS_COUNT | **Decisions:** $DECISIONS_COUNT"
  echo "Categories: $(python3 -c "
import json
d=json.load(open('$MEMORY_DIR/learnings.json'))
cats={}
for e in d.get('entries',[]):
    c=e.get('category','general')
    cats[c]=cats.get(c,0)+1
print(', '.join(f'{k}: {v}' for k,v in sorted(cats.items(),key=lambda x:-x[1])))
" 2>/dev/null || echo "n/a")"
  echo "Co-modifications: $(python3 -c "import json; d=json.load(open('$MEMORY_DIR/co-modifications.json')); print(len(d.get('pairs',[])))" 2>/dev/null || echo "0") file pairs tracked"
  echo ""
  echo "Auto-save is active. Save learnings/decisions proactively via remember-handler (see MEMORY.md)."
fi

# Cleanup old daily memory logs (older than 90 days - safety net for unbounded growth)
find "$MEMORY_DIR" -maxdepth 1 -name "20??-??-??.md" -type f -mtime +90 -delete 2>/dev/null || true

# Check if daily logs need curation into project MEMORY.md
DAILY_LOG_COUNT=$(find "$MEMORY_DIR" -maxdepth 1 -name "20??-??-??.md" -type f 2>/dev/null | wc -l | tr -d ' ')
if [ "$DAILY_LOG_COUNT" -ge 5 ]; then
  echo ""
  echo "---"
  echo "**Memory curation needed:** $DAILY_LOG_COUNT daily logs accumulated in \`.claude/memory/\`."
  echo "Review them and distill key insights into the project-level MEMORY.md, then delete processed logs."
fi

exit 0
