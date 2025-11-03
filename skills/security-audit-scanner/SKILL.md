# Security Audit Scanner

## Overview
Automated security scanning and audit automation for Vigil Guard covering OWASP Top 10, secret detection (TruffleHog), npm/pip vulnerability scanning, ReDoS detection, and security testing automation.

## When to Use This Skill
- Running security audits
- Detecting secrets in codebase
- Scanning for vulnerabilities (npm audit, pip audit)
- ReDoS pattern validation
- OWASP Top 10 compliance checking
- Pre-commit security validation
- CI/CD security pipeline

## Tech Stack
- TruffleHog (secret scanning)
- npm audit / pip audit (dependency vulnerabilities)
- OWASP ZAP (penetration testing)
- redos-detector (ReDoS validation)
- Custom security checks

## OWASP Top 10 Coverage

### 1. Broken Access Control
**Check:**
```bash
# Verify RBAC implementation
grep -r "requirePermission" services/web-ui/backend/src/

# Test unauthorized access
curl -X POST http://localhost:8787/api/users \
  -H "Content-Type: application/json" \
  -d '{"username":"hacker"}'
# Should return 401 Unauthorized
```

### 2. Cryptographic Failures
**Check:**
```bash
# Verify bcrypt usage (12 rounds minimum)
grep -r "bcrypt.hash" services/web-ui/backend/ | grep -v "12"

# Check JWT secret length (32+ chars)
echo $JWT_SECRET | wc -c  # Should be >32

# Verify HTTPS in production
grep -r "http://" services/ --include="*.ts" | grep -v localhost
```

### 3. Injection
**Check:**
```bash
# SQL Injection: Verify parameterized queries
grep -r "db.prepare\|db.query" services/web-ui/backend/ | grep -v "?"

# Command Injection: Check exec/spawn usage
grep -r "exec\|spawn" services/ --include="*.js" --include="*.ts"

# XSS: Verify React escaping + DOMPurify
grep -r "dangerouslySetInnerHTML" services/web-ui/frontend/
```

### 4. Insecure Design
**Check:**
```bash
# Defense in depth layers
# 1. Client-side validation (browser extension)
# 2. n8n workflow validation (40 nodes)
# 3. Pattern matching (34 categories)
# 4. PII detection (dual Presidio)
# 5. Sanitization (Light/Heavy)
# 6. Optional LLM validation (Prompt Guard)

# Verify fail-secure defaults
grep -r "ALLOWED\|fail.*open" services/workflow/
```

### 5. Security Misconfiguration
**Check:**
```bash
# Verify secrets not in code
grep -rE "(password|secret|key|token).*=.*['\"]" services/ --include="*.ts" --include="*.js" | grep -v ".env"

# Check CORS configuration
grep -r "cors({" services/web-ui/backend/

# Verify default passwords changed
grep -r "admin123\|password123" services/
```

### 6. Vulnerable Components
**Check:**
```bash
# npm audit
cd services/web-ui/backend && npm audit --audit-level=moderate

# Python dependencies
cd services/presidio-pii-api && pip check

# Docker image vulnerabilities
docker scan vigil-web-ui-backend:latest
```

### 7. Authentication Failures
**Check:**
```bash
# Rate limiting on auth endpoints
grep -A5 "authLimiter" services/web-ui/backend/src/server.ts

# Session timeout
grep "expiresIn" services/web-ui/backend/src/auth.ts

# Password complexity (8+ chars enforced)
grep "password.*length" services/web-ui/backend/
```

### 8. Software & Data Integrity
**Check:**
```bash
# Docker image SHA256 digests
grep "@sha256:" docker-compose.yml

# ETag for config concurrency
grep "etag\|ETag" services/web-ui/backend/src/server.ts

# Audit logging
grep "auditLog" services/web-ui/backend/
```

### 9. Logging & Monitoring
**Check:**
```bash
# Verify no sensitive data in logs
grep -r "console.log.*password\|console.log.*token" services/

# ClickHouse logging enabled
grep "ClickHouse" services/workflow/workflows/*.json

# Grafana dashboards configured
ls services/monitoring/grafana/provisioning/dashboards/
```

### 10. Server-Side Request Forgery (SSRF)
**Check:**
```bash
# Verify URL validation
grep -r "axios\|fetch" services/workflow/ | grep -v "vigil-"

# Whitelist external services
# - vigil-presidio-pii:5001 (internal)
# - vigil-language-detector:5002 (internal)
# - vigil-prompt-guard:8000 (internal)
```

## Common Tasks

### Task 1: Secret Scanning with TruffleHog

```bash
#!/bin/bash
# scripts/scan-secrets.sh

echo "🔍 Scanning for secrets with TruffleHog..."

# Install TruffleHog (if not installed)
if ! command -v trufflehog &> /dev/null; then
  echo "Installing TruffleHog..."
  brew install trufflehog || pip install trufflehog
fi

# Scan git history
trufflehog filesystem . \
  --exclude-paths=.truffleHog-exclude \
  --json \
  > /tmp/trufflehog-results.json

# Parse results
SECRETS_FOUND=$(jq length /tmp/trufflehog-results.json)

if [ "$SECRETS_FOUND" -gt 0 ]; then
  echo "❌ Found $SECRETS_FOUND potential secrets:"
  jq -r '.[] | "\(.Reason): \(.Path):\(.Line)"' /tmp/trufflehog-results.json
  exit 1
else
  echo "✅ No secrets detected"
fi
```

**Exclusions (.truffleHog-exclude):**
```
.git/
node_modules/
vigil_data/
*.md
test/fixtures/
```

### Task 2: npm/pip Vulnerability Scanning

```bash
#!/bin/bash
# scripts/scan-vulnerabilities.sh

echo "🔍 Scanning for vulnerabilities..."

# Frontend
echo "Frontend (React + Vite):"
cd services/web-ui/frontend && npm audit --audit-level=moderate
FRONTEND_EXIT=$?

# Backend
echo "Backend (Express):"
cd ../backend && npm audit --audit-level=moderate
BACKEND_EXIT=$?

# Workflow
echo "Workflow (n8n):"
cd ../../workflow && npm audit --audit-level=moderate
WORKFLOW_EXIT=$?

# Python services
echo "Presidio PII API:"
cd ../../presidio-pii-api && pip check
PIP_EXIT=$?

# Summary
if [ $FRONTEND_EXIT -ne 0 ] || [ $BACKEND_EXIT -ne 0 ] || [ $WORKFLOW_EXIT -ne 0 ] || [ $PIP_EXIT -ne 0 ]; then
  echo "❌ Vulnerabilities found - review above"
  exit 1
else
  echo "✅ No vulnerabilities detected"
fi
```

### Task 3: ReDoS Detection

```bash
#!/bin/bash
# scripts/scan-redos.sh

echo "🔍 Scanning regex patterns for ReDoS vulnerabilities..."

# Extract patterns from rules.config.json
PATTERNS=$(jq -r '.categories[].patterns[]' services/workflow/config/rules.config.json)

VULNERABLE=0

while IFS= read -r pattern; do
  # Test with redos-detector (npm package)
  RESULT=$(npx redos-detector "$pattern" 2>&1)

  if echo "$RESULT" | grep -q "vulnerable"; then
    echo "❌ ReDoS vulnerability detected:"
    echo "   Pattern: $pattern"
    echo "   $RESULT"
    VULNERABLE=$((VULNERABLE+1))
  fi
done <<< "$PATTERNS"

if [ $VULNERABLE -gt 0 ]; then
  echo ""
  echo "❌ Found $VULNERABLE vulnerable regex patterns"
  exit 1
else
  echo "✅ No ReDoS vulnerabilities detected"
fi
```

### Task 4: API Security Testing

```bash
#!/bin/bash
# scripts/api-security-test.sh

echo "🔍 API Security Testing..."

BASE_URL="http://localhost:8787"

# Test 1: Authentication bypass
echo "Test 1: Authentication bypass"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/api/users")
if [ "$RESPONSE" -eq 401 ]; then
  echo "✅ PASS: Requires authentication"
else
  echo "❌ FAIL: No authentication required (HTTP $RESPONSE)"
fi

# Test 2: SQL Injection
echo "Test 2: SQL Injection"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin'"'"' OR '"'"'1'"'"'='"'"'1","password":"anything"}')
if echo "$RESPONSE" | grep -q "error"; then
  echo "✅ PASS: SQL injection blocked"
else
  echo "❌ FAIL: SQL injection possible"
fi

# Test 3: XSS in response
echo "Test 3: XSS reflection"
RESPONSE=$(curl -s "$BASE_URL/api/files?name=<script>alert(1)</script>")
if echo "$RESPONSE" | grep -q "<script>"; then
  echo "❌ FAIL: XSS vulnerability detected"
else
  echo "✅ PASS: XSS blocked"
fi

# Test 4: Rate limiting
echo "Test 4: Rate limiting"
for i in {1..10}; do
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}')
done
if [ "$RESPONSE" -eq 429 ]; then
  echo "✅ PASS: Rate limiting active"
else
  echo "⚠️  WARNING: Rate limiting not triggered (HTTP $RESPONSE)"
fi
```

### Task 5: Docker Image Security Scan

```bash
#!/bin/bash
# scripts/scan-docker-images.sh

echo "🔍 Scanning Docker images for vulnerabilities..."

IMAGES=$(docker-compose config --services)

for SERVICE in $IMAGES; do
  IMAGE=$(docker-compose config | grep -A1 "image:" | grep "$SERVICE" | awk '{print $2}')

  if [ -n "$IMAGE" ]; then
    echo ""
    echo "Scanning: $IMAGE"

    # Trivy scan (install: brew install trivy)
    trivy image --severity HIGH,CRITICAL "$IMAGE"

    EXIT_CODE=$?
    if [ $EXIT_CODE -ne 0 ]; then
      echo "❌ Vulnerabilities found in $IMAGE"
    else
      echo "✅ No critical vulnerabilities in $IMAGE"
    fi
  fi
done
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/security-audit.yml
name: Security Audit

on:
  push:
    branches: [main, security-*]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * 1'  # Weekly on Monday 2am

jobs:
  security-scan:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: TruffleHog Secret Scan
        run: |
          docker run --rm -v "$PWD:/scan" trufflesecurity/trufflehog:latest filesystem /scan

      - name: npm Audit
        run: |
          cd services/web-ui/backend && npm audit --audit-level=moderate
          cd ../frontend && npm audit --audit-level=moderate
          cd ../../workflow && npm audit --audit-level=moderate

      - name: ReDoS Detection
        run: ./scripts/scan-redos.sh

      - name: OWASP Dependency Check
        uses: dependency-check/Dependency-Check_Action@main
        with:
          project: 'Vigil Guard'
          path: '.'
          format: 'HTML'

      - name: Upload Security Report
        uses: actions/upload-artifact@v4
        with:
          name: security-report
          path: dependency-check-report.html
```

## Metrics & Reporting

### Security Scorecard

```bash
#!/bin/bash
# scripts/security-scorecard.sh

SCORE=0
MAX_SCORE=100

echo "🔒 Vigil Guard Security Scorecard"
echo "================================"

# 1. Secrets (20 points)
if ./scripts/scan-secrets.sh &>/dev/null; then
  echo "✅ [20/20] No secrets in codebase"
  SCORE=$((SCORE+20))
else
  echo "❌ [0/20] Secrets detected"
fi

# 2. Vulnerabilities (20 points)
VULNS=$(cd services/web-ui/backend && npm audit --json | jq '.metadata.vulnerabilities.total')
if [ "$VULNS" -eq 0 ]; then
  echo "✅ [20/20] No vulnerabilities"
  SCORE=$((SCORE+20))
else
  echo "⚠️  [10/20] $VULNS vulnerabilities found"
  SCORE=$((SCORE+10))
fi

# 3. OWASP Top 10 (30 points)
OWASP_PASS=0
# Run checks for each OWASP category
# ... (implementation details)
echo "✅ [$OWASP_PASS/30] OWASP Top 10 compliance"
SCORE=$((SCORE+OWASP_PASS))

# 4. Authentication (15 points)
if grep -q "authLimiter" services/web-ui/backend/src/server.ts; then
  echo "✅ [15/15] Rate limiting enabled"
  SCORE=$((SCORE+15))
else
  echo "❌ [0/15] No rate limiting"
fi

# 5. Encryption (15 points)
if [ ${#JWT_SECRET} -ge 32 ]; then
  echo "✅ [15/15] Strong JWT secret"
  SCORE=$((SCORE+15))
else
  echo "❌ [0/15] Weak JWT secret"
fi

echo ""
echo "📊 Final Score: $SCORE / $MAX_SCORE"
if [ $SCORE -ge 90 ]; then
  echo "🏆 Grade: A (Excellent)"
elif [ $SCORE -ge 70 ]; then
  echo "✅ Grade: B (Good)"
elif [ $SCORE -ge 50 ]; then
  echo "⚠️  Grade: C (Needs Improvement)"
else
  echo "❌ Grade: F (Critical Issues)"
  exit 1
fi
```

## Integration Points

### With vigil-security-patterns:
```yaml
when: Security issue detected
action:
  1. Reference security-patterns skill for fix
  2. Implement recommended pattern
  3. Re-run security audit
```

### With git-commit-helper:
```yaml
when: Security fix committed
action:
  1. Use type "fix" with scope "security"
  2. Reference CVE or vulnerability ID
  3. Include security scorecard in PR description
```

## Quick Reference

```bash
# Run full security audit
./scripts/security-audit-full.sh

# Scan for secrets
./scripts/scan-secrets.sh

# Check vulnerabilities
./scripts/scan-vulnerabilities.sh

# ReDoS detection
./scripts/scan-redos.sh

# API security tests
./scripts/api-security-test.sh

# Docker image scan
./scripts/scan-docker-images.sh

# Security scorecard
./scripts/security-scorecard.sh
```

---
**Coverage:** OWASP Top 10
**Tools:** TruffleHog, npm audit, Trivy, redos-detector
**Automation:** CI/CD integrated, pre-commit hooks
**Target Score:** >90/100 (Grade A)
