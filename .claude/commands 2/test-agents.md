---
name: test-agents
description: Test all 10 agents with sample tasks
cwd: .
---

# Test All Agents

Testing the complete Master Orchestrator system with all 10 implemented agents.

## Running Agent Tests

I'll now test each agent with a sample task to verify the entire orchestration system is working:

### 1. Test Automation Agent
- Create and run tests for new patterns
- Verify test coverage

### 2. Workflow Business Logic Agent
- Add detection patterns
- Configure thresholds

### 3. PII Detection Agent
- Test dual-language PII detection
- Configure entity types

### 4. Backend API Agent
- Create API endpoints
- Setup authentication

### 5. Frontend UI Agent
- Create React components
- Integrate APIs

### 6. Data Analytics Agent
- Query ClickHouse
- Create dashboards

### 7. Workflow Infrastructure Agent
- Validate n8n workflows
- Fix pipeline bugs

### 8. Infrastructure Deployment Agent
- Build and deploy services
- Health checks

### 9. Security Compliance Agent
- Run security audits
- Check vulnerabilities

### 10. Documentation Agent
- Generate documentation
- Update API docs

## Test Execution

```javascript
const MasterOrchestrator = require('./.claude/master/orchestrator');

async function testAllAgents() {
  const orchestrator = new MasterOrchestrator();
  await orchestrator.initialize();

  const testTasks = [
    'Create test for SQL injection pattern',
    'Add new detection pattern for prompt leak',
    'Detect PII in text with credit card 4111111111111111',
    'Create authenticated API endpoint for user profile',
    'Create UserDashboard React component',
    'Analyze ClickHouse performance for last hour',
    'Validate n8n workflow structure',
    'Deploy web-ui service with health check',
    'Run security audit with npm scanning',
    'Generate API documentation'
  ];

  for (const task of testTasks) {
    const result = await orchestrator.handleTask(task);
    console.log(`✓ ${task}: ${result.summary}`);
  }
}
```

Ready to test all agents. What specific functionality would you like to verify?