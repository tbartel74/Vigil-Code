---
name: n8n-vigil-workflow
description: Expert guidance for n8n workflow development in Vigil Guard. Use when working with detection patterns, threat categories, sanitization engine, 40-node processing pipeline, workflow configuration, dual-language PII detection, language detection, or managing rules.config.json and unified_config.json files.
version: 1.6.11
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob]
---

# n8n Vigil Guard Workflow Development

## Overview
Comprehensive guidance for developing and maintaining the Vigil Guard n8n workflow engine - a 40-node sequential pipeline with dual-language PII detection (Polish + English), hybrid language detection, 34 threat categories, and ClickHouse logging.

## When to Use This Skill
- Adding new detection patterns to rules.config.json (829 lines)
- Modifying threat categories or base weights (34 categories)
- Configuring decision thresholds (ALLOW/SANITIZE/BLOCK)
- Configuring PII detection (Presidio dual-language mode)
- Configuring language detection (hybrid entity-based + statistical)
- Troubleshooting workflow nodes
- Understanding detection scoring algorithms
- Working with configuration files (NEVER modify directly!)
- Testing patterns via n8n chat interface

## ⚠️ Critical Constraints
**NEVER modify files in `services/workflow/config/` directly**
✅ **ALWAYS use the Web GUI** at http://localhost/ui/config/
- Configuration changes tracked with audit logs
- ETag concurrency control prevents conflicts
- Backup rotation maintains version history (max 2 backups per file)
- Variable mapping managed via `frontend/src/spec/variables.json`

## Detection Architecture

### 40-Node Processing Pipeline (v1.6.11)
```
1. Chat Input (webhook trigger)
2. Input_Validator (length, format, sanitization)
3. Language_Detector (hybrid: entity hints + statistical) [NEW v1.6.11]
4. PII_Redactor_v2 (dual Presidio calls: Polish + English) [NEW v1.6.10]
5. Normalize_Node (Unicode NFKC, max 3 iterations)
6. Bloom_Prefilter (1000-element filter, early rejection)
7. Allowlist_Validator (bypass detection for known-good)
8. Pattern_Matching_Engine (829-line rules.config.json, 34 categories)
9. Unified Decision Engine (score-based thresholds)
10. Correlation_Engine (pattern combination analysis)
11. Sanitization_Enforcement (Light: 10 categories, Heavy: all 34)
12. [Optional] Prompt_Guard_API (LLM validation)
13. Final_Decision (ALLOW/SANITIZE_LIGHT/SANITIZE_HEAVY/BLOCK)
14. Build+Sanitize NDJSON (logging structure)
15. Logging to ClickHouse (events_raw + events_processed)
16. Clean_Output (user-facing result)
```

### Decision Matrix
| Score Range | Action | Severity | Sanitization |
|------------|--------|----------|-------------|
| 0-29 | ALLOW | Clean | None |
| 30-64 | SANITIZE_LIGHT | Low | 10 categories |
| 65-84 | SANITIZE_HEAVY | Medium | All 34 categories |
| 85-100 | BLOCK | Critical | N/A (rejected) |

### 34 Detection Categories (v1.6.11)
**Critical Threats (6)**: CRITICAL_INJECTION, JAILBREAK_ATTEMPT, CONTROL_OVERRIDE, PROMPT_LEAK_ATTEMPT, GODMODE_JAILBREAK, DESTRUCTIVE_COMMANDS

**Security & Access (3)**: PRIVILEGE_ESCALATION, COMMAND_INJECTION, CREDENTIAL_HARVESTING

**Obfuscation & Manipulation (3)**: HEAVY_OBFUSCATION, FORMAT_COERCION, ENCODING_SUSPICIOUS

**Enhanced Categories**:
- **SQL_XSS_ATTACKS** (v1.4: base weight 30→50, +24 patterns)
- **MEDICAL_MISUSE** (v1.5: 60% detection, 0% FP)
- **PROMPT_LEAK** (v1.5: 38.3%→55.0%, +43% improvement)

See: `docs/DETECTION_CATEGORIES.md` for complete list

## Common Tasks

### Add Detection Pattern
**TDD Approach** (Recommended):
```bash
cd services/workflow

# 1. Create test first
cat > tests/fixtures/my-attack.json << 'EOF'
{
  "prompt": "malicious payload here",
  "expected": "BLOCKED"
}
EOF

# 2. Add to test suite (tests/e2e/bypass-scenarios.test.js)
# 3. Run test (should FAIL)
npm test -- bypass-scenarios.test.js

# 4. Add pattern via GUI at http://localhost/ui/config/
#    Navigate to: Detection Tuning → rules.config.json
#    Add pattern to appropriate category

# 5. Re-run test (should PASS)
npm test
```

### Modify Threshold Ranges
Access via GUI: http://localhost/ui/config/ → Quick Settings
- ALLOW_MAX: 0-29 (default)
- SANITIZE_LIGHT_MAX: 30-64
- SANITIZE_HEAVY_MAX: 65-84
- BLOCK_MIN: 85+

### Test Pattern Effectiveness
```bash
# Option 1: n8n Chat Interface
# 1. Open http://localhost:5678
# 2. Open Vigil-Guard-v1.4.json workflow
# 3. Click "Test workflow" → "Chat" tab
# 4. Send test prompts
# 5. Review detection scores

# Option 2: Automated Test Suite
cd services/workflow
npm test -- --grep "SQL injection"
```

## Configuration Files Reference

### unified_config.json
```json
{
  "normalization": { "unicode_form": "NFKC", "max_iterations": 3 },
  "sanitization": { "light": {}, "heavy": {} },
  "bloom_filter": { "enabled": true, "size": 1000 },
  "thresholds": { "allow_max": 29, "sanitize_light_max": 64 }
}
```

### rules.config.json
```json
{
  "categories": {
    "SQL_XSS_ATTACKS": {
      "base_weight": 50,
      "multiplier": 1.3,
      "patterns": ["SELECT.*FROM", "DROP TABLE", "<script>"]
    }
  }
}
```

Access editing via GUI only!

## Dual-Language PII Detection (v1.6.10+)

### Architecture Overview

**Language Detection Flow (v1.6.11):**
```
1. Normalize_Node → Normalized text
2. Language_Detector → Hybrid detection (entity hints + statistical)
   - Polish entities (PESEL, NIP, Polish keywords) → force Polish
   - Otherwise → langdetect statistical analysis
3. PII_Redactor_v2 → Dual Presidio calls (parallel)
4. Entity Deduplication → Merge overlapping entities
5. Masking/Anonymization → Final sanitized output
```

### Configuration (unified_config.json)

**PII Detection Section:**
```json
{
  "pii_detection": {
    "presidio_enabled": true,
    "language": "auto",                    // Hybrid detection
    "fallback_to_regex": true,             // If Presidio fails
    "score_threshold": 0.7,                // Entity confidence
    "dual_language_mode": true,            // NEW v1.6.10
    "entities_polish": [
      "PERSON",        // Only if text is Polish
      "PL_PESEL",      // Polish national ID
      "PL_NIP",        // Polish tax ID
      "PL_REGON",      // Polish business ID
      "EMAIL"
    ],
    "entities_international": [
      "EMAIL",
      "PHONE_NUMBER",
      "CREDIT_CARD",
      "IP_ADDRESS",
      "IBAN_CODE",
      "US_SSN",
      "UK_NHS"
    ]
  }
}
```

**Access via GUI:** Configuration → PII Detection

### Parallel Presidio Calls

**PII_Redactor_v2 Node Logic:**
```javascript
// 1. Language detection
const langResponse = await axios.post('http://vigil-language-detector:5002/detect', {
  text: normalizedText,
  detailed: false
}, { timeout: 1000 });

const detectedLang = langResponse.data.language; // 'pl' or 'en'

// 2. Hybrid logic: Entity-based hints override low-confidence detection
const isProbablyPolish = (detectedLang === 'pl') || hasPolishEntities(normalizedText);

// 3. Parallel Presidio API calls
const [plResults, enResults] = await Promise.all([
  // Polish model (PERSON + Polish IDs)
  axios.post('http://vigil-presidio-pii:5001/analyze', {
    text: normalizedText,
    language: 'pl',
    entities: isProbablyPolish ?
      ['PERSON', 'PL_PESEL', 'PL_NIP', 'PL_REGON', 'EMAIL'] :
      ['PL_PESEL', 'PL_NIP', 'PL_REGON'] // No PERSON for English text
  }),

  // English model (international PII)
  axios.post('http://vigil-presidio-pii:5001/analyze', {
    text: normalizedText,
    language: 'en',
    entities: ['EMAIL', 'PHONE_NUMBER', 'CREDIT_CARD', 'IP_ADDRESS', ...]
  })
]);

// 4. Deduplication: Merge results, remove overlaps
const allEntities = deduplicateEntities([
  ...plResults.data.entities,
  ...enResults.data.entities
]);
```

### Entity Deduplication Logic

**Why Needed:**
- Both models may detect same EMAIL or phone number
- Overlapping PERSON entities (Polish vs English NER)
- Credit card detected by both recognizers

**Algorithm:**
```javascript
function deduplicateEntities(entities) {
  // Sort by start position, then score (descending)
  entities.sort((a, b) => a.start !== b.start ? a.start - b.start : b.score - a.score);

  const deduplicated = [];
  for (const entity of entities) {
    // Check if overlaps with any existing entity
    const overlaps = deduplicated.some(existing =>
      (entity.start >= existing.start && entity.start < existing.end) ||
      (entity.end > existing.start && entity.end <= existing.end)
    );

    if (!overlaps) {
      deduplicated.push(entity);
    }
  }

  return deduplicated;
}
```

### Performance Metrics

**From Load Testing (v1.6.10):**
- **Avg latency:** 310ms (vs 150ms single-language, +107%)
- **Detection rate:** 96% (48/50 requests with PII detected)
- **Memory:** ~616MB (unchanged from single-language)
- **Timeout behavior:** Graceful (3000ms limit, fallback to regex)

### Language Statistics (ClickHouse Logging)

**Logged Fields:**
```json
{
  "pii": {
    "has": true,
    "entities_detected": 3,
    "detection_method": "presidio_dual_language",
    "processing_time_ms": 310,
    "language_stats": {
      "detected_language": "pl",
      "detection_method": "hybrid_entity_hints",
      "polish_entities": 2,
      "international_entities": 1,
      "total_after_dedup": 3
    },
    "entities": [
      { "type": "PL_PESEL", "start": 10, "end": 21, "score": 1.0 },
      { "type": "EMAIL", "start": 30, "end": 45, "score": 0.95 },
      { "type": "PHONE_NUMBER", "start": 50, "end": 62, "score": 0.85 }
    ]
  }
}
```

### Fallback Behavior

**Automatic Fallback Chain:**
```
1. Presidio dual-language (preferred)
   ↓ (if Presidio service unavailable)
2. Regex patterns from pii.conf (13 basic patterns)
   ↓ (if both fail)
3. Continue without PII redaction (log warning)
```

**Monitoring Fallback Rate:**
```sql
-- ClickHouse query
SELECT
  JSON_VALUE(sanitizer_json, '$.pii.detection_method') AS method,
  count() AS occurrences
FROM n8n_logs.events_processed
WHERE timestamp > now() - INTERVAL 1 DAY
GROUP BY method;

-- Expected:
-- presidio_dual_language: 95%+
-- regex_fallback: <5%
```

### Troubleshooting PII Detection

**Issue: PII not detected**
```bash
# 1. Check Presidio service health
curl http://localhost:5001/health

# 2. Check language detector health
curl http://localhost:5002/health

# 3. Test Presidio directly
curl -X POST http://localhost:5001/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "My email is test@example.com", "language": "en", "entities": ["EMAIL"]}'

# 4. Check n8n workflow logs
docker logs vigil-n8n | grep "PII_Redactor_v2"
```

**Issue: Wrong language detected**
```bash
# Check ClickHouse logs for language_stats
docker exec vigil-clickhouse clickhouse-client -q "
  SELECT
    original_input,
    JSON_VALUE(sanitizer_json, '$.pii.language_stats.detected_language') AS lang,
    JSON_VALUE(sanitizer_json, '$.pii.language_stats.detection_method') AS method
  FROM n8n_logs.events_processed
  ORDER BY timestamp DESC
  LIMIT 10
  FORMAT Pretty
"
```

### Version History

**Workflow Versions:**
- **v1.6.11** (Current): Hybrid language detection (entity-based hints + statistical)
- **v1.6.10**: Dual-language PII (parallel Presidio calls, entity deduplication)
- **v1.6.0**: Microsoft Presidio integration (replaced regex-only approach)
- **v1.5.0**: MEDICAL_MISUSE category, improved PROMPT_LEAK detection
- **v1.4.0**: Enhanced SQL_XSS_ATTACKS, browser extension support
- **v1.3.0**: Investigation Panel integration
- **v1.2.0**: Authentication & RBAC
- **v1.1.0**: Grafana monitoring, ClickHouse logging
- **v1.0.0**: Initial release

## Workflow Nodes (Key)

### Pattern_Matching_Engine
- Regex matching against 29+ categories
- Encoding detection bonus (+45 base64, +30 URL, +35 hex)
- Score accumulation across categories
- Logs to `scoreBreakdown.ENCODING_DETECTED`

### Unified Decision Engine
- Evaluates total score vs thresholds
- Returns: ALLOW/SANITIZE_LIGHT/SANITIZE_HEAVY/BLOCK
- Factors: base_weight × multiplier per category

### Sanitization_Enforcement
- LIGHT: Removes LOW/MEDIUM severity patterns (10 categories)
- HEAVY: Removes ALL detected patterns (33 categories)
- Uses patterns from Pattern_Matching_Engine (not hardcoded)

## Best Practices
1. **Always write tests first** (TDD approach)
2. **Use GUI for all config changes** (never edit files directly)
3. **Test in n8n chat** before production
4. **Monitor ClickHouse logs** for false positives
5. **Document pattern rationale** in git commits
6. **Keep base_weight conservative** (30-60 range)
7. **Use multipliers** for severity adjustment (1.0-2.0)

## Integration Points
- **ClickHouse**: Logs to `n8n_logs.events_processed` table
- **Prompt Guard API**: External LLM validation (optional)
- **Web UI**: Configuration management via REST API
- **Browser Extension**: Webhook endpoint for client-side protection

## Troubleshooting

### Pattern Not Triggering
```bash
# 1. Verify pattern syntax
echo "test payload" | grep -P "your_regex_pattern"

# 2. Check category is enabled
curl http://localhost:8787/api/parse/rules.config.json

# 3. Verify scoring in n8n chat
# Send test prompt → check scoreBreakdown in response
```

### False Positives
```bash
# Report via GUI:
# http://localhost/ui/monitoring → Investigation Panel
# → Search for prompt → Click "Report False Positive"

# Check stats:
# GET /api/feedback/stats
```

## Related Skills
- `vigil-testing-e2e` - For writing comprehensive tests
- `clickhouse-grafana-monitoring` - For analyzing detection metrics
- `react-tailwind-vigil-ui` - For GUI configuration interface
- `vigil-security-patterns` - For security best practices

## References
- Workflow JSON: `services/workflow/workflows/Vigil-Guard-v1.4.json`
- Config docs: `docs/CONFIGURATION.md`
- Detection guide: `docs/DETECTION_CATEGORIES.md`
- Sanitization fix: `docs/SANITIZATION_FIX_2025-10-20.md`
