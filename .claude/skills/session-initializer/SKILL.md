# Session Initializer

Lightweight session initialization skill. Replaces heavy orchestrator pattern.

## Purpose

Quick context loading at session start without runtime coordination overhead.
Claude Code handles expert routing natively - this skill just establishes baseline context.

## When to Use

- Automatically on session start (via SessionStart hook)
- Manually via `/init` command
- When resuming work after context reset

## Initialization Steps

### 1. Verify Environment

```bash
pwd                           # Confirm working directory
git status --short            # Quick state check
```

### 2. Load Memory Context

Read cross-session learnings:
- `.claude/memory/learnings.json` - past lessons
- `.claude/memory/preferences.json` - user style
- `.claude/memory/decisions.json` - architectural decisions

Report relevant learnings for current task (if any match).

### 3. Check Workflow State

```bash
# Check for existing workflow
cat .claude/state/progress.json 2>/dev/null || echo "No active workflow"
```

If progress.json exists with `status: "in_progress"`:
- Report last completed step
- Suggest resuming or starting fresh

### 4. Quick Health Check (Optional)

Only if user asks or previous session had issues:
```bash
pnpm typecheck 2>&1 | head -5  # Quick TSC check
```

## Output Format

```
Session initialized.

Git: main (clean)
Memory: 3 learnings loaded
Workflow: None active

Ready for tasks.
```

Or with active workflow:

```
Session initialized.

Git: feature/add-llm-guard (+2 -1)
Memory: 3 learnings loaded
Workflow: "Add LLM Guard" - Step 2/4 (in_progress)
  Last: nats-expert configured stream

Continue workflow or start fresh?
```

## What This Skill Does NOT Do

- Runtime coordination (Claude Code handles)
- Expert selection (triggers handle)
- Token tracking (Claude 4.5 handles)
- OODA protocol enforcement (removed)
- Checkpoint management (simplified)

## Integration

This skill is designed to work with:
- `.claude/memory/` - Cross-session persistence
- `.claude/state/progress.json` - Workflow state (v4.0 schema)
- `.claude/core/protocols.md` - Error handling and code quality
