---
name: test
description: Testing command - TDD workflow, full suite, agent testing
argument-hint: "[--full] [--coverage] [--agents] [pattern] - Run tests with options"
---

# Test Command

Unified testing command for your project.

## Usage

```bash
/test                         # TDD workflow / run basic tests
/test --full                  # Run full test suite with health checks
/test --coverage              # Run with coverage report
/test --agents                # Test available experts
/test "SQL injection"         # Run tests matching pattern
```

---

## Default: TDD Workflow

Create and run tests using Test-Driven Development:

1. **Create Test** - Generates test fixtures and test cases
2. **Run Test** - Executes tests using Vitest
3. **Verify Test** - Validates detection
4. **Analyze Results** - Reports coverage and gaps

### Test Structure

```
tests/
├── unit/
│   ├── services/             # Service tests
│   └── utils/                # Utility tests
├── integration/
│   ├── messaging.test.ts     # Messaging flow
│   └── api.test.ts           # API endpoints
├── e2e/
│   ├── pipeline.test.ts      # Full pipeline
│   └── performance.test.ts   # Latency tests
└── fixtures/
    ├── malicious/            # Attack payloads
    └── benign/               # Safe inputs
```

---

## `/test --full` Full Test Suite

Execute comprehensive tests with health checks.

### 1. Verify Services
```bash
curl -s http://localhost:8787/health || echo "API not running"
```

### 2. Run All Suites
```bash
pnpm test -- tests/unit/
pnpm test -- tests/integration/
pnpm test -- tests/e2e/
```

---

## `/test --agents` Test Experts

Test the available technology experts with sample tasks.

| Expert | Sample Task |
|--------|-------------|
| `security-expert` | "Run security audit" |
| `testing-expert` | "Create test for SQL injection" |

```bash
# Test individual expert
/expert [security] Run security audit
```

---

## Quick Commands

```bash
# Run all tests
pnpm test

# Run specific suite
pnpm test -- tests/e2e/pipeline.test.ts

# Run with grep pattern
pnpm test -- --grep "SQL injection"

# Run with coverage
pnpm test -- --coverage

# Watch mode
pnpm test -- --watch

# Specific service tests
pnpm test -- tests/unit/services/
```

---

## Example Tasks

- "Create test for SQL injection detection"
- "Run the full test suite and report results"
- "Verify XSS pattern detection is working"
- "Add test case for prompt extraction attack"

## Related

- **testing-expert** - Full testing expertise
