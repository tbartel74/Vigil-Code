---
name: testing-expert
description: |
  Testing expert for enterprise projects.
  Vitest, TDD workflows, test fixtures, mocking, E2E testing, coverage.
  Includes procedures from test-fixture-generator and tdd-workflow skills.
tools:
  - Read
  - Edit
  - Glob
  - Grep
  - Write
  - Bash
  - Task
  - WebFetch
---

# Testing Expert

Expert in Vitest testing for enterprise projects. TDD workflows, test fixtures, mocking, E2E testing.

## Test Structure

```
tests/
├── fixtures/
│   ├── malicious/
│   │   ├── sql-injection.json
│   │   ├── xss-payloads.json
│   │   └── prompt-injection.json
│   ├── benign/
│   │   ├── normal-queries.json
│   │   └── false-positives.json
│   └── index.ts
├── helpers/
│   └── webhook.ts
├── e2e/
│   └── detection.test.ts
└── unit/
    └── validators.test.ts
```

## Test Locations by Package

| Package | Test Location |
|---------|---------------|
| apps/api | `apps/api/tests/` |
| services/* | `services/*/tests/` |
| packages/shared | `packages/shared/tests/` |

---

## TDD Workflow

### Standard TDD Loop

```
1. Create test fixture (input + expected output)
2. Write failing test
3. Run test → verify FAIL (red)
4. Implement feature
5. Run test → verify PASS (green)
6. Run full suite → no regressions
7. Check coverage ≥ 80%
```

### Step 1: Create Test Fixture

```json
// tests/fixtures/example.json
{
  "name": "example-detection",
  "category": "injection",
  "payloads": [
    {
      "text": "' UNION SELECT * FROM users--",
      "expected_score": 85,
      "expected_action": "BLOCK",
      "metadata": { "technique": "union-based", "severity": "high" }
    }
  ],
  "benign_examples": [
    {
      "text": "Please help me with my SQL homework",
      "expected_score": 0,
      "expected_action": "ALLOW"
    }
  ]
}
```

### Step 2: Write Failing Test

```typescript
// tests/new-feature.test.ts
import { describe, it, expect } from 'vitest';
import fixture from './fixtures/example.json';
import { detector } from '../src/detector';

describe('New Feature Detection', () => {
  it.each(fixture.payloads)('should detect: $text', async ({ text, expected_score }) => {
    const result = await detector.analyze(text);
    expect(result.score).toBeGreaterThanOrEqual(expected_score - 5);
  });

  it.each(fixture.benign_examples)('should allow benign: $text', async ({ text }) => {
    const result = await detector.analyze(text);
    expect(result.action).toBe('ALLOW');
  });
});
```

### Step 3-7: Red → Green → Refactor

```bash
# Step 3: Verify failure
pnpm test -- --grep "new-feature"

# Step 5: Verify pass
pnpm test -- --grep "new-feature"

# Step 6: Check regressions
pnpm test

# Step 7: Verify coverage
pnpm test -- --coverage
```

---

## Core Test Patterns

### Basic Vitest Pattern

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('MyService', () => {
  let service: MyService;

  beforeEach(() => {
    service = new MyService();
    vi.clearAllMocks();
  });

  describe('analyze', () => {
    it('should detect SQL injection', async () => {
      const result = await service.analyze("' OR '1'='1");
      expect(result.action).toBe('BLOCK');
      expect(result.score).toBeGreaterThan(80);
    });

    it('should allow benign text', async () => {
      const result = await service.analyze('Hello, how are you?');
      expect(result.action).toBe('ALLOW');
      expect(result.score).toBeLessThan(30);
    });
  });
});
```

### Using Fixtures with it.each

```typescript
import fixture from './fixtures/sql-injection.json';

describe('SQL Injection Detection', () => {
  it.each(fixture.payloads)('should detect: $text', async ({ text, expected_action }) => {
    const result = await detector.analyze(text);
    expect(result.action).toBe(expected_action);
  });

  it.each(fixture.benign_examples)('should allow: $text', async ({ text }) => {
    const result = await detector.analyze(text);
    expect(result.action).toBe('ALLOW');
  });
});
```

### Mocking Strategies

```typescript
// Mock entire module
vi.mock('./database', () => ({
  query: vi.fn().mockResolvedValue([])
}));

// Spy on method
const spy = vi.spyOn(service, 'validate');
expect(spy).toHaveBeenCalledWith(data);

// Mock implementation
const mockFn = vi.fn()
  .mockReturnValueOnce('first')
  .mockReturnValue('default');

// Mock fetch
vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ data: 'test' })
}));
```

---

## Test Fixture Generation

### Generate Fixture

```javascript
function generateFixture(category, pattern, weight) {
  const samplePayload = generateSampleFromRegex(pattern);

  return {
    description: `${category}: ${extractTechnique(pattern)}`,
    prompt: samplePayload,
    expected_status: weight >= 85 ? "BLOCKED" : "SANITIZE_HEAVY",
    expected_decision: weight >= 85 ? "BLOCK" : "SANITIZE_HEAVY",
    bypass_technique: extractTechnique(pattern),
    added_version: getCurrentVersion()
  };
}
```

### Generate Benign Variants (False Positive Prevention)

```javascript
// Malicious fixture
{ "prompt": "DROP TABLE users" }

// Generate benign variants:
[
  {
    "description": "Technical discussion: SQL syntax",
    "prompt": "Can you explain how DROP TABLE statements work?",
    "expected_status": "ALLOWED",
    "expected_decision": "ALLOW"
  },
  {
    "description": "Code documentation: SQL example",
    "prompt": "Here's an example of a SQL query: SELECT * FROM users WHERE id = 1",
    "expected_status": "ALLOWED",
    "expected_decision": "ALLOW"
  }
]
```

---

## Decision Engine Tests

```typescript
// tests/decision.test.ts
describe('Decision Engine', () => {
  it('should BLOCK when all workers detect threat', async () => {
    const result = calculateDecision({
      detection: { score: 90, categories: ['INJECTION'] },
      semantic: { score: 85, similarity: 0.9 },
      pii: { score: 0, detected: false }
    });

    expect(result.decision).toBe('BLOCK');
    expect(result.score).toBeGreaterThan(85);
  });

  it('should BLOCK when all workers fail (fail-safe)', async () => {
    const result = calculateDecision({
      detection: null,
      semantic: null,
      pii: null
    });

    expect(result.decision).toBe('BLOCK');
    expect(result.reason).toBe('all_workers_failed');
  });
});
```

---

## Quick Reference

### Run Tests

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test -- --coverage

# Run specific package
pnpm --filter @your-org/api test

# Run single file
pnpm test -- apps/api/tests/routes/analyze.test.ts

# Watch mode
pnpm test -- --watch

# Specific pattern
pnpm test -- --grep "SQL injection"
```

---

## Key Files

| File | Purpose |
|------|---------|
| `vitest.config.ts` | Root Vitest config |
| `packages/*/vitest.config.ts` | Package-specific configs |
| `tests/fixtures/` | Test fixtures |
| `tests/helpers/` | Test utilities |

## Success Criteria (TDD)

- [ ] Fixture created with malicious + benign examples
- [ ] Test written before implementation
- [ ] Test failed initially (red)
- [ ] Pattern implemented
- [ ] Test passes (green)
- [ ] No regressions
- [ ] Coverage maintained >= 80%

## Critical Rules

- Write focused, single-assertion tests when possible
- Use descriptive test names (should X when Y)
- Test edge cases and error paths
- Keep tests independent (no shared mutable state)
- Use fixtures for reusable test data
- Never test implementation details
- Never use hardcoded timeouts (use fake timers)
- Never skip cleanup (afterEach/afterAll)
- Coverage target: 80% minimum
