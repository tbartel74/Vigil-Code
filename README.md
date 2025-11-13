# Vigil-Code: Autonomous Agent System for Claude Code

**A production-ready, autonomous multi-agent orchestration framework for Claude Code that enables intelligent task routing, parallel execution, and self-coordinating workflows.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Claude Code](https://img.shields.io/badge/Claude-Code-blue.svg)](https://claude.ai/code)
[![Agents: 12](https://img.shields.io/badge/Agents-12-green.svg)](#agents)
[![Skills: 18](https://img.shields.io/badge/Skills-18-orange.svg)](#skills)
[![Version: 2.0](https://img.shields.io/badge/Version-2.0-brightgreen.svg)]()

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Agents](#agents)
- [Skills](#skills)
- [Workflows](#workflows)
- [Usage Examples](#usage-examples)
- [Installation](#installation)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [License](#license)

---

## Overview

Vigil-Code is an autonomous agent system designed for Claude Code that provides:

- **12 Specialized Agents** - Domain experts for different technical areas
- **18 Knowledge Skills** - Deep expertise in specific technologies
- **22 Slash Commands** - Quick access to agent capabilities
- **5 Pre-configured Workflows** - Common multi-step task patterns
- **Real-time Progress Tracking** - Visual feedback during execution
- **Inter-agent Communication** - Agents can coordinate autonomously

### Why Vigil-Code?

When working with complex codebases, Claude Code benefits from specialized agents that:
- **Maintain Context** - Prevent token exhaustion on large projects
- **Enforce Best Practices** - TDD workflows, security patterns, code quality
- **Coordinate Tasks** - Automatically route work to the right specialist
- **Track Progress** - Real-time visibility into multi-step operations
- **Scale Workflows** - Parallel execution for independent tasks

---

## Features

### Core Capabilities

#### 1. Intelligent Task Routing
The Master Orchestrator analyzes your request and automatically:
- Classifies task type (detection, testing, security, deployment, etc.)
- Selects appropriate agents (single or multiple)
- Determines execution strategy (sequential, parallel, workflow)
- Provides confidence scoring for routing decisions

#### 2. Autonomous Agent Coordination
Agents can work together without manual coordination:
- **Message Bus** - Async inter-agent communication
- **State Management** - Workflow persistence across executions
- **Error Recovery** - Automatic retry with fallback strategies
- **Result Synthesis** - Combine outputs from multiple agents

#### 3. Pre-configured Workflows
Common patterns implemented as reusable workflows:
- **PATTERN_ADDITION** - TDD approach (test → implement → verify)
- **PII_ENTITY_ADDITION** - Add PII detection entity types
- **SECURITY_AUDIT** - Parallel security scanning
- **TEST_EXECUTION** - Run and analyze test suites
- **SERVICE_DEPLOYMENT** - Build → deploy → health check

#### 4. Real-time Progress Reporting
Visual feedback during execution using emoji indicators:
```
🎯 Task: Add SQL injection detection
🎭 Strategy: WORKFLOW (PATTERN_ADDITION)

🧪 Step 1/4: Invoking agent: vg-test-automation
   ▶️  Action: create_test
   📝 Creating fixture for SQL injection...
   ✅ Completed (1.2s)

⚙️  Step 2/4: Invoking agent: vg-workflow-business-logic
   ▶️  Action: add_pattern
   ✅ Completed (0.8s)

✨ Workflow Completed in 2.3s
```

---

## Quick Start

### Prerequisites
- Claude Code installed and configured
- Node.js 18+ (for orchestrator CLI)
- Git (for cloning repository)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/vigil-code.git
   cd vigil-code
   ```

2. **Test the system:**
   ```bash
   cd .claude/agents/vg-master-orchestrator
   node init.js
   ```

   You should see:
   ```
   ✅ All 10 agents loaded successfully
   ✅ State Manager initialized
   ✅ Message Bus ready
   ```

3. **Use in your project:**
   ```bash
   # Copy .claude directory to your project
   cp -r .claude /path/to/your/project/

   # Copy CLAUDE.md project instructions
   cp CLAUDE.md /path/to/your/project/
   ```

### First Task

In Claude Code, use a slash command:
```
/vg-orchestrate Add SQL injection detection pattern
```

The orchestrator will automatically:
1. Classify the task (detection pattern addition)
2. Activate PATTERN_ADDITION workflow
3. Coordinate test-automation and workflow-business-logic agents
4. Report progress in real-time
5. Synthesize results

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────┐
│                  Master Orchestrator                     │
│  (Intelligent Routing & Workflow Coordination)          │
└────────┬──────────────────────────────────────┬─────────┘
         │                                       │
    ┌────▼────┐                            ┌────▼────┐
    │  Task   │                            │ Workflow│
    │Classifier│                           │Executor │
    └────┬────┘                            └────┬────┘
         │                                      │
         ├──────────────────┬───────────────────┤
         │                  │                   │
    ┌────▼────┐        ┌────▼────┐        ┌────▼────┐
    │ Agent 1 │        │ Agent 2 │   ...  │ Agent N │
    │(Domain) │        │(Domain) │        │(Domain) │
    └─────────┘        └─────────┘        └─────────┘
         │                  │                   │
         └──────────────────┴───────────────────┘
                         │
                    ┌────▼────┐
                    │Message  │
                    │  Bus    │
                    └────┬────┘
                         │
                    ┌────▼────┐
                    │ State   │
                    │Manager  │
                    └─────────┘
```

### Core Components

| Component | Purpose | Location |
|-----------|---------|----------|
| **Master Orchestrator** | Receives tasks, routes to agents, synthesizes results | `.claude/agents/vg-master-orchestrator/` |
| **Task Classifier** | Pattern matching, confidence scoring, agent selection | `.claude/core/task-classifier.js` |
| **Workflow Executor** | Executes workflows, manages dependencies, error handling | `.claude/agents/vg-master-orchestrator/workflow-executor.js` |
| **Message Bus** | Inter-agent communication, event routing | `.claude/core/message-bus.js` |
| **State Manager** | Workflow persistence, execution history | `.claude/core/state-manager.js` |
| **Progress Reporter** | Real-time progress updates with emoji indicators | `.claude/core/progress-reporter.js` |

---

## Agents

### Worker Agents (10)

Each agent is an autonomous specialist with domain expertise, action repertoire, error handling, and inter-agent communication.

#### 1. vg-workflow-business-logic
**Purpose:** Pattern management and rules configuration
**Actions:** Add pattern, update scoring, manage categories, validate syntax
**Use Cases:** Adding threat detection patterns, tuning sensitivity, managing pattern libraries

#### 2. vg-workflow-infrastructure
**Purpose:** n8n workflow structure and migrations
**Actions:** Analyze workflow JSON, update nodes, manage migrations, validate structure
**Use Cases:** Workflow upgrades, node configuration, structural modifications

#### 3. vg-test-automation
**Purpose:** Test creation, execution, and verification
**Actions:** Create fixtures, generate tests, run suites, analyze results
**Use Cases:** TDD workflows, regression testing, coverage analysis

#### 4. vg-backend-api
**Purpose:** Express.js API and database operations
**Actions:** Create endpoints, implement auth, write queries, configure middleware
**Use Cases:** REST API development, database changes, authentication

#### 5. vg-frontend-ui
**Purpose:** React UI development and Tailwind CSS
**Actions:** Create components, style with Tailwind v4, API integration, routing
**Use Cases:** UI component development, frontend features, styling

#### 6. vg-data-analytics
**Purpose:** ClickHouse queries and Grafana dashboards
**Actions:** Write queries, create dashboards, optimize performance, design metrics
**Use Cases:** Analytics dashboards, monitoring, data visualization

#### 7. vg-pii-detection
**Purpose:** Dual-language PII detection (Polish + English)
**Actions:** Configure recognizers, analyze text, custom patterns, test accuracy
**Use Cases:** PII entity configuration, privacy compliance, detection tuning

#### 8. vg-infrastructure-deployment
**Purpose:** Docker orchestration and service deployment
**Actions:** Configure Docker Compose, manage dependencies, health checks, deploy
**Use Cases:** Service deployment, infrastructure changes, container orchestration

#### 9. vg-security-compliance
**Purpose:** Security scanning and vulnerability management
**Actions:** Run scans, analyze vulnerabilities, implement fixes, validate compliance
**Use Cases:** Security audits, vulnerability remediation, compliance

#### 10. vg-documentation
**Purpose:** Documentation generation and management
**Actions:** Generate API docs, update guides, sync code with docs, validate
**Use Cases:** Documentation updates, API reference, user guides

#### 11. vg-tech-docs-navigator
**Purpose:** Technical documentation navigation and search
**Actions:** Search docs, retrieve API references, find examples, navigate
**Use Cases:** Finding technical information, API usage, technology research

### Meta-Agent (1)

#### vg-master-orchestrator
**Purpose:** Coordinates all 10 worker agents
**Capabilities:** Task classification, agent selection, workflow execution, result synthesis
**Invocation:** `/vg-orchestrate [task]`

**Full documentation:** [.claude/Agents.md](.claude/Agents.md)

---

## Skills

Skills provide domain-specific knowledge that agents leverage. Each skill contains technical documentation, code examples, best practices, and common patterns.

### Available Skills (18)

| Skill | Domain | Purpose |
|-------|--------|---------|
| `workflow-json-architect` | n8n | Workflow JSON structure management (1166+ lines, 41 nodes) |
| `vigil-testing-e2e` | Testing | End-to-end testing with Vitest (100+ test suite) |
| `express-api-developer` | Backend | Express.js API development (JWT, RBAC, ClickHouse) |
| `pattern-library-manager` | Patterns | Detection pattern management (rules.config.json, 829 lines) |
| `clickhouse-grafana-monitoring` | Analytics | ClickHouse analytics + Grafana dashboards |
| `git-commit-helper` | Git | Conventional Commits automation |
| `documentation-sync-specialist` | Docs | Documentation maintenance (59 .md files) |
| `browser-extension-developer` | Extensions | Chrome Manifest v3 development |
| `n8n-vigil-workflow` | n8n | n8n workflow development (40-node pipeline) |
| `presidio-pii-specialist` | PII | Microsoft Presidio PII detection API |
| `language-detection-expert` | NLP | Hybrid language detection (entity + statistical) |
| `vigil-security-patterns` | Security | Security best practices (OWASP Top 10) |
| `docker-vigil-orchestration` | Docker | Docker Compose orchestration (9 services) |
| `installation-orchestrator` | Installation | install.sh management (2000+ lines) |
| `test-fixture-generator` | Testing | Test fixture generation (TDD workflow) |
| `react-tailwind-vigil-ui` | Frontend | React 18 + Vite + Tailwind CSS v4 |
| `security-audit-scanner` | Security | Automated security scanning (TruffleHog, npm audit) |
| `vg-master-orchestrator` | Meta | Orchestrator documentation |

**Location:** `.claude/skills/*/SKILL.md`

---

## Workflows

Pre-configured multi-step workflows for common tasks.

### 1. PATTERN_ADDITION (TDD Workflow)

**Steps:**
1. Test Creation - vg-test-automation creates failing test
2. Pattern Addition - vg-workflow-business-logic guides pattern config
3. Test Execution - vg-test-automation runs test suite
4. Verification - vg-test-automation confirms pattern works

**Strategy:** Sequential
**Usage:** `/vg-orchestrate Add XSS detection pattern`

### 2. PII_ENTITY_ADDITION

**Steps:**
1. Analysis - vg-pii-detection analyzes entity requirements
2. Configuration - vg-pii-detection updates recognizer config
3. Testing - vg-test-automation creates and runs tests

**Strategy:** Sequential
**Usage:** `/vg-orchestrate Add Polish driver's license PII entity`

### 3. SECURITY_AUDIT

**Steps:**
1. Parallel Scanning: npm audit, secret scanning, ReDoS validation, auth review
2. Result Synthesis - vg-security-compliance combines findings
3. Prioritization - vg-security-compliance ranks by severity

**Strategy:** Parallel scanning, sequential synthesis
**Usage:** `/vg-orchestrate Run security audit`

### 4. TEST_EXECUTION

**Steps:**
1. Test Execution - vg-test-automation runs suite
2. Result Analysis - vg-test-automation analyzes failures
3. Report Generation - vg-test-automation creates summary

**Strategy:** Sequential
**Usage:** `/vg-orchestrate Run full test suite`

### 5. SERVICE_DEPLOYMENT

**Steps:**
1. Build - vg-infrastructure-deployment builds Docker image
2. Deploy - vg-infrastructure-deployment starts service
3. Health Check - vg-infrastructure-deployment verifies status

**Strategy:** Sequential
**Usage:** `/vg-orchestrate Deploy web-ui-backend service`

**Full definitions:** `.claude/core/workflows.js`

---

## Usage Examples

### Example 1: Add Detection Pattern (TDD)

**Command:**
```
/vg-orchestrate Add SQL injection detection pattern
```

**Output:**
```
🎯 Task: Add SQL injection detection

🎭 Strategy: WORKFLOW (PATTERN_ADDITION)

🧪 Step 1/4: Invoking agent: vg-test-automation
   ▶️  Action: create_test
   📝 Creating test fixture with malicious SQL payloads...
   ✅ Completed (1.5s)

⚙️  Step 2/4: Invoking agent: vg-workflow-business-logic
   ▶️  Action: add_pattern
   📝 Adding pattern to rules.config.json via Web UI...
   ✅ Completed (0.9s)

🧪 Step 3/4: Invoking agent: vg-test-automation
   ▶️  Action: run_test
   📝 Running test suite (100+ tests)...
   ✅ Completed (2.3s)

🔍 Step 4/4: Invoking agent: vg-test-automation
   ▶️  Action: verify_test
   📝 Verifying SQL injection detection...
   ✅ Completed (0.8s)

════════════════════════════════════════════════════════════
✨ Workflow Completed in 5.5s

📋 Summary:
   SQL injection detection pattern added successfully
   Pattern: UNION\s+SELECT|DROP\s+TABLE|;--
   Score: 85 (BLOCK threshold)
   Tests passing: 103/103
════════════════════════════════════════════════════════════
```

### Example 2: Security Audit

**Command:**
```
/vg-orchestrate Run security audit
```

**Output:**
```
🎯 Task: Security audit

🎭 Strategy: WORKFLOW (SECURITY_AUDIT)

⚡ Parallel Execution (4 scanners):
   🔍 vg-security-compliance: npm audit
   🔍 vg-security-compliance: secret scanning
   🔍 vg-security-compliance: ReDoS validation
   🔍 vg-security-compliance: auth review

   [████████████████████████] 100% Complete

📊 Results:
   ✅ npm audit: 0 high-severity vulnerabilities
   ✅ Secret scanning: 0 secrets found
   ⚠️  ReDoS: 2 patterns need timeout protection
   ✅ Auth review: JWT implementation secure

🔧 Synthesis:
   Priority: MEDIUM
   Recommended actions:
   1. Add 1-second timeout to 2 regex patterns
   2. Update pattern-matching-engine.js (lines 45-67)

════════════════════════════════════════════════════════════
✨ Audit Completed in 8.2s
════════════════════════════════════════════════════════════
```

### Example 3: Interactive CLI

**Command:**
```bash
cd .claude/agents/vg-master-orchestrator
node init.js
```

**Session:**
```
Master Orchestrator v2.0

> help
Available commands:
  help   - Show this help
  status - System status
  agents - List agents
  exit   - Exit

> agents
Loaded agents (10):
  ✓ vg-workflow-business-logic
  ✓ vg-workflow-infrastructure
  ✓ vg-test-automation
  ✓ vg-backend-api
  ✓ vg-frontend-ui
  ✓ vg-data-analytics
  ✓ vg-pii-detection
  ✓ vg-infrastructure-deployment
  ✓ vg-security-compliance
  ✓ vg-documentation

> status
System Status:
  • Agents loaded: 10
  • Active workflows: 0
  • Message bus ready: Yes
  • State manager: Initialized

> exit
Goodbye!
```

---

## Installation

### Option 1: Use in Existing Project

Copy the agent system to your project:

```bash
# Clone Vigil-Code
git clone https://github.com/YOUR_USERNAME/vigil-code.git

# Copy .claude directory
cp -r vigil-code/.claude /path/to/your/project/

# Copy CLAUDE.md
cp vigil-code/CLAUDE.md /path/to/your/project/
```

### Option 2: Standalone Usage

Use Vigil-Code as a standalone system:

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/vigil-code.git
cd vigil-code

# Test orchestrator
cd .claude/agents/vg-master-orchestrator
node init.js
```

### Verification

```bash
# Check directory structure
ls -la .claude/
# Should show: agents/, core/, skills/, commands/

# Test orchestrator
cd .claude/agents/vg-master-orchestrator
node init.js

# Expected output:
# ✅ All 10 agents loaded successfully
# ✅ State Manager initialized
# ✅ Message Bus ready
```

---

## Configuration

### Claude Code Settings

Configure auto-execution and permissions:

**File:** `.claude/settings.local.json`

```json
{
  "alwaysAllow": [
    "SlashCommand(/vg-orchestrate:*)",
    "Skill(vg-master-orchestrator)",
    "Bash(node:*)"
  ]
}
```

### Agent Configuration

Each agent has configuration in `agent.js`:

```javascript
// Example: .claude/agents/vg-test-automation/agent.js
module.exports = {
  name: 'vg-test-automation',
  version: '2.0.0',
  description: 'Test automation and verification',
  capabilities: ['create_test', 'run_test', 'verify_test']
};
```

### Custom Workflows

Add workflows in `.claude/core/workflows.js`:

```javascript
const WORKFLOWS = {
  MY_WORKFLOW: {
    name: 'MY_WORKFLOW',
    description: 'Custom workflow',
    agents: ['vg-agent-1', 'vg-agent-2'],
    strategy: 'sequential',
    steps: [
      { agent: 'vg-agent-1', action: 'step1' },
      { agent: 'vg-agent-2', action: 'step2' }
    ]
  }
};
```

---

## Project Structure

```
vigil-code/
├── .claude/                          # Agent system core
│   ├── agents/                       # 12 specialized agents
│   │   ├── vg-master-orchestrator/  # Meta-agent coordinator
│   │   ├── vg-test-automation/      # Test automation
│   │   ├── vg-workflow-business-logic/
│   │   ├── vg-workflow-infrastructure/
│   │   ├── vg-backend-api/
│   │   ├── vg-frontend-ui/
│   │   ├── vg-data-analytics/
│   │   ├── vg-pii-detection/
│   │   ├── vg-infrastructure-deployment/
│   │   ├── vg-security-compliance/
│   │   ├── vg-documentation/
│   │   └── vg-tech-docs-navigator/
│   ├── core/                         # Core infrastructure
│   │   ├── base-agent.js            # Base agent class
│   │   ├── message-bus.js           # Inter-agent messaging
│   │   ├── state-manager.js         # Workflow state
│   │   ├── task-classifier.js       # Intelligent routing
│   │   ├── workflows.js             # Workflow definitions
│   │   └── progress-reporter.js     # Real-time progress
│   ├── skills/                       # 18 knowledge domains
│   ├── commands/                     # 22 slash commands
│   ├── README.md                     # .claude documentation
│   ├── Agents.md                     # Agent system guide
│   ├── HOW_TO_USE_MASTER_ORCHESTRATOR.md
│   ├── MIGRATION_GUIDE.md
│   ├── README_ORCHESTRATOR.md
│   ├── package.json                  # CommonJS config
│   └── settings.local.json           # Claude Code approvals
├── CLAUDE.md                          # Project instructions
├── LICENSE                            # MIT license
├── README.md                          # This file
└── package.json                       # Project metadata
```

---

## Slash Commands Reference

| Command | Purpose |
|---------|---------|
| `/vg-orchestrate [task]` | Invoke Master Orchestrator |
| `/add-detection-pattern` | TDD pattern addition workflow |
| `/run-full-test-suite` | Execute complete test suite |
| `/deploy-service [name]` | Deploy service with health check |
| `/status-agents` | Show agent system status |
| `/test-agents` | Test agent system |
| `/agent-help` | Agent system help |
| `/vg-workflow-business-logic [task]` | Pattern management |
| `/vg-test-automation [task]` | Test automation |
| `/vg-backend-api [task]` | Backend API tasks |
| `/vg-frontend-ui [task]` | Frontend UI tasks |
| `/vg-data-analytics [task]` | Analytics tasks |
| `/vg-pii-detection [task]` | PII detection tasks |
| `/vg-infrastructure-deployment [task]` | Infrastructure tasks |
| `/vg-security-compliance [task]` | Security tasks |
| `/vg-documentation [task]` | Documentation tasks |

**Full list:** `.claude/commands/*.md`

---

## Documentation

- **[CLAUDE.md](CLAUDE.md)** - Complete project instructions
- **[.claude/README.md](.claude/README.md)** - Agent system overview
- **[.claude/Agents.md](.claude/Agents.md)** - Detailed agent documentation
- **[.claude/HOW_TO_USE_MASTER_ORCHESTRATOR.md](.claude/HOW_TO_USE_MASTER_ORCHESTRATOR.md)** - Orchestrator usage guide
- **[.claude/MIGRATION_GUIDE.md](.claude/MIGRATION_GUIDE.md)** - Migration documentation

---

## License

MIT License - See [LICENSE](LICENSE) file for details.

---

## Support

- **Issues:** [GitHub Issues](https://github.com/YOUR_USERNAME/vigil-code/issues)
- **Discussions:** [GitHub Discussions](https://github.com/YOUR_USERNAME/vigil-code/discussions)

---

## Acknowledgments

Built for [Claude Code](https://claude.ai/code).

Special thanks to:
- Anthropic for Claude Code
- The open-source community

---

**Made with ❤️ for autonomous AI development**

**Status:** Production Ready ✅
**Version:** 2.0.0
**Last Updated:** 2025-11-13
