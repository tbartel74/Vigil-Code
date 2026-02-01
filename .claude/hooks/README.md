# Claude Code Hooks for Vigil Guard Enterprise

This directory contains automation hooks that integrate with Claude Code CLI.

---

## Available Hooks

| Hook | Event | Purpose | Status |
|------|-------|---------|--------|
| `session-init.sh` | SessionStart | Loads cross-session memory, creates session context | ✅ Active |
| `safety-validator.py` | PreToolUse | Blocks destructive commands and protects sensitive files | ✅ Active |
| `audit-logger.py` | All events | Logs all tool operations for audit trail | ✅ Active |
| `auto-format.sh` | PostToolUse | Auto-formats files after Write/Edit | ✅ Active |
| `post-tool-use-tracker.sh` | PostToolUse | Session-based file tracking for TSC check | ✅ Active |
| `doc-update-reminder.py` | PostToolUse | Suggests documentation updates after code changes | ✅ Active |
| `memory-writer.py` | Stop | Persists session learnings to permanent memory | ✅ Active |
| `tsc-check.sh` | Stop | TypeScript build check on modified repos | ✅ Active |
| `self-check-reminder.sh` | Stop | Analyzes edited files for risky patterns | ✅ Active |
| `notification-sound.sh` | Stop | Plays notification sound on completion | ✅ Active |

---

## Memory System

The hook system implements cross-session memory persistence:

### Flow

1. **SessionStart** - `session-init.sh` loads learnings from `.claude/memory/`
2. **During Session** - User runs `/remember` to save learnings to session file
3. **Stop** - `memory-writer.py` persists session learnings to permanent storage

### Files

| File | Purpose |
|------|---------|
| `.claude/memory/learnings.json` | Lessons learned (max 100, FIFO) |
| `.claude/memory/decisions.json` | Architectural decisions (max 50, FIFO) |
| `.claude/memory/preferences.json` | User preferences (key-based overwrite) |
| `.claude/state/session-learnings.json` | Temporary session storage |

### Usage

Use `/remember` command during session:
```
/remember learning Always use parameterized queries for ClickHouse
/remember decision Use NATS request-reply for Python services
```

---

## Hook Details

### session-init.sh

**Event:** SessionStart

Initializes session context and loads cross-session memory.

### memory-writer.py

**Event:** Stop

Persists session learnings to permanent memory at session end.

### safety-validator.py

**Event:** PreToolUse | **Matcher:** `Bash|Write|Edit`

Blocks destructive bash commands and access to protected files.

### audit-logger.py

**Event:** All events

Logs all tool operations to `.claude/audit_logs/`.

### auto-format.sh

**Event:** PostToolUse | **Matcher:** `Write|Edit`

Auto-formats Python (ruff) and JS/TS (prettier) files.

### notification-sound.sh

**Event:** Stop

Plays notification sound when Claude completes.

---

## Adding New Hooks

1. Create script in `.claude/hooks/`
2. Make executable: `chmod +x hook-name.py`
3. Add to `.claude/settings.json` under appropriate event
4. Update this README
