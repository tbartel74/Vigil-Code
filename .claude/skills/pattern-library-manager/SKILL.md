---
name: pattern-library-manager
description: |
  Detection pattern management for Vigil Guard Enterprise. Use for NATS KV pattern storage,
  detection-worker configuration, Qdrant semantic patterns, scoring algorithms,
  and pattern optimization.
version: 3.0.0
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob]
---

# Pattern Library Manager for Vigil Guard Enterprise

## Overview

Expert management of detection patterns across Vigil Guard Enterprise's worker-based detection architecture. Patterns are stored in NATS KV for heuristics and Qdrant for semantic similarity.

## Enterprise Architecture

### Pattern Storage Locations

| Component | Storage | Purpose |
|-----------|---------|---------|
| Heuristics | NATS KV `vigil-patterns` | JSON pattern files |
| Semantic | Qdrant `vigil_attack_patterns` | Vector embeddings |
| Config | NATS KV `vigil-config` | unified_config.json |

### Pattern Flow

```
                     NATS KV
                  vigil-patterns
                        │
           ┌────────────┴────────────┐
           ▼                         ▼
   detection-worker              Qdrant
  (heuristics patterns)    vigil_attack_patterns
           │                         │
           └────────────┬────────────┘
                        ▼
                 arbiter-worker
              (weighted scoring)
```

## When to Use This Skill

- Managing detection patterns in NATS KV
- Configuring Qdrant collections for semantic search
- Understanding weighted scoring algorithms
- Tracking false positive rates
- Analyzing pattern effectiveness metrics
- Optimizing detection performance

## Pattern Storage (NATS KV)

### KV Bucket: `vigil-patterns`

```
vigil-patterns/
├── injection-patterns          # Injection attack patterns
├── whisper-patterns            # Whisper attack patterns
├── roleplay-patterns           # Roleplay jailbreak patterns
├── boundary-patterns           # System boundary markers
├── obfuscation-patterns        # Obfuscation detection
├── homoglyphs                  # Unicode lookalikes
├── leet-speak                  # Leet speak mappings
└── zero-width                  # Zero-width characters
```

### Managing Patterns via NATS CLI

```bash
# List all patterns
docker exec vigil-nats nats kv ls vigil-patterns

# Get specific pattern
docker exec vigil-nats nats kv get vigil-patterns injection-patterns

# Update pattern
docker exec vigil-nats nats kv put vigil-patterns injection-patterns \
  "$(cat patterns/injection-patterns.json)"

# Watch for changes
docker exec vigil-nats nats kv watch vigil-patterns
```

### Pattern JSON Structure

```json
{
  "name": "injection-patterns",
  "version": "1.0.0",
  "patterns": [
    {
      "id": "inj-001",
      "pattern": "ignore (all )?(previous|prior|above) instructions?",
      "flags": "i",
      "score": 85,
      "category": "INJECTION",
      "description": "Classic instruction override"
    },
    {
      "id": "inj-002",
      "pattern": "disregard (everything|all|any)",
      "flags": "i",
      "score": 80,
      "category": "INJECTION"
    }
  ]
}
```

## Configuration (NATS KV)

### KV Bucket: `vigil-config`

```
vigil-config/
├── unified_config              # Main detection config
├── thresholds                  # Score thresholds
└── weights                     # Branch weights
```

### unified_config Structure

```json
{
  "version": "6.0.0",
  "detection": {
    "thresholds": {
      "ALLOW_MAX": 29,
      "SANITIZE_LIGHT_MAX": 64,
      "SANITIZE_HEAVY_MAX": 84
    },
    "weights": {
      "heuristics": 0.35,
      "semantic": 0.35,
      "pii": 0.30
    },
    "categories": {
      "INJECTION": { "enabled": true, "weight": 1.0 },
      "JAILBREAK": { "enabled": true, "weight": 1.0 },
      "PROMPT_LEAK": { "enabled": true, "weight": 0.9 },
      "DATA_EXFIL": { "enabled": true, "weight": 0.95 }
    }
  }
}
```

## Semantic Patterns (Qdrant)

### Collection: `vigil_attack_patterns`

```bash
# Check collection status
curl http://localhost:6333/collections/vigil_attack_patterns

# Search similar patterns
curl -X POST http://localhost:6333/collections/vigil_attack_patterns/points/search \
  -H "Content-Type: application/json" \
  -d '{
    "vector": [0.1, 0.2, ...],
    "limit": 5,
    "with_payload": true
  }'
```

### Adding Semantic Patterns

```typescript
// services/detection-worker/src/semantic.ts
import { QdrantClient } from '@qdrant/js-client-rest';

const qdrant = new QdrantClient({ url: 'http://vigil-qdrant:6333' });

async function indexPattern(text: string, metadata: PatternMetadata) {
  const embedding = await generateEmbedding(text);

  await qdrant.upsert('vigil_attack_patterns', {
    points: [{
      id: crypto.randomUUID(),
      vector: embedding,
      payload: {
        text,
        category: metadata.category,
        score: metadata.score,
        created_at: new Date().toISOString()
      }
    }]
  });
}
```

## Scoring Architecture

### Branch Weights (Enterprise)

| Branch | Weight | Worker |
|--------|--------|--------|
| Heuristics | 35% | detection-worker |
| Semantic | 35% | detection-worker (Qdrant) |
| PII | 30% | pii-worker |

### Final Score Calculation

```typescript
// arbiter-worker scoring
interface BranchResults {
  heuristics: { score: number; categories: string[] };
  semantic: { score: number; similarity: number };
  pii: { score: number; entities: string[] };
}

function calculateFinalScore(branches: BranchResults): number {
  const weights = { heuristics: 0.35, semantic: 0.35, pii: 0.30 };

  const weightedScore =
    (branches.heuristics.score * weights.heuristics) +
    (branches.semantic.score * weights.semantic) +
    (branches.pii.score * weights.pii);

  return Math.round(weightedScore);
}

function determineDecision(score: number): Decision {
  if (score <= 29) return 'ALLOW';
  if (score <= 64) return 'SANITIZE_LIGHT';
  if (score <= 84) return 'SANITIZE_HEAVY';
  return 'BLOCK';
}
```

### Critical Signal Override

```typescript
function checkCriticalSignals(branches: BranchResults): boolean {
  // Force BLOCK for critical patterns regardless of score
  const criticalCategories = ['INJECTION', 'JAILBREAK', 'DATA_EXFIL'];

  return branches.heuristics.categories.some(
    cat => criticalCategories.includes(cat) &&
           branches.heuristics.score >= 80
  );
}
```

## Pattern Addition Workflow (TDD)

### Step 1: Create Test Fixture

```typescript
// services/detection-worker/tests/fixtures/new-attack.json
{
  "id": "test-new-attack",
  "input": "malicious payload to detect",
  "expected": {
    "decision": "BLOCK",
    "minScore": 85,
    "categories": ["INJECTION"]
  }
}
```

### Step 2: Run Test (Should Fail)

```bash
cd services/detection-worker
pnpm test -- --grep "new-attack"
# Expected: FAIL - pattern not yet added
```

### Step 3: Add Pattern to NATS KV

```bash
# Get current patterns
docker exec vigil-nats nats kv get vigil-patterns injection-patterns > patterns.json

# Edit patterns.json, add new pattern
vim patterns.json

# Update KV
docker exec vigil-nats nats kv put vigil-patterns injection-patterns \
  "$(cat patterns.json)"
```

### Step 4: Restart Worker

```bash
docker restart detection-worker
```

### Step 5: Run Test (Should Pass)

```bash
pnpm test -- --grep "new-attack"
# Expected: PASS
```

### Step 6: Commit

```bash
git add tests/fixtures/new-attack.json
git commit -m "feat(detect): add new injection pattern with TDD tests"
```

## ReDoS Validation

### Dangerous Patterns (AVOID)

```regex
# Catastrophic backtracking
^(a+)+$
(x+x+)+y
(a|a)*b
(.*){10,}
```

### Safe Patterns

```regex
# Bounded, non-nested
^a+$
^[a-z]{1,100}$
^(?:ab)+$
^a*b
```

### Validation Script

```bash
#!/bin/bash
PATTERN="$1"
for size in 10 100 1000; do
  INPUT=$(printf 'a%.0s' $(seq 1 $size))
  timeout 1s node -e "/$PATTERN/.test('$INPUT')" 2>/dev/null
  if [ $? -eq 124 ]; then
    echo "REDOS DETECTED at size $size"
    exit 1
  fi
done
echo "Pattern is safe"
```

## Pattern Effectiveness Analysis

### ClickHouse Queries

```sql
-- Detection rate by category
SELECT
  arrayJoin(categories) as category,
  count() as detections,
  round(avg(score), 2) as avg_score
FROM vigil.detection_events
WHERE timestamp > now() - INTERVAL 7 DAY
  AND length(categories) > 0
GROUP BY category
ORDER BY detections DESC;

-- Branch contribution analysis
SELECT
  decision,
  round(avg(branch_a_score), 2) as avg_heuristics,
  round(avg(branch_b_score), 2) as avg_semantic,
  count() as total
FROM vigil.detection_events
WHERE timestamp > now() - INTERVAL 7 DAY
GROUP BY decision;

-- False positive candidates
SELECT
  request_id,
  score,
  categories,
  branch_a_score,
  branch_b_score
FROM vigil.detection_events
WHERE decision = 'BLOCK'
  AND score < 90
  AND timestamp > now() - INTERVAL 1 DAY
ORDER BY timestamp DESC
LIMIT 20;
```

## Troubleshooting

### Pattern Not Triggering

```bash
# Check pattern is in KV
docker exec vigil-nats nats kv get vigil-patterns injection-patterns | jq .

# Test detection-worker directly
curl -X POST http://localhost:8787/v1/analyze \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text":"test payload","mode":"fast"}'

# Check worker logs
docker logs detection-worker --tail 50 | grep -i pattern
```

### High False Positive Rate

**Solutions:**
1. Reduce pattern score in NATS KV
2. Add context requirements
3. Adjust category weight in unified_config
4. Add to allowlist

```bash
# Update pattern score
docker exec vigil-nats nats kv get vigil-patterns injection-patterns > tmp.json
# Edit tmp.json, reduce score
docker exec vigil-nats nats kv put vigil-patterns injection-patterns "$(cat tmp.json)"
```

### Qdrant Search Not Working

```bash
# Check Qdrant health
curl http://localhost:6333/health

# Check collection exists
curl http://localhost:6333/collections/vigil_attack_patterns

# Check vector count
curl http://localhost:6333/collections/vigil_attack_patterns | jq '.result.points_count'
```

## Metrics & KPIs

```yaml
quality_metrics:
  redos_vulnerabilities: 0 (zero tolerance)
  false_positive_rate: <3%
  detection_effectiveness: >85%
  pattern_latency: <50ms (heuristics), <100ms (semantic)

coverage_metrics:
  heuristics_patterns: ~100 patterns
  semantic_vectors: ~1000 attack samples
  categories_covered: 15+
```

## Related Skills

- `nats-vigil-messaging` - NATS KV operations
- `vigil-testing-e2e` - Pattern testing
- `docker-vigil-orchestration` - Service management

## References

- Detection worker: `services/detection-worker/`
- Qdrant docs: https://qdrant.tech/documentation/
- NATS KV docs: https://docs.nats.io/nats-concepts/jetstream/key-value-store

## Version History

- **v3.0.0** (Current): Enterprise architecture - NATS KV, Qdrant, TypeScript workers
- **v2.0.0** (PoC): File-based patterns, heuristics-service, semantic-service
- **v1.x** (Legacy): Single rules.config.json
