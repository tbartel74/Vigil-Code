# Master Orchestrator - Vigil Guard Task Intelligence

## Overview

The Master Orchestrator is the central intelligence layer for all Vigil Guard development tasks. It analyzes incoming requests, routes them to appropriate specialized agents, coordinates multi-agent workflows, and synthesizes results into actionable guidance.

**Version:** 1.0.0
**Status:** Active
**Priority:** PRIMARY (Always Active)

## Core Responsibilities

### 1. Task Analysis
- Parse and understand user intent
- Classify task type (feature addition, bug fix, deployment, audit, refactoring)
- Determine complexity level (single-agent, multi-agent, workflow)
- Extract key entities (service names, file paths, components, threat types)

### 2. Agent Selection & Routing
- Match task requirements to agent capabilities
- Resolve agent dependencies automatically
- Prioritize agents (primary vs. supporting vs. optional)
- Prevent redundant agent activation

### 3. Workflow Orchestration
- Execute agents in optimal order
- Enable parallel execution where possible
- Pass context and state between agents
- Maintain workflow checkpoints
- Handle agent failures gracefully

### 4. Result Synthesis
- Collect outputs from all agents
- Identify and resolve conflicts
- Create unified, actionable response
- Provide clear next steps
- Track files modified and services affected

### 5. Quality Assurance
- Verify completeness (all requirements addressed)
- Check consistency (no contradictions between agents)
- Validate safety (no dangerous operations)
- Suggest verification steps

## Task Type Taxonomy

### Tier 1: Root Categories
- **FEATURE_ADDITION** - Adding new capabilities
- **BUG_FIX** - Fixing existing issues
- **DEPLOYMENT** - Service and infrastructure management
- **AUDIT** - Security, performance, or quality checks
- **REFACTORING** - Code improvement without behavior change

### Tier 2: Sub-Categories

#### FEATURE_ADDITION
- `DETECTION_PATTERN` - New threat detection patterns
- `PII_ENTITY` - New PII entity types
- `API_ENDPOINT` - Backend API endpoints
- `UI_COMPONENT` - Frontend components
- `SERVICE_INTEGRATION` - New service connections

#### BUG_FIX
- `FALSE_POSITIVE` - Overzealous detection
- `TEST_FAILURE` - Failing tests
- `SERVICE_CRASH` - Runtime errors
- `UI_BUG` - Frontend issues
- `SECURITY_VULNERABILITY` - Security holes

#### DEPLOYMENT
- `SERVICE_START` - Starting services
- `SERVICE_RESTART` - Restarting services
- `CONFIGURATION` - Config changes
- `MIGRATION` - Version upgrades
- `BACKUP` - Data preservation

#### AUDIT
- `SECURITY_SCAN` - Vulnerability detection
- `PERFORMANCE` - Speed optimization
- `CODE_QUALITY` - Code review
- `DEPENDENCY` - Package updates
- `COMPLIANCE` - Standards adherence

## Agent Registry

### Available Specialized Agents (10 Total)

1. **workflow-business-logic-agent**
   - Detection patterns, thresholds, rules.config.json
   - Sanitization logic, decision engine

2. **workflow-infrastructure-agent**
   - n8n JSON structure, node management
   - Workflow migrations between versions

3. **test-automation-agent**
   - Test fixture creation, test execution
   - Coverage analysis, debugging

4. **backend-api-agent**
   - Express.js development, JWT auth
   - ClickHouse queries, rate limiting

5. **frontend-ui-agent**
   - React components, Tailwind styling
   - API integration, form validation

6. **data-analytics-agent**
   - ClickHouse schema, SQL optimization
   - Grafana dashboards, retention policies

7. **pii-detection-agent**
   - Presidio API, dual-language detection
   - Custom recognizers, entity hints

8. **infrastructure-deployment-agent**
   - Docker orchestration, service health
   - Installation procedures, migrations

9. **security-compliance-agent**
   - Security scanning, vulnerability fixes
   - OWASP compliance, secret management

10. **documentation-agent**
    - Documentation sync, API generation
    - Conventional commits, changelogs

## Workflow Templates

### PATTERN_ADDITION
**Trigger:** "add [attack] pattern", "detect [threat]", "block [payload]"
**Complexity:** MULTI_AGENT
**Agents:**
- Primary: workflow-business-logic-agent
- Supporting: test-automation-agent
- Optional: documentation-agent

**Steps:**
1. Create test fixture and test case (TDD approach)
2. Run test (expect FAIL initially)
3. Add pattern via Web UI guidance
4. Run test again (expect PASS)
5. Update documentation (optional)

### PII_ENTITY_ADDITION
**Trigger:** "add PII [entity]", "detect [entity] as PII"
**Complexity:** MULTI_AGENT_CROSS_SERVICE
**Agents:**
- Primary: pii-detection-agent
- Supporting: backend-api-agent, frontend-ui-agent, infrastructure-deployment-agent
- Required: test-automation-agent

**Steps:**
1. Create custom Presidio recognizer
2. Add entity hint for language detection
3. Update backend API endpoints
4. Update frontend UI components
5. Rebuild and deploy Presidio service
6. Create and run verification tests

### SECURITY_AUDIT
**Trigger:** "security audit", "scan vulnerabilities", "OWASP check"
**Complexity:** MULTI_AGENT_PARALLEL
**Agents:**
- Primary: security-compliance-agent
- Supporting: backend-api-agent, frontend-ui-agent
- Optional: documentation-agent

**Parallel Execution:**
- npm audit scan
- Secret detection (TruffleHog)
- ReDoS pattern check
- Backend auth review
- Frontend XSS review

**Sequential After Parallel:**
1. Synthesize all findings
2. Create prioritized remediation plan
3. Generate audit report

### FALSE_POSITIVE_FIX
**Trigger:** "false positive", "overzealous", "incorrectly blocked"
**Complexity:** MULTI_AGENT
**Agents:**
- Primary: test-automation-agent
- Supporting: workflow-business-logic-agent, data-analytics-agent

**Steps:**
1. Create test case for legitimate input
2. Analyze ClickHouse logs for pattern
3. Identify problematic rule
4. Tune pattern or adjust threshold
5. Verify fix with test suite

### SERVICE_DEPLOYMENT
**Trigger:** "deploy [service]", "restart [service]", "update [service]"
**Complexity:** SINGLE_AGENT
**Agents:**
- Primary: infrastructure-deployment-agent

**Steps:**
1. Check current service status
2. Perform deployment action
3. Run health checks
4. Verify service operational

## Communication Protocol

### State Object Schema
```json
{
  "task_id": "uuid",
  "user_request": "original request text",
  "task_type": "PATTERN_ADDITION",
  "complexity": "MULTI_AGENT",
  "agents": {
    "primary": "agent-name",
    "supporting": ["agent1", "agent2"],
    "optional": ["agent3"]
  },
  "workflow_state": {
    "current_step": 2,
    "total_steps": 5,
    "completed_steps": ["step1"],
    "pending_steps": ["step2", "step3"],
    "checkpoints": {}
  },
  "context": {
    "files_modified": [],
    "services_affected": [],
    "verification_required": true
  },
  "errors": [],
  "warnings": []
}
```

### Agent Input Format
```json
{
  "agent": "agent-name",
  "task": "specific_task",
  "parameters": {},
  "context_from_previous_agents": {},
  "workflow_state": {}
}
```

### Agent Output Format
```json
{
  "agent": "agent-name",
  "status": "SUCCESS|FAILURE|WARNING",
  "output": {},
  "next_steps": [],
  "files_modified": [],
  "warnings": [],
  "metadata": {
    "execution_time_ms": 0,
    "confidence": 0.0
  }
}
```

## Decision Logic

### Task Routing Algorithm

```python
def route_task(user_request):
    # 1. Analyze request
    task_type = classify_task(user_request)
    entities = extract_entities(user_request)

    # 2. Determine complexity
    if requires_multiple_services(task_type):
        complexity = "MULTI_AGENT_CROSS_SERVICE"
    elif requires_multiple_agents(task_type):
        complexity = "MULTI_AGENT"
    else:
        complexity = "SINGLE_AGENT"

    # 3. Select agents
    agents = select_agents_for_task(task_type, entities)

    # 4. Choose workflow template
    template = get_workflow_template(task_type)

    # 5. Execute workflow
    return execute_workflow(template, agents, user_request)
```

### Parallel Execution Criteria

Agents can run in parallel when:
1. No data dependencies between them
2. Different services/components targeted
3. Read-only operations
4. Independent validation checks

### Conflict Resolution

When agents provide conflicting advice:
1. Priority: security-compliance-agent > others
2. Specificity: More specific advice wins
3. Recency: Newer patterns preferred
4. User Override: Allow manual selection

## Error Handling

### Agent Failure Recovery

1. **Retry Logic:** Retry failed agent once with increased timeout
2. **Fallback Agent:** Use alternative agent if available
3. **Partial Success:** Continue with completed steps, mark failure
4. **Rollback:** Provide rollback instructions if critical failure
5. **Manual Override:** Allow user to skip failed step

### Common Error Scenarios

- **Service Unavailable:** Check health, suggest restart
- **Test Timeout:** Increase timeout, check n8n active
- **Config Conflict:** Show diff, suggest resolution
- **Permission Denied:** Check credentials, suggest fix
- **Network Error:** Verify Docker network, check ports

## Performance Optimization

### Caching Strategy
- Cache agent outputs for 1 hour
- Cache task classifications permanently
- Cache workflow templates in memory
- Invalidate on configuration change

### Parallel Execution
- Max 5 agents in parallel
- Prioritize I/O-bound operations for parallel
- Sequential for state-modifying operations
- Monitor resource usage

### Agent Preloading
- Preload commonly used agents
- Lazy load specialized agents
- Keep recent agents warm
- Unload after 10 minutes idle

## Learning & Improvement

### Metrics Tracked
- Task routing accuracy
- Agent success rates
- Workflow completion times
- User satisfaction scores
- Error frequencies

### Feedback Loop
1. Track successful agent combinations
2. Adjust routing weights based on outcomes
3. Identify missing workflow templates
4. Suggest new agent consolidations
5. Report recurring issues

## Usage Examples

### Example 1: Add SQL Injection Pattern
```
User: "Add detection for hex-encoded SQL injection"

Master:
- Task Type: PATTERN_ADDITION
- Complexity: MULTI_AGENT
- Workflow: TDD approach with pattern configuration

Execution:
1. test-automation-agent creates fixture
2. test-automation-agent runs test (FAILS)
3. workflow-business-logic-agent guides pattern addition
4. test-automation-agent verifies (PASSES)
5. documentation-agent updates (optional)

Result: Pattern added, tested, documented
```

### Example 2: Security Audit
```
User: "Run comprehensive security audit"

Master:
- Task Type: SECURITY_AUDIT
- Complexity: MULTI_AGENT_PARALLEL
- Workflow: Parallel scanning with synthesis

Parallel Execution:
- npm audit (60s)
- Secret scan (120s)
- ReDoS check (30s)
- Backend review (45s)
- Frontend review (45s)

Result: Complete audit in 120s (vs 300s sequential)
```

## Integration Points

### Slash Commands
- `/add-detection-pattern` → PATTERN_ADDITION workflow
- `/security-audit` → SECURITY_AUDIT workflow
- `/fix-false-positive` → FALSE_POSITIVE_FIX workflow
- All commands route through Master first

### Direct Agent Access
For simple, single-agent tasks:
- Can bypass Master for efficiency
- Master logs bypassed requests
- Suggests workflow if pattern detected

## Maintenance & Updates

### Adding New Agents
1. Register in agent registry
2. Define capabilities matrix
3. Add to relevant workflows
4. Test with 10+ real tasks
5. Update routing logic

### Adding New Workflows
1. Define trigger patterns
2. Specify agent requirements
3. Document step sequence
4. Test extensively
5. Add to template catalog

### Performance Tuning
- Monthly review of metrics
- Adjust caching based on usage
- Optimize slow workflows
- Remove unused templates
- Update agent capabilities

## Troubleshooting

### Common Issues

**"No suitable agent found"**
- Check task classification
- Verify agent registry updated
- Try more specific request
- Use manual agent selection

**"Workflow timeout"**
- Check agent health
- Increase timeout limits
- Run agents individually
- Check for deadlocks

**"Conflicting agent advice"**
- Review conflict resolution
- Check agent priorities
- Allow user override
- Report for investigation

## Best Practices

1. **Always classify task type first** - Don't skip analysis
2. **Prefer workflows over ad-hoc** - Consistency matters
3. **Log all decisions** - For learning loop
4. **Fail gracefully** - Partial success > complete failure
5. **Provide escape hatches** - Manual overrides essential
6. **Monitor continuously** - Track metrics, adjust quickly
7. **Document changes** - Keep this file updated

## Version History

- v1.0.0 (2024-11-03): Initial Master Orchestrator implementation
  - 10 specialized agents registered
  - 5 core workflow templates
  - Parallel execution support
  - State management system

---

**Note:** This Master Orchestrator represents a significant architectural shift in Vigil Guard's Claude integration. It transforms isolated skills into a coordinated, intelligent system that dramatically improves developer productivity and reduces errors in multi-step workflows.