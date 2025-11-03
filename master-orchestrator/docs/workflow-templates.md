# Workflow Templates Catalog

## Overview

This catalog defines reusable workflow templates for common Vigil Guard development tasks. Each template specifies the agents involved, execution order, validation steps, and success criteria.

## Template Format

Each template contains:
- **Name**: Unique identifier
- **Triggers**: Keywords that activate this workflow
- **Complexity**: SINGLE_AGENT | MULTI_AGENT | MULTI_AGENT_CROSS_SERVICE
- **Agents**: Primary, supporting, and optional agents
- **Execution Mode**: Sequential, parallel, or mixed
- **Steps**: Ordered list of operations
- **Validation**: Checkpoints and success criteria
- **Rollback**: Recovery procedures if failure

---

## Core Workflow Templates

### 1. PATTERN_ADDITION

**Purpose**: Add new threat detection pattern using TDD approach

```yaml
name: PATTERN_ADDITION
version: 1.0.0
triggers:
  - "add [attack] pattern"
  - "detect [threat]"
  - "block [payload]"
  - "add detection for"
complexity: MULTI_AGENT
execution_mode: SEQUENTIAL

agents:
  primary: workflow-business-logic-agent
  supporting:
    - test-automation-agent
  optional:
    - documentation-agent

prerequisites:
  - n8n workflow active
  - Web UI accessible
  - Test environment ready

steps:
  - id: create_test
    agent: test-automation-agent
    task: create_fixture_and_test
    inputs:
      attack_type: "${extracted.attack_type}"
      payload: "${user.provided_payload}"
      expected_result: "BLOCKED"
    outputs:
      - fixture_path
      - test_path
    validation:
      - File exists: fixture_path
      - File exists: test_path

  - id: run_initial_test
    agent: test-automation-agent
    task: run_test
    inputs:
      test_path: "${steps.create_test.test_path}"
    expected_result: FAILURE
    outputs:
      - test_result
    validation:
      - Test fails (TDD approach)

  - id: guide_pattern_addition
    agent: workflow-business-logic-agent
    task: provide_pattern_guidance
    inputs:
      attack_type: "${extracted.attack_type}"
      fixture: "${steps.create_test.fixture_path}"
    outputs:
      - category
      - base_weight
      - multiplier
      - pattern_regex
      - web_ui_instructions
    user_action_required: true
    user_prompt: "Add pattern via Web UI at http://localhost/ui/config/"

  - id: verify_pattern_added
    agent: test-automation-agent
    task: run_test
    inputs:
      test_path: "${steps.create_test.test_path}"
    expected_result: SUCCESS
    outputs:
      - test_result
      - detection_stats
    validation:
      - Test passes
      - No false positives

  - id: update_documentation
    agent: documentation-agent
    task: update_detection_docs
    inputs:
      category: "${steps.guide_pattern_addition.category}"
      pattern: "${steps.guide_pattern_addition.pattern_regex}"
    outputs:
      - docs_updated
    optional: true

success_criteria:
  - Test created and passing
  - Pattern active in rules.config.json
  - No regression in other tests

rollback:
  - Remove pattern from rules.config.json
  - Delete test files
  - Restore backup config

metrics:
  target_duration: 180_seconds
  expected_steps: 5
  user_interactions: 1
```

### 2. PII_ENTITY_ADDITION

**Purpose**: Add new PII entity type with cross-service updates

```yaml
name: PII_ENTITY_ADDITION
version: 1.0.0
triggers:
  - "add PII [entity]"
  - "detect [entity] as PII"
  - "add [country] ID detection"
complexity: MULTI_AGENT_CROSS_SERVICE
execution_mode: SEQUENTIAL

agents:
  primary: pii-detection-agent
  supporting:
    - backend-api-agent
    - frontend-ui-agent
    - infrastructure-deployment-agent
  required:
    - test-automation-agent

prerequisites:
  - Presidio service running
  - Language detector running
  - Docker build permissions

steps:
  - id: create_recognizer
    agent: pii-detection-agent
    task: create_custom_recognizer
    inputs:
      entity_type: "${extracted.entity_type}"
      language: "${extracted.language || 'en'}"
      pattern: "${extracted.pattern}"
      validation_logic: "${extracted.validation}"
    outputs:
      - recognizer_code
      - recognizer_path
      - confidence_scores
    validation:
      - Python syntax valid
      - Pattern compiles

  - id: add_language_hint
    agent: pii-detection-agent
    task: configure_language_hints
    inputs:
      entity_type: "${steps.create_recognizer.entity_type}"
      language: "${steps.create_recognizer.language}"
    outputs:
      - hint_added
      - language_detector_config
    validation:
      - Hint in ENTITY_HINTS dict

  - id: update_backend_api
    agent: backend-api-agent
    task: add_entity_to_api
    inputs:
      entity_type: "${steps.create_recognizer.entity_type}"
    outputs:
      - endpoint_updated
      - api_response_schema
    validation:
      - Entity in /api/pii-detection/entity-types

  - id: update_frontend_ui
    agent: frontend-ui-agent
    task: add_entity_checkbox
    inputs:
      entity_type: "${steps.create_recognizer.entity_type}"
      display_name: "${extracted.display_name}"
    outputs:
      - component_updated
      - ui_path
    validation:
      - Checkbox renders
      - State management works

  - id: rebuild_service
    agent: infrastructure-deployment-agent
    task: rebuild_and_deploy
    inputs:
      service: presidio-pii-api
      dockerfile_changes: true
    outputs:
      - build_success
      - container_id
      - health_status
    validation:
      - Service healthy
      - Responds to requests

  - id: create_verification_test
    agent: test-automation-agent
    task: create_pii_test
    inputs:
      entity_type: "${steps.create_recognizer.entity_type}"
      test_samples: "${user.test_samples}"
    outputs:
      - test_created
      - test_results
    validation:
      - Detection works
      - No false positives

success_criteria:
  - Recognizer deployed
  - UI shows new entity
  - Tests passing
  - Service healthy

rollback:
  - Restore previous Presidio image
  - Revert recognizer file
  - Restore UI component
  - Clear entity from API

metrics:
  target_duration: 300_seconds
  expected_steps: 6
  services_affected: 4
```

### 3. SECURITY_AUDIT

**Purpose**: Comprehensive security vulnerability scan

```yaml
name: SECURITY_AUDIT
version: 1.0.0
triggers:
  - "security audit"
  - "scan for vulnerabilities"
  - "check security"
  - "OWASP"
complexity: MULTI_AGENT_PARALLEL
execution_mode: PARALLEL_THEN_SEQUENTIAL

agents:
  primary: security-compliance-agent
  supporting:
    - backend-api-agent
    - frontend-ui-agent
  optional:
    - documentation-agent

parallel_phase:
  - id: npm_audit
    agent: security-compliance-agent
    task: run_npm_audit
    timeout: 60_seconds
    outputs:
      - npm_vulnerabilities
      - severity_counts

  - id: secret_scan
    agent: security-compliance-agent
    task: scan_secrets
    tool: trufflehog
    timeout: 120_seconds
    outputs:
      - leaked_secrets
      - file_locations

  - id: redos_check
    agent: security-compliance-agent
    task: check_redos_patterns
    timeout: 30_seconds
    outputs:
      - vulnerable_patterns
      - risk_scores

  - id: backend_review
    agent: backend-api-agent
    task: review_authentication
    timeout: 45_seconds
    outputs:
      - auth_issues
      - jwt_config
      - rbac_status

  - id: frontend_review
    agent: frontend-ui-agent
    task: review_xss_prevention
    timeout: 45_seconds
    outputs:
      - xss_vulnerabilities
      - csp_status
      - sanitization

sequential_phase:
  - id: synthesize_results
    agent: security-compliance-agent
    task: create_audit_summary
    inputs:
      all_results: "${parallel_phase.*}"
    outputs:
      - risk_score
      - prioritized_issues
      - remediation_plan

  - id: generate_report
    agent: documentation-agent
    task: create_security_report
    inputs:
      findings: "${steps.synthesize_results.prioritized_issues}"
      risk_score: "${steps.synthesize_results.risk_score}"
    outputs:
      - report_path
      - executive_summary
    optional: true

success_criteria:
  - All scans complete
  - Risk score calculated
  - Remediation plan created

output_format:
  risk_levels:
    - CRITICAL: Immediate action required
    - HIGH: Fix within 24 hours
    - MEDIUM: Fix within 1 week
    - LOW: Fix in next release

metrics:
  target_duration: 120_seconds
  parallel_operations: 5
  total_checks: 50+
```

### 4. FALSE_POSITIVE_FIX

**Purpose**: Fix detection pattern that incorrectly blocks legitimate content

```yaml
name: FALSE_POSITIVE_FIX
version: 1.0.0
triggers:
  - "false positive"
  - "incorrectly blocked"
  - "overzealous detection"
  - "legitimate content blocked"
complexity: MULTI_AGENT
execution_mode: SEQUENTIAL

agents:
  primary: test-automation-agent
  supporting:
    - workflow-business-logic-agent
    - data-analytics-agent

steps:
  - id: create_false_positive_test
    agent: test-automation-agent
    task: create_fixture_and_test
    inputs:
      content: "${user.legitimate_content}"
      expected_result: "ALLOWED"
    outputs:
      - test_path
      - fixture_path

  - id: verify_false_positive
    agent: test-automation-agent
    task: run_test
    inputs:
      test_path: "${steps.create_false_positive_test.test_path}"
    expected_result: FAILURE
    outputs:
      - actual_result
      - detection_details
    validation:
      - Confirms false positive exists

  - id: analyze_detection
    agent: data-analytics-agent
    task: query_detection_logs
    inputs:
      content_hash: "${hash(user.legitimate_content)}"
      time_range: "7_days"
    outputs:
      - triggering_pattern
      - category
      - frequency
      - similar_false_positives

  - id: identify_problematic_rule
    agent: workflow-business-logic-agent
    task: analyze_pattern
    inputs:
      pattern: "${steps.analyze_detection.triggering_pattern}"
      false_positive_content: "${user.legitimate_content}"
    outputs:
      - problem_analysis
      - suggested_fix
      - alternative_patterns

  - id: apply_fix
    agent: workflow-business-logic-agent
    task: guide_pattern_fix
    inputs:
      current_pattern: "${steps.analyze_detection.triggering_pattern}"
      suggested_fix: "${steps.identify_problematic_rule.suggested_fix}"
    outputs:
      - fix_instructions
      - web_ui_guidance
    user_action_required: true

  - id: verify_fix
    agent: test-automation-agent
    task: run_test_suite
    inputs:
      specific_test: "${steps.create_false_positive_test.test_path}"
      regression_suite: "tests/e2e/false-positives.test.js"
    outputs:
      - specific_test_result
      - regression_results
    validation:
      - False positive fixed
      - No new false negatives

success_criteria:
  - Legitimate content no longer blocked
  - Original threats still detected
  - No regression in detection rates

metrics:
  target_duration: 240_seconds
  expected_steps: 6
```

### 5. SERVICE_DEPLOYMENT

**Purpose**: Deploy or update a service with health verification

```yaml
name: SERVICE_DEPLOYMENT
version: 1.0.0
triggers:
  - "deploy [service]"
  - "restart [service]"
  - "update [service]"
complexity: SINGLE_AGENT
execution_mode: SEQUENTIAL

agents:
  primary: infrastructure-deployment-agent

steps:
  - id: check_current_status
    agent: infrastructure-deployment-agent
    task: check_service_health
    inputs:
      service: "${extracted.service_name}"
    outputs:
      - current_status
      - version
      - uptime

  - id: prepare_deployment
    agent: infrastructure-deployment-agent
    task: validate_environment
    outputs:
      - docker_ready
      - ports_available
      - volumes_mounted

  - id: deploy_service
    agent: infrastructure-deployment-agent
    task: deploy
    inputs:
      service: "${extracted.service_name}"
      action: "${extracted.action || 'restart'}"
    outputs:
      - deployment_status
      - container_id
      - start_time

  - id: health_check
    agent: infrastructure-deployment-agent
    task: verify_health
    inputs:
      service: "${extracted.service_name}"
      max_retries: 10
      retry_delay: 3_seconds
    outputs:
      - health_status
      - response_time
      - endpoints_tested

  - id: smoke_test
    agent: infrastructure-deployment-agent
    task: run_smoke_tests
    inputs:
      service: "${extracted.service_name}"
    outputs:
      - test_results
      - performance_metrics

success_criteria:
  - Service responding
  - Health checks passing
  - Smoke tests passing

rollback:
  - Stop new container
  - Start previous container
  - Restore previous version

metrics:
  target_duration: 60_seconds
  health_check_timeout: 30_seconds
```

### 6. MORNING_CHECK

**Purpose**: Daily health and status check of all systems

```yaml
name: MORNING_CHECK
version: 1.0.0
triggers:
  - "morning check"
  - "daily status"
  - "system health"
complexity: MULTI_AGENT_PARALLEL
execution_mode: PARALLEL_THEN_SYNTHESIZE

agents:
  primary: infrastructure-deployment-agent
  supporting:
    - data-analytics-agent
    - test-automation-agent

parallel_phase:
  - id: service_health
    agent: infrastructure-deployment-agent
    task: check_all_services
    outputs:
      - service_statuses
      - unhealthy_services
      - response_times

  - id: overnight_errors
    agent: data-analytics-agent
    task: query_error_logs
    inputs:
      time_range: "24_hours"
    outputs:
      - error_count
      - error_types
      - affected_services

  - id: smoke_tests
    agent: test-automation-agent
    task: run_smoke_suite
    outputs:
      - passed_tests
      - failed_tests
      - test_duration

synthesis_phase:
  - id: create_summary
    task: synthesize_morning_report
    inputs:
      health: "${parallel_phase.service_health}"
      errors: "${parallel_phase.overnight_errors}"
      tests: "${parallel_phase.smoke_tests}"
    outputs:
      - overall_status
      - action_items
      - metrics_summary

output_format:
  status_indicators:
    - "🟢 All systems operational"
    - "🟡 Minor issues detected"
    - "🔴 Critical issues require attention"

metrics:
  target_duration: 30_seconds
  services_checked: 9
  tests_run: 10+
```

### 7. API_ENDPOINT_ADDITION

**Purpose**: Add new API endpoint with full stack implementation

```yaml
name: API_ENDPOINT_ADDITION
version: 1.0.0
triggers:
  - "add endpoint"
  - "create API"
  - "new route"
complexity: MULTI_AGENT
execution_mode: SEQUENTIAL

agents:
  primary: backend-api-agent
  supporting:
    - frontend-ui-agent
    - test-automation-agent
    - documentation-agent

steps:
  - id: design_endpoint
    agent: backend-api-agent
    task: design_api_endpoint
    inputs:
      purpose: "${user.endpoint_purpose}"
      method: "${extracted.http_method}"
      path: "${extracted.endpoint_path}"
    outputs:
      - endpoint_spec
      - request_schema
      - response_schema

  - id: implement_backend
    agent: backend-api-agent
    task: create_endpoint
    inputs:
      spec: "${steps.design_endpoint.endpoint_spec}"
    outputs:
      - controller_path
      - validation_rules
      - auth_requirements

  - id: add_frontend_integration
    agent: frontend-ui-agent
    task: create_api_client
    inputs:
      endpoint: "${steps.design_endpoint.endpoint_spec}"
    outputs:
      - api_client_path
      - hook_created
      - types_generated

  - id: create_tests
    agent: test-automation-agent
    task: create_api_tests
    inputs:
      endpoint: "${steps.design_endpoint.endpoint_spec}"
    outputs:
      - unit_tests
      - integration_tests
      - test_results

  - id: update_documentation
    agent: documentation-agent
    task: update_api_docs
    inputs:
      endpoint: "${steps.design_endpoint.endpoint_spec}"
    outputs:
      - api_doc_updated
      - openapi_spec_updated

success_criteria:
  - Endpoint responding
  - Tests passing
  - Frontend integrated
  - Documentation updated

metrics:
  target_duration: 600_seconds
  files_created: 5+
```

---

## Workflow Execution Rules

### Execution Modes

1. **SEQUENTIAL**: Steps execute one after another
   - Each step waits for previous to complete
   - State passed between steps
   - Rollback possible at each checkpoint

2. **PARALLEL**: Multiple operations simultaneously
   - Independent operations only
   - Results collected when all complete
   - Fastest operation determines minimum time

3. **PARALLEL_THEN_SEQUENTIAL**: Hybrid approach
   - Parallel phase for independent operations
   - Sequential phase for dependent operations
   - Synthesis combines parallel results

### State Management

Each workflow maintains:
- Current step ID
- Completed steps list
- Shared context dictionary
- Error accumulator
- Rollback checkpoints

### User Interactions

Types of user interactions:
- **Confirmation**: Yes/No decision
- **Input**: Provide missing information
- **Action**: Manual step (e.g., Web UI usage)
- **Review**: Verify automated changes

### Error Handling

Error response strategies:
1. **Retry**: Attempt operation again
2. **Skip**: Continue without this step
3. **Rollback**: Undo all changes
4. **Manual**: User fixes manually
5. **Abort**: Stop workflow entirely

---

## Creating New Templates

### Template Requirements

New templates must define:
- [ ] Unique name and version
- [ ] Clear triggers (3+ examples)
- [ ] Complexity classification
- [ ] Agent requirements
- [ ] Step-by-step operations
- [ ] Success criteria
- [ ] Rollback procedures
- [ ] Performance targets

### Template Testing

Before activation:
1. Test with 5+ real scenarios
2. Verify all paths (success and failure)
3. Test rollback procedures
4. Measure performance
5. Document edge cases

### Template Naming Convention

Format: `DOMAIN_ACTION`

Examples:
- `PATTERN_ADDITION`
- `SERVICE_DEPLOYMENT`
- `SECURITY_AUDIT`
- `API_ENDPOINT_ADDITION`

---

## Performance Targets

### Execution Time Goals

| Complexity | Target Time | Maximum Time |
|------------|------------|--------------|
| SINGLE_AGENT | <60s | 120s |
| MULTI_AGENT | <180s | 300s |
| MULTI_AGENT_CROSS_SERVICE | <300s | 600s |
| PARALLEL | <120s | 240s |

### Optimization Strategies

1. **Parallelize** independent operations
2. **Cache** repeated queries
3. **Preload** likely next agents
4. **Stream** results as available
5. **Batch** similar operations

---

## Monitoring & Metrics

### Key Metrics

Per workflow execution:
- Total duration
- Steps completed/failed
- User interaction count
- Error count
- Rollback frequency

### Success Rate Targets

- Overall success: >90%
- Without rollback: >80%
- User satisfaction: >4.0/5.0
- Performance SLA: >95%

---

**Note:** These workflow templates form the core automation capabilities of the Vigil Guard Master-Agent system. They ensure consistent, efficient execution of complex multi-step operations.