# Claude Code Hooks

This directory contains automation hooks that integrate with Claude Code CLI.

---

## Available Hooks

| Hook | Event | Purpose | Status |
|------|-------|---------|--------|
| `session-init.sh` | SessionStart | Loads memory, creates context, cleans old caches | ✅ Active |
| `safety-validator.py` | PreToolUse | Blocks destructive commands and protects sensitive files | ✅ Active |
| `audit-logger.py` | All events | Logs all tool operations for audit trail | ✅ Active |
| `auto-format.sh` | PostToolUse | Auto-formats files after Write/Edit | ✅ Active |
| `post-tool-use-tracker.sh` | PostToolUse | Session-based file tracking for TSC check | ✅ Active |
| `doc-update-reminder.py` | PostToolUse | Suggests documentation updates after code changes | ✅ Active |
| `memory-writer.py` | Stop | Persists session learnings to permanent memory | ✅ Active |
| `co-modification-tracker.py` | Stop | Tracks files frequently edited together | ✅ Active |
| `tsc-check.sh` | Stop | TypeScript build check on modified repos | ✅ Active |
| `self-check-reminder.sh` | Stop | Analyzes edited files for risky patterns | ✅ Active |
| `notification-sound.sh` | Stop | Plays notification sound on completion | ✅ Active |
| `pre-compact-flush.sh` | PreCompact | Flushes pending session learnings before context compression | ✅ Active |

---

## Memory System

Cross-session memory persistence with automatic cleanup.

### Flow

1. **SessionStart** - `session-init.sh` loads learnings, cleans old daily logs, checks curation needs
2. **During Session** - User runs `/remember` to save learnings to session file
3. **PreCompact** - `pre-compact-flush.sh` flushes pending learnings before context compression
4. **Stop** - `memory-writer.py` persists session learnings to permanent storage + daily logs
5. **Stop** - `co-modification-tracker.py` tracks file pairs edited together

### Files

| File | Purpose | Rotation |
|------|---------|----------|
| `.claude/memory/learnings.json` | Lessons learned | Max 100, FIFO |
| `.claude/memory/decisions.json` | Architectural decisions | Max 50, FIFO |
| `.claude/memory/preferences.json` | User preferences | Key-based overwrite |
| `.claude/memory/co-modifications.json` | File pairs edited together | Max 50, frequency-based |
| `.claude/memory/YYYY-MM-DD.md` | Daily episodic logs (append-only) | Auto-delete after 90 days |
| `.claude/state/session-learnings.json` | Temporary session storage | Cleared on Stop |

### Usage

Use `/remember` command during session:
```
/remember learning Always use parameterized queries for the database
/remember decision Use request-reply for service calls --rationale Lower latency
/remember preference commit_style conventional
```

### Memory Types

| Type | When to Use |
|------|-------------|
| `learning` | Gotchas, patterns, things to remember |
| `decision` | Architectural choices with rationale |
| `preference` | User style preferences |

### Automatic Cleanup

| Target | Retention | Hook |
|--------|-----------|------|
| tsc-cache directories | 7 days | session-init.sh |
| audit_logs/*.jsonl | 30 days | session-init.sh |

---

## Hook Details

### session-init.sh

**Event:** SessionStart

Initializes session context and loads cross-session memory.

### pre-compact-flush.sh

**Event:** PreCompact

Hybrid pre-compaction flush: (1) deterministic flush of pending `session-learnings.json` via `memory-writer.py`, then (2) prompt asking Claude to save any unsaved knowledge to `.claude/state/pre-compact-notes.md`.

### memory-writer.py

**Event:** Stop

Persists session learnings to permanent memory and daily episodic logs at session end.

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

### co-modification-tracker.py

**Event:** Stop

Tracks files frequently edited together across sessions. Useful for understanding codebase coupling.

**Output:** `.claude/memory/co-modifications.json`

**View co-modifications:**
```
/memory comods
```

---

## Adding New Hooks

1. Create script in `.claude/hooks/`
2. Make executable: `chmod +x hook-name.py`
3. Add to `.claude/settings.json` under appropriate event
4. Update this README
