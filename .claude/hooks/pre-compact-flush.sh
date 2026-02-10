#!/bin/bash
# Pre-compaction memory flush - hybrid (deterministic + prompt safety net)

CLAUDE_PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"

# 1B: Deterministic flush of any pending session-learnings.json
python3 "$CLAUDE_PROJECT_DIR/.claude/hooks/memory-writer.py" 2>/dev/null

# 1A: Prompt safety net — catches anything not yet saved via /remember
cat <<'PROMPT'

## CONTEXT COMPACTION IMMINENT

Pending learnings have been auto-flushed. However, you may have knowledge not yet saved.

**Write a single file `.claude/state/pre-compact-notes.md` with:**
- Learnings/gotchas discovered but not yet saved via remember-handler
- Decisions made with rationale
- Current task progress: what is done, what remains

One Write tool call. Do it now.
PROMPT

exit 0
