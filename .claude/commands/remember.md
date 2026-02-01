# Remember Command

Save learnings, decisions, or preferences to cross-session memory.

## Usage

```
/remember <type> <content>
```

## Types

| Type | Storage | Purpose |
|------|---------|---------|
| `learning` | learnings.json | Lessons learned, gotchas, patterns |
| `decision` | decisions.json | Architectural/technical decisions |
| `preference` | preferences.json | User style preferences |

## Examples

```
/remember learning Always use parameterized queries for ClickHouse to avoid SQL injection

/remember decision Use NATS request-reply for synchronous Python service communication instead of HTTP

/remember preference Prefer concise responses without emojis
```

## How It Works

1. Claude writes to `.claude/state/session-learnings.json` during session
2. At session end, `memory-writer.py` hook persists to permanent memory
3. At next session start, `session-init.sh` loads memories into context

## Implementation

When user invokes `/remember`, Claude should:

1. Parse the type and content from the command
2. Read current session learnings from `.claude/state/session-learnings.json`
3. Append new entry with timestamp and session ID
4. Write back to session learnings file
5. Confirm to user what was remembered

## Memory Limits

- learnings.json: Max 100 entries (FIFO rotation)
- decisions.json: Max 50 entries (FIFO rotation)
- preferences.json: No limit (key-based overwrite)

## Related

- Session init: `.claude/hooks/session-init.sh`
- Memory writer: `.claude/hooks/memory-writer.py`
- Memory files: `.claude/memory/`
