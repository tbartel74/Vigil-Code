# Vigil-Code: Technology Expert Agent System v3.1

**A practical technology expert agent framework for Claude Code. Build specialized AI assistants with domain knowledge, documentation access, and state recovery protocols.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Claude Code](https://img.shields.io/badge/Claude-Code-blue.svg)](https://claude.ai/code)
[![Experts: 17](https://img.shields.io/badge/Experts-17-green.svg)](#technology-experts-17)
[![Version: 3.1](https://img.shields.io/badge/Version-3.1-brightgreen.svg)]()

> **Documentation available in:** [Polski (Polish)](docs/README.pl.md)

---

## Table of Contents

1. [What It Is and Why Use It](#what-it-is-and-why-use-it)
2. [Quick Start](#quick-start)
3. [System Architecture](#system-architecture)
4. [How Expert Routing Works](#how-expert-routing-works)
5. [OODA Protocol](#ooda-protocol)
6. [Expert Anatomy](#expert-anatomy)
7. [Creating Your Own Expert](#creating-your-own-expert)
8. [Slash Commands](#slash-commands)
9. [Skills (Domain Context)](#skills-domain-context)
10. [Workflow State and Checkpoints](#workflow-state-and-checkpoints)
11. [Error Handling](#error-handling)
12. [Token Optimization](#token-optimization)
13. [Adapting to Your Project](#adapting-to-your-project)
14. [Usage Examples](#usage-examples)
15. [Troubleshooting](#troubleshooting)

---

## What It Is and Why Use It

### The Problem

Claude Code is a powerful tool, but:
- It doesn't know technology specifics (n8n, Presidio, ClickHouse)
- It doesn't remember context between sessions
- It lacks structure for complex, multi-step tasks
- It may guess instead of checking documentation

### The Solution

Vigil-Code introduces a system of **technology experts** - specialized agents with:

1. **Domain Knowledge** - each expert knows their technology (React, Docker, Vitest...)
2. **Documentation Access** - 3-tier knowledge model (memory → docs → community)
3. **Decision Protocol** - OODA loop ensures deliberate actions
4. **Workflow State** - `progress.json` tracks multi-step task progress
5. **Error Recovery** - checkpoints enable rollback to previous states

### Philosophy

```
OLD MODEL: Agent knows project specifics (hardcoded knowledge)
NEW MODEL: Agent is a technology expert + reads project context from files
```

**Benefits:**
- **Reusability** - same experts work across any project
- **Maintainability** - update technology knowledge, not project-specific code
- **Specialization** - each expert is deeply specialized
- **Scalability** - add new experts in minutes

---

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/tbartel74/vigil-code.git
cd vigil-code

# Copy to your project
cp -r .claude /path/to/your/project/

# Optional: copy CLAUDE.md as an example of project instructions
cp CLAUDE.md /path/to/your/project/
```

### Post-Installation Structure

```
your-project/
├── .claude/
│   ├── agents/           # 16 technology experts
│   ├── commands/         # 23 slash commands
│   ├── skills/           # 18 domain contexts
│   ├── core/             # Protocols and schemas
│   │   ├── protocols.md  # OODA, checkpoints, errors
│   │   └── tool-schema.md # Tool categories
│   ├── state/            # Runtime state (gitignore)
│   └── README.md         # System documentation
├── CLAUDE.md             # Your project instructions
└── [rest of project]
```

### First Use

```
/expert How do I create a custom recognizer in Presidio?
```

Claude Code:
1. Parses the query
2. Matches triggers → `presidio-expert`
3. Loads knowledge from `.claude/agents/presidio-expert/AGENT.md`
4. Responds with documentation reference

---

## System Architecture

```
                         TECHNOLOGY EXPERTS
                    (each with its own AGENT.md)

    +-----------+  +-----------+  +-----------+  +-----------+
    | n8n       |  | React     |  | Express   |  | Docker    |
    | (sonnet)  |  | (sonnet)  |  | (sonnet)  |  | (sonnet)  |
    +-----+-----+  +-----+-----+  +-----+-----+  +-----+-----+
          |              |              |              |
          +--------------+--------------+--------------+
                                |
                                v
                  +---------------------------+
                  |    Orchestrator (opus)    |
                  |   - routes tasks          |
                  |   - plans workflows       |
                  |   - coordinates experts   |
                  +---------------------------+
                                |
                                v
                  +---------------------------+
                  |     Project Context       |
                  |  - CLAUDE.md (instructions)|
                  |  - progress.json (state)  |
                  |  - protocols.md           |
                  +---------------------------+
```

### Components

| Component | Location | Description |
|-----------|----------|-------------|
| **Agents** | `.claude/agents/*/AGENT.md` | Experts with technology knowledge |
| **Commands** | `.claude/commands/*.md` | Slash commands (`/expert`, `/vg`) |
| **Skills** | `.claude/skills/*/SKILL.md` | Project-specific domain context |
| **Protocols** | `.claude/core/protocols.md` | OODA, checkpoints, error handling |
| **Tool Schema** | `.claude/core/tool-schema.md` | Tool categories (Core/Extended/Deferred) |
| **State** | `.claude/state/progress.json` | Current workflow state |

---

## Technology Experts (17)

Each expert is a `.claude/agents/[name]/AGENT.md` file with YAML frontmatter + Markdown content.

| Expert | Model | Primary Triggers | Specialization |
|--------|-------|------------------|----------------|
| `orchestrator` | **opus** | multi-step, coordinate | Routing, planning, coordination |
| `n8n-expert` | sonnet | n8n, workflow, Code node | Workflows, webhooks, automation |
| `react-expert` | sonnet | react, component, hook | Components, state, hooks |
| `express-expert` | sonnet | express, API, middleware | REST APIs, auth, routing |
| `vitest-expert` | sonnet | test, vitest, TDD | Testing, fixtures, mocking |
| `clickhouse-expert` | sonnet | clickhouse, analytics, SQL | Analytics DB, schema |
| `docker-expert` | sonnet | docker, container, compose | Containers, networking |
| `presidio-expert` | sonnet | presidio, PII, entity | PII detection, NLP |
| `security-expert` | sonnet | security, OWASP, auth | Vulnerabilities, audits |
| `git-expert` | sonnet | git, commit, branch | Version control, PRs |
| `python-expert` | sonnet | python, flask, fastapi | Python APIs |
| `tailwind-expert` | sonnet | tailwind, CSS, styling | Utility CSS, responsive |
| `kubernetes-expert` | sonnet | kubernetes, k8s, kubectl, pod | Cluster ops, deployments, RBAC |
| `helm-expert` | sonnet | helm, chart, values.yaml | Charts, releases, templating |
| `nats-expert` | sonnet | nats, jetstream, stream | Messaging, queues, pub/sub |
| `redis-expert` | sonnet | redis, cache, rate limit | Caching, sessions, rate limiting |
| `code-audit-expert` | **opus** | audit, code quality, review | Code auditing, quality assessment |

---

## Code Audit System

Run comprehensive code audits using the `/audit-code` command:

```bash
/audit-code                      # Full audit (10 categories)
/audit-code --quick              # Security + Tests + Tech Debt only
/audit-code --category=security  # Single category deep-dive
```

### 10 Audit Categories

| Category | Points | Focus |
|----------|--------|-------|
| Structure | 10 | Architecture, module design |
| Readability | 10 | Code quality, naming, style |
| Testability | 10 | Coverage, test quality |
| CI/CD | 5 | Pipelines, automation |
| Security | 10 | OWASP, vulnerabilities |
| Observability | 5 | Logging, monitoring |
| Tech Debt | 10 | TODOs, code smells |
| Documentation | 5 | API docs, README |
| Performance | 5 | Queries, caching |
| DDD | 5 | Domain modeling |

### Rating System

- 🟢 **OK** - Meets professional standards
- 🟡 **NEEDS_IMPROVEMENT** - Fix this sprint
- 🔴 **CRITICAL** - Immediate action required

### Output Files

- `.claude/state/audit-report.json` - Machine-readable report
- `docs/AUDIT_SUMMARY.md` - Human-readable summary

### Philosophy: 5-10 Leverage Points, Not 200 Issues

The audit system focuses on identifying **high-leverage improvement opportunities** rather than overwhelming you with hundreds of minor issues. Each audit produces a prioritized list of 5-10 actionable recommendations sorted by Impact × Effort.

---

## How Expert Routing Works

### Step 1: Parse the Query

```
User: /expert Add health check to Express API
```

### Step 2: Match Triggers

Each expert has triggers defined in YAML frontmatter:

```yaml
# .claude/agents/express-expert/AGENT.md
triggers:
  primary:    # +10 points per match
    - "express"
    - "api"
    - "middleware"
  secondary:  # +5 points per match
    - "endpoint"
    - "route"
    - "backend"
```

**Scoring:**
- "Express" → +10 (primary)
- "API" → +10 (primary)
- **Total: 20 points → express-expert**

### Step 3: Choose Strategy

| Strategy | When | Token Budget |
|----------|------|--------------|
| **single** | One expert is sufficient | 10K |
| **sequential** | Experts depend on previous results | 25K |
| **parallel** | Experts can work independently | 30K |

### Step 4: Invoke Expert

```javascript
Task(
  prompt: `You are express-expert, a world-class Express.js expert.

           Read .claude/agents/express-expert/AGENT.md for knowledge base.
           Read .claude/state/progress.json for workflow context.

           Execute: Add health check endpoint

           Follow OODA:
           1. OBSERVE: Examine existing routes
           2. ORIENT: Consider approaches
           3. DECIDE: Choose action with justification
           4. ACT: Execute and update progress.json`,
  subagent_type: "general-purpose",
  model: "sonnet"
)
```

### Force a Specific Expert

Use square brackets:

```
/expert [docker] Why is port 5678 not accessible?
/expert [security] Review this authentication flow
```

---

## OODA Protocol

Each expert follows the OODA loop before every action:

### OBSERVE

```
- Read progress.json (workflow state)
- Examine relevant files
- Identify what exists vs what's missing
- Note blockers or dependencies
```

### ORIENT

```
- Consider 2+ alternative approaches
- Assess confidence level (HIGH/MEDIUM/LOW)
- Identify potential failure modes
- Select tools to use
```

### DECIDE

```
- Choose specific action with justification
- Define expected outcome
- Specify success criteria
- Plan fallback if it fails
```

### ACT

```
- Execute chosen tool
- Capture full output
- Update progress.json with OODA state
- Evaluate results
```

### Example OODA in progress.json

```json
{
  "steps": [{
    "expert": "vitest-expert",
    "ooda": {
      "observe": "No SQL injection tests in tests/. Checked rules.config.json - no SQL_INJECTION category.",
      "orient": "TDD required. Options: 1) Fixture first (recommended), 2) Pattern first (risky). Confidence: HIGH for option 1.",
      "decide": "Create fixture in tests/fixtures/malicious/sql-injection.json with UNION SELECT, OR 1=1, DROP TABLE payloads. Success: file with 5+ payloads.",
      "act": "Use Write tool to create fixture."
    }
  }]
}
```

### Confidence Levels

| Level | Description | Action |
|-------|-------------|--------|
| **HIGH** | Core knowledge, used daily | Respond directly |
| **MEDIUM** | Know concept, uncertain of details | Check docs first |
| **LOW** | Unknown or edge case | Research thoroughly |

---

## Expert Anatomy

### YAML Frontmatter Structure

```yaml
---
# === IDENTITY ===
name: express-expert
version: "3.1"
description: |
  Express.js and Node.js backend expert. Deep knowledge of REST APIs,
  middleware, authentication, routing, and security best practices.

# === MODEL CONFIGURATION ===
model: sonnet  # sonnet (fast) | opus (complex tasks)
thinking: extended  # extended | standard | minimal

# === TOOL CONFIGURATION ===
tools:
  core:      # Always loaded (~850 tokens)
    - Read
    - Edit
    - Glob
    - Grep
  extended:  # Loaded on demand (~950 tokens)
    - Write
    - Bash
  deferred:  # Loaded on discovery (~1050 tokens)
    - WebFetch
    - WebSearch

# === TOOL EXAMPLES ===
tool-examples:
  Read:
    - description: "Read Express server file"
      parameters:
        file_path: "services/backend/src/server.ts"
      expected: "Express app with routes, middleware, JWT auth"
  Grep:
    - description: "Find route definitions"
      parameters:
        pattern: "app\\.(get|post|put|delete)\\("
        path: "services/backend/"
        output_mode: "content"
      expected: "All Express route handlers"

# === ROUTING ===
triggers:
  primary:    # High confidence (+10 pts)
    - "express"
    - "api"
    - "middleware"
  secondary:  # Medium confidence (+5 pts)
    - "endpoint"
    - "route"
    - "backend"

# === OUTPUT SCHEMA ===
output-schema:
  type: object
  required: [status, findings, actions_taken, ooda]
  properties:
    status:
      enum: [success, partial, failed, blocked]
    ooda:
      type: object
---
```

### Markdown Content Structure

```markdown
# Expert Name Agent

Expert role description.

## OODA Protocol

Instructions for each OODA phase.

## Core Knowledge (Tier 1)

Fundamental knowledge - immediately available.
[code, patterns, best practices]

## Documentation Sources (Tier 2)

| Source | URL | Usage |
|--------|-----|-------|
| Official Docs | https://... | Core concepts |

### When to Fetch Documentation

- [ ] Specific parameter names
- [ ] Expression syntax

## Community Sources (Tier 3)

| Source | URL | Usage |
|--------|-----|-------|
| GitHub Issues | https://... | Known bugs |

## Common Tasks

### Task 1
```code
implementation example
```

## Response Format

[response template]

## Critical Rules

- Always validate input
- Never hardcode secrets
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
version: "3.1"
description: |
  Terraform and Infrastructure as Code expert. Deep knowledge of providers,
  resources, modules, state management, and cloud deployments.

model: sonnet
thinking: extended

tools:
  core: [Read, Edit, Glob, Grep]
  extended: [Write, Bash]
  deferred: [WebFetch, WebSearch]

tool-examples:
  Bash:
    - description: "Initialize Terraform"
      parameters:
        command: "terraform init"
      expected: "Provider plugins downloaded"
    - description: "Plan infrastructure changes"
      parameters:
        command: "terraform plan"
      expected: "Execution plan with resources to create/modify/destroy"

triggers:
  primary:
    - "terraform"
    - "tf"
    - "infrastructure"
    - "IaC"
  secondary:
    - "provider"
    - "module"
    - "state"
    - "resource"

output-schema:
  type: object
  required: [status, findings, actions_taken, ooda]
---

# Terraform Expert Agent

You are a world-class Terraform and Infrastructure as Code expert.

## Core Knowledge (Tier 1)

### Resource Definition
```hcl
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"

  tags = {
    Name = "WebServer"
  }
}
```

### Common Commands
```bash
terraform init      # Initialize working directory
terraform plan      # Preview changes
terraform apply     # Apply changes
terraform destroy   # Destroy infrastructure
```

## Documentation Sources (Tier 2)

| Source | URL |
|--------|-----|
| Terraform Docs | https://developer.hashicorp.com/terraform/docs |

## Critical Rules

- Always use remote state in production
- Never commit .tfstate files to git
- Use variables for sensitive data
```

### Step 3: Expert Auto-Registers

The system reads triggers from frontmatter and routes appropriate queries.

> **Note:** Kubernetes and Helm experts are already included in the system. See `.claude/agents/kubernetes-expert/` and `.claude/agents/helm-expert/` for full implementations.

---

## Slash Commands

Slash commands are shortcuts to common operations. Definitions in `.claude/commands/*.md`.

### Main Commands

| Command | Description | Usage |
|---------|-------------|-------|
| `/expert [task]` | Route to expert | `/expert How to use hooks in React?` |
| `/expert [name] [task]` | Force expert | `/expert [docker] Fix networking` |
| `/orchestrate [task]` | Multi-expert coordination | `/orchestrate Add feature with tests` |
| `/vg [agent] [task]` | Universal invocation | `/vg test-automation Run tests` |

### Creating Your Own Command

```bash
# .claude/commands/deploy-preview.md
```

```yaml
---
name: deploy-preview
description: Deploy preview environment for PR
---

# Deploy Preview

Deploy preview for current PR.

## Steps

1. Build Docker image from current branch
2. Deploy to preview namespace
3. Return preview URL
```

Usage:
```
/deploy-preview
```

---

## Skills (Domain Context)

Skills are extensions providing project-specific context.

### Expert vs Skill Difference

| Aspect | Expert | Skill |
|--------|--------|-------|
| Knowledge | Technology (React, Docker) | Project (Your API, Your structure) |
| Reusability | Universal | Project-specific |
| Location | `.claude/agents/` | `.claude/skills/` |
| Invocation | Automatic (triggers) | Manual (Skill tool) |

### Skill Structure

```yaml
# .claude/skills/my-api-context/SKILL.md
---
name: my-api-context
description: My project API context
version: 1.0.0
allowed-tools: [Read, Glob, Grep]
---

# My API Context

## Project Structure

src/
├── controllers/     # Request handlers
├── services/        # Business logic
├── models/          # Database models
└── middleware/      # Express middleware

## Conventions

- Controllers: `*.controller.ts`
- Services: `*.service.ts`

## How to Add an Endpoint

1. Create controller
2. Create service
3. Add route
4. Add test
```

---

## Workflow State and Checkpoints

### progress.json

Multi-step tasks track state in `.claude/state/progress.json`:

```json
{
  "schema_version": "3.1",
  "workflow_id": "wf-20251202-abc123",
  "created_at": "2025-12-02T10:00:00Z",

  "task": {
    "original_request": "Add SQL injection detection with tests",
    "summary": "TDD workflow: test → pattern → verify",
    "complexity": "medium"
  },

  "planning": {
    "strategy": "sequential",
    "thinking": "TDD required. Test first, then implementation.",
    "risks": ["Pattern may cause false positives"]
  },

  "classification": {
    "primary_expert": "vitest-expert",
    "supporting_experts": ["n8n-expert"],
    "execution_order": ["vitest-expert", "n8n-expert", "vitest-expert"]
  },

  "token_budget": {
    "allocated": 25000,
    "used": 8500,
    "remaining": 16500
  },

  "status": "in_progress",
  "current_step": 2,
  "total_steps": 3,

  "steps": [
    {
      "id": 1,
      "expert": "vitest-expert",
      "action": "create_fixture",
      "status": "completed",
      "ooda": {
        "observe": "No SQL injection tests",
        "orient": "TDD: fixture first",
        "decide": "Create fixture with 5 payloads. Confidence: HIGH",
        "act": "Write fixture"
      },
      "artifacts": ["tests/fixtures/sql-injection.json"]
    }
  ],

  "checkpoints": [
    {
      "id": "cp-001",
      "step_id": 1,
      "type": "step_complete",
      "files_modified": ["tests/fixtures/sql-injection.json"],
      "restorable": true,
      "restore_command": "git checkout abc123 -- tests/fixtures/sql-injection.json"
    }
  ],

  "clean_state": {
    "all_tests_pass": false,
    "ready_to_merge": false
  }
}
```

### Recovery

```bash
# Restore file from checkpoint
git checkout abc123 -- path/to/file.ts

# Full rollback
git reset --hard abc123
```

---

## Error Handling

### Error Taxonomy (19 codes)

#### Recoverable (E0xx) - Retry with backoff

| Code | Error | Strategy |
|------|-------|----------|
| E001 | Network timeout | Exponential backoff (5s, 15s, 45s) |
| E002 | Rate limit | Wait + retry |
| E003 | File lock | Wait 5s, retry |

#### Soft Errors (E1xx) - Alternative approach

| Code | Error | Alternative |
|------|-------|-------------|
| E101 | File not found | Search with Glob |
| E102 | Pattern not found | Expand search |
| E103 | WebFetch 404 | Try WebSearch |

#### Hard Errors (E2xx) - Escalate to user

| Code | Error | Action |
|------|-------|--------|
| E201 | Permission denied | Halt + report |
| E202 | Out of tokens | Save state, stop |
| E203 | Conflicting edits | Require resolution |

#### Validation Errors (E3xx) - Fix and retry

| Code | Error | Action |
|------|-------|--------|
| E301 | Test failure | Analyze + fix |
| E302 | Lint failure | Auto-fix |
| E303 | Type error | Fix types |

---

## Token Optimization

### Tool Categories

| Category | Tools | Tokens | Loading |
|----------|-------|--------|---------|
| **Core** | Read, Edit, Glob, Grep | ~850 | Always |
| **Extended** | Write, Bash, Task | ~950 | On demand |
| **Deferred** | WebFetch, WebSearch | ~1050 | Discovery |

### Savings

| Scenario | Traditional | v3.1 | Savings |
|----------|-------------|------|---------|
| Simple edit | 2850 | 850 | **70%** |
| Code + test | 2850 | 1800 | **37%** |

### Batch Operations

```bash
# BAD: 10 Read calls (~5000 tokens)

# GOOD: 1 Bash call (~800 tokens)
for f in $(find src -name "*.ts" | head -10); do
  echo "=== $f ==="
  grep -n "pattern" "$f" | head -5
done
```

---

## Adapting to Your Project

### Step 1: Copy .claude

```bash
cp -r vigil-code/.claude /your/project/
```

### Step 2: Remove Unneeded Experts

```bash
# If you don't use n8n
rm -rf .claude/agents/n8n-expert
```

### Step 3: Add Your Own Experts

For technologies specific to your project.

### Step 4: Customize Skills

```bash
# Remove Vigil Guard skills
rm -rf .claude/skills/vg-*

# Add your own
mkdir .claude/skills/my-project-context
```

### Step 5: Create CLAUDE.md

```markdown
# CLAUDE.md

Instructions for Claude Code in this project.

## Project Structure
[describe your structure]

## Conventions
[describe code conventions]

## Important Files
[list key files]
```

### Step 6: Update .gitignore

```gitignore
# Agent state (runtime)
.claude/state/
.claude/settings.local.json
```

---

## Usage Examples

### Technology Question

```
/expert How to use useCallback in React?

react-expert (model: sonnet)
useCallback memoizes a callback function...
Source: https://react.dev/reference/react/useCallback
```

### TDD Implementation

```
/expert Add email validation with tests

Task: Add email validation with tests
Strategy: sequential

Step 1/3: vitest-expert
   - Action: create_test
   - Completed (1.5s)

Step 2/3: express-expert
   - Action: create_middleware
   - Completed (1.2s)

Step 3/3: vitest-expert
   - Action: run_tests
   - Result: 5 passed

Task Completed in 4.7s
Clean State: Tests passing
```

### Parallel Execution

```
/expert Create API endpoint and React component

Strategy: parallel

express-expert (sonnet) -> Completed
react-expert (sonnet) -> Completed

Artifacts:
   - src/routes/users.ts
   - src/components/UserList.tsx
```

### Debug with Documentation

```
/expert [docker] Container can't connect to database

docker-expert (model: sonnet)

OBSERVE: Checking docker-compose.yml

ORIENT: Possible causes:
1. Containers in different networks
2. Wrong hostname

Fetching docs... (docker networking)
Source: https://docs.docker.com/network/

Solution:
Use service name as hostname, not localhost.

Status: success
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Wrong expert selected | Use `[expert-name]` in brackets |
| Expert doesn't know project | Update CLAUDE.md |
| Workflow hangs | Check `.claude/state/progress.json` |
| Expert gives outdated info | Ask to "verify in documentation" |
| Too slow | Use specific expert instead of orchestrator |
| Token limit | Use batch operations |

### Debug Workflow

```bash
# Check workflow state
cat .claude/state/progress.json | jq '.status, .current_step'

# Check errors
cat .claude/state/progress.json | jq '.errors'
```

### Reset Workflow

```bash
rm .claude/state/progress.json
```

---

## Reference Files

| File | Description |
|------|-------------|
| [.claude/README.md](.claude/README.md) | Agent system documentation |
| [.claude/core/protocols.md](.claude/core/protocols.md) | All 13 protocols |
| [.claude/core/tool-schema.md](.claude/core/tool-schema.md) | Tool categories |

---

## License

MIT License - See [LICENSE](LICENSE) file.

Copyright (c) 2025 Tomasz Bartel

---

**Status:** Production Ready
**Version:** 3.1.0
**Last Updated:** 2025-12-02
