# Technology Expert Agent System v4.1

A modernized, lightweight agent system for Claude Code based on **Anthropic's Context Engineering Best Practices (2025-2026)**.

> **v4.1 Highlights:**
> - 7 consolidated technology experts (down from 17)
> - Cross-session memory system
> - Python-based hooks (zero dependencies)
> - Claude 4.5 handles token management automatically

## Philosophy

```
Skills   = HOW to do things (procedures, workflows)
Agents   = WHO does the work (technology expertise)
```

**Key Principles:**
- **No orchestrator** - Claude Code handles routing natively
- **Consolidated experts** - Fewer, more focused experts
- **Memory system** - Cross-session learning persistence
- **Simplified protocols** - Claude 4.5 manages context automatically

## Architecture v4.1

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

## Available Experts (7)

| Expert | Keywords | Specialization |
|--------|----------|----------------|
| `nats-expert` | nats, jetstream, stream, consumer | Messaging, streams, KV store |
| `security-expert` | security, OWASP, XSS, audit | API auth, vulnerabilities, audits |
| `express-expert` | express, api, route, redis, cache | REST APIs, middleware, JWT auth |
| `testing-expert` | test, vitest, TDD, fixture | Testing, TDD workflow, mocking |
| `docker-expert` | docker, compose, kubernetes | Containers, orchestration |
| `clickhouse-expert` | clickhouse, SQL, analytics | Analytics DB, schema, TTL |
| `python-expert` | python, flask, fastapi, presidio | Python APIs, PII detection |

## Directory Structure

```
.claude/
├── agents/                    # Technology experts (7)
│   ├── nats-expert/
│   ├── security-expert/
│   ├── express-expert/
│   ├── testing-expert/
│   ├── docker-expert/
│   ├── clickhouse-expert/
│   └── python-expert/
│
├── skills/                    # Procedural skills (6)
│   ├── session-initializer/
│   ├── pattern-library-manager/
│   ├── git-commit-helper/
│   ├── browser-extension-developer/
│   ├── documentation-specialist/
│   └── installation-orchestrator/
│
├── memory/                    # Cross-session persistence
│   ├── learnings.json
│   ├── preferences.json
│   └── decisions.json
│
├── state/                     # Session state (gitignore)
│   └── session-context.json
│
├── core/                      # Shared protocols
│   ├── protocols.md
│   └── tool-schema.md
│
├── hooks/                     # Automation hooks (Python)
│   ├── session-init.sh
│   ├── safety-validator.py
│   └── memory-writer.py
│
└── commands/                  # Slash commands
    ├── expert.md
    ├── deploy.md
    └── ...
```

## Memory System

Cross-session learning with automatic persistence:

**How it works:**
1. **SessionStart** - `session-init.sh` loads recent learnings into context
2. **During Session** - Use `/remember` to save learnings
3. **Stop** - `memory-writer.py` persists to permanent storage

**Usage:**
```
/remember learning Always use parameterized queries for ClickHouse
/remember decision Use NATS request-reply for Python services
```

**Files:**
- `memory/learnings.json` - Lessons learned (max 100, FIFO rotation)
- `memory/decisions.json` - Architectural decisions (max 50, FIFO)
- `memory/preferences.json` - User style preferences

## Simplified Tool Categories

Claude 4.5 manages tool loading automatically:

| Category | Tools |
|----------|-------|
| **Always Available** | Read, Edit, Glob, Grep |
| **On-Demand** | Write, Bash, Task, WebFetch, WebSearch |

## Usage

### Single Expert

```
/expert How do I configure a NATS JetStream consumer?

🤖 Invoking: nats-expert
✅ Use jetstream.consumers.add() with ack_policy
📚 Source: https://docs.nats.io/
```

### Direct Expert Selection

```
/expert [docker] Why is port 5678 not accessible?
/expert [security] Review this authentication flow
```

### TDD Workflow

```
/expert Add SQL injection detection with TDD

🧪 Step 1: Create test fixture (malicious payload)
⚙️  Step 2: Write failing test
🔨 Step 3: Implement detection pattern
✅ Step 4: Verify test passes
```

## Protocols Reference

See `core/protocols.md` for:

1. **Error Handling Protocol** - 3-state error handling
2. **Clean State Protocol** - Tests pass, ready to merge
3. **Response Format Protocol** - Output formatting
4. **Memory Protocol** - Cross-session learning
5. **Code Quality Protocol** - CLAUDE.md compliance

## Adding New Expert

1. Create directory: `agents/{tech}-expert/`

2. Create `AGENT.md` with Claude Code SDK frontmatter:

```yaml
---
name: new-expert
description: |
  Brief description of expertise.
  Include trigger keywords in description for routing.
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

# Expert Name

Expert in [technology].

## Core Knowledge
[Technology fundamentals]

## Common Procedures
[Step-by-step procedures]

## Key Files
[Project-specific file references]

## Critical Rules
[Do's and Don'ts]
```

---

## Migration from v3.x

| v3.x | v4.1 |
|------|------|
| `/expert` with orchestrator | Direct expert invocation |
| 17 agents | 7 consolidated agents |
| 22+ skills | 6 essential skills |
| TypeScript hooks | Python hooks (zero deps) |
| Manual token tracking | Claude 4.5 automatic |
| OODA protocol in every agent | Simplified reasoning |

**Removed Agents:**
- orchestrator → Claude Code handles routing natively
- react-expert → Frontend Conventions in CLAUDE.md
- vitest-expert → testing-expert
- presidio-expert → python-expert
- kubernetes-expert → docker-expert
- redis-expert → express-expert
- helm-expert, git-expert → removed

---

**Version:** 4.1.0
**Status:** Production ready
**Based on:** Anthropic Context Engineering Best Practices (2025-2026)
