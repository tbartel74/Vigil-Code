---
name: code-audit-vigil
description: |
  Vigil Guard project-specific code audit context. Maps 10 audit categories
  to specific directories, files, and technologies. Includes custom checks
  for n8n workflows, Presidio PII detection, ClickHouse analytics, and the
  40-node detection pipeline.
version: 1.8.1
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob]
---

# Vigil Guard Code Audit Skill

## Overview

This skill provides Vigil Guard project-specific context for the code-audit-expert agent. It maps the universal 10-category audit framework to Vigil Guard's specific architecture, technologies, and quality standards.

## When to Use This Skill

- Running project-specific code audits
- Verifying Vigil Guard architecture compliance
- Checking n8n workflow quality
- Validating Presidio PII detection patterns
- Assessing ClickHouse schema design
- Reviewing detection pattern quality
- Evaluating test suite coverage (100+ tests)

## Project Directory Mapping

### Category → Directory Matrix

| Category | Primary Directories | Key Files | Technologies |
|----------|---------------------|-----------|--------------|
| Structure | `services/`, `.claude/` | `docker-compose.yml` | Docker, monorepo |
| Readability | `services/web-ui/` | `*.ts`, `*.tsx` | TypeScript, React |
| Testability | `services/workflow/tests/` | `vitest.config.js` | Vitest, fixtures |
| CI/CD | `.github/workflows/` | `*.yml` | GitHub Actions |
| Security | `services/web-ui/backend/` | `auth.ts`, `server.ts` | JWT, bcrypt |
| Observability | `services/monitoring/` | `grafana/`, `clickhouse/` | ClickHouse, Grafana |
| Tech Debt | `services/workflow/config/` | `rules.config.json` | n8n, JSON |
| Documentation | `docs/`, `README.md` | `*.md` | Markdown |
| Performance | `services/workflow/` | `workflows/*.json` | n8n, 40 nodes |
| DDD | `services/` | all service directories | Microservices |

### Service Architecture

```
vigil-guard/
├── services/
│   ├── workflow/                   # n8n detection engine (CRITICAL)
│   │   ├── config/                 # ⚠️ NEVER edit directly! Use Web UI
│   │   │   ├── rules.config.json   # 829 lines, 34 categories
│   │   │   ├── unified_config.json # 4013 lines, main settings
│   │   │   └── pii.conf            # PII regex patterns
│   │   ├── tests/                  # 100+ Vitest tests
│   │   │   ├── e2e/                # Integration tests
│   │   │   └── fixtures/           # Test payloads
│   │   └── workflows/              # n8n JSON exports
│   │       └── Vigil-Guard-vX.X.X.json
│   │
│   ├── web-ui/
│   │   ├── frontend/               # React 18 + Vite + Tailwind v4
│   │   │   ├── src/components/     # UI components
│   │   │   └── src/routes.tsx      # Routing
│   │   └── backend/                # Express + JWT + SQLite
│   │       └── src/server.ts       # API endpoints
│   │
│   ├── presidio-pii-api/           # Dual-language PII (v1.6.11)
│   ├── language-detector/          # Hybrid detection (v1.0.1)
│   ├── monitoring/                 # ClickHouse + Grafana
│   └── proxy/                      # Caddy reverse proxy
│
├── prompt-guard-api/               # Llama Prompt Guard LLM
├── plugin/                         # Chrome extension (manifest v3)
├── docs/                           # 20+ guides
└── scripts/                        # install.sh, status.sh
```

## Vigil Guard-Specific Checks

### 1. n8n Workflow Quality (40-node pipeline)

**Audit Focus:**
- Sequential processing integrity
- Code node JavaScript quality
- Error handling in nodes
- Connection consistency

**Commands:**
```bash
# Count nodes in workflow
jq '.nodes | length' services/workflow/workflows/Vigil-Guard-*.json

# Check for Code nodes
jq '.nodes[] | select(.type == "n8n-nodes-base.code") | .name' \
  services/workflow/workflows/Vigil-Guard-*.json

# Find nodes without error handling
jq '.nodes[] | select(.onError == null) | .name' \
  services/workflow/workflows/Vigil-Guard-*.json

# Check workflow version consistency
grep -r "pipeline_version" services/workflow/
```

**Quality Criteria:**
- [ ] All 40 nodes connected (no orphans)
- [ ] Code nodes use try-catch
- [ ] Variables use consistent naming
- [ ] No hardcoded values in Code nodes
- [ ] Comments explain complex logic

**Scoring Adjustments:**
- +2 pts if all Code nodes have try-catch
- -2 pts if orphan nodes exist
- -1 pt per hardcoded value in Code nodes

---

### 2. Presidio Integration Quality (dual-language)

**Audit Focus:**
- Entity type configuration
- Language routing (Polish first)
- Deduplication logic
- Performance (<310ms)

**Commands:**
```bash
# Check Presidio service status
curl -s http://localhost:5001/health | jq

# Test dual-language detection
curl -s -X POST http://localhost:5001/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "PESEL: 12345678901", "language": "pl"}' | jq '.entities | length'

# Check entity configuration
cat services/workflow/config/unified_config.json | jq '.pii_detection'

# Find Presidio calls in backend
grep -rn "presidio\|/analyze" services/web-ui/backend/src/
```

**Quality Criteria:**
- [ ] Polish language first in array (PESEL detection)
- [ ] Entity deduplication implemented
- [ ] Error handling for Presidio failures
- [ ] Timeout configured (<500ms)
- [ ] Fallback regex patterns in pii.conf

**Scoring Adjustments:**
- +2 pts if dual-language working correctly
- -3 pts if language order wrong (Polish must be first)
- -2 pts if no Presidio timeout configured

---

### 3. ClickHouse Schema Quality (TTL, partitions)

**Audit Focus:**
- Table schema design
- Partitioning strategy
- TTL policies
- Index efficiency

**Commands:**
```bash
# Check ClickHouse tables
docker exec vigil-clickhouse clickhouse-client \
  --user admin --password "$CLICKHOUSE_PASSWORD" \
  -q "SHOW TABLES FROM n8n_logs"

# Check table schema
docker exec vigil-clickhouse clickhouse-client \
  --user admin --password "$CLICKHOUSE_PASSWORD" \
  -q "DESCRIBE n8n_logs.workflow_logs"

# Check TTL policies
docker exec vigil-clickhouse clickhouse-client \
  --user admin --password "$CLICKHOUSE_PASSWORD" \
  -q "SELECT name, engine, partition_key, sorting_key FROM system.tables WHERE database = 'n8n_logs'"

# Check retention settings
cat services/workflow/config/unified_config.json | jq '.clickhouse_settings'
```

**Quality Criteria:**
- [ ] Partitioning by date (toYYYYMMDD)
- [ ] TTL configured (30-90 days default)
- [ ] Appropriate MergeTree engine
- [ ] Indexes on frequent query columns
- [ ] Map type for score_breakdown

**Scoring Adjustments:**
- +2 pts if TTL and partitioning optimal
- -2 pts if no partitioning
- -1 pt if indexes missing on hot columns

---

### 4. Detection Pattern Quality (ReDoS risk)

**Audit Focus:**
- Regex complexity
- ReDoS vulnerability
- Pattern coverage
- False positive rate

**Commands:**
```bash
# Count patterns in rules.config.json
jq '.categories | length' services/workflow/config/rules.config.json
jq '[.categories[].patterns[]] | length' services/workflow/config/rules.config.json

# Extract all regex patterns
jq -r '.categories[].patterns[]' services/workflow/config/rules.config.json > /tmp/patterns.txt

# Check for ReDoS-prone patterns (nested quantifiers)
grep -E "\+\+|\*\*|\+\*|\*\+" /tmp/patterns.txt

# Check for catastrophic backtracking
grep -E "\(.*\)\+" /tmp/patterns.txt | head -10

# Run ReDoS detector (if available)
# npx redos-detector "$(cat /tmp/patterns.txt)"
```

**Quality Criteria:**
- [ ] No nested quantifiers (++, **, etc.)
- [ ] Timeout per pattern (1 second max)
- [ ] Patterns tested with edge cases
- [ ] False positive rate <5%
- [ ] Documentation for complex patterns

**Scoring Adjustments:**
- +2 pts if all patterns ReDoS-safe
- -3 pts per ReDoS-vulnerable pattern
- -1 pt if pattern timeout not configured

---

### 5. Test Suite Quality (100+ tests, OWASP AITG)

**Audit Focus:**
- Test coverage
- OWASP AITG compliance
- Test organization
- Fixture quality

**Commands:**
```bash
# Count test files
find services/workflow/tests -name "*.test.js" | wc -l

# Count total tests
grep -rn "it\|test\|describe" services/workflow/tests/ --include="*.test.js" | wc -l

# Check OWASP AITG tests
ls services/workflow/tests/e2e/owasp-aitg-*.test.js 2>/dev/null | wc -l

# Run test suite with coverage
cd services/workflow && npm test -- --coverage

# Check fixture organization
find services/workflow/tests/fixtures -type f | wc -l
```

**OWASP AITG Compliance:**
- [ ] APP-01: Direct prompt injection (96% target)
- [ ] APP-02: Indirect prompt injection (82.5% target)
- [ ] APP-07: Prompt extraction attempts
- [ ] APP-08: Jailbreak attempts

**Quality Criteria:**
- [ ] 100+ tests passing
- [ ] OWASP AITG: APP-01 >90%, APP-02 >80%
- [ ] E2E tests for critical flows
- [ ] Fixtures organized by attack type
- [ ] Test timeout <30s per file

**Scoring Adjustments:**
- +3 pts if OWASP AITG targets met
- -2 pts if <80 tests
- -1 pt if test timeouts occur

---

## Quick Audit Commands

### Full Vigil Guard Audit

```bash
#!/bin/bash
# scripts/vigil-audit-full.sh

echo "=== Vigil Guard Full Audit ==="
echo ""

# 1. Structure
echo "## 1. Structure"
docker-compose config --services | wc -l
echo "Services configured: $(docker-compose config --services | wc -l)"

# 2. Readability
echo "## 2. Readability"
find services/web-ui -name "*.ts" -exec wc -l {} + | awk '$1 > 500 {count++} END {print "Files >500 lines:", count}'

# 3. Testability
echo "## 3. Testability"
cd services/workflow && npm test -- --reporter=dot 2>/dev/null | tail -3

# 4. CI/CD
echo "## 4. CI/CD"
ls .github/workflows/*.yml 2>/dev/null | wc -l

# 5. Security
echo "## 5. Security"
cd services/web-ui/backend && npm audit --audit-level=moderate 2>&1 | tail -3

# 6. Observability
echo "## 6. Observability"
curl -s http://localhost:5001/health | jq -r '.status // "DOWN"'
curl -s http://localhost:5002/health | jq -r '.status // "DOWN"'

# 7. Tech Debt
echo "## 7. Tech Debt"
grep -rn "TODO\|FIXME" services/ --include="*.ts" --include="*.js" | wc -l

# 8. Documentation
echo "## 8. Documentation"
find docs -name "*.md" | wc -l

# 9. Performance (workflow node count)
echo "## 9. Performance"
jq '.nodes | length' services/workflow/workflows/Vigil-Guard-*.json 2>/dev/null | tail -1

# 10. DDD
echo "## 10. DDD"
ls -d services/*/ | wc -l
```

### Quick Security Scan

```bash
#!/bin/bash
# scripts/vigil-audit-security.sh

echo "=== Vigil Guard Security Scan ==="

# npm vulnerabilities
echo "## npm Vulnerabilities"
for dir in services/web-ui/backend services/web-ui/frontend services/workflow; do
  echo "Checking $dir..."
  cd "$dir" && npm audit --json 2>/dev/null | jq '.metadata.vulnerabilities.total // 0'
  cd - > /dev/null
done

# Hardcoded secrets
echo ""
echo "## Potential Hardcoded Secrets"
grep -rn "password\s*=\s*['\"]" services/ --include="*.ts" --include="*.js" | grep -v "test\|spec" | head -5

# JWT configuration
echo ""
echo "## JWT Configuration"
grep -rn "JWT_SECRET\|expiresIn" services/web-ui/backend/src/ --include="*.ts"

# Rate limiting
echo ""
echo "## Rate Limiting"
grep -rn "rateLimit\|limiter" services/web-ui/backend/src/ --include="*.ts"
```

### Test Suite Check

```bash
#!/bin/bash
# scripts/vigil-audit-tests.sh

echo "=== Vigil Guard Test Suite ==="

cd services/workflow

# Run all tests
echo "## Running Test Suite"
npm test -- --reporter=verbose 2>&1 | tee /tmp/test-results.txt

# Parse results
echo ""
echo "## Summary"
grep -E "Tests:|Pass:|Fail:" /tmp/test-results.txt

# OWASP AITG results
echo ""
echo "## OWASP AITG Compliance"
grep -A1 "owasp-aitg" /tmp/test-results.txt
```

---

## Integration Points

### With security-audit-scanner
```yaml
when: Security category audit
action:
  1. Load security-audit-scanner skill
  2. Run OWASP Top 10 checks
  3. Run npm/pip vulnerability scanning
  4. Merge results into audit report
```

### With vigil-testing-e2e
```yaml
when: Testability category audit
action:
  1. Load vigil-testing-e2e skill
  2. Run full test suite
  3. Calculate coverage metrics
  4. Identify untested critical paths
```

### With clickhouse-grafana-monitoring
```yaml
when: Observability category audit
action:
  1. Load clickhouse-grafana-monitoring skill
  2. Verify schema design
  3. Check dashboard coverage
  4. Validate retention policies
```

### With n8n-vigil-workflow
```yaml
when: Performance category audit (workflow)
action:
  1. Load n8n-vigil-workflow skill
  2. Analyze 40-node pipeline
  3. Check Code node quality
  4. Verify error handling
```

---

## Audit Thresholds (Vigil Guard Specific)

### Production-Ready Thresholds

| Category | Minimum Score | Target Score | Critical Threshold |
|----------|---------------|--------------|-------------------|
| Structure | 7/10 | 9/10 | <5 = BLOCK |
| Readability | 6/10 | 8/10 | <4 = BLOCK |
| Testability | 7/10 | 9/10 | <6 = BLOCK |
| CI/CD | 3/5 | 5/5 | <2 = BLOCK |
| Security | 8/10 | 10/10 | <7 = BLOCK |
| Observability | 3/5 | 5/5 | <2 = WARNING |
| Tech Debt | 6/10 | 8/10 | <4 = WARNING |
| Documentation | 3/5 | 4/5 | <2 = WARNING |
| Performance | 3/5 | 5/5 | <2 = WARNING |
| DDD | 3/5 | 4/5 | <2 = WARNING |
| **TOTAL** | **60/100** | **80/100** | **<50 = FAIL** |

### Version-Specific Requirements

**v1.7.9+ (Current):**
- Aho-Corasick prefilter: 993 keywords
- OWASP AITG: APP-01 ≥96%, APP-02 ≥82.5%
- Detection categories: 44
- Test count: 160+

**v1.6.11 (Legacy):**
- Detection categories: 34
- Test count: 100+
- PII detection: dual-language

---

## Output Files

### audit-report.json

**Location:** `.claude/state/audit-report.json`

**Structure:**
```json
{
  "metadata": {
    "audit_id": "vigil-audit-20251208-xyz",
    "project": "vigil-guard",
    "version": "1.7.9",
    "scope": "full"
  },
  "summary": {
    "total_score": 78,
    "grade": "B",
    "production_ready": true
  },
  "categories": { /* ... */ },
  "leverage_points": [ /* top 5-10 */ ],
  "vigil_specific": {
    "workflow_nodes": 40,
    "test_count": 165,
    "owasp_aitg": {
      "app01": 96,
      "app02": 82.5
    },
    "presidio_languages": ["pl", "en"]
  }
}
```

### AUDIT_SUMMARY.md

**Location:** `docs/AUDIT_SUMMARY.md`

**Structure:**
```markdown
# Vigil Guard Audit Summary

**Date:** 2025-12-08
**Version:** 1.7.9
**Grade:** B (78/100)
**Status:** Production Ready ✅

## Executive Summary
[2-3 sentence overview]

## Category Scores
| Category | Score | Rating |
|----------|-------|--------|
| ... | ... | ... |

## Top 5 Leverage Points
1. [Most impactful improvement]
2. ...

## Vigil Guard Specific
- Workflow: 40 nodes, all connected
- Tests: 165 passing, OWASP AITG compliant
- Security: 0 critical vulnerabilities
```

---

## Quick Reference

### Key Files to Always Check

| File | Why | What to Look For |
|------|-----|------------------|
| `docker-compose.yml` | Service orchestration | 9 services, healthchecks |
| `services/workflow/config/rules.config.json` | Detection patterns | 829 lines, no ReDoS |
| `services/workflow/config/unified_config.json` | Main config | 4013 lines, version |
| `services/web-ui/backend/src/server.ts` | API security | JWT, rate limiting |
| `services/workflow/tests/` | Test coverage | 100+ tests |

### Emergency Checks

```bash
# Is everything running?
./scripts/status.sh

# Any critical vulnerabilities?
cd services/web-ui/backend && npm audit --audit-level=high

# Are tests passing?
cd services/workflow && npm test -- --reporter=dot

# Is PII detection working?
curl -s http://localhost:5001/health | jq '.status'
```

---

**Coverage:** Vigil Guard v1.7.9
**Technologies:** n8n, Presidio, ClickHouse, React, Express
**Test Target:** 160+ tests, OWASP AITG compliant
**Security Target:** 0 critical, <3 high vulnerabilities
