# Technology Expert Agent System v4.2

**A production-ready technology expert agent framework for Claude Code (Opus 4.6). Build specialized AI assistants with domain knowledge, cross-session memory, and procedural skills.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Claude Code](https://img.shields.io/badge/Claude-Code-blue.svg)](https://claude.ai/code)
[![Experts: 2](https://img.shields.io/badge/Experts-2_examples-green.svg)](#technology-experts)
[![Skills: 3](https://img.shields.io/badge/Skills-3-orange.svg)](#skills-system)
[![Version: 4.2](https://img.shields.io/badge/Version-4.2-brightgreen.svg)]()

---

## Table of Contents

1. [What It Is and Why Use It](#what-it-is-and-why-use-it)
2. [Quick Start](#quick-start)
3. [System Architecture](#system-architecture)
4. [Technology Experts](#technology-experts)
5. [Skills System](#skills-system)
6. [Memory System](#memory-system)
7. [Hooks System](#hooks-system)
8. [Creating Your Own Expert](#creating-your-own-expert)
9. [Adapting to Your Project](#adapting-to-your-project)

---

## What It Is and Why Use It

### The Problem

Claude Code is a powerful tool, but:
- It doesn't know your project's technology specifics
- It doesn't remember context between sessions
- It lacks structure for complex, multi-step tasks
- It may guess instead of checking documentation

### The Solution

This template introduces a system of **technology experts** - specialized agents with:

1. **Domain Knowledge** - each expert knows their technology deeply
2. **Cross-Session Memory** - learnings, decisions, and preferences persist
3. **Procedural Skills** - step-by-step workflows for complex tasks
4. **Automation Hooks** - safety validators and session initialization

### Philosophy

```
Skills   = HOW to do things (procedures, workflows)
Agents   = WHO does the work (technology expertise)
```

**v4.2 Key Changes:**
- **No orchestrator** - Claude Code handles routing natively
- **2 example experts** - Security + Testing as templates (add your own)
- **3 procedural skills** - Session init, documentation, git commits
- **Memory system** - Cross-session persistence with co-modification tracking
- **Python hooks** - Zero-dependency automation with automatic cleanup
- **Opus 4.6 alignment** - Simplified protocols, correct SDK format

---

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/tbartel74/vigil-code.git
cd vigil-code

# Copy to your project
cp -r .claude /path/to/your/project/

# Optional: copy CLAUDE.md as template
cp CLAUDE.md /path/to/your/project/
```

### Post-Installation Structure

```
your-project/
├── .claude/
│   ├── agents/           # 2 example experts (add your own)
│   ├── skills/           # 3 procedural skills
│   ├── commands/         # Slash commands
│   ├── hooks/            # Automation hooks
│   ├── memory/           # Cross-session persistence
│   ├── lib/              # Shared libraries
│   └── state/            # Session state (gitignore)
├── CLAUDE.md             # Your project instructions
└── [rest of project]
```

### First Use

```
/expert How do I configure rate limiting?

Invoking: security-expert
Use a rate limiting middleware with sliding window...
```

---

## System Architecture

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

### Components

| Component | Location | Description |
|-----------|----------|-------------|
| **Agents** | `.claude/agents/*/AGENT.md` | Technology experts with domain knowledge |
| **Skills** | `.claude/skills/*/SKILL.md` | Procedural workflows and procedures |
| **Commands** | `.claude/commands/*.md` | Slash commands (`/expert`, `/test`) |
| **Hooks** | `.claude/hooks/` | Automation (session init, safety guards) |
| **Memory** | `.claude/memory/` | Cross-session persistence |

---

## Technology Experts

Each expert is a `.claude/agents/[name]/AGENT.md` file with YAML frontmatter + Markdown content.

### Included Examples (2)

| Expert | Primary Focus | Use For |
|--------|---------------|---------|
| `security-expert` | Application Security | OWASP, vulnerabilities, audits, auth |
| `testing-expert` | Testing | Vitest, TDD workflow, fixtures, mocking, E2E |

These are provided as **templates**. Add your own experts for any technology your project uses (e.g., database, messaging, DevOps, frontend frameworks).

### Usage

**Single Expert:**
```
/expert How do I configure rate limiting?
→ security-expert responds
```

**Force Specific Expert:**
```
/expert [security] Review this authentication flow
/expert [testing] Create test for input validation
```

### Expert Anatomy

```yaml
---
name: your-expert
description: |
  Expert in [technology] for your project.
  Deep knowledge of [specific areas].
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
[Technology fundamentals]

## Common Procedures
[Step-by-step procedures]

## Key Files
[Project-specific references]

## Critical Rules
[Do's and Don'ts]
```

---

## Skills System

Skills are procedural workflows that guide Claude through multi-step tasks.

| Skill | Purpose |
|-------|---------|
| `session-initializer` | Auto-load context on session start |
| `documentation-specialist` | README, API docs, changelogs |
| `git-commit-helper` | Conventional commits, no AI attribution |

### Skills vs Agents

| Aspect | Agent | Skill |
|--------|-------|-------|
| Focus | Technology expertise | Procedure/workflow |
| Knowledge | Deep domain knowledge | Step-by-step instructions |
| Invocation | `/expert [query]` | `/skill [name]` |
| Example | "How to configure auth?" | "Run TDD workflow" |

---

## Memory System

Cross-session persistence in `.claude/memory/`:

```
memory/
├── learnings.json         # Lessons learned (patterns, gotchas)
├── decisions.json         # Architectural decisions
├── preferences.json       # User preferences
└── co-modifications.json  # File pairs frequently edited together
```

### How It Works

1. **SessionStart** - Hook loads recent learnings + cleans old caches
2. **During Session** - Use `/remember` to save learnings
3. **Stop** - Hook persists new learnings to storage
4. **Stop** - Hook tracks files frequently edited together

### Usage

```
/remember learning Always use parameterized queries for the database
/remember decision Use message queue for inter-service communication
/remember preference Prefer explicit error handling over try-catch
```

### Storage Format

```json
{
  "entries": [
    {
      "lesson": "Always use parameterized queries for the database",
      "category": "database",
      "timestamp": "2026-02-01T10:00:00Z"
    }
  ]
}
```

---

## Hooks System

Python-based automation hooks in `.claude/hooks/`:

| Hook | Event | Purpose |
|------|-------|---------|
| `session-init.sh` | SessionStart | Load context, clean old caches (7d tsc-cache, 30d audit logs) |
| `safety-validator.py` | PreToolUse | Block dangerous commands |
| `audit-logger.py` | All events | Audit trail in JSONL format |
| `auto-format.sh` | PostToolUse | Format files after Write/Edit |
| `doc-update-reminder.py` | PostToolUse | Suggest doc updates after code changes |
| `post-tool-use-tracker.py` | PostToolUse | Track modified files for TSC |
| `memory-writer.py` | Stop | Persist learnings |
| `co-modification-tracker.py` | Stop | Track files frequently edited together |
| `tsc-check.sh` | Stop | TypeScript build check |
| `self-check-reminder.sh` | Stop | Risky pattern analysis |
| `notification-sound.sh` | Stop | Completion notification |
| `pre-compact-flush.sh` | PreCompact | Flush learnings before compression |

### Safety Validator

Blocks dangerous patterns:

```python
BLOCKED_PATTERNS = [
    r'rm\s+-rf\s+/',           # rm -rf with absolute path
    r'git\s+push.*--force',    # Force push
]
```

---

## Creating Your Own Expert

### Step 1: Create Directory

```bash
mkdir -p .claude/agents/terraform-expert
```

### Step 2: Create AGENT.md

```yaml
---
name: terraform-expert
description: |
  Terraform and Infrastructure as Code expert.
  Deep knowledge of providers, modules, state management.
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

# Terraform Expert

Expert in Terraform and Infrastructure as Code.

## Core Knowledge

### Resource Definition
\`\`\`hcl
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"
}
\`\`\`

### Common Commands
\`\`\`bash
terraform init      # Initialize
terraform plan      # Preview changes
terraform apply     # Apply changes
\`\`\`

## Documentation Sources

| Source | URL |
|--------|-----|
| Terraform Docs | https://developer.hashicorp.com/terraform/docs |

## Critical Rules

- Always use remote state in production
- Never commit .tfstate files to git
- Use variables for sensitive data
```

### Step 3: Expert Auto-Registers

The system reads triggers from description and routes appropriate queries.

---

## Adapting to Your Project

### Step 1: Copy .claude

```bash
cp -r vigil-code/.claude /your/project/
```

### Step 2: Add Your Own Experts

Create experts for technologies your project uses:

```bash
mkdir -p .claude/agents/my-database-expert
# Create AGENT.md with domain knowledge
```

### Step 3: Customize Skills

Add or remove skills as needed:

```bash
# Add your own
mkdir .claude/skills/my-workflow
# Create SKILL.md with procedures
```

### Step 4: Create CLAUDE.md

Use the template in `CLAUDE.md` and customize for your project.

### Step 5: Update .gitignore

```gitignore
# Agent state (runtime)
.claude/state/
.claude/settings.local.json
.claude/audit_logs/
.claude/tsc-cache/
```

---

## Reference Files

| File | Description |
|------|-------------|
| [.claude/README.md](.claude/README.md) | Agent system documentation |
| [CLAUDE.md](CLAUDE.md) | Project template |

---

## License

MIT License - See [LICENSE](LICENSE) file.

Copyright (c) 2025-2026 Tomasz Bartel

---

**Status:** Production Ready
**Version:** 4.2.0
**Based on:** Anthropic Context Engineering Best Practices (2025-2026)
**Last Updated:** 2026-02-10
