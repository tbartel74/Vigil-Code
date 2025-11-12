---
name: agent-help
description: Get help with using the Master Orchestrator and agents
cwd: .
---

# Master Orchestrator Help

## 🤖 How to Use the Agent System

### Basic Usage

The Master Orchestrator automatically analyzes your request and routes it to the appropriate agents. Simply describe what you want to accomplish!

### Example Commands

#### Pattern Management
- "Add SQL injection detection pattern"
- "Create test for XSS attack pattern"
- "Fix false positive in PROMPT_LEAK detection"

#### PII Detection
- "Test PII detection for Polish PESEL numbers"
- "Add new PII entity type for passport numbers"
- "Configure PII confidence thresholds"

#### API Development
- "Create authenticated API endpoint for user profile"
- "Setup JWT authentication"
- "Query ClickHouse for detection statistics"

#### Frontend Development
- "Create UserDashboard React component"
- "Fix controlled component issues in ConfigSection"
- "Add dark mode to the interface"

#### Analytics & Monitoring
- "Create Grafana dashboard for detection metrics"
- "Analyze query performance"
- "Generate daily report"

#### Infrastructure
- "Validate n8n workflow structure"
- "Fix PII flag preservation bug"
- "Migrate workflow to version 1.7.0"

#### Deployment
- "Build and deploy web-ui service"
- "Run health checks on all services"
- "Restart docker containers"

#### Security
- "Run full security audit"
- "Scan for exposed secrets"
- "Check npm vulnerabilities"

#### Documentation
- "Generate API documentation"
- "Update README with new features"
- "Create user guide"

### Multi-Agent Workflows

Some tasks automatically trigger multiple agents:

**Pattern Addition (TDD Workflow):**
1. vg-test-automation creates test
2. vg-test-automation runs test (fails)
3. vg-workflow-business-logic adds pattern
4. vg-test-automation verifies test (passes)

**Security Audit (Parallel):**
- vg-security-compliance runs npm audit
- vg-security-compliance scans secrets
- vg-security-compliance checks ReDoS
- Results are synthesized

### Agent Capabilities

| Agent | What It Can Do |
|-------|---------------|
| **vg-test-automation** | Create tests, run suites, verify patterns, analyze coverage |
| **vg-workflow-business-logic** | Add patterns, tune thresholds, validate rules |
| **vg-pii-detection** | Detect PII, configure entities, test detection |
| **vg-backend-api** | Create endpoints, setup auth, query databases |
| **vg-frontend-ui** | Create components, integrate APIs, optimize performance |
| **vg-data-analytics** | Execute queries, create dashboards, generate reports |
| **vg-workflow-infrastructure** | Update workflows, add nodes, fix bugs, validate |
| **vg-infrastructure-deployment** | Build containers, deploy services, health checks |
| **vg-security-compliance** | Security audits, vulnerability scanning |
| **vg-documentation** | Generate docs, update READMEs, create guides |

### Advanced Features

#### Inter-Agent Communication
Agents can invoke other agents autonomously. For example, if vg-test-automation detects a pattern is missing, it automatically invokes vg-workflow-business-logic to add it.

#### Parallel Execution
Multiple independent tasks run simultaneously for 30-50% faster completion.

#### State Persistence
Workflows maintain state between executions, allowing complex multi-step operations.

### Troubleshooting

**"Command not found"**
- Use natural language instead: "I want to add a SQL injection pattern"
- Or explicitly: "Use orchestrator to [task]"

**"Agent not available"**
- Check status with `/status-agents`
- Some agents may need services running (Docker, ClickHouse, etc.)

**"Task failed"**
- Check error details in the response
- Verify required services are running
- Try breaking complex tasks into smaller steps

### Interactive Mode

For testing and exploration:
```bash
cd .claude/master
node init.js
```

Commands in interactive mode:
- `help` - Show commands
- `status` - System status
- `agents` - List agents
- `test [scenario]` - Run test
- `exit` - Exit

### Getting More Help

- Check agent status: `/status-agents`
- Test all agents: `/test-agents`
- View documentation: Check `.claude/README_ORCHESTRATOR.md`

Ready to orchestrate your tasks! What would you like to accomplish?