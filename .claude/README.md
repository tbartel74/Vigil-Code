# Technology Expert Agent System v4.2

A lightweight agent system template for Claude Code (Opus 4.6) based on **Anthropic's Context Engineering Best Practices (2025-2026)**.

> **v4.2 Highlights:**
> - 2 example technology experts (extensible to any number)
> - 3 procedural skills
> - Cross-session memory with co-modification tracking
> - Python hooks for automation
> - Protocols consolidated into CLAUDE.md (reduced context overhead)

## Philosophy

```
Skills   = HOW to do things (procedures, workflows)
Agents   = WHO does the work (technology expertise)
```

**Key Design Principles:**
- **No orchestrator** - Claude Code handles routing natively
- **Merged skills** - Technology procedures belong inside expert agents
- **Simplified protocols** - Opus 4.6 manages context automatically
- **Correct SDK format** - Valid Claude Code YAML frontmatter

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     TECHNOLOGY EXPERTS (2 examples)              │
│                                                                  │
│  ┌────────────┐ ┌────────────┐                                  │
│  │ Security   │ │ Testing    │   + add your own experts          │
│  │            │ │            │                                    │
│  └────────────┘ └────────────┘                                   │
│                              │                                   │
│                              ▼                                   │
│              ┌───────────────────────────────┐                  │
│              │     Context System            │                  │
│              │  - memory/learnings.json      │                  │
│              │  - memory/decisions.json      │                  │
│              │  - memory/preferences.json    │                  │
│              └───────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────────┘
```

## Included Experts (2 examples)

| Expert | Keywords | Purpose |
|--------|----------|---------|
| `security-expert` | security, OWASP, XSS, audit | Application security, OWASP Top 10, audit automation |
| `testing-expert` | test, vitest, TDD, fixture | Vitest testing, TDD workflow, fixtures |

These are provided as templates. Add your own experts for any technology your project uses (e.g., database, messaging, DevOps, frontend frameworks).

## Directory Structure

```
.claude/
├── agents/                    # Technology experts
│   ├── security-expert/      # Security + OWASP (example)
│   └── testing-expert/       # Vitest + TDD (example)
│
├── skills/                    # Procedural skills
│   ├── session-initializer/  # Session setup (auto-load)
│   ├── documentation-specialist/
│   └── git-commit-helper/
│
├── memory/                    # Cross-session persistence
│   ├── learnings.json        # Lessons learned (max 100, FIFO)
│   ├── preferences.json      # User preferences
│   ├── decisions.json        # Architectural decisions (max 50)
│   └── co-modifications.json # File pairs edited together
│
├── hooks/                     # Automation hooks
│   ├── session-init.sh       # SessionStart: load memory, create context
│   ├── safety-validator.py   # PreToolUse: block destructive commands
│   ├── audit-logger.py       # All events: audit trail logging
│   ├── auto-format.sh        # PostToolUse: format files after Write/Edit
│   ├── doc-update-reminder.py # PostToolUse: suggest doc updates
│   ├── post-tool-use-tracker.py # PostToolUse: TSC file tracking
│   ├── memory-writer.py      # Stop: persist session learnings
│   ├── co-modification-tracker.py # Stop: track file pairs
│   ├── tsc-check.sh          # Stop: TypeScript build check
│   ├── self-check-reminder.sh # Stop: risky pattern analysis
│   ├── notification-sound.sh # Stop: completion notification
│   └── pre-compact-flush.sh  # PreCompact: flush learnings
│
├── commands/                  # Slash commands
│   ├── expert.md             # /expert - invoke technology experts
│   ├── remember.md           # /remember - save learnings
│   ├── memory.md             # /memory - view memory
│   ├── test.md               # /test - TDD workflow
│   ├── audit-code.md         # /audit-code - code audits
│   ├── frontend.md           # /frontend - UI development
│   ├── backend.md            # /backend - API development
│   ├── security.md           # /security - security scanning
│   ├── pr-review.md          # /pr-review - PR reviews
│   ├── docs.md               # /docs - documentation management
│   ├── documentation.md      # /documentation - doc generation
│   └── status-agents.md      # /status-agents - agent status
│
├── lib/                       # Shared libraries
│   ├── remember-handler.py   # Memory save handler
│   └── memory-loader.py      # Memory load utility
│
├── scripts/                   # Utility scripts
│   └── next-task-number.sh   # Task number generator
│
└── settings.json              # Hook configuration
```

## Getting Started

### 1. Copy to Your Project

Copy the `.claude/` directory into your project root:

```bash
cp -r .claude/ /path/to/your/project/.claude/
```

### 2. Customize CLAUDE.md

Create a `CLAUDE.md` in your project root with project-specific instructions. The template agents reference patterns from CLAUDE.md for consistency.

### 3. Add Your Own Experts

Create new agents in `.claude/agents/`:

```yaml
---
name: your-expert
description: Expert in [technology] for your project.
tools:
  - Read
  - Edit
  - Glob
  - Grep
  - Write
  - Bash
  - Task
  - WebFetch
---

# Your Expert

Expert in [technology] for your project.

## Core Knowledge
[Technology fundamentals and patterns]

## Common Procedures
[Step-by-step procedures]

## Key Files
[Project-specific file references]

## Critical Rules
[Do's and Don'ts]
```

### 4. Configure Hooks

Edit `.claude/settings.json` to enable/disable hooks. Update path patterns in:
- `hooks/post-tool-use-tracker.py` - REPO_MAPPINGS for your monorepo structure
- `hooks/safety-validator.py` - PROTECTED_PATHS for sensitive files
- `hooks/doc-update-reminder.py` - DOC_TRIGGERS for documentation paths

### 5. Initialize Memory

Memory files are ready to use. During sessions:
```
/remember learning Always use parameterized queries for the database
/remember decision Use message queue for inter-service communication --rationale Lower latency
/remember preference commit_style conventional
```

## Memory System

Cross-session learning with automatic persistence:

1. **SessionStart** - `session-init.sh` loads recent learnings into context
2. **During Session** - Use `/remember` to save learnings
3. **PreCompact** - `pre-compact-flush.sh` flushes pending learnings before context compression
4. **Stop** - `memory-writer.py` persists to permanent storage + daily logs
5. **Stop** - `co-modification-tracker.py` tracks file pairs edited together

### Memory Files

| File | Purpose | Rotation |
|------|---------|----------|
| `memory/learnings.json` | Lessons learned | Max 100, FIFO |
| `memory/decisions.json` | Architectural decisions | Max 50, FIFO |
| `memory/preferences.json` | User preferences | Key-based overwrite |
| `memory/co-modifications.json` | File pairs edited together | Max 50, frequency-based |
| `memory/YYYY-MM-DD.md` | Daily episodic logs | Auto-delete after 90 days |

## Hook System

| Hook | Event | Purpose |
|------|-------|---------|
| `session-init.sh` | SessionStart | Load memory, create context, clean caches |
| `safety-validator.py` | PreToolUse | Block destructive commands, protect files |
| `audit-logger.py` | All events | Audit trail in JSONL format |
| `auto-format.sh` | PostToolUse | Format files after Write/Edit |
| `doc-update-reminder.py` | PostToolUse | Suggest doc updates after code changes |
| `post-tool-use-tracker.py` | PostToolUse | Track modified files for TSC |
| `memory-writer.py` | Stop | Persist session learnings |
| `co-modification-tracker.py` | Stop | Track file co-modifications |
| `tsc-check.sh` | Stop | TypeScript build check |
| `self-check-reminder.sh` | Stop | Risky pattern analysis |
| `notification-sound.sh` | Stop | Completion sound |
| `pre-compact-flush.sh` | PreCompact | Flush learnings before compression |

## Usage

### Single Expert

```
/expert How do I configure rate limiting?

Invoking: security-expert
Use express-rate-limit with sliding window...
```

### Direct Expert Selection

```
/expert [security] Review this authentication flow
/expert [testing] Create test for SQL injection detection
```

### TDD Workflow

```
/test

Step 1: Create test fixture
Step 2: Write failing test
Step 3: Implement feature
Step 4: Verify test passes
```

---

**Version:** 4.2.0
**Model:** Opus 4.6
**Based on:** Anthropic Context Engineering Best Practices (2025-2026)
