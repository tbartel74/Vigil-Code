# Vigil-Code: Technology Expert Agent System v4.1

**A production-ready technology expert agent framework for Claude Code. Build specialized AI assistants with domain knowledge, cross-session memory, and procedural skills.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Claude Code](https://img.shields.io/badge/Claude-Code-blue.svg)](https://claude.ai/code)
[![Experts: 7](https://img.shields.io/badge/Experts-7-green.svg)](#technology-experts)
[![Skills: 6](https://img.shields.io/badge/Skills-6-orange.svg)](#skills)
[![Version: 4.1](https://img.shields.io/badge/Version-4.1-brightgreen.svg)]()

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
10. [Migration from v3.x](#migration-from-v3x)

---

## What It Is and Why Use It

### The Problem

Claude Code is a powerful tool, but:
- It doesn't know technology specifics (NATS, Presidio, ClickHouse)
- It doesn't remember context between sessions
- It lacks structure for complex, multi-step tasks
- It may guess instead of checking documentation

### The Solution

Vigil-Code introduces a system of **technology experts** - specialized agents with:

1. **Domain Knowledge** - each expert knows their technology deeply
2. **Cross-Session Memory** - learnings, decisions, and preferences persist
3. **Procedural Skills** - step-by-step workflows for complex tasks
4. **Automation Hooks** - safety validators and session initialization

### Philosophy

```
Skills   = HOW to do things (procedures, workflows)
Agents   = WHO does the work (technology expertise)
```

**v4.1 Key Changes:**
- **No orchestrator** - Claude Code handles routing natively
- **Consolidated experts** - 7 focused experts (down from 17)
- **Memory system** - Cross-session persistence with co-modification tracking
- **Python hooks** - Zero-dependency automation with automatic cleanup

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
│   ├── agents/           # 7 technology experts
│   ├── skills/           # 6 procedural skills
│   ├── commands/         # Slash commands
│   ├── hooks/            # Automation hooks
│   ├── memory/           # Cross-session persistence
│   ├── core/             # Protocols
│   └── state/            # Session state (gitignore)
├── CLAUDE.md             # Your project instructions
└── [rest of project]
```

### First Use

```
/expert How do I configure a NATS JetStream consumer?

🤖 Invoking: nats-expert
✅ Use jetstream.consumers.add() with ack_policy
📚 Source: https://docs.nats.io/
```

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     TECHNOLOGY EXPERTS (7)                       │
│                                                                  │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│  │   NATS     │ │  Express   │ │  Testing   │ │   Docker   │   │
│  │  Expert    │ │  Expert    │ │  Expert    │ │  Expert    │   │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘   │
│                                                                  │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐                   │
│  │  Security  │ │ ClickHouse │ │   Python   │                   │
│  │  Expert    │ │  Expert    │ │  Expert    │                   │
│  └────────────┘ └────────────┘ └────────────┘                   │
│                              │                                   │
│                              ▼                                   │
│              ┌───────────────────────────────┐                  │
│              │     Context System            │                  │
│              │  - memory/learnings.json      │                  │
│              │  - memory/decisions.json      │                  │
│              │  - core/protocols.md          │                  │
│              └───────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────────┘
```

### Components

| Component | Location | Description |
|-----------|----------|-------------|
| **Agents** | `.claude/agents/*/AGENT.md` | Technology experts with domain knowledge |
| **Skills** | `.claude/skills/*/SKILL.md` | Procedural workflows and procedures |
| **Commands** | `.claude/commands/*.md` | Slash commands (`/expert`, `/deploy`) |
| **Hooks** | `.claude/hooks/` | Automation (session init, safety guards) |
| **Memory** | `.claude/memory/` | Cross-session persistence |
| **Protocols** | `.claude/core/protocols.md` | Shared protocols |

---

## Technology Experts

Each expert is a `.claude/agents/[name]/AGENT.md` file with YAML frontmatter + Markdown content.

| Expert | Primary Focus | Use For |
|--------|---------------|---------|
| `nats-expert` | NATS JetStream | Streams, consumers, KV store, messaging patterns |
| `security-expert` | Application Security | OWASP, vulnerabilities, audits, auth |
| `express-expert` | Express.js | REST APIs, middleware, JWT auth, rate limiting |
| `testing-expert` | Testing | Vitest, TDD workflow, fixtures, mocking, E2E |
| `clickhouse-expert` | ClickHouse | Analytics SQL, schema design, TTL, performance |
| `docker-expert` | Docker | Containers, compose, networking, stack.sh |
| `python-expert` | Python | Flask, FastAPI, Presidio PII, language detection |

### Usage

**Single Expert:**
```
/expert How do I create a ClickHouse materialized view?
→ clickhouse-expert responds
```

**Force Specific Expert:**
```
/expert [docker] Why is port 5678 not accessible?
/expert [security] Review this authentication flow
```

### Expert Anatomy

```yaml
---
name: nats-expert
description: |
  NATS and JetStream messaging expert.
  Deep knowledge of streams, consumers, workers, request-reply patterns.
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

# NATS Expert

Expert in NATS JetStream messaging.

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
| `pattern-library-manager` | Detection pattern management |
| `git-commit-helper` | Conventional commits, no AI attribution |
| `browser-extension-developer` | Chrome extension development |
| `documentation-specialist` | README, API docs, changelogs |
| `installation-orchestrator` | Installation troubleshooting |

### Skills vs Agents

| Aspect | Agent | Skill |
|--------|-------|-------|
| Focus | Technology expertise | Procedure/workflow |
| Knowledge | Deep domain knowledge | Step-by-step instructions |
| Invocation | `/expert [query]` | `/skill [name]` |
| Example | "How to configure NATS?" | "Run TDD workflow" |

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
/remember learning Always use parameterized queries for ClickHouse
/remember decision Use NATS request-reply for Python services
/remember preference Prefer explicit error handling over try-catch
```

### Storage Format

```json
{
  "learnings": [
    {
      "id": "learn-001",
      "content": "Always use parameterized queries for ClickHouse",
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
| `memory-writer.py` | Stop | Persist learnings |
| `co-modification-tracker.py` | Stop | Track files frequently edited together |

### Safety Validator

Blocks dangerous patterns:

```python
BLOCKED_PATTERNS = [
    r'rm\s+-rf\s+/',           # rm -rf with absolute path
    r'git\s+push.*--force',    # Force push
    r'docker\s+system\s+prune', # Docker prune
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

### Step 2: Remove Unneeded Experts

```bash
# If you don't use ClickHouse
rm -rf .claude/agents/clickhouse-expert
```

### Step 3: Add Your Own Experts

For technologies specific to your project.

### Step 4: Customize Skills

```bash
# Remove project-specific skills
rm -rf .claude/skills/pattern-library-manager

# Add your own
mkdir .claude/skills/my-workflow
```

### Step 5: Create CLAUDE.md

Use the template in `CLAUDE.md` and customize for your project.

### Step 6: Update .gitignore

```gitignore
# Agent state (runtime)
.claude/state/
.claude/settings.local.json
.claude/audit_logs/
.claude/tsc-cache/
```

---

## Migration from v3.x

| v3.x | v4.1 |
|------|------|
| `/expert` with orchestrator | Direct expert invocation |
| 17 technology experts | 7 consolidated experts |
| 22 skills | 6 essential skills |
| TypeScript hooks | Python hooks (zero deps) |
| Manual token tracking | Claude 4.5 automatic |
| OODA protocol in every agent | Simplified reasoning |

### Breaking Changes

- `orchestrator` agent removed
- `react-expert` → Frontend Conventions in CLAUDE.md
- `vitest-expert` → `testing-expert`
- `presidio-expert` → `python-expert`
- `kubernetes-expert` → `docker-expert`
- `redis-expert` → `express-expert`
- `helm-expert`, `git-expert` → removed

### Removed Agents

- orchestrator → Claude Code handles routing natively
- code-audit-expert → merged into security-expert
- error-debugger → generic, not needed
- performance-profiler → generic, not needed
- refactor-planner → generic, not needed

---

## Reference Files

| File | Description |
|------|-------------|
| [.claude/README.md](.claude/README.md) | Agent system documentation |
| [.claude/core/protocols.md](.claude/core/protocols.md) | Essential protocols |
| [.claude/core/tool-schema.md](.claude/core/tool-schema.md) | Tool patterns |
| [CLAUDE.md](CLAUDE.md) | Project template |

---

## License

MIT License - See [LICENSE](LICENSE) file.

Copyright (c) 2025-2026 Tomasz Bartel

---

**Status:** Production Ready
**Version:** 4.1.1
**Based on:** Anthropic Context Engineering Best Practices (2025-2026)
**Last Updated:** 2026-02-02
