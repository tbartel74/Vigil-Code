# Technology Expert Agent System v3.0

A universal, technology-focused agent system for Claude Code. Agents are experts in **technologies**, not specific projects.

## Philosophy

```
❌ OLD: Agents know your project internals
✅ NEW: Agents are technology experts + read project context from files
```

**Benefits:**
- **Reusable**: Same agents work across any project
- **Maintainable**: Update technology knowledge, not project-specific code
- **Expert-level**: Deep specialization in one technology per agent
- **Future-proof**: Your code evolves, agents adapt via context
- **Documentation-aware**: Experts fetch official docs when uncertain

## Architecture

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

## Available Experts (12)

| Expert | Technology | Specialization |
|--------|------------|----------------|
| `orchestrator` | Coordination | Task routing, workflow management |
| `n8n-expert` | n8n | Workflows, nodes, webhooks, automation |
| `react-expert` | React + Vite | Components, hooks, state, modern React |
| `express-expert` | Express.js | REST APIs, middleware, auth, routing |
| `vitest-expert` | Vitest/Jest | Testing, TDD, fixtures, mocking |
| `clickhouse-expert` | ClickHouse | Analytics SQL, schema, optimization |
| `docker-expert` | Docker | Containers, compose, networking |
| `presidio-expert` | MS Presidio | PII detection, NLP, entity recognition |
| `security-expert` | Security | OWASP, auth, vulnerabilities |
| `git-expert` | Git/GitHub | Version control, workflows, PRs |
| `python-expert` | Python | Flask, FastAPI, data processing |
| `tailwind-expert` | Tailwind CSS | Utility CSS, responsive design |

## How It Works

### 1. Task Classification

Orchestrator analyzes user request and determines:
- Which expert(s) are needed
- Whether to run sequentially or in parallel
- How to structure the workflow

### 2. Progress File

Multi-step tasks use `.claude/state/progress.json`:

```json
{
  "workflow_id": "wf-20251127-abc123",
  "task": {
    "original_request": "Add SQL injection detection",
    "summary": "Create test + add pattern"
  },
  "classification": {
    "primary_expert": "n8n-expert",
    "supporting_experts": ["vitest-expert"],
    "strategy": "sequential"
  },
  "status": "in_progress",
  "completed_steps": [...],
  "next_step": {...}
}
```

### 3. Expert Invocation

Experts are invoked via Task tool:

```
Task(
  prompt="You are n8n-expert. Read .claude/state/progress.json for context.
          Execute: add_node action. Update progress when done.",
  subagent_type="general-purpose"
)
```

### 4. Documentation Protocol

Each expert has 3 tiers of knowledge:

**Tier 1: Core Knowledge** (in-context)
- Fundamentals, best practices, common patterns
- Used for 80% of tasks

**Tier 2: Official Documentation** (WebFetch)
- API references, configuration options
- Fetched when uncertain about details

**Tier 3: Community Knowledge** (WebSearch)
- Edge cases, workarounds, known issues
- Used for unusual problems

```
🔍 Let me verify this in the documentation...
[WebFetch: https://docs.n8n.io/...]
✅ Confirmed: [solution]
Source: [url]
```

## Directory Structure

```
.claude/
├── agents/
│   ├── orchestrator/      # Task routing & coordination
│   │   └── AGENT.md
│   ├── n8n-expert/        # n8n automation
│   │   └── AGENT.md
│   ├── react-expert/      # React development
│   │   └── AGENT.md
│   ├── express-expert/    # Express.js APIs
│   │   └── AGENT.md
│   ├── vitest-expert/     # Testing
│   │   └── AGENT.md
│   ├── clickhouse-expert/ # Analytics DB
│   │   └── AGENT.md
│   ├── docker-expert/     # Containers
│   │   └── AGENT.md
│   ├── presidio-expert/   # PII detection
│   │   └── AGENT.md
│   ├── security-expert/   # Security
│   │   └── AGENT.md
│   ├── git-expert/        # Version control
│   │   └── AGENT.md
│   ├── python-expert/     # Python development
│   │   └── AGENT.md
│   └── tailwind-expert/   # CSS styling
│       └── AGENT.md
├── core/
│   └── protocols.md       # Shared protocols
├── state/
│   └── progress.json      # Current workflow state
├── commands/              # Slash commands
│   └── expert.md          # /expert command
└── skills/                # Legacy skills (simplified)
```

## Usage

### Single Expert Task

```
User: "Add a health check endpoint to my Express app"

→ Orchestrator routes to express-expert
→ Expert reads project context
→ Expert provides solution with code
```

### Multi-Expert Task

```
User: "Add SQL injection detection with tests"

→ Orchestrator creates workflow:
   1. vitest-expert: Create test (TDD)
   2. n8n-expert: Add detection pattern
   3. vitest-expert: Verify tests pass

→ Progress file tracks state between experts
→ Each expert reads previous results from progress.json
```

### Expert with Documentation Lookup

```
User: "How do I use $input.all() in n8n Code node?"

→ n8n-expert assesses confidence (MEDIUM)
→ Fetches https://docs.n8n.io/code/
→ Provides verified answer with source citation
```

## Progress Reporting Format

```
🎯 Task: [description]

📋 Classification:
   • Primary: [expert]
   • Supporting: [experts]
   • Strategy: [sequential/parallel]

🤖 Step 1: [expert-name]
   ├─ ▶️  Action: [action]
   ├─ 📝 [progress]
   └─ ✅ Completed (X.Xs)

🤖 Step 2: [expert-name]
   ...

═══════════════════════════════════════
✨ Task Completed in [duration]

📋 Summary: [what was accomplished]

📁 Artifacts:
   • [files created/modified]

💡 Next Steps:
   • [suggestions if any]
═══════════════════════════════════════
```

## Key Differences from v2

| Aspect | v2 (vg-* agents) | v3 (technology experts) |
|--------|------------------|------------------------|
| Knowledge | Project-specific | Technology-focused |
| Reusability | Single project | Any project |
| Communication | Message bus (broken) | Progress file (works) |
| Invocation | Node.js classes | Task tool prompts |
| Documentation | Static | Dynamic (WebFetch) |
| Uncertainty | Guess | Fetch official docs |

## Adding New Expert

1. Create directory: `.claude/agents/{tech}-expert/`

2. Create `AGENT.md` with these sections:
   - **Core Knowledge (Tier 1)**: Fundamentals expert knows by heart
   - **Documentation Sources (Tier 2)**: Official docs URLs + when to fetch
   - **Community Sources (Tier 3)**: GitHub, forums for edge cases
   - **Uncertainty Protocol**: When to fetch docs, response patterns
   - **Common Tasks**: Templates for frequent operations
   - **Response Format**: Standard output structure
   - **Critical Rules**: Do's and Don'ts

3. Add to orchestrator's expert directory

## Protocols

See `.claude/core/protocols.md` for:
- Progress File Protocol
- Documentation Protocol
- Expert Invocation Protocol
- Response Format Protocol
- Error Handling Protocol
- Handoff Protocol

## Migration from v2

**Removed:**
- ❌ `vg-*` agents (project-specific)
- ❌ `message-bus.js` (didn't work in Claude Code)
- ❌ `base-agent.js` (Node.js classes not invocable)
- ❌ `state-manager.js` (replaced with progress.json)
- ❌ `orchestrator.js` (replaced with AGENT.md prompt)

**Added:**
- ✅ 12 technology experts
- ✅ Documentation protocol (WebFetch/WebSearch)
- ✅ Progress file for state
- ✅ Core protocols document

---

**Version:** 3.0.0
**Philosophy:** Technology experts + project context from files + documentation lookup
**Status:** Production ready
