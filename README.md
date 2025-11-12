# Vigil-Code

**Autonomous Multi-Agent Ecosystem for Software Development**

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Agents](https://img.shields.io/badge/agents-12+10-orange.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)

---

## 🎯 Overview

Vigil-Code is an ecosystem of autonomous multi-agent systems designed for complex software development workflows. It features two distinct runtimes:

1.  **Claude (`.claude/`)**: A production-ready orchestration system written in JavaScript, deeply integrated with the repository's workflows.
2.  **Codex (`.codex/`)**: A local-first, TypeScript-based runtime that mirrors the functionality of Claude but operates in a git-ignored environment, ideal for development and testing.

Both systems provide intelligent task routing, parallel execution, and real-time progress tracking across specialized development agents.

---

## 📁 Repository Structure

```
Vigil-Code/
├── .claude/                          # Claude: Production JS agent system
│   ├── agents/                       # 12 specialized agents
│   ├── core/                         # Infrastructure modules
│   ├── commands/                     # 22 slash commands
│   ├── skills/                       # 18 auto-activated skills
│   ├── Agents.md                     # Complete agent documentation
│   └── README.md                     # System overview
│
├── .codex/                           # Codex: Local TS agent system (git-ignored)
│   ├── agents/                       # 10 specialized agents (TypeScript)
│   ├── orchestrator/                 # Master orchestrator and CLI
│   ├── runtime/                      # Core runtime components (TS)
│   ├── config/                       # Permissions and configuration
│   └── README.md                     # Codex-specific documentation
│
├── bin/
│   └── vg-orchestrate                # CLI launcher for the Codex runtime
│
├── CLAUDE.md                         # Main usage documentation for the Claude system
├── README.md                         # This file
├── LICENSE                           # MIT License
├── package.json                      # Node.js project config
└── .gitignore                        # Git ignore rules
```

---

## 🚀 Quick Start

This project contains two separate agent systems. Please follow the instructions for the system you intend to use.

### Claude (JavaScript Runtime)

The Claude system is the primary, production-ready agent orchestrator.

**Prerequisites:**
- **Node.js** ≥18.0.0
- **Claude Code** (for agent execution)
- Git (for version control)

**Installation & Verification:**
```bash
# Clone the repository
git clone https://github.com/your-username/vigil-code.git
cd vigil-code

# Install dependencies
npm install

# Verify installation by listing available technologies
node .claude/agents/vg-tech-docs-navigator/agent.js list_technologies
```

### Codex (TypeScript Runtime)

The Codex system is a local, TypeScript-based runtime for development and experimentation. It is ignored by Git.

**Prerequisites:**
- **Node.js** ≥18.0.0
- `ts-node` (recommended, for running without manual compilation)

**First-time Setup & Verification:**
```bash
# Install dependencies (if not already done)
npm install

# Compile the TypeScript runtime (required once, and after changes)
npx tsc -p .codex/tsconfig.json

# Check the orchestrator status
bin/vg-orchestrate --status
```
> The launcher `bin/vg-orchestrate` will automatically use `ts-node` if the build is not found.

**Running a Task:**
```bash
bin/vg-orchestrate --task "Add a new test for the login component"
```

---

## 🎭 The Agents

### Claude Agent System (12 Agents)

1.  **vg-test-automation** - Test creation, execution, fixture generation
2.  **vg-workflow-business-logic** - Pattern management, rules.config.json
3.  **vg-pii-detection** - Dual-language PII detection (Presidio + spaCy)
4.  **vg-backend-api** - Express.js API development (JWT, ClickHouse)
5.  **vg-frontend-ui** - React 18 + Vite + Tailwind CSS v4
6.  **vg-data-analytics** - ClickHouse analytics + Grafana dashboards
7.  **vg-workflow-infrastructure** - n8n workflow JSON management
8.  **vg-infrastructure-deployment** - Docker orchestration
9.  **vg-security-compliance** - OWASP Top 10, TruffleHog, ReDoS validation
10. **vg-documentation** - Documentation sync and generation
11. **vg-tech-docs-navigator** 🆕 - 41+ technologies documentation hub
12. **vg-master-orchestrator** - Meta-agent coordinating all 11 worker agents.

### Codex Agent System (10 Agents)

The Codex runtime includes 10 specialist agents written in TypeScript, focused on core development tasks like testing, business logic, security, and documentation. For a detailed list and their capabilities, see the [Codex README](.codex/README.md).

---

## 📚 Documentation

- **This `README.md`** - High-level overview of both Claude and Codex systems.
- **[CLAUDE.md](CLAUDE.md)** - Main usage guide for the Claude system.
- **[.claude/README.md](.claude/README.md)** - In-depth system overview for Claude.
- **[.claude/Agents.md](.claude/Agents.md)** - Complete documentation for all Claude agents.
- **[.codex/README.md](.codex/README.md)** - Detailed documentation for the local Codex (TypeScript) runtime.

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Made with ❤️ for autonomous software development**

**Status:** Production Ready ✅
**Version:** 2.0.0
**Last Updated:** 2025-11-12