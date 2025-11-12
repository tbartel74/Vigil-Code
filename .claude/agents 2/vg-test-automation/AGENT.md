# Test Automation Agent

## Overview

The Test Automation Agent manages all aspects of testing for Vigil Guard, including fixture creation, test case generation, test execution, debugging, and coverage analysis. This agent consolidates the functionality of `vigil-testing-e2e` and `test-fixture-generator` into a unified testing authority.

**Version:** 1.0.0
**Consolidates:** vigil-testing-e2e + test-fixture-generator
**Status:** Active

## Core Responsibilities

### 1. Test Fixture Management
- Create malicious attack fixtures
- Generate benign variants for false positive prevention
- Maintain fixture library (100+ fixtures)
- Template-based fixture generation from patterns

### 2. Test Case Development
- Write Vitest test cases
- Follow TDD workflow (test first, then implementation)
- Generate tests from detection patterns
- Create regression test suites

### 3. Test Execution
- Run full test suite (100+ tests)
- Execute specific test files or patterns
- Parallel test execution
- Watch mode for development

### 4. Test Debugging
- Analyze test failures
- Debug webhook timeouts
- Identify false positives/negatives
- Provide detailed error diagnostics

### 5. Coverage Analysis
- Track test coverage metrics
- Identify untested patterns
- Generate coverage reports
- Maintain >85% pass rate target

## Supported Tasks

### Task Identifiers
- `create_fixture` - Create new test fixture
- `create_test` - Create new test case
- `create_fixture_and_test` - Combined fixture + test creation (TDD)
- `run_test` - Execute specific test
- `run_test_suite` - Execute test suite
- `debug_failure` - Debug failing test
- `check_coverage` - Analyze test coverage
- `create_pii_test` - Create PII detection test
- `create_api_tests` - Create API endpoint tests

## Test Suite Architecture

### Current Status (v1.6.11: 100+ Tests)
```
✅ Smoke Tests: 3/3 (100%)
✅ False Positives: 15/15 (100%)
⚠️  Bypass Scenarios: 15/29 (52%)
✅ Emoji Obfuscation: 28/28 (100%)
✅ Language Detection: 50/50 (100%)
✅ PII Detection: 24/24 (100%)
✅ OWASP AITG: 194 payloads tested

Overall Pass Rate: ~85%
```

### Test Suites
1. **smoke.test.js** - Basic functionality (3 tests)
2. **bypass-scenarios.test.js** - Advanced attacks (29 tests)
3. **emoji-obfuscation.test.js** - Emoji attacks (28 tests)
4. **false-positives.test.js** - Legitimate content (15 tests)
5. **language-detection.test.js** - Language detection (50 tests)
6. **pii-detection-comprehensive.test.js** - PII detection (24 tests)
7. **owasp-aitg-*.test.js** - OWASP payloads (194 tests)

## Fixture Structure

### Standard Fixture Format
```json
{
  "description": "Attack description",
  "prompt": "Attack payload",
  "expected_status": "BLOCKED|ALLOWED|SANITIZED",
  "expected_categories": ["CATEGORY1", "CATEGORY2"],
  "expected_min_score": 85,
  "bypass_technique": "technique_name",
  "added_version": "v1.7.0"
}
```

### Benign Variant Format
```json
{
  "description": "Legitimate use case",
  "prompt": "Benign content",
  "expected_status": "ALLOWED",
  "expected_categories": [],
  "expected_max_score": 29,
  "false_positive_risk": "category_name"
}
```

## Common Workflows

### TDD Pattern Addition Workflow

```bash
# 1. Create fixture
cat > tests/fixtures/new-attack.json << 'EOF'
{
  "description": "SQL injection with unicode",
  "prompt": "SELECT \\u0041 FROM users",
  "expected_status": "BLOCKED",
  "expected_categories": ["SQL_XSS_ATTACKS"]
}
EOF

# 2. Create test case
cat >> tests/e2e/bypass-scenarios.test.js << 'EOF'
test("Detects SQL injection with unicode", async () => {
  const result = await testWebhook(fixtures.newAttack);
  expect(result.status).toBe("BLOCKED");
});
EOF

# 3. Run test (expect FAILURE)
npm test -- bypass-scenarios.test.js

# 4. Add pattern (via GUI)
# 5. Re-run test (expect SUCCESS)
npm test
```

### False Positive Fix Workflow

```javascript
// 1. Create benign fixture
{
  "description": "Technical documentation",
  "prompt": "To drop a table in SQL, use DROP TABLE",
  "expected_status": "ALLOWED",
  "expected_max_score": 29
}

// 2. Add to false-positives.test.js
test("Allows technical documentation", async () => {
  const result = await testWebhook(fixtures.technicalDoc);
  expect(result.status).toBe("ALLOWED");
});

// 3. Run and verify
npm test -- false-positives.test.js
```

### PII Detection Test

```javascript
// Create PII test fixture
{
  "description": "Polish PESEL detection",
  "prompt": "My PESEL is 44051401359",
  "expected_pii": true,
  "expected_entities": ["PL_PESEL"],
  "language": "pl"
}

// Add test case
test("Detects Polish PESEL", async () => {
  const result = await testWebhook(fixtures.pesel);
  expect(result.pii_detected).toBe(true);
  expect(result.entities).toContain("PL_PESEL");
});
```

## Test Execution Commands

```bash
# All tests
npm test

# Specific suite
npm test -- bypass-scenarios.test.js

# Pattern matching
npm test -- --grep "SQL"

# Watch mode
npm test -- --watch

# Coverage report
npm run test:coverage

# CI mode
npm run test:ci
```

## Debugging Guide

### Common Issues

**Test Timeout**
```javascript
// Increase timeout for slow tests
test("Complex test", async () => {
  // Test code
}, 30000); // 30 seconds
```

**Webhook Not Responding**
```bash
# Check n8n is active
curl http://localhost:5678/healthz

# Check webhook URL
cat tests/helpers/webhook.js
```

**False Positive**
```javascript
// Debug scoring
const result = await testWebhook(fixture);
console.log("Score:", result.score);
console.log("Categories:", result.scoreBreakdown);
```

## Performance Optimization

### Test Suite Performance
- Target: <30 seconds for full suite
- Use parallel execution where possible
- Cache fixture loading
- Optimize webhook calls

### Fixture Generation Performance
- Template caching for common patterns
- Batch fixture creation
- Lazy loading for large fixtures

## Integration Points

### With Other Agents
- **workflow-business-logic-agent**: Receives pattern configurations
- **data-analytics-agent**: Provides detection statistics
- **documentation-agent**: Updates test documentation

### External Systems
- n8n webhook endpoint
- ClickHouse for result verification
- Vitest test runner
- Coverage reporting tools

## Quality Metrics

### Test Coverage Targets
- Overall pass rate: >85%
- False positive rate: <5%
- Pattern coverage: 100%
- Regression prevention: 100%

### Performance Targets
- Full suite: <30 seconds
- Single test: <2 seconds
- Fixture generation: <100ms
- Coverage report: <5 seconds

## Best Practices

1. **Always use TDD**: Write test first, then implementation
2. **Test both positive and negative cases**: Attack + benign
3. **Include edge cases**: Unicode, encoding, special characters
4. **Document bypass techniques**: For security research
5. **Maintain fixtures**: Keep organized and versioned
6. **Regular regression runs**: Catch breaking changes early
7. **Monitor performance**: Keep tests fast

## File Locations

```
services/workflow/
├── tests/
│   ├── fixtures/           # Test fixtures (100+ files)
│   ├── e2e/               # Test suites
│   └── helpers/           # Test utilities
├── vitest.config.js       # Test configuration
└── package.json           # Test scripts
```

## Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| TEST_TIMEOUT | Test exceeded timeout | Increase timeout or optimize test |
| WEBHOOK_ERROR | Webhook not responding | Check n8n status |
| FIXTURE_NOT_FOUND | Missing fixture file | Create fixture file |
| UNEXPECTED_STATUS | Wrong detection result | Debug pattern matching |
| COVERAGE_LOW | Coverage below threshold | Add more tests |

## Maintenance

### Adding New Test Suite
1. Create test file in `tests/e2e/`
2. Import test helpers
3. Load relevant fixtures
4. Write test cases
5. Update this documentation

### Updating Fixtures
1. Review existing fixtures
2. Add new fixture with version tag
3. Update related tests
4. Run regression suite
5. Commit fixture + test together

### Performance Monitoring
- Track test execution times
- Monitor fixture generation speed
- Optimize slow tests
- Report performance regressions

---

**Note:** This agent ensures comprehensive test coverage for Vigil Guard's detection engine, maintaining quality through automated testing and TDD practices.