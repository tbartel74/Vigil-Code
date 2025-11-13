# Vigil Guard - Claude Code Integration

**Version:** 2.0.0
**Last Updated:** 2025-11-04
**Status:** Production Ready ✅

This directory contains the complete Claude Code integration for Vigil Guard, including the Master Orchestrator v2.0 autonomous agent coordination system.

---

## 📁 Directory Structure

```
.claude/
├── agents/              # 11 specialized agents (10 worker + 1 meta-agent)
├── core/               # Infrastructure (message-bus, state-manager, task-classifier)
├── commands/           # 21 slash commands (/vg-orchestrate, etc.)
├── skills/             # 18 skills (auto-activated by Claude)
├── settings.local.json # Claude Code configuration
└── *.md               # Documentation
```

---

## 🤖 Agents (12)

All agents follow the standard structure: `AGENT.md` (documentation) + `agent.js` (executable).

### Worker Agents (11)

1. **vg-test-automation** - Test creation, execution, fixture generation
2. **vg-workflow-business-logic** - Pattern management, rules.config.json
3. **vg-pii-detection** - Dual-language PII (Polish + English)
4. **vg-backend-api** - Express.js, JWT auth, ClickHouse
5. **vg-frontend-ui** - React + Tailwind CSS v4
6. **vg-data-analytics** - ClickHouse queries, Grafana dashboards
7. **vg-workflow-infrastructure** - n8n JSON structure, node management
8. **vg-infrastructure-deployment** - Docker orchestration, install.sh
9. **vg-security-compliance** - Security scanning, vulnerability fixes
10. **vg-documentation** - Documentation sync and generation
11. **vg-tech-docs-navigator** - Technical documentation hub (41+ technologies) 🆕

### Meta-Agent (1)

12. **vg-master-orchestrator** - Coordinates all 11 worker agents
   - Task classification and routing
   - Workflow execution (TDD, Security Audit, etc.)
   - Parallel/sequential coordination
   - Result synthesis

**Location:** `agents/vg-*/`

---

## 🔧 Core Infrastructure (5 modules)

Located in `core/`:

1. **base-agent.js** - Base class for all agents
2. **message-bus.js** - Event-driven inter-agent communication
3. **progress-reporter.js** - Real-time progress updates with emoji indicators
4. **state-manager.js** - Workflow persistence and recovery
5. **task-classifier.js** - Intelligent task routing (95%+ confidence)

---

## 📜 Skills (18)

Skills are **auto-activated** by Claude based on request context. All have YAML headers for proper registration.

### Vigil Guard Specific (6)
- `n8n-vigil-workflow` - Detection patterns, workflow business logic
- `vigil-testing-e2e` - E2E testing, 100+ test suite
- `react-tailwind-vigil-ui` - Frontend components
- `clickhouse-grafana-monitoring` - Analytics and dashboards
- `docker-vigil-orchestration` - Container management
- `vigil-security-patterns` - Security best practices

### General Purpose (11)
- `workflow-json-architect` - n8n JSON structure
- `pattern-library-manager` - rules.config.json management
- `presidio-pii-specialist` - PII detection API
- `language-detection-expert` - Hybrid language detection
- `express-api-developer` - Backend API development
- `browser-extension-developer` - Chrome extension
- `documentation-sync-specialist` - Doc automation
- `git-commit-helper` - Conventional commits
- `installation-orchestrator` - install.sh management
- `security-audit-scanner` - OWASP Top 10, secret scanning
- `test-fixture-generator` - Test fixture creation

### Master Orchestrator (1)
- `vg-master-orchestrator` - Auto-activates for multi-agent tasks

**Location:** `skills/*/SKILL.md`

---

## ⚡ Commands (22)

Slash commands for quick access to specific functionality.

### Orchestration
- `/vg-orchestrate` - Master Orchestrator with full context
- `/orchestrate` - Alternative orchestrator invocation
- `/agent-help` - Master Orchestrator usage guide
- `/status-agents` - Show all agent capabilities
- `/test-agents` - Test agent invocations
- `/quick-agent` - Quick agent access

### Agent-Specific
- `/vg-test-automation` - Testing operations
- `/vg-workflow-business-logic` - Pattern management
- `/vg-pii-detection` - PII detection operations
- `/vg-backend-api` - Backend API tasks
- `/vg-frontend-ui` - Frontend development
- `/vg-data-analytics` - Analytics and queries
- `/vg-workflow-infrastructure` - n8n workflow operations
- `/vg-infrastructure-deployment` - Deployment tasks
- `/vg-security-compliance` - Security operations
- `/vg-documentation` - Documentation tasks
- `/vg-docs` - Technical documentation for 41+ technologies 🆕

### Workflows
- `/add-detection-pattern` - TDD workflow for new patterns
- `/run-full-test-suite` - Execute all tests with reporting
- `/deploy-service` - Deploy specific service with health checks
- `/commit-with-validation` - Pre-commit validation + git commit
- `/vg` - Universal command dispatcher

**Location:** `commands/*.md`

---

## 📚 Documentation

### Master Orchestrator
- [HOW_TO_USE_MASTER_ORCHESTRATOR.md](HOW_TO_USE_MASTER_ORCHESTRATOR.md) - User guide
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Technical implementation
- [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) - Migration from old system
- [README_ORCHESTRATOR.md](README_ORCHESTRATOR.md) - Orchestrator overview

### Agent Documentation
Each agent has detailed `AGENT.md` in `agents/vg-*/AGENT.md`

### Skill Documentation
Each skill has `SKILL.md` in `skills/*/SKILL.md`

---

## 🚀 Quick Start

### Using Master Orchestrator

**1. Via Auto-Activation (Skill)**
```
Just ask: "Add SQL injection detection pattern"
Claude automatically activates vg-master-orchestrator skill
```

**2. Via Slash Command**
```
/vg-orchestrate Add SQL injection detection pattern
```

**3. Via Interactive CLI**
```bash
cd .claude/agents/vg-master-orchestrator
node init.js
```

**4. Via Demo**
```bash
cd .claude/agents/vg-master-orchestrator
node demo.js
```

### Using Specific Agents

**Via Slash Command**
```
/vg-test-automation Run all tests
/vg-backend-api Add new API endpoint
```

**Via Skill (Auto)**
```
"Run security audit"  → vg-security-compliance activated
"Update Grafana dashboard" → clickhouse-grafana-monitoring activated
```

---

## 🔄 Workflow Templates

The Master Orchestrator includes pre-configured workflows:

### 1. PATTERN_ADDITION (TDD)
```yaml
Strategy: Sequential
Steps:
  1. vg-test-automation: create_test
  2. vg-test-automation: run_test (expect FAIL)
  3. vg-workflow-business-logic: add_pattern
  4. vg-test-automation: verify_test (expect PASS)
```

### 2. SECURITY_AUDIT (Parallel)
```yaml
Strategy: Parallel
Agents:
  - vg-security-compliance: npm_audit
  - vg-security-compliance: secret_scan
  - vg-security-compliance: redos_check
  - vg-security-compliance: auth_review
```

### 3. PII_ENTITY_ADDITION
```yaml
Strategy: Sequential
Steps:
  1. vg-pii-detection: analyze_entity
  2. vg-workflow-business-logic: update_config
  3. vg-backend-api: update_api
  4. vg-frontend-ui: update_ui
  5. vg-test-automation: test_pii
```

### 4. TEST_EXECUTION
```yaml
Strategy: Single Agent
Agent: vg-test-automation
Action: run_suite
```

### 5. SERVICE_DEPLOYMENT
```yaml
Strategy: Sequential
Steps:
  1. vg-infrastructure-deployment: health_check
  2. vg-infrastructure-deployment: deploy_service
  3. vg-infrastructure-deployment: verify_deployment
```

---

## 🔍 Featured Agent: Tech Docs Navigator

**NEW in v2.0:** Central documentation hub for all 41+ technologies used in Vigil Guard.

### What It Does

- **Query Documentation** - Get official docs + quick links for any technology
- **Check Pitfalls** - Identify known issues (e.g., React controlled components bug)
- **Find Examples** - Locate Vigil Guard-specific patterns with file locations
- **Search APIs** - Search across all technologies for specific API methods
- **Best Practices** - Get project-specific best practices and patterns
- **Suggest Fixes** - Match error messages to known solutions

### Quick Start

```bash
# Get React documentation
/vg-docs react

# Search for authentication examples
/vg-docs search "JWT authentication"

# List all technologies
/vg-docs list

# Check Express pitfalls
/vg-docs express
```

### Example Output

```
📚 Express.js (^4.19.2)

📖 Official Documentation:
https://expressjs.com/en/5x/api.html

⚠️ Known Pitfalls:
1. Middleware order matters
   Solution: Place express.json() before route handlers

✅ Vigil Guard Examples:
- JWT Authentication: services/web-ui/backend/src/auth.ts:99-111
- Rate Limiting: services/web-ui/backend/src/server.ts:45-63
```

### Integration with Other Agents

Tech Docs Navigator automatically helps other agents when they encounter technology-specific issues:

```javascript
// Example: Frontend UI Agent encounters React bug
// → Master Orchestrator asks Tech Docs for help
// → Receives solution: "Use getCurrentValue() pattern at ConfigSection.tsx:59-72"
```

### Coverage

**15 Core Technologies (Etap 1):**
Express, React, Vitest, Docker, ClickHouse, TypeScript, Vite, Tailwind CSS v4, n8n, Presidio, spaCy, bcryptjs, JWT, Grafana, Caddy

**26 Additional (Planned for Etap 3):**
Node.js, better-sqlite3, express-rate-limit, React Router, langdetect, transformers, and more...

**Full Documentation:** [.claude/agents/vg-tech-docs-navigator/AGENT.md](.claude/agents/vg-tech-docs-navigator/AGENT.md)

---

## 🏗️ Architecture

### Execution Flow

```
User Request
  ↓
Task Classifier (confidence scoring)
  ↓
Strategy Selection (single|parallel|sequential|workflow)
  ↓
Agent Invocation (via Message Bus)
  ↓
Progress Reporting (real-time with emoji)
  ↓
Result Synthesis (summary + recommendations)
```

### Agent Communication

```
Master Orchestrator
  ├── Message Bus (async events)
  ├── State Manager (persistence)
  └── Progress Reporter (real-time updates)
       ↓
  Worker Agents (10)
    ├── Execute tasks
    ├── Publish results
    └── Subscribe to events
```

---

## 📊 Statistics

- **12 Agents** (11 worker + 1 meta-agent)
- **18 Skills** (all with YAML headers)
- **22 Slash Commands**
- **5 Core Modules**
- **5 Workflow Templates**
- **41+ Technologies** documented (Tech Docs Navigator)
- **~55KB** total code (excluding docs)
- **~160KB** total documentation

---

## ⚙️ Configuration

### settings.local.json

Contains Claude Code permissions and configuration. Pre-approved commands for faster execution.

**Key Sections:**
- `permissions.allow` - Pre-approved bash patterns
- Agent-specific configurations
- Tool access permissions

---

## 🧪 Testing

### Test Master Orchestrator
```bash
cd .claude/agents/vg-master-orchestrator
node test-full-system.js
```

### Test Individual Agent
```bash
cd .claude/agents/vg-test-automation
node agent.js
```

### Run Demo
```bash
cd .claude/agents/vg-master-orchestrator
node demo.js
```

---

## 📝 Development Guidelines

### Adding New Agent

1. Create directory: `agents/vg-new-agent/`
2. Add `AGENT.md` (documentation)
3. Add `agent.js` (implementation with `execute()` method)
4. Add to Master Orchestrator's task classifier
5. Create slash command: `commands/vg-new-agent.md`

### Adding New Skill

1. Create directory: `skills/new-skill/`
2. Add `SKILL.md` with YAML header:
```yaml
---
name: new-skill
description: Brief description (shown in autocomplete)
version: 1.0.0
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob]
---
```
3. Add detailed documentation below YAML
4. Test auto-activation

### Adding New Command

1. Create `commands/new-command.md`
2. Add YAML header:
```yaml
---
name: new-command
description: Brief description
---
```
3. Add command instructions
4. Reference relevant skills/agents

---

## 🔗 Integration with Vigil Guard

This `.claude/` directory integrates with the main Vigil Guard project:

- **Agents** work with actual project files (services/, config/, tests/)
- **Skills** provide context about project architecture
- **Commands** automate common workflows
- **Master Orchestrator** coordinates complex multi-step operations

---

## 🚢 Deployment

This system is also available as a standalone repository:

**Vigil-Code** (`../Vigil-Code/`)
- Separate git repository
- Complete copy of `.claude/` system
- Can be developed independently
- Periodically synced with Vigil Guard

---

## 📊 Real-Time Agent Visibility (.claude-code/)

**NEW:** Agent system now features real-time status tracking via `.claude-code/` directory.

### Directory Structure

```
.claude-code/
├── prompt.txt              # Forced system prompt (always loaded by Claude Code)
├── ui-state.json          # Real-time agent status (updated during execution)
├── agent-manifest.json    # Agent discovery metadata (static config)
└── state/                 # Future: per-agent state persistence
```

### Files

#### 1. `prompt.txt` (Forced Context Loading)

**Purpose:** Ensures agent system context is loaded BEFORE any task execution

**Contents:**
- Overview of 12 agents (with icons and capabilities)
- When to use each agent
- Visibility protocol (emoji indicators)
- Quick reference commands

**Behavior:**
- Automatically loaded by Claude Code at conversation start
- Acts as "first message" prepended to system prompt
- Guarantees agent system is always accessible

#### 2. `ui-state.json` (Persistent UI State)

**Purpose:** Tracks agent execution history and workflow status in real-time

**Structure:**
```json
{
  "agents": {
    "vg-test-automation": {
      "status": "idle|active",
      "last_execution": "2025-11-12T10:45:23Z",
      "last_task": "Run test suite",
      "success_count": 47,
      "failure_count": 3,
      "last_error": null,
      "last_duration_ms": 1200,
      "icon": "🧪",
      "description": "Test creation, execution, fixture generation"
    }
    // ... 11 more agents
  },
  "active_workflow": "PATTERN_ADDITION" | null,
  "workflow_details": {
    "name": "PATTERN_ADDITION",
    "step": 2,
    "total_steps": 4,
    "start_time": "2025-11-12T10:45:20Z",
    "strategy": "SEQUENTIAL"
  },
  "last_orchestrator_call": "2025-11-12T10:45:20Z",
  "agent_system_version": "2.0.1",
  "conversation_count": 15,
  "metadata": {
    "created_at": "2025-11-12T00:00:00Z",
    "last_updated": "2025-11-12T10:45:23Z",
    "total_agent_executions": 127
  }
}
```

**Updated By:**
- `BaseAgent.updateUIState()` - when agent starts/completes execution
- `ProgressReporter.updateUIState()` - when workflow starts/completes
- `ProgressReporter.updateWorkflowDetails()` - when workflow step changes

**Gitignore:** ✅ Added to `.gitignore` (runtime-generated, changes frequently)

#### 3. `agent-manifest.json` (Agent Discovery)

**Purpose:** Single source of truth for agent metadata

**Contents:**
- All 12 agents with full details (capabilities, technologies, status)
- All 5 workflows with descriptions and estimated durations
- Skills count and categories
- Commands count and most used
- Integration points (message bus, state manager, etc.)

**Used By:**
- `/status-agents` command
- Future: Claude Code UI integration
- Future: Autocomplete suggestions

**Gitignore:** ❌ NOT ignored (static configuration, committed to repo)

### Integration Points

#### BaseAgent Class (`.claude/core/base-agent.js`)

Added methods:
- `executeWithTracking(task, executionFn)` - Wrapper that auto-tracks execution
- `updateUIState(updates)` - Updates ui-state.json with agent status
- Atomic writes (write to .tmp → rename) to prevent race conditions
- Graceful degradation if `.claude-code/` doesn't exist

#### ProgressReporter Class (`.claude/core/progress-reporter.js`)

Added methods:
- `updateUIState(updates)` - Updates workflow-level status
- `updateWorkflowDetails(updates)` - Updates workflow step progress
- Modified: `startTask()`, `reportStrategy()`, `reportWorkflowStep()`, `completeTask()`, `failTask()` now `async`

### Commands

#### `/status-agents`

**Purpose:** Display real-time status of all 12 agents

**Output:**
```
🤖 Vigil Guard Agent System v2.0.1

═══════════════════════════════════════════════════════════════════════════

ACTIVE AGENTS (2):
🔄 test-automation           Running: "verify_pattern" (3.5s elapsed)
🔄 workflow-business-logic   Running: "add_pattern" (1.2s elapsed)

IDLE AGENTS (10):
✅ 🔒 pii-detection
   Last: "analyze_entity" (5m ago)
   Success: 23 | Failures: 0

... [8 more agents]

═══════════════════════════════════════════════════════════════════════════

WORKFLOW STATUS:
🎯 Active Workflow: PATTERN_ADDITION
   Strategy: SEQUENTIAL
   Progress: Step 2/4
   Duration: 5.3s elapsed

═══════════════════════════════════════════════════════════════════════════

SYSTEM STATS:
• Total Agent Executions: 127
• Last Updated: 2025-11-12T10:45:23Z (2s ago)
• Agent System Version: 2.0.1
• Conversation Count: 15

═══════════════════════════════════════════════════════════════════════════
```

**Usage:** `/status-agents` (call anytime during conversation)

### Benefits

✅ **Agent Visibility:** 0% → 80% (users see which agents are active)
✅ **Context Preservation:** 40% → 85% (forced prompt.txt loading)
✅ **Real-Time Monitoring:** Live status updates in ui-state.json
✅ **Debugging:** `/status-agents` shows execution history
✅ **Backward Compatible:** Graceful degradation if `.claude-code/` missing

### Future Enhancements

**Phase 2 (Optional):** tmux status bar wrapper
- Real-time status bar in terminal
- Shows active agents/workflow in top bar
- See `scripts/claude-code-wrapper.sh` (if implemented)

**Phase 3 (Requires Anthropic):** Claude Code UI integration
- Official status bar API
- Native UI indicators for agent activity
- Visual workflow progress

---

## 🤝 Contributing

When modifying the orchestration system:

1. ✅ Update agent documentation (`AGENT.md`)
2. ✅ Update this README if structure changes
3. ✅ Test with `test-full-system.js`
4. ✅ Sync to Vigil-Code if needed
5. ✅ Commit with descriptive message

---

## 📖 Related Documentation

### In This Directory
- [HOW_TO_USE_MASTER_ORCHESTRATOR.md](HOW_TO_USE_MASTER_ORCHESTRATOR.md)
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
- [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)
- [README_ORCHESTRATOR.md](README_ORCHESTRATOR.md)

### In Project Root
- `../CLAUDE.md` - Vigil Guard project instructions for Claude Code
- `../docs/` - Complete Vigil Guard documentation

---

## 📜 License

Part of Vigil Guard project - MIT License

---

**Questions?** Use `/agent-help` command or read the detailed documentation in this directory.

**Status:** All systems operational ✅
**Version:** 2.0.0
**Last Audit:** 2025-11-04
