# Vigil-Code: Technology Expert Agent System for Claude Code

**A universal technology expert framework for Claude Code that provides domain-specific knowledge, documentation-aware assistance, and intelligent task routing.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Claude Code](https://img.shields.io/badge/Claude-Code-blue.svg)](https://claude.ai/code)
[![Experts: 12](https://img.shields.io/badge/Experts-12-green.svg)](#technology-experts)
[![Version: 3.0](https://img.shields.io/badge/Version-3.0-brightgreen.svg)]()

---

## Overview

Vigil-Code v3.0 is a **universal technology expert system** designed for Claude Code. Unlike project-specific agents, these experts focus on **technologies** (n8n, React, Docker, etc.) and adapt to any codebase through context files.

### Key Features

- **12 Technology Experts** - Deep specialization in specific technologies
- **3-Tier Knowledge Model** - Core knowledge → Documentation → Community resources
- **Documentation-Aware** - Experts fetch official docs when uncertain
- **Progress Tracking** - State persistence via JSON files (no Node.js required)
- **Universal Design** - Works across any project, not just Vigil Guard

### Philosophy

```
❌ OLD (v2.0): Agents knew project internals (hardcoded knowledge)
✅ NEW (v3.0): Experts know technologies + read project context from files
```

**Benefits:**
- **Reusable** - Same experts work across any project
- **Maintainable** - Update technology knowledge, not project-specific code
- **Expert-level** - Deep specialization in one technology per expert
- **Future-proof** - Your code evolves, experts adapt via context
- **Documentation-aware** - Experts verify answers against official docs

---

## Quick Start

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/vigil-code.git
   cd vigil-code
   ```

2. **Copy to your project:**
   ```bash
   cp -r .claude /path/to/your/project/
   cp CLAUDE.md /path/to/your/project/
   ```

3. **Use in Claude Code:**
   ```
   /expert Add health check endpoint to Express API
   ```

### First Task

The `/expert` command routes your request to the appropriate technology expert:

```
/expert How do I configure a Code node in n8n?
→ Routes to n8n-expert
→ Expert provides answer with documentation reference
```

---

## Technology Experts

### Available Experts (12)

| Expert | Technology | Specialization |
|--------|------------|----------------|
| `orchestrator` | Coordination | Multi-expert task routing, workflow management |
| `n8n-expert` | n8n | Workflows, nodes, webhooks, Code node syntax |
| `react-expert` | React + Vite | Components, hooks, state management, modern React |
| `express-expert` | Express.js | REST APIs, middleware, authentication, routing |
| `vitest-expert` | Vitest/Jest | Testing, TDD, fixtures, mocking strategies |
| `clickhouse-expert` | ClickHouse | Analytics SQL, schema design, optimization |
| `docker-expert` | Docker | Containers, compose, networking, orchestration |
| `presidio-expert` | MS Presidio | PII detection, NLP, custom entity recognition |
| `security-expert` | Security | OWASP Top 10, auth patterns, vulnerability assessment |
| `git-expert` | Git/GitHub | Version control, branching, PRs, workflows |
| `python-expert` | Python | Flask, FastAPI, data processing |
| `tailwind-expert` | Tailwind CSS | Utility CSS, responsive design, v4 features |

### Expert Location

Each expert is defined in `.claude/agents/[expert-name]/AGENT.md`

---

## 3-Tier Knowledge Model

Each expert has access to three tiers of knowledge:

### Tier 1: Core Knowledge (In-Context)
- Fundamentals, best practices, common patterns
- Always available, no lookup needed
- Handles ~80% of requests

### Tier 2: Official Documentation (WebFetch)
- API references, configuration options, version-specific details
- Fetched when expert is uncertain about details
- Sources: Official docs (docs.n8n.io, react.dev, etc.)

### Tier 3: Community Knowledge (WebSearch)
- Edge cases, workarounds, known issues
- Used for unusual problems not in official docs
- Sources: Stack Overflow, GitHub issues, blog posts

### Documentation Protocol

When an expert needs to verify information:

```
🔍 Let me verify this in the documentation...
[WebFetch: https://docs.n8n.io/code/cookbook/...]
✅ Confirmed: Code nodes use $input.all() to access items
Source: https://docs.n8n.io/code/cookbook/
```

---

## How It Works

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    TECHNOLOGY EXPERTS                           │
│                                                                 │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐  │
│  │ n8n        │ │ React      │ │ Express    │ │ Docker     │  │
│  │ Expert     │ │ Expert     │ │ Expert     │ │ Expert     │  │
│  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘  │
│        │              │              │              │          │
│        └──────────────┴──────────────┴──────────────┘          │
│                              │                                  │
│                              ▼                                  │
│              ┌───────────────────────────────┐                 │
│              │      Orchestrator             │                 │
│              │  (routes tasks to experts)    │                 │
│              └───────────────────────────────┘                 │
│                              │                                  │
│                              ▼                                  │
│              ┌───────────────────────────────┐                 │
│              │     Project Context           │                 │
│              │  - CLAUDE.md                  │                 │
│              │  - progress.json              │                 │
│              │  - Project files              │                 │
│              └───────────────────────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

### Expert Invocation

Experts are invoked via the Task tool:

```javascript
Task(
  prompt="You are n8n-expert. [task description]",
  subagent_type="general-purpose"
)
```

### Progress Tracking

Multi-step tasks use `.claude/state/progress.json`:

```json
{
  "workflow_id": "wf-20251127-abc123",
  "status": "in_progress",
  "current_expert": "n8n-expert",
  "completed_steps": ["vitest-expert:create_test"],
  "next_step": {
    "expert": "n8n-expert",
    "action": "add_pattern"
  }
}
```

---

## Usage Examples

### Example 1: Technology Question

```
/expert How do I create a custom recognizer in Presidio?
```

**Response:**
```
🤖 Invoking: presidio-expert

To create a custom recognizer in Presidio:

1. Create a class inheriting from EntityRecognizer:

   from presidio_analyzer import EntityRecognizer, RecognizerResult

   class MyRecognizer(EntityRecognizer):
       def load(self):
           pass

       def analyze(self, text, entities, nlp_artifacts):
           # Your detection logic
           return [RecognizerResult(...)]

2. Register with the analyzer:

   analyzer.registry.add_recognizer(MyRecognizer())

🔍 Source: https://microsoft.github.io/presidio/analyzer/adding_recognizers/
```

### Example 2: Multi-Expert Workflow

```
/expert Add SQL injection detection with tests
```

**Response:**
```
🎯 Task: Add SQL injection detection

🎭 Strategy: Sequential (TDD workflow)

📋 Classification:
   • Primary: vitest-expert
   • Supporting: n8n-expert

🧪 Step 1: Invoking vitest-expert
   ▶️  Action: create_test
   📝 Creating fixture for SQL injection...
   ✅ Completed (1.2s)

⚙️  Step 2: Invoking n8n-expert
   ▶️  Action: add_pattern
   📝 Adding pattern to workflow...
   ✅ Completed (0.8s)

🧪 Step 3: Invoking vitest-expert
   ▶️  Action: run_test
   📝 Verifying pattern detection...
   ✅ Completed (2.1s)

════════════════════════════════════════════════════════════
✨ Task Completed in 4.1s

📋 Summary:
   SQL injection detection pattern added successfully
════════════════════════════════════════════════════════════
```

### Example 3: Direct Expert Invocation

```
/expert [docker] Why is my container not connecting to the network?
```

Routes directly to `docker-expert` for container networking troubleshooting.

---

## Project Structure

```
vigil-code/
├── .claude/                          # Agent system
│   ├── agents/                       # 12 technology experts
│   │   ├── orchestrator/            # Task routing
│   │   ├── n8n-expert/              # n8n automation
│   │   ├── react-expert/            # React development
│   │   ├── express-expert/          # Express.js APIs
│   │   ├── vitest-expert/           # Testing
│   │   ├── clickhouse-expert/       # Analytics DB
│   │   ├── docker-expert/           # Containers
│   │   ├── presidio-expert/         # PII detection
│   │   ├── security-expert/         # Security
│   │   ├── git-expert/              # Version control
│   │   ├── python-expert/           # Python development
│   │   └── tailwind-expert/         # CSS styling
│   ├── core/                         # Shared protocols
│   │   └── protocols.md             # Progress, docs, handoff protocols
│   ├── state/                        # Workflow state
│   │   └── progress.json            # Current workflow state
│   ├── commands/                     # Slash commands
│   │   └── expert.md                # /expert command
│   ├── skills/                       # Legacy skills
│   └── README.md                     # .claude documentation
├── CLAUDE.md                          # Project instructions
├── LICENSE                            # MIT license
└── README.md                          # This file
```

---

## When to Use Experts

### USE experts when:
- Task is domain-specific (n8n, React, Docker, etc.)
- You need verified information from documentation
- Task involves best practices for a specific technology
- Multi-step workflow crossing multiple technologies

### DON'T use experts for:
- Simple file edits (direct Read/Edit tools are faster)
- Pure codebase exploration (use Explore agent)
- Documentation-only updates (direct work is faster)

---

## Migration from v2.0

If you're upgrading from v2.0:

### Removed
- ❌ `vg-*` agents (project-specific)
- ❌ `message-bus.js` (didn't work in Claude Code context)
- ❌ `base-agent.js` (Node.js classes not invocable)
- ❌ `state-manager.js` (replaced with progress.json)
- ❌ `master/`, `master-orchestrator/` directories
- ❌ Node.js CLI (`node init.js`)

### Added
- ✅ 12 technology experts (in `.claude/agents/`)
- ✅ Documentation protocol (WebFetch/WebSearch)
- ✅ Progress file for state (`.claude/state/progress.json`)
- ✅ Core protocols document (`.claude/core/protocols.md`)
- ✅ `/expert` slash command

### Migration Steps

1. Delete old `.claude/` directory
2. Copy new `.claude/` from this repo
3. Update CLAUDE.md to v3.0 version
4. Use `/expert` instead of `/vg-orchestrate`

---

## Documentation

- **[CLAUDE.md](CLAUDE.md)** - Complete project instructions
- **[.claude/README.md](.claude/README.md)** - Agent system overview
- **[.claude/core/protocols.md](.claude/core/protocols.md)** - Shared protocols

---

## License

MIT License - See [LICENSE](LICENSE) file for details.

---

## Acknowledgments

Built for [Claude Code](https://claude.ai/code).

---

**Status:** Production Ready ✅
**Version:** 3.0.0
**Last Updated:** 2025-11-27
