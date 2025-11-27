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

## What's New in v3.0

### YAML Frontmatter

Each expert now has structured metadata:

```yaml
---
name: n8n-expert
description: |
  n8n workflow automation expert. Deep knowledge of workflow structure,
  node types, Code node syntax, webhooks, and automation patterns.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - WebFetch
  - WebSearch
model: sonnet
triggers:
  - "n8n"
  - "workflow"
  - "Code node"
  - "webhook"
---
```

### Model Selection

| Expert | Model | Rationale |
|--------|-------|-----------|
| orchestrator | **opus** | Complex coordination, planning |
| All others | **sonnet** | Fast, specialized tasks |

### Parallel Expert Invocation

Independent experts can run simultaneously:

```
⚡ Executing in parallel...

🔧 express-expert (model: sonnet)
   └─ ✅ Completed

⚛️  react-expert (model: sonnet)
   └─ ✅ Completed
```

### Extended Thinking / Planning

Multi-expert workflows start with planning phase:

```
🧠 Planning Phase

📋 Task Analysis:
   Sequential TDD workflow needed. Test first, then pattern, then verify.

🎯 Strategy: sequential because test depends on pattern

⚠️  Risks Identified:
   • Pattern might cause false positives

▶️  Proceeding with execution...
```

### Clean State Requirement

Workflows must end in clean state (tests pass, ready to merge):

```json
{
  "clean_state": {
    "all_tests_pass": true,
    "ready_to_merge": true,
    "pending_issues": []
  }
}
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    TECHNOLOGY EXPERTS                           │
│                                                                 │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐  │
│  │ n8n        │ │ React      │ │ Express    │ │ Docker     │  │
│  │ (sonnet)   │ │ (sonnet)   │ │ (sonnet)   │ │ (sonnet)   │  │
│  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘  │
│        │              │              │              │          │
│        └──────────────┴──────────────┴──────────────┘          │
│                              │                                  │
│                              ▼                                  │
│              ┌───────────────────────────────┐                 │
│              │      Orchestrator (opus)      │                 │
│              │  routes + plans + coordinates │                 │
│              └───────────────────────────────┘                 │
│                              │                                  │
│                              ▼                                  │
│              ┌───────────────────────────────┐                 │
│              │     Project Context           │                 │
│              │  - CLAUDE.md                  │                 │
│              │  - progress.json v3.0         │                 │
│              │  - Project files              │                 │
│              └───────────────────────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

## Available Experts (12)

| Expert | Model | Triggers | Specialization |
|--------|-------|----------|----------------|
| `orchestrator` | opus | multi-step, coordinate | Task routing, workflow management |
| `n8n-expert` | sonnet | n8n, workflow, webhook | Workflows, nodes, automation |
| `react-expert` | sonnet | react, component, hook | Components, hooks, state |
| `express-expert` | sonnet | express, api, endpoint | REST APIs, middleware, auth |
| `vitest-expert` | sonnet | test, vitest, TDD | Testing, fixtures, mocking |
| `clickhouse-expert` | sonnet | clickhouse, SQL, analytics | Analytics SQL, schema |
| `docker-expert` | sonnet | docker, container, compose | Containers, networking |
| `presidio-expert` | sonnet | presidio, PII, entity | PII detection, NLP |
| `security-expert` | sonnet | security, OWASP, XSS | Auth, vulnerabilities |
| `git-expert` | sonnet | git, commit, branch | Version control, PRs |
| `python-expert` | sonnet | python, flask, fastapi | Flask, data processing |
| `tailwind-expert` | sonnet | tailwind, CSS, styling | Utility CSS, responsive |

## How It Works

### 1. Intelligent Routing

The `/expert` command analyzes task description and matches against expert triggers:

```
/expert Add health check to Express API
→ Detects: "API", "Express" → Routes to express-expert (sonnet)
```

### 2. Progress File v3.0

Multi-step tasks use enhanced `.claude/state/progress.json`:

```json
{
  "version": "3.0",
  "workflow_id": "wf-20251127-abc123",
  "planning": {
    "thinking": "TDD workflow: test → implement → verify",
    "strategy_rationale": "Test-first ensures pattern works",
    "risks": ["False positives possible"]
  },
  "steps": [
    {
      "expert": "vitest-expert",
      "model": "sonnet",
      "action": "create_fixture",
      "status": "completed",
      "duration_ms": 1200,
      "artifacts": ["tests/fixtures/sql.json"]
    }
  ],
  "clean_state": {
    "all_tests_pass": true,
    "ready_to_merge": true
  }
}
```

### 3. Expert Invocation with Model

```javascript
Task(
  prompt: "You are n8n-expert. Read AGENT.md for knowledge, progress.json for context.
           Execute: add_pattern. Update progress when done.",
  subagent_type: "general-purpose",
  model: "sonnet"  // From frontmatter
)
```

### 4. 3-Tier Knowledge Model

**Tier 1: Core Knowledge** (instant)
- Fundamentals, best practices, common patterns
- 80% of tasks

**Tier 2: Official Documentation** (WebFetch)
- API references, configuration options
- When uncertain about details

**Tier 3: Community Knowledge** (WebSearch)
- Edge cases, workarounds, known issues
- Unusual problems

## Directory Structure

```
.claude/
├── agents/
│   ├── orchestrator/      # Task routing (opus)
│   │   └── AGENT.md       # With YAML frontmatter
│   ├── n8n-expert/        # n8n automation (sonnet)
│   │   └── AGENT.md
│   ├── react-expert/      # React development (sonnet)
│   │   └── AGENT.md
│   ├── [9 more experts...]
├── core/
│   └── protocols.md       # Shared protocols v3.0
├── state/
│   └── progress.json      # Current workflow state
├── commands/
│   └── expert.md          # /expert command
└── skills/                # Legacy skills
```

## Usage Examples

### Single Expert with Model

```
/expert How do I use $input.all() in n8n Code node?

🤖 Invoking: n8n-expert (model: sonnet)
🔍 Fetching docs... (verifying Code node syntax)
✅ Confirmed: $input.all() returns array of items
📚 Source: https://docs.n8n.io/code/
```

### Multi-Expert Sequential

```
/expert Add SQL injection detection with tests

🧠 Planning: TDD workflow (test → implement → verify)

🎯 Task: Add SQL injection detection with tests

📋 Classification:
   • Primary: vitest-expert
   • Supporting: n8n-expert
   • Strategy: sequential

🧪 Step 1/3: vitest-expert (model: sonnet)
   ├─ ▶️  Action: create_fixture
   └─ ✅ Completed (1.2s)

⚙️  Step 2/3: n8n-expert (model: sonnet)
   ├─ ▶️  Action: add_pattern
   └─ ✅ Completed (0.8s)

🧪 Step 3/3: vitest-expert (model: sonnet)
   ├─ ▶️  Action: run_tests
   └─ ✅ Completed (2.1s)

════════════════════════════════════════════════════════════
✨ Task Completed in 4.1s

✅ Clean State: Tests passing, ready to merge
════════════════════════════════════════════════════════════
```

### Multi-Expert Parallel

```
/expert Create API endpoint with React component

🎯 Task: Create API endpoint with React component

📋 Classification:
   • Experts: express-expert, react-expert
   • Strategy: parallel (independent work)

⚡ Executing in parallel...

🔧 express-expert (model: sonnet) → ✅
⚛️  react-expert (model: sonnet) → ✅

✨ Task Completed
```

## Effective Usage Guide

### Best Practices

#### 1. Use Trigger Keywords for Better Routing

Include technology-specific keywords in your request:

```
❌ "Fix the bug in my code"
✅ "Fix the React component rendering bug"
✅ "Fix the n8n workflow connection error"
```

#### 2. Direct Expert Selection with Brackets

When you know which expert you need:

```
/expert [docker] Why is port 5678 not accessible?
/expert [security] Review this authentication flow
/expert [clickhouse] Optimize this slow query
```

#### 3. Combine Technologies for Multi-Expert

Mention multiple technologies to trigger coordination:

```
/expert Add REST endpoint with React form and tests
→ Detects: REST, React, tests
→ Routes to: express-expert + react-expert + vitest-expert
```

### Common Scenarios

#### Scenario 1: Quick Question (Single Expert)

```
User: /expert How do I mock fetch in Vitest?

🤖 vitest-expert (sonnet):
   Use vi.stubGlobal('fetch', vi.fn()...)
   📚 Source: vitest.dev/guide/mocking
```

#### Scenario 2: Implementation Task (Single Expert)

```
User: /expert Add pagination to the users API endpoint

🤖 express-expert (sonnet):
   ├─ 📝 Analyzing existing routes...
   ├─ 📝 Adding page/limit query params...
   └─ ✅ Created: routes/users.js (modified)
```

#### Scenario 3: TDD Workflow (Sequential Multi-Expert)

```
User: /expert Add XSS detection pattern with tests

🧠 Planning: TDD workflow required
   1. vitest-expert: Create failing test
   2. n8n-expert: Add detection pattern
   3. vitest-expert: Verify tests pass

🧪 Step 1: vitest-expert creates fixture
⚙️  Step 2: n8n-expert adds pattern
🧪 Step 3: vitest-expert runs tests

✅ Clean State: All tests passing
```

#### Scenario 4: Independent Work (Parallel Multi-Expert)

```
User: /expert Create dashboard with backend API and styling

⚡ Parallel execution:
   • express-expert → /api/dashboard endpoint
   • react-expert → Dashboard.tsx component
   • tailwind-expert → Responsive grid layout

✨ All 3 experts completed in parallel
```

#### Scenario 5: Documentation Lookup

```
User: /expert What's the correct syntax for ClickHouse TTL?

🤖 clickhouse-expert (sonnet):
   🔍 Fetching docs... (TTL syntax varies by version)
   ✅ Confirmed: ALTER TABLE ... MODIFY TTL timestamp + INTERVAL 90 DAY
   📚 Source: clickhouse.com/docs/en/sql-reference/statements/alter/ttl
```

#### Scenario 6: Security Audit

```
User: /expert Review this login endpoint for vulnerabilities

🤖 security-expert (sonnet):
   ├─ 📝 Checking OWASP Top 10...
   ├─ ⚠️  Found: No rate limiting
   ├─ ⚠️  Found: Password in error message
   └─ 📋 Recommendations provided
```

### When to Use vs Skip Experts

| Task | Use Expert? | Why |
|------|-------------|-----|
| "How to use React hooks?" | ✅ Yes | Technology question |
| "Add feature with tests" | ✅ Yes | Multi-step workflow |
| "Fix typo in README" | ❌ No | Simple edit |
| "What files are in src/?" | ❌ No | Use Explore agent |
| "Run npm test" | ❌ No | Direct Bash |
| "Security audit" | ✅ Yes | Specialized knowledge |
| "Optimize Docker build" | ✅ Yes | Expert optimization |

### Pro Tips

#### Tip 1: Chain Commands for Complex Workflows

```
# First, get expert advice
/expert [n8n] What's the best pattern for error handling?

# Then implement
/expert Add error handling to the detection workflow

# Finally, verify
/expert [vitest] Run tests and check coverage
```

#### Tip 2: Use Context Files

Experts read `CLAUDE.md` and `progress.json`. Keep them updated:

```
# CLAUDE.md - Project conventions experts will follow
# progress.json - State for multi-step workflows
```

#### Tip 3: Request Documentation Sources

When you need verified info:

```
/expert [presidio] How to add Polish PESEL recognizer? Include docs.

→ Expert will cite: microsoft.github.io/presidio/...
```

#### Tip 4: Parallel for Speed

For independent tasks, be explicit:

```
/expert Create user model, API endpoint, and React form (can be parallel)

→ Orchestrator detects "parallel" keyword
→ Runs 3 experts simultaneously
```

#### Tip 5: TDD Keywords

For test-first development:

```
/expert Add input validation with TDD
/expert Create feature using test-driven approach
/expert Write tests first, then implement login

→ Forces: test → implement → verify sequence
```

### Troubleshooting

| Problem | Solution |
|---------|----------|
| Wrong expert selected | Use `[expert-name]` bracket syntax |
| Expert doesn't know project structure | Check CLAUDE.md is up to date |
| Multi-step workflow fails midway | Check `.claude/state/progress.json` |
| Expert gives outdated info | Ask to "verify in documentation" |
| Too slow | Use specific expert instead of routing |

## Key Differences: v2 → v3

| Aspect | v2 (vg-* agents) | v3 (technology experts) |
|--------|------------------|------------------------|
| Knowledge | Project-specific | Technology-focused |
| Metadata | None | YAML frontmatter |
| Model | Single model | Per-expert (opus/sonnet) |
| Routing | Manual | Trigger-based automatic |
| Execution | Sequential only | Sequential + Parallel |
| Planning | None | Extended thinking |
| State | Basic progress | Full v3.0 schema |
| Clean check | None | Ready-to-merge validation |
| Documentation | Static | Dynamic (WebFetch) |

## Adding New Expert

1. Create directory: `.claude/agents/{tech}-expert/`

2. Create `AGENT.md` with frontmatter:

```yaml
---
name: new-expert
description: |
  Brief description of expertise.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - WebFetch
  - WebSearch
model: sonnet
triggers:
  - "keyword1"
  - "keyword2"
---
```

3. Add sections:
   - **Core Knowledge (Tier 1)**: Fundamentals
   - **Documentation Sources (Tier 2)**: Official docs URLs
   - **Community Sources (Tier 3)**: GitHub, forums
   - **Uncertainty Protocol**: When to fetch docs
   - **Common Tasks**: Templates
   - **Response Format**: Standard output
   - **Critical Rules**: Do's and Don'ts

4. Expert auto-registers via frontmatter triggers

## Protocols Reference

See `.claude/core/protocols.md` for:

1. **Progress File Protocol** (v3.0 schema)
2. **Extended Thinking Protocol** (planning)
3. **Documentation Protocol** (3-tier)
4. **Expert Invocation Protocol** (with model)
5. **Response Format Protocol** (emoji)
6. **Error Handling Protocol**
7. **Handoff Protocol**
8. **Clean State Protocol**
9. **YAML Frontmatter Protocol**

---

**Version:** 3.0.0
**Status:** Production ready
**Philosophy:** Technology experts + YAML frontmatter + model selection + parallel execution
