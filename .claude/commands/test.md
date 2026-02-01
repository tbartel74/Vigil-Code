---
name: test
description: Testing command - TDD workflow, full suite, agent testing
argument-hint: "[--full] [--coverage] [--agents] [pattern] - Run tests with options"
---

# Test Command

Unified testing command for Vigil Guard Enterprise.

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
3. **Verify Test** - Validates pattern detection
4. **Analyze Results** - Reports coverage and gaps

### Test Structure

```
tests/
├── unit/
│   ├── detection-worker/     # Heuristics tests
│   ├── pii-worker/           # PII tests
│   └── arbiter-worker/       # Decision logic tests
├── integration/
│   ├── nats-flow.test.ts     # NATS messaging
│   └── api-analyze.test.ts   # API endpoints
├── e2e/
│   ├── detection.test.ts     # Full pipeline
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
curl -s http://localhost:8222/healthz || echo "NATS not running"
curl -s http://localhost:8123/ping || echo "ClickHouse not running"
docker exec vigil-nats nats consumer ls VIGIL_DETECTION || echo "Workers not connected"
```

### 2. Run All Suites
```bash
pnpm test -- tests/unit/
pnpm test -- tests/integration/
pnpm test -- tests/e2e/detection.test.ts
pnpm test -- tests/e2e/pii-redaction.test.ts
pnpm test -- tests/e2e/performance.test.ts
```

### 3. Check ClickHouse Results
```bash
docker exec vigil-clickhouse clickhouse-client -q "
  SELECT decision, count(), round(avg(latency_ms), 0)
  FROM vigil.detection_events
  WHERE timestamp > now() - INTERVAL 5 MINUTE
  GROUP BY decision FORMAT Pretty"
```

---

## `/test --agents` Test Experts

Test the 5 technology experts with sample tasks.

| Expert | Sample Task |
|--------|-------------|
| `nats-expert` | "Configure consumer retry policy" |
| `security-expert` | "Run security audit" |
| `express-expert` | "Create authenticated endpoint" |
| `testing-expert` | "Create test for SQL injection" |
| `docker-expert` | "Troubleshoot container networking" |

```bash
# Test individual expert
/expert [nats] List all streams

# Test multi-expert coordination
/expert Add SQL injection detection with tests
```

---

## Quick Commands

```bash
# Run all tests
pnpm test

# Run specific suite
pnpm test -- tests/e2e/detection.test.ts

# Run with grep pattern
pnpm test -- --grep "SQL injection"

# Run with coverage
pnpm test -- --coverage

# Watch mode
pnpm test -- --watch

# Specific worker tests
pnpm test -- tests/unit/detection-worker/
```

---

## Example Tasks

- "Create test for SQL injection detection"
- "Run the full test suite and report results"
- "Verify XSS pattern detection is working"
- "Add test case for prompt extraction attack"
- "Test NATS message flow end-to-end"

## Related

- **testing-expert** - Full testing expertise
- **patterns** - Pattern configuration after test creation
- **infrastructure** - NATS worker validation
