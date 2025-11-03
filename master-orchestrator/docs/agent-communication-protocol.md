# Agent Communication Protocol

## Overview

This document defines the standardized communication protocol between the Master Orchestrator and specialized agents in the Vigil Guard system. All agents MUST adhere to this protocol to ensure seamless orchestration and state management.

## Protocol Version

**Current Version:** 1.0.0
**Status:** Active
**Last Updated:** 2024-11-03

## Message Flow

```
User Request
    ↓
Master Orchestrator (Analysis)
    ↓
Task Classification & Agent Selection
    ↓
Agent Input Message (JSON)
    ↓
Agent Execution
    ↓
Agent Output Message (JSON)
    ↓
Master Orchestrator (Synthesis)
    ↓
User Response
```

## Message Formats

### 1. Agent Input Message

The Master Orchestrator sends this message to activate an agent:

```json
{
  "version": "1.0.0",
  "message_id": "uuid-v4",
  "timestamp": "ISO-8601",
  "agent": "agent-name",
  "task": "specific-task-identifier",
  "parameters": {
    // Task-specific parameters
  },
  "context": {
    "user_request": "original user request",
    "task_type": "PATTERN_ADDITION",
    "workflow_template": "template-name",
    "workflow_state": {
      "current_step": 2,
      "total_steps": 5,
      "completed_steps": ["step1"],
      "pending_steps": ["step2", "step3", "step4", "step5"]
    },
    "previous_agents": [
      {
        "agent": "test-automation-agent",
        "output_summary": "Created fixture and test",
        "files_modified": ["tests/fixtures/attack.json"]
      }
    ],
    "shared_context": {
      // Data to be shared across agents
      "pattern_name": "SQL_INJECTION_HEX",
      "category": "SQL_XSS_ATTACKS",
      "test_file": "tests/e2e/bypass-scenarios.test.js"
    }
  },
  "constraints": {
    "timeout_ms": 30000,
    "max_retries": 1,
    "require_confirmation": false,
    "allowed_operations": ["read", "write", "execute"]
  },
  "metadata": {
    "priority": "normal|high|critical",
    "correlation_id": "workflow-uuid",
    "source": "master-orchestrator"
  }
}
```

### 2. Agent Output Message

Agents respond with this standardized output:

```json
{
  "version": "1.0.0",
  "message_id": "uuid-v4",
  "timestamp": "ISO-8601",
  "agent": "agent-name",
  "status": "SUCCESS|FAILURE|WARNING|PARTIAL",
  "output": {
    "summary": "Brief summary of what was accomplished",
    "details": {
      // Agent-specific detailed output
    },
    "artifacts": [
      {
        "type": "file|command|config",
        "path": "path/to/artifact",
        "action": "created|modified|deleted",
        "description": "What this artifact represents"
      }
    ]
  },
  "next_steps": [
    {
      "action": "User action required",
      "urgency": "immediate|soon|eventual",
      "command": "Optional command to run"
    }
  ],
  "state_updates": {
    // Updates to shared context
    "pattern_added": true,
    "threshold_configured": 50
  },
  "files_modified": [
    "path/to/file1.js",
    "path/to/file2.json"
  ],
  "services_affected": [
    "n8n",
    "clickhouse"
  ],
  "warnings": [
    {
      "level": "info|warning|error",
      "message": "Warning message",
      "suggestion": "How to address this"
    }
  ],
  "errors": [
    {
      "code": "ERROR_CODE",
      "message": "Error description",
      "recoverable": true,
      "retry_suggestion": "What to try"
    }
  ],
  "metrics": {
    "execution_time_ms": 1234,
    "operations_count": 5,
    "confidence_score": 0.95
  },
  "metadata": {
    "agent_version": "1.0.0",
    "correlation_id": "workflow-uuid",
    "requires_followup": false
  }
}
```

## State Management

### Workflow State Object

Maintained by Master Orchestrator, passed to agents:

```json
{
  "workflow_id": "uuid-v4",
  "template": "PATTERN_ADDITION",
  "status": "IN_PROGRESS",
  "started_at": "ISO-8601",
  "current_phase": "testing|implementation|verification",
  "checkpoints": {
    "test_created": {
      "completed": true,
      "timestamp": "ISO-8601",
      "agent": "test-automation-agent",
      "result": "SUCCESS"
    },
    "pattern_added": {
      "completed": false,
      "attempts": 0
    }
  },
  "shared_data": {
    // Data shared across all agents
    "test_file": "path/to/test.js",
    "fixture_file": "path/to/fixture.json",
    "pattern_config": {},
    "verification_results": {}
  },
  "rollback_points": [
    {
      "checkpoint": "before_pattern_add",
      "timestamp": "ISO-8601",
      "files_snapshot": []
    }
  ]
}
```

## Communication Patterns

### 1. Sequential Execution

```
Master → Agent A → Master → Agent B → Master → Agent C → Master
```

Used when each agent depends on the previous agent's output.

### 2. Parallel Execution

```
        → Agent A →
Master  → Agent B  → Master (collect & synthesize)
        → Agent C →
```

Used when agents can work independently.

### 3. Conditional Execution

```
Master → Agent A → Master
                    ↓
                 [if condition]
                    ↓
                  Agent B → Master
```

Used when subsequent agents depend on conditions.

### 4. Retry Pattern

```
Master → Agent A (FAILURE) → Master
            ↓
         [retry]
            ↓
        Agent A (SUCCESS) → Master
```

Automatic retry with exponential backoff.

## Error Handling Protocol

### Error Classifications

1. **RECOVERABLE**: Can be retried
   - Network timeout
   - Service temporarily unavailable
   - Rate limit exceeded

2. **PARTIAL_FAILURE**: Some operations succeeded
   - 3 of 5 tests passed
   - Config partially updated

3. **FATAL**: Cannot continue
   - Invalid credentials
   - Missing required files
   - Syntax errors in code

### Error Response Format

```json
{
  "status": "FAILURE",
  "error": {
    "type": "RECOVERABLE|PARTIAL_FAILURE|FATAL",
    "code": "STANDARDIZED_ERROR_CODE",
    "message": "Human-readable description",
    "details": {
      "file": "path/to/problem/file",
      "line": 42,
      "column": 15
    },
    "recovery_options": [
      {
        "action": "retry",
        "delay_ms": 5000
      },
      {
        "action": "skip",
        "consequence": "Pattern won't be added"
      },
      {
        "action": "manual_fix",
        "instruction": "Edit file X and fix Y"
      }
    ]
  }
}
```

## Standard Task Identifiers

Agents recognize these standardized tasks:

### test-automation-agent
- `create_fixture`
- `create_test`
- `run_test`
- `debug_failure`
- `check_coverage`

### workflow-business-logic-agent
- `add_pattern`
- `tune_threshold`
- `configure_sanitization`
- `analyze_scoring`

### backend-api-agent
- `add_endpoint`
- `configure_auth`
- `optimize_query`
- `add_validation`

### frontend-ui-agent
- `create_component`
- `add_route`
- `integrate_api`
- `fix_styling`

### pii-detection-agent
- `add_recognizer`
- `configure_entity`
- `add_language_hint`
- `test_detection`

### infrastructure-deployment-agent
- `deploy_service`
- `check_health`
- `restart_service`
- `migrate_data`

### security-compliance-agent
- `run_audit`
- `scan_secrets`
- `check_dependencies`
- `fix_vulnerability`

### documentation-agent
- `update_docs`
- `generate_api_docs`
- `create_changelog`
- `validate_links`

## Performance Guidelines

### Timeout Limits
- Default: 30 seconds
- Long operations: 120 seconds
- Network calls: 10 seconds
- Health checks: 5 seconds

### Message Size Limits
- Input message: Max 100KB
- Output message: Max 500KB
- File paths: Max 100 files
- Warnings/Errors: Max 50 items

### Retry Strategy
- Initial delay: 1 second
- Max retries: 3
- Backoff multiplier: 2
- Max delay: 30 seconds

## Versioning

### Protocol Version Negotiation

1. Agent declares supported versions in capability response
2. Master selects highest common version
3. Falls back to v1.0.0 if no match
4. Logs version mismatch warnings

### Backward Compatibility

- New fields are optional
- Deprecated fields marked but supported for 3 versions
- Breaking changes require major version bump
- Migration guide provided for upgrades

## Security Considerations

### Message Validation
- All messages must be valid JSON
- Required fields must be present
- Timestamps must be recent (±5 minutes)
- Message IDs must be unique

### Sensitive Data Handling
- Never include passwords in messages
- Mask sensitive values in logs
- Use references instead of inline secrets
- Clear sensitive data after use

### Authorization
- Agents verify task authorization
- Dangerous operations require confirmation
- Rate limiting on agent invocations
- Audit trail for all operations

## Examples

### Example 1: Pattern Addition Flow

```json
// Master → test-automation-agent
{
  "agent": "test-automation-agent",
  "task": "create_fixture",
  "parameters": {
    "attack_type": "SQL_INJECTION",
    "payload": "0x1234 UNION SELECT * FROM users"
  }
}

// test-automation-agent → Master
{
  "status": "SUCCESS",
  "output": {
    "summary": "Created fixture and test",
    "details": {
      "fixture_path": "tests/fixtures/sql-hex.json",
      "test_path": "tests/e2e/bypass.test.js:156"
    }
  },
  "state_updates": {
    "fixture_created": true,
    "test_created": true
  }
}

// Master → workflow-business-logic-agent
{
  "agent": "workflow-business-logic-agent",
  "task": "add_pattern",
  "parameters": {
    "category": "SQL_XSS_ATTACKS",
    "pattern": "0x[0-9a-fA-F]+"
  },
  "context": {
    "shared_context": {
      "fixture_path": "tests/fixtures/sql-hex.json",
      "test_path": "tests/e2e/bypass.test.js:156"
    }
  }
}
```

### Example 2: Parallel Security Audit

```json
// Master → Multiple Agents (Parallel)
[
  {
    "agent": "security-compliance-agent",
    "task": "run_audit",
    "parameters": {"type": "npm"}
  },
  {
    "agent": "security-compliance-agent",
    "task": "scan_secrets",
    "parameters": {"tool": "trufflehog"}
  },
  {
    "agent": "backend-api-agent",
    "task": "review_auth",
    "parameters": {}
  }
]

// Agents → Master (Collected)
{
  "parallel_results": [
    {"agent": "security-compliance-agent", "status": "SUCCESS", "output": {...}},
    {"agent": "security-compliance-agent", "status": "SUCCESS", "output": {...}},
    {"agent": "backend-api-agent", "status": "WARNING", "output": {...}}
  ],
  "synthesis": {
    "overall_status": "WARNING",
    "critical_issues": 0,
    "high_priority": 3,
    "medium_priority": 9
  }
}
```

## Monitoring & Debugging

### Required Logging

Each agent MUST log:
- Message receipt confirmation
- Task start/completion
- Errors and warnings
- Performance metrics
- State changes

### Debug Mode

When `debug: true` in input message:
- Verbose logging enabled
- Intermediate steps logged
- Performance profiling active
- Memory usage tracked

### Health Check Protocol

Agents must respond to health check:

```json
// Health Check Request
{
  "agent": "agent-name",
  "task": "health_check"
}

// Health Check Response
{
  "status": "HEALTHY|DEGRADED|UNHEALTHY",
  "version": "1.0.0",
  "uptime_ms": 3600000,
  "capabilities": ["task1", "task2"],
  "metrics": {
    "requests_processed": 1234,
    "average_response_ms": 500,
    "error_rate": 0.01
  }
}
```

## Compliance Checklist

Agents MUST:
- [ ] Accept standardized input format
- [ ] Return standardized output format
- [ ] Handle all error types gracefully
- [ ] Respect timeout constraints
- [ ] Update workflow state appropriately
- [ ] Log all operations
- [ ] Support health checks
- [ ] Validate input messages
- [ ] Mask sensitive data
- [ ] Provide meaningful error messages

---

**Note:** This protocol ensures consistent, reliable communication between the Master Orchestrator and all specialized agents. Adherence to this protocol is mandatory for proper system operation.