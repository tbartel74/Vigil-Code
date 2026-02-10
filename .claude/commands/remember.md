# Remember Command

Save learnings, decisions, or preferences to cross-session memory.

## Usage

```
/remember learning <content>
/remember learning <content> --category <category>
/remember decision <content>
/remember decision <content> --rationale <why>
/remember preference <key> <value>
```

## Types

| Type | Storage | Purpose |
|------|---------|---------|
| `learning` | learnings.json | Lessons learned, gotchas, patterns |
| `decision` | decisions.json | Architectural/technical decisions |
| `preference` | preferences.json | User style preferences |

## Examples

```
/remember learning Always use parameterized queries for the database
/remember learning Message consumers need explicit ack --category infrastructure
/remember decision Use request-reply for sync service calls --rationale Lower latency than HTTP
/remember preference commit_style conventional
```

## Implementation

When user invokes `/remember`, run the appropriate command:

```bash
# Learning (basic)
python3 $CLAUDE_PROJECT_DIR/.claude/lib/remember-handler.py learning "Always use parameterized queries"

# Learning with category
python3 $CLAUDE_PROJECT_DIR/.claude/lib/remember-handler.py learning "Consumers need explicit ack" --category infrastructure

# Learning with context
python3 $CLAUDE_PROJECT_DIR/.claude/lib/remember-handler.py learning "Check for nil before access" --context "Discovered during worker debugging" --category golang

# Decision with rationale
python3 $CLAUDE_PROJECT_DIR/.claude/lib/remember-handler.py decision "Use request-reply for service calls" --rationale "Lower latency than HTTP, built-in timeout"

# Preference
python3 $CLAUDE_PROJECT_DIR/.claude/lib/remember-handler.py preference commit_style "conventional"
```

## Categories

Common categories for learnings:
- `general` (default)
- `security`
- `performance`
- `architecture`
- `infrastructure`
- `testing`
- `documentation`

## Memory Lifecycle

1. User invokes `/remember` → `remember-handler.py` writes to `session-learnings.json`
2. Session ends → `memory-writer.py` hook persists to permanent `learnings.json`
3. Next session starts → `session-init.sh` loads summary into context

## Memory Limits

- learnings.json: Max 100 entries (FIFO rotation)
- decisions.json: Max 50 entries (FIFO rotation)
- preferences.json: No limit (key-based overwrite)

## Related

- Memory access: `/memory` command
- Handler: `.claude/lib/remember-handler.py`
- Writer hook: `.claude/hooks/memory-writer.py`
- Memory files: `.claude/memory/`
