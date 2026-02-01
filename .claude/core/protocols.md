# Core Protocols for Technology Expert Agents v4.1

> **ADVISORY GUIDELINES**
> These are recommended patterns, not automatically enforced rules.
> Claude Code handles context and routing automatically.

This document defines shared protocols for technology expert agents.

---

## 1. Error Handling Protocol

### 1.1 Error Actions (3-State System)

| Action | When to Use | Example |
|--------|-------------|---------|
| **retry** | Transient failures | Network timeout, rate limit, file lock |
| **escalate** | Needs user decision | Permission denied, conflicting edits |
| **fail** | Unrecoverable | Out of tokens, invalid state |

### 1.2 Common Error Patterns

**Retry (automatic):**
- Network timeout: exponential backoff
- Rate limit: wait then retry
- File lock: wait 5s, retry

**Escalate (ask user):**
- Permission denied
- Conflicting edits
- Tests failing after 3 attempts

**Fail (stop):**
- Out of context window
- Critical file missing
- Security violation detected

### 1.3 Error Response Format

```
Error in {action}

Problem: {description}
Action: retry | escalate | fail
Suggestion: {how to proceed}
```

---

## 2. Clean State Protocol

### 2.1 Requirements for Clean State

Before marking task as complete:

- [ ] All steps completed
- [ ] Tests passing (if applicable)
- [ ] Lint clean
- [ ] No uncommitted changes that break build

### 2.2 Validation Commands

```bash
pnpm test          # Tests pass
pnpm lint          # No lint errors
pnpm typecheck     # No type errors
git status         # Clean or intentional changes
```

---

## 3. Response Format Protocol

### 3.1 Expert Response Format

```
## Action: {action_name}

### Solution
{implementation details}

### Artifacts
- Created: {files}
- Modified: {files}

### Status: success | partial | failed | blocked
```

### 3.2 Progress Report Format

```
Task: [description]

Step 1/{n}: {expert-name}
   {what was done}
   Completed

Summary:
   {what was accomplished}

Artifacts:
   {file1}
   {file2}

Clean State:
   Tests: {pass/fail}
   Ready to merge: {yes/no}
```

---

## 4. Memory Protocol

Cross-session learning persists in `.claude/memory/`:

| File | Purpose | Max Entries |
|------|---------|-------------|
| `learnings.json` | Lessons from past workflows | 100 (FIFO) |
| `preferences.json` | User style preferences | - |
| `decisions.json` | Architectural decisions | 50 (FIFO) |

Use `/remember` command to save learnings during session.

---

## 5. Code Quality Protocol

All technology experts follow these standards.

### 5.1 Naming and Structure

| Rule | DO | DON'T |
|------|-----|-------|
| Specific names | `detectPromptInjection()` | `processData()` |
| Forbidden names | - | `data`, `result`, `handler`, `utils` |
| Function size | 20-40 lines | 100+ line monoliths |
| Simplicity | Solution for current use | Generic framework |

### 5.2 Comments and Documentation

- Add comments only for non-obvious decisions
- Skip comments for self-explanatory code
- No TODO/FIXME unless solving immediately
- Docstrings for public API only

### 5.3 Code Style

- **Consistency over "best practice"** - Adapt to existing repo style
- **Readability over cleverness** - If hard to understand, it's bad
- **Logic first, validation later** - Core logic before guards

### 5.4 Critical Prohibitions

| NEVER | Rationale |
|-------|-----------|
| AI attribution | Zero tolerance |
| Polish in code/docs | English only |
| Hardcoded secrets | Security violation |
| Template strings for SQL | Use parameterized queries |

### 5.5 Senior Developer Mindset

When in doubt, choose:
- Simpler over complex
- Easier to debug over harder
- Easier to delete over harder

For full examples, see `CLAUDE.md` → "Golden Rules for Code Generation"

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 3.2 | 2025-12-14 | Code Quality Protocol |
| 4.0 | 2026-01-31 | Simplified for Claude 4.5 |
| 4.1 | 2026-02-01 | Removed unimplemented protocols (checkpoint, handoff, compaction), simplified error codes to 3-state |
