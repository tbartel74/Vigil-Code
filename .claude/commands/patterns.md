---
name: patterns
description: Pattern management and detection rules configuration for Vigil Guard (project)
---

# Workflow Business Logic Agent

Use this agent for managing detection patterns, rules configuration, and threat categorization in Vigil Guard Enterprise:
- Adding new detection patterns to NATS KV store
- Tuning detection thresholds
- Configuring threat categories
- Arbiter weighted scoring
- Pattern analysis and optimization

## What This Agent Does

The workflow business logic agent manages the brain of Vigil Guard:

1. **Add Pattern** - Creates new detection patterns in NATS KV
2. **Suggest Pattern** - Analyzes text and recommends patterns
3. **Update Config** - Modifies unified_config in NATS KV
4. **Analyze Detection** - Reviews pattern effectiveness via ClickHouse
5. **Tune Thresholds** - Optimizes scoring and decision boundaries
6. **Validate Rules** - Ensures configuration integrity

## Pattern Storage (Enterprise)

| Storage | Content |
|---------|---------|
| NATS KV `vigil-patterns` | Heuristics patterns JSON |
| NATS KV `vigil-config` | unified_config settings |
| Qdrant `vigil_attack_patterns` | Semantic embeddings |

## Scoring Architecture

| Branch | Weight | Worker |
|--------|--------|--------|
| Heuristics | 35% | detection-worker |
| Semantic | 35% | detection-worker (Qdrant) |
| PII | 30% | pii-worker |

## Decision Thresholds

| Score | Decision |
|-------|----------|
| 0-29 | ALLOW |
| 30-64 | SANITIZE_LIGHT |
| 65-84 | SANITIZE_HEAVY |
| 85-100 | BLOCK |

## When to Use

- Adding new threat detection patterns
- Tuning detection sensitivity
- Configuring pattern categories
- Analyzing false positives/negatives
- Optimizing detection performance

## Example Tasks

"Add SQL injection detection pattern"
"Analyze the INJECTION category effectiveness"
"Tune thresholds to reduce false positives"
"Suggest patterns for this attack: [text]"
"Update branch weights in unified_config"

## Quick Commands

```bash
# Get current patterns
docker exec vigil-nats nats kv get vigil-patterns injection-patterns

# Update patterns
docker exec vigil-nats nats kv put vigil-patterns injection-patterns "$(cat patterns.json)"

# Get config
docker exec vigil-nats nats kv get vigil-config unified_config

# Watch for changes
docker exec vigil-nats nats kv watch vigil-patterns
```

---

## TDD Pattern Addition Workflow

Complete workflow for adding new detection patterns with test-first approach.

### Step 1: Create Test Fixture

```bash
cat > tests/fixtures/malicious/$PATTERN_NAME.json << 'EOF'
{
  "id": "$PATTERN_NAME",
  "description": "Description of the attack technique",
  "input": "malicious payload here",
  "expected": {
    "decision": "BLOCK",
    "minScore": 85,
    "categories": ["YOUR_CATEGORY"]
  },
  "metadata": {
    "technique": "description_of_technique",
    "severity": "critical"
  }
}
EOF
```

### Step 2: Add Test Case

Edit `tests/e2e/detection.test.ts`:
```typescript
test("Detects $PATTERN_NAME", async () => {
  const fixture = await loadFixture('malicious/$PATTERN_NAME.json');
  const result = await analyzeText(fixture.input);

  expect(result.decision).toBe(fixture.expected.decision);
  expect(result.score).toBeGreaterThanOrEqual(fixture.expected.minScore);
  expect(result.categories).toContain(fixture.expected.categories[0]);
});
```

### Step 3: Run Test (Should FAIL)

```bash
pnpm test -- tests/e2e/detection.test.ts --grep "$PATTERN_NAME"
```

### Step 4: Add Pattern to NATS KV

```bash
# Get current patterns
docker exec vigil-nats nats kv get vigil-patterns injection-patterns > /tmp/patterns.json

# Add new pattern entry with proper JSON structure
# Update NATS KV
docker exec vigil-nats nats kv put vigil-patterns injection-patterns "$(cat /tmp/patterns.json)"
```

### Step 5: Restart & Verify

```bash
# Restart worker to load new patterns
docker restart detection-worker

# Run test (should PASS now)
pnpm test -- tests/e2e/detection.test.ts --grep "$PATTERN_NAME"
```

### Step 6: Validate via API

```bash
curl -X POST http://localhost:8787/v1/analyze \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text":"your test payload","mode":"fast"}'
```

### Step 7: Monitor in ClickHouse

```bash
docker exec vigil-clickhouse clickhouse-client \
  -u admin --password=$CLICKHOUSE_PASSWORD \
  -q "SELECT request_id, decision, score, categories
      FROM vigil.detection_events
      WHERE arrayExists(x -> x = 'YOUR_CATEGORY', categories)
      ORDER BY timestamp DESC
      LIMIT 10"
```

---

## Related Skills

- pattern-library-manager - Full pattern management guidance

## Usage

```
/patterns                           # General pattern management
/patterns add sql-hex-encoding      # Add new pattern (TDD workflow)
/patterns analyze INJECTION         # Analyze category effectiveness
/patterns tune                      # Tune thresholds
```

Describe the pattern or configuration change you need!
