---
name: orchestrate
description: Execute tasks using the Master Orchestrator autonomous agent system
cwd: .
---

# Master Orchestrator - Autonomous Task Execution

You are now activating the **Master Orchestrator** system. This will analyze the user's request and autonomously coordinate multiple specialized agents to complete the task.

## Available Agents

The Master Orchestrator can coordinate these specialized agents:

1. **vg-workflow-business-logic** - Pattern management, rules configuration
2. **vg-workflow-infrastructure** - n8n workflow structure and migrations
3. **vg-test-automation** - Test creation, execution, and verification
4. **vg-backend-api** - Express.js, JWT auth, API endpoints
5. **vg-frontend-ui** - React components, Tailwind CSS, UI updates
6. **vg-data-analytics** - ClickHouse queries, Grafana dashboards
7. **vg-pii-detection** - Presidio integration, entity configuration
8. **vg-infrastructure-deployment** - Docker, services, health checks
9. **vg-security-compliance** - Security scanning, vulnerability fixes
10. **vg-documentation** - Documentation updates, API generation

## Workflow Templates

Pre-configured multi-agent workflows:

- **PATTERN_ADDITION** - TDD approach for adding detection patterns
- **PII_ENTITY_ADDITION** - Add new PII entity across all services
- **SECURITY_AUDIT** - Parallel security scanning and synthesis
- **TEST_EXECUTION** - Run tests and analyze results
- **SERVICE_DEPLOYMENT** - Deploy with health verification

## How to Use

Simply describe what you want to accomplish. The Master Orchestrator will:

1. **Classify** your request using intelligent task analysis
2. **Select** appropriate agents or workflows automatically
3. **Execute** tasks autonomously (parallel when possible)
4. **Coordinate** inter-agent communication
5. **Synthesize** results into actionable guidance

## Examples

```bash
# Simple task (single agent)
/orchestrate Add SQL injection detection pattern

# Complex task (multi-agent workflow)
/orchestrate Implement new PII entity PASSPORT with full testing

# Parallel execution
/orchestrate Run security audit and analyze test coverage

# Autonomous decision
/orchestrate Fix the failing tests and update patterns
```

## Execution Process

```javascript
// Initialize the Master Orchestrator
const MasterOrchestrator = require('./.claude/master/orchestrator');
const orchestrator = new MasterOrchestrator();

async function executeTask(userRequest) {
  try {
    // Initialize orchestrator with all agents
    await orchestrator.initialize();

    // Execute task autonomously
    const result = await orchestrator.handleTask(userRequest);

    // Display synthesized results
    console.log('Task completed:', result.summary);
    console.log('Details:', result.details);

    if (result.metadata.agents.length > 1) {
      console.log(`Coordinated ${result.metadata.agents.length} agents`);
    }

    return result;

  } catch (error) {
    console.error('Orchestration failed:', error);
    throw error;
  }
}
```

## Current Status

✅ **Core Infrastructure Ready:**
- Base agent class with inter-agent communication
- Message bus for async messaging
- State manager for workflow persistence
- Task classifier for intelligent routing
- Master orchestrator with autonomous coordination
- Workflow executor for template execution

✅ **Priority Agents Implemented:**
- vg-test-automation (full autonomous capabilities)
- vg-workflow-business-logic (pattern and config management)
- vg-pii-detection (dual-language detection)

⏳ **Remaining Agents:** 7 agents need conversion to executable format

## Advanced Features

**Autonomous Capabilities:**
- Agents can invoke other agents independently
- Automatic error recovery and retry logic
- Progress tracking across workflow steps
- State persistence between invocations
- Parallel execution optimization

**Smart Routing:**
- Keyword-based task classification
- Confidence scoring for agent selection
- Multi-agent detection for complex tasks
- Workflow template matching

**Inter-Agent Communication:**
- JSON-RPC style messaging
- Async/await pattern
- Event-driven notifications
- Capability queries

## Troubleshooting

If orchestration fails:
1. Check that all required agents are implemented
2. Verify services are running (Presidio, language detector)
3. Review agent logs in console output
4. Check workflow state in `.claude/state/` directory

## Note

The Master Orchestrator represents a significant upgrade from traditional skills. It enables:
- 30-50% faster task completion through parallel execution
- Reduced user interaction through autonomous decisions
- Better error handling and recovery
- Comprehensive task orchestration

Ready to orchestrate your task. What would you like me to coordinate?