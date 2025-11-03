---
name: Run Full Test Suite
description: Execute comprehensive test suite with detailed reporting
---

# Run Full Test Suite

Execute all Vigil Guard tests with health checks and reporting.

## Steps

### 1. Verify Services Running
```bash
echo "Checking n8n workflow..."
curl -s http://localhost:5678/healthz || echo "⚠️  n8n not running"

echo "Checking ClickHouse..."
docker logs vigil-clickhouse clickhouse-client -q "SELECT 1" || echo "⚠️  ClickHouse not running"

echo "Checking backend API..."
curl -s http://localhost:8787/api/files > /dev/null || echo "⚠️  Backend not running"
```

### 2. Run Test Suites
```bash
cd services/workflow

echo "========================================="
echo "Running Smoke Tests (3 tests)"
echo "========================================="
npm test -- smoke.test.js

echo ""
echo "========================================="
echo "Running False Positive Tests (15 tests)"
echo "========================================="
npm test -- false-positives.test.js

echo ""
echo "========================================="
echo "Running Bypass Scenarios (29 tests)"
echo "========================================="
npm test -- bypass-scenarios.test.js

echo ""
echo "========================================="
echo "Running Emoji Obfuscation Tests (28 tests)"
echo "========================================="
npm test -- emoji-obfuscation.test.js

echo ""
echo "========================================="
echo "Running Input Validation Tests"
echo "========================================="
npm test -- input-validation.test.js
```

### 3. Generate Summary
```bash
echo ""
echo "========================================="
echo "TEST SUMMARY"
echo "========================================="
npm test 2>&1 | grep -E "(Tests|passed|failed)"
```

### 4. Check ClickHouse Logs
```bash
echo ""
echo "Recent test events in ClickHouse:"
docker logs vigil-clickhouse clickhouse-client -q "
  SELECT
    status,
    count() as count
  FROM n8n_logs.events_processed
  WHERE timestamp > now() - INTERVAL 5 MINUTE
  GROUP BY status
  FORMAT Pretty
"
```

### 5. View Failed Tests (if any)
```bash
npm test 2>&1 | grep -A 5 "FAIL"
```

## Quick Mode
For rapid validation:
```bash
cd services/workflow
npm test -- smoke.test.js false-positives.test.js
```

## Coverage Mode
With code coverage report:
```bash
cd services/workflow
npm run test:coverage
```

## Watch Mode
Continuous testing during development:
```bash
cd services/workflow
npm run test:watch
```

## Example Usage
```
/run-full-test-suite
```

## Related Skills
- vigil-testing-e2e - Test suite details
- clickhouse-grafana-monitoring - Log analysis
