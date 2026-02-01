---
name: docs
description: Development documentation management - create, update, and archive task plans
argument-hint: "Subcommand: create <description>, update [context], archive [task_id]"
---

# Development Documentation Command

Unified command for managing development documentation in `dev_docs/`.

## Usage

```bash
/docs create <description>    # Create new strategic plan
/docs update [context]        # Update active docs before context reset
/docs archive [task_id]       # Archive completed task
```

---

## `/docs create <description>`

Create a comprehensive strategic plan with structured task breakdown.

### Instructions

1. **Get the next task number:**
   ```bash
   .claude/scripts/next-task-number.sh
   ```

2. **Create task structure:**
   ```
   dev_docs/active/NNNN_[task-name]/
   ├── NNNN_[task-name]-plan.md      # Comprehensive plan
   ├── NNNN_[task-name]-context.md   # Key files, decisions
   └── NNNN_[task-name]-tasks.md     # Checklist for tracking
   ```

3. **Plan Structure:**
   - Executive Summary
   - Current State Analysis
   - Proposed Future State
   - Implementation Phases
   - Detailed Tasks (with acceptance criteria)
   - Risk Assessment
   - Success Metrics

### Naming Convention

```
NNNN_task-name
│    └─ kebab-case task description
└─ 4-digit zero-padded sequential number
```

---

## `/docs update [context]`

Update development documentation before context compaction.

### Required Updates

1. **Update Active Task Documentation**
   - `[task-name]-context.md`: Current state, decisions, files modified, blockers, next steps
   - `[task-name]-tasks.md`: Mark completed ✅, add new tasks, update status

2. **Capture Session Context**
   - Complex problems solved
   - Architectural decisions made
   - Bugs found and fixed
   - Integration points discovered

3. **Document Unfinished Work**
   - What was being worked on
   - Exact state of partial features
   - Commands to run on restart
   - Temporary workarounds

**Priority:** Focus on information hard to rediscover from code alone.

---

## `/docs archive [task_id]`

Move a completed task from `dev_docs/active/` to `dev_docs/archive/`.

### Process

1. **Identify task** (by task_id or find single active)
2. **Verify completion** (all tasks marked as completed)
3. **Update context.md** with completion date and summary
4. **Move directory:**
   ```bash
   mv dev_docs/active/NNNN_task-name/ dev_docs/archive/NNNN_task-name/
   ```
5. **Create ARCHIVED.md** with metadata

### ARCHIVED.md Format

```markdown
# Archived: NNNN [Task Name]

**Archived Date:** YYYY-MM-DD
**Status:** Completed

## Summary
[Brief summary]

## Outcomes
- [Outcome 1]
- [Outcome 2]

## Files Created/Modified
- `path/to/file.ts` - [description]
```

### Pre-Archive Checklist

- [ ] All tasks marked complete
- [ ] Code changes committed
- [ ] Tests passing
- [ ] Documentation updated

---

## Examples

```bash
# Create new plan
/docs create "refactor authentication system"

# Update before context reset
/docs update

# Update with specific focus
/docs update "focus on NATS integration progress"

# Archive completed task
/docs archive 0001

# Archive with summary
/docs archive 0001 "Implemented all 5 phases"
```

---

## Directory Structure

```
dev_docs/
├── active/                    # Current work
│   └── NNNN_task-name/
│       ├── NNNN_task-name-plan.md
│       ├── NNNN_task-name-context.md
│       └── NNNN_task-name-tasks.md
├── archive/                   # Completed work
│   └── NNNN_task-name/
│       ├── ... (same files)
│       └── ARCHIVED.md
└── README.md                  # Guidelines
```
