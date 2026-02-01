# Claude Integration Guide

**FOR CLAUDE CODE:** Instructions for working with Vigil Guard Enterprise Claude Code infrastructure.

---

## Overview

This repository contains Claude Code infrastructure for Vigil Guard Enterprise - a commercial prompt injection detection platform.

**Key Components:**
- 21 specialized agents (technology experts)
- 20 domain skills (Vigil Guard specific)
- 26 slash commands
- 6 automation hooks
- Dev docs pattern for task tracking

---

## Repository Structure

### Folder Tree

```
.claude/
├── settings.json                    # Claude Code settings (hooks, permissions)
├── CLAUDE_INTEGRATION_GUIDE.md      # This file
│
├── agents/                          # 21 specialized AI agents
│   ├── clickhouse-expert/
│   ├── docker-expert/
│   ├── express-expert/
│   ├── nats-expert/
│   ├── orchestrator/
│   └── ...
│
├── skills/                          # 20 domain skills
│   ├── skill-rules.json             # Activation rules
│   ├── master-orchestrator/
│   ├── nats-messaging/
│   ├── docker-orchestration/
│   └── ...
│
├── commands/                        # 26 slash commands
│   ├── dev-docs.md
│   ├── orchestrate.md
│   ├── deploy.md
│   └── ...
│
├── hooks/                           # 6 automation hooks
│   ├── safety-validator.py
│   ├── audit-logger.py
│   ├── skill-suggester.py
│   ├── skill-validator.py
│   ├── auto-format.sh
│   └── notification-sound.sh
│
├── audit_logs/                      # Operation audit logs (auto-generated)
├── scripts/                         # Helper scripts
│   └── next-task-number.sh
└── core/                            # Shared protocols

dev_docs/                            # Development task tracking
├── active/                          # Work in progress
├── archive/                         # Completed tasks
└── README.md                        # Pattern documentation
```

---

## Agents (21)

Specialized task agents for complex operations. Use via Task tool.

### Technology Experts

| Agent | Purpose |
|-------|---------|
| `clickhouse-expert` | ClickHouse analytics, queries, schema |
| `docker-expert` | Containers, Compose, Dockerfile |
| `express-expert` | API, middleware, routes |
| `git-expert` | Version control, branching |
| `helm-expert` | Helm charts, values, templates |
| `kubernetes-expert` | K8s deployment, pods, services |
| `nats-expert` | JetStream, messaging, streams |
| `presidio-expert` | PII detection, Presidio API |
| `python-expert` | Python SDK, Flask services |
| `react-expert` | Components, hooks, state |
| `redis-expert` | Caching, rate limiting |
| `security-expert` | OWASP, vulnerabilities |
| `tailwind-expert` | CSS, styling |
| `vitest-expert` | Testing, TDD, coverage |

### Task-Oriented Agents

| Agent | Purpose |
|-------|---------|
| `orchestrator` | Multi-expert task routing |
| `error-debugger` | Root cause analysis |
| `performance-profiler` | Bottleneck identification |
| `refactor-planner` | Refactoring strategies |
| `strategic-plan-architect` | Implementation planning |
| `code-audit-expert` | Code quality review |
| `web-research-specialist` | Web research with citations |

---

## Skills (20)

Domain skills auto-activated by file patterns or keywords.

### Core Skills

| Skill | Purpose |
|-------|---------|
| `master-orchestrator` | Autonomous multi-agent coordination |
| `nats-messaging` | NATS JetStream patterns |
| `docker-orchestration` | Docker Compose, services |
| `express-api-developer` | REST API development |
| `react-tailwind-ui` | Frontend components |
| `security-patterns` | Security best practices |

### Detection Pipeline Skills

| Skill | Purpose |
|-------|---------|
| `presidio-pii-specialist` | PII detection (Polish + English) |
| `language-detection-expert` | Hybrid language detection |
| `pattern-library-manager` | Detection pattern management |
| `testing-e2e` | End-to-end testing |
| `test-fixture-generator` | Test data generation |

### Infrastructure Skills

| Skill | Purpose |
|-------|---------|
| `kubernetes-operations` | K8s deployment |
| `helm-chart-management` | Helm charts |
| `installation-orchestrator` | install.sh management |
| `security-audit-scanner` | OWASP scanning |

### Other Skills

| Skill | Purpose |
|-------|---------|
| `git-commit-helper` | Conventional Commits |
| `documentation-sync-specialist` | Docs maintenance |
| `browser-extension-developer` | Chrome extension |
| `nats-messaging` | NATS JetStream workers |
| `code-audit` | Code quality |

---

## Commands (26)

Slash commands for common operations.

### Development

| Command | Purpose |
|---------|---------|
| `/dev-docs` | Create dev docs for new task |
| `/dev-docs-update` | Update before context reset |
| `/dev-docs-archive` | Archive completed task |

### Orchestration

| Command | Purpose |
|---------|---------|
| `/orchestrate` | Multi-agent task execution |
| `/quick-agent` | Quick access to agents |
| `/agent-help` | Agent usage help |
| `/status-agents` | Show agent status |
| `/test-agents` | Test all agents |

### Domain Commands

| Command | Purpose |
|---------|---------|
| `/backend` | Express API development |
| `/frontend` | React + Tailwind UI |
| `/infrastructure` | NATS, workers |
| `/deploy` | Docker deployment |
| `/security` | Security scanning |
| `/analytics` | ClickHouse analytics |
| `/pii` | PII detection |
| `/patterns` | Pattern management |
| `/documentation` | Docs generation |

### Testing & Quality

| Command | Purpose |
|---------|---------|
| `/test` | TDD workflow |
| `/run-full-test-suite` | Full test execution |
| `/add-detection-pattern` | Add new pattern (TDD) |
| `/pr-review` | PR code review |
| `/audit-code` | Code quality audit |
| `/commit-with-validation` | Validated git commit |

### Utilities

| Command | Purpose |
|---------|---------|
| `/tech-docs` | Query technology docs |
| `/expert` | Access technology expert |
| `/deploy-service` | Deploy specific service |

---

## Hooks (6)

Automation scripts triggered by Claude events.

| Hook | Event | Purpose |
|------|-------|---------|
| `safety-validator.py` | PreToolUse | Blocks destructive commands |
| `audit-logger.py` | All events | Logs operations to JSONL |
| `skill-suggester.py` | UserPromptSubmit | Suggests relevant skills |
| `skill-validator.py` | PreToolUse | Validates skill file structure |
| `auto-format.sh` | PostToolUse | Auto-formats code (Ruff, Prettier) |
| `notification-sound.sh` | Stop | Plays sound on completion |

---

## Dev Docs Pattern

Task tracking across Claude sessions.

### Structure

```
dev_docs/
├── active/                    # Work in progress
│   └── NNNN_task-name/
│       ├── NNNN_task-name-plan.md
│       ├── NNNN_task-name-context.md
│       └── NNNN_task-name-tasks.md
├── archive/                   # Completed tasks
└── README.md
```

### Commands

```bash
# Get next task number
.claude/scripts/next-task-number.sh  # Returns: 0001

# Create new task
/dev-docs implement new detection branch

# Update before context reset
/dev-docs-update

# Archive completed task
/dev-docs-archive
```

---

## Quick Start

### For Development Tasks

1. **Simple task**: Work directly or use `/quick-agent`
2. **Multi-step task**: Use `/orchestrate` or TodoWrite
3. **Technology-specific**: Use `/expert [technology]`

### For Complex Features

1. `/dev-docs [feature description]` - Create task structure
2. Work through tasks, update context regularly
3. `/dev-docs-update` before context limits
4. `/dev-docs-archive` when complete

### Decision Tree

```
Task received
    │
    ├─ Simple, single-file? → Work directly
    │
    ├─ Technology-specific? → Use expert agent
    │
    ├─ Multi-technology? → Use /orchestrate
    │
    └─ Multi-day/complex? → Use /dev-docs
```

---

## Vigil Guard Architecture

### 3-Branch Detection Pipeline

```
Request → API → NATS JetStream
                    │
    ┌───────────────┼───────────────┐
    │               │               │
    ▼               ▼               ▼
┌─────────┐   ┌─────────┐   ┌─────────┐
│ Branch A│   │ Branch B│   │ Branch C│
│Heuristic│   │Semantic │   │LLM Guard│
│  30%    │   │  35%    │   │  35%    │
└────┬────┘   └────┬────┘   └────┬────┘
     │             │             │
     └─────────────┼─────────────┘
                   │
                   ▼
            ┌─────────────┐
            │   Arbiter   │
            └──────┬──────┘
                   │
                   ▼
            ┌─────────────┐
            │  Logging    │
            │ ClickHouse  │
            └─────────────┘
```

### Key Services

| Service | Purpose |
|---------|---------|
| `apps/api` | Public REST API (:8787) |
| `apps/web-ui` | Config interface (:8788) |
| `services/detection-worker` | Branch A: Heuristics |
| `services/semantic-worker` | Branch B: Embeddings |
| `services/pii-worker` | PII detection |
| `services/arbiter-worker` | Decision fusion |
| `services/logging-worker` | ClickHouse ingestion |

---

## Best Practices

### Using Skills

1. Skills auto-activate based on file patterns and keywords
2. Check skill suggestions after prompt submission
3. Use `/[skill-name]` to manually activate

### Using Agents

1. Agents are stateless - provide full context
2. Use `model: opus` for all agents
3. Orchestrator routes to appropriate experts

### Using Hooks

1. Safety validator blocks destructive commands
2. Audit logs track all operations
3. Auto-format runs after file modifications

---

## Troubleshooting

### Hooks Not Running

```bash
# Check executable permissions
ls -la .claude/hooks/

# Make executable
chmod +x .claude/hooks/*.py .claude/hooks/*.sh
```

### Skill Not Activating

```bash
# Check skill-rules.json syntax
cat .claude/skills/skill-rules.json | jq .

# Verify file patterns match your paths
```

### Agent Not Responding

```bash
# Check agent file exists
ls .claude/agents/[agent-name]/AGENT.md

# Verify model setting
grep "model:" .claude/agents/[agent-name]/AGENT.md
```

---

## Verification Checklist

```bash
# 1. Hooks are executable
ls -la .claude/hooks/*.py .claude/hooks/*.sh

# 2. settings.json is valid
cat .claude/settings.json | jq .

# 3. skill-rules.json is valid
cat .claude/skills/skill-rules.json | jq .

# 4. Python dependencies available
python3 -c "import json, sys, re"

# 5. Dev docs structure exists
ls -la dev_docs/
```

---

**Last Updated:** 2025-12-20
