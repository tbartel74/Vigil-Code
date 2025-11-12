---
name: vg-orchestrate
description: Execute tasks using Master Orchestrator with autonomous agent coordination (project)
---

# Master Orchestrator - Autonomous Multi-Agent Coordination

**IMPORTANT:** This command actually executes the Master Orchestrator system. It will:
1. Analyze your request
2. Select appropriate agents automatically
3. Coordinate multi-agent workflows
4. Show real-time progress
5. Synthesize results

## How It Works

The Master Orchestrator uses intelligent task classification to:
- Route simple tasks to single agents
- Execute complex tasks with multiple agents in parallel
- Run pre-configured workflows (TDD, Security Audit, etc.)
- Show real-time progress with emoji indicators

## Available Agents (10)

All agents with `vg-` prefix:
- vg-test-automation
- vg-workflow-business-logic
- vg-pii-detection
- vg-backend-api
- vg-frontend-ui
- vg-data-analytics
- vg-workflow-infrastructure
- vg-infrastructure-deployment
- vg-security-compliance
- vg-documentation

## Pre-Configured Workflows

1. **PATTERN_ADDITION** - TDD workflow for detection patterns
2. **PII_ENTITY_ADDITION** - Add PII entity across services
3. **SECURITY_AUDIT** - Parallel security scanning
4. **TEST_EXECUTION** - Run and analyze tests
5. **SERVICE_DEPLOYMENT** - Deploy with health checks

## Example Usage

Simple tasks (single agent):
- "Run all tests"
- "Analyze ClickHouse performance"
- "Create React component for user profile"

Complex tasks (multi-agent):
- "Add SQL injection detection pattern" → PATTERN_ADDITION workflow
- "Run security audit" → SECURITY_AUDIT workflow (parallel)
- "Add new PII entity PASSPORT" → PII_ENTITY_ADDITION workflow

## Real-Time Progress

You'll see:
```
🎯 Task: Add SQL injection detection
════════════════════════════════════
📊 Classification: detection (95%)
🎭 Strategy: WORKFLOW

🧪 Invoking: vg-test-automation
   ├─ ▶️  Action: create_test
   └─ ✅ Completed (1.2s)

⚙️ Invoking: vg-workflow-business-logic
   ├─ [████████████████░░░░] 80%
   └─ ✅ Completed (0.8s)

✨ Task Completed in 2.3s
🤝 Coordinated 2 agents
```

## Execution Instructions

**This command redirects to the Master Orchestrator skill.**

When user types `/vg-orchestrate [task]`, you MUST:

1. Invoke the skill using Skill tool:
   ```
   Skill tool:
     command: "vg-master-orchestrator"
   ```

2. The skill (`@vg-master-orchestrator`) will:
   - Analyze and classify the user's task
   - Select appropriate agents (from 10 vg-* agents)
   - Coordinate execution with real-time progress
   - Synthesize and return results

**ALTERNATIVE:** User can directly use `@vg-master-orchestrator` skill

**IMPORTANT:**
- Do NOT just show documentation
- MUST invoke the skill to actually orchestrate
- The user's request following this command is the task to execute

---

**TIP:** For direct access, use: `@vg-master-orchestrator` instead of this command