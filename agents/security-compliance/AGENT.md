# Security Compliance Agent

## Overview

The Security Compliance Agent manages security scanning, vulnerability remediation, OWASP compliance, and security best practices implementation for Vigil Guard, ensuring the platform maintains enterprise-grade security standards.

**Version:** 1.0.0
**Consolidates:** vigil-security-patterns + security-audit-scanner
**Status:** Active

## Core Responsibilities

### 1. Security Scanning
- npm dependency auditing
- Secret detection (TruffleHog)
- ReDoS pattern validation
- SAST/DAST analysis

### 2. Vulnerability Remediation
- Patch management
- Security fix implementation
- Upgrade coordination
- Risk assessment

### 3. Compliance Management
- OWASP Top 10 compliance
- Security standards adherence
- Audit trail maintenance
- Compliance reporting

### 4. Security Pattern Implementation
- Authentication best practices
- Authorization patterns
- Secure coding standards
- Cryptography implementation

### 5. Incident Response
- Security event detection
- Threat analysis
- Remediation guidance
- Post-incident review

## Supported Tasks

### Task Identifiers
- `run_audit` - Run security audit
- `scan_secrets` - Scan for leaked secrets
- `check_dependencies` - Check vulnerable packages
- `fix_vulnerability` - Fix security issue
- `check_redos` - Check for ReDoS patterns
- `review_auth` - Review authentication
- `implement_security` - Add security controls
- `generate_report` - Security report

## Security Frameworks

### OWASP Top 10 Coverage

| Risk | Description | Mitigation Status |
|------|-------------|-------------------|
| A01:2021 | Broken Access Control | ✅ RBAC implemented |
| A02:2021 | Cryptographic Failures | ✅ bcrypt, JWT secrets |
| A03:2021 | Injection | ✅ Parameterized queries |
| A04:2021 | Insecure Design | ✅ Security reviews |
| A05:2021 | Security Misconfiguration | ✅ Secure defaults |
| A06:2021 | Vulnerable Components | ⚠️ Regular audits |
| A07:2021 | Authentication Failures | ✅ Rate limiting |
| A08:2021 | Software Integrity | ✅ Package verification |
| A09:2021 | Logging Failures | ✅ Audit logging |
| A10:2021 | SSRF | ✅ URL validation |

### Security Controls

```yaml
Authentication:
  - JWT with expiration (24h)
  - bcrypt password hashing (12 rounds)
  - Rate limiting (5 attempts/15 min)
  - Session management

Authorization:
  - Role-Based Access Control (RBAC)
  - Permission verification
  - API endpoint protection
  - Resource-level checks

Data Protection:
  - Encryption at rest (volumes)
  - Encryption in transit (HTTPS)
  - PII redaction
  - Secure secret storage

Input Validation:
  - Schema validation
  - Regex pattern safety
  - File upload restrictions
  - SQL injection prevention
```

## Scanning Tools

### npm Audit

```bash
# Run audit
npm audit

# Fix automatically
npm audit fix

# Force fixes (careful!)
npm audit fix --force

# Generate report
npm audit --json > audit-report.json

# Check specific severity
npm audit --audit-level=high
```

### Secret Detection (TruffleHog)

```bash
# Scan repository
trufflehog filesystem . \
  --exclude-paths=.trufflehog-ignore \
  --json > secrets-scan.json

# Scan with custom rules
trufflehog filesystem . \
  --config=trufflehog-config.yaml \
  --only-verified

# Pre-commit hook
trufflehog git file://. \
  --since-commit=HEAD~1 \
  --fail
```

### ReDoS Detection

```python
# ReDoS checker
import re
import time

def check_redos(pattern: str, max_time: float = 1.0) -> bool:
    """Check if pattern has ReDoS vulnerability"""

    # Dangerous patterns
    dangerous = [
        r'(a+)+',           # Nested quantifiers
        r'(a*)*',          # Nested stars
        r'(a|a)*',         # Overlapping alternation
        r'(.*){10,}',      # Excessive repetition
    ]

    # Check against known dangerous patterns
    for danger in dangerous:
        if danger in pattern:
            return True

    # Test with increasing input
    test_inputs = [
        'a' * n for n in [10, 100, 1000, 10000]
    ]

    for test_input in test_inputs:
        start = time.time()
        try:
            re.search(pattern, test_input)
        except:
            return True  # Pattern failed

        elapsed = time.time() - start
        if elapsed > max_time:
            return True  # Too slow

    return False
```

## Vulnerability Remediation

### Dependency Updates

```json
// package.json security updates
{
  "scripts": {
    "security:check": "npm audit",
    "security:fix": "npm audit fix",
    "security:update": "npm update && npm audit",
    "security:report": "npm audit --json > security-report.json"
  },
  "devDependencies": {
    "npm-check-updates": "^16.14.0",
    "audit-ci": "^6.6.1"
  }
}
```

### Automated Fixes

```typescript
// Security middleware
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';

// Apply security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Rate limiting
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
}));

// Prevent NoSQL injection
app.use(mongoSanitize());
```

## Authentication Security

### Password Policy

```typescript
// Password validation
const passwordSchema = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecial: true,
  preventCommon: true
};

function validatePassword(password: string): string[] {
  const errors = [];

  if (password.length < passwordSchema.minLength) {
    errors.push('Password must be at least 8 characters');
  }

  if (passwordSchema.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letter');
  }

  if (passwordSchema.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain number');
  }

  // Check against common passwords
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common');
  }

  return errors;
}
```

### Session Security

```typescript
// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,  // HTTPS only
    httpOnly: true,  // No JS access
    maxAge: 24 * 60 * 60 * 1000,  // 24 hours
    sameSite: 'strict'  // CSRF protection
  },
  store: new SQLiteStore({
    db: 'sessions.db',
    table: 'sessions'
  })
}));
```

## Security Monitoring

### Audit Logging

```typescript
// Security event logging
interface SecurityEvent {
  timestamp: Date;
  event: string;
  userId?: string;
  ip: string;
  details: any;
  severity: 'info' | 'warning' | 'critical';
}

function logSecurityEvent(event: SecurityEvent) {
  // Log to file
  const log = `${event.timestamp.toISOString()} [${event.severity}] ${event.event} - User: ${event.userId || 'anonymous'} IP: ${event.ip}\n`;
  fs.appendFileSync('security.log', log);

  // Alert on critical events
  if (event.severity === 'critical') {
    sendSecurityAlert(event);
  }

  // Store in database
  db.prepare('INSERT INTO security_events VALUES (?, ?, ?, ?, ?, ?)')
    .run(event.timestamp, event.event, event.userId, event.ip, JSON.stringify(event.details), event.severity);
}
```

### Intrusion Detection

```typescript
// Failed login tracking
const failedLogins = new Map();

function trackFailedLogin(username: string, ip: string) {
  const key = `${username}:${ip}`;
  const attempts = failedLogins.get(key) || 0;

  if (attempts >= 5) {
    logSecurityEvent({
      timestamp: new Date(),
      event: 'BRUTE_FORCE_DETECTED',
      userId: username,
      ip: ip,
      details: { attempts: attempts + 1 },
      severity: 'critical'
    });

    // Block IP
    blockIP(ip);
  }

  failedLogins.set(key, attempts + 1);

  // Clear after 15 minutes
  setTimeout(() => failedLogins.delete(key), 15 * 60 * 1000);
}
```

## Compliance Reports

### Security Audit Report Template

```markdown
# Security Audit Report

**Date:** {{date}}
**Version:** {{version}}
**Risk Level:** {{risk_level}}

## Executive Summary
- Total vulnerabilities: {{total}}
- Critical: {{critical}}
- High: {{high}}
- Medium: {{medium}}
- Low: {{low}}

## Findings

### Critical Issues
{{#each critical_issues}}
- **{{this.title}}**
  - Component: {{this.component}}
  - Risk: {{this.risk}}
  - Remediation: {{this.fix}}
{{/each}}

## Recommendations
1. Immediate actions
2. Short-term improvements
3. Long-term strategy

## Compliance Status
- OWASP Top 10: {{owasp_compliance}}%
- Security Headers: {{headers_score}}/100
- SSL/TLS: {{ssl_rating}}
```

## Security Checklist

### Pre-Deployment

- [ ] Run npm audit (0 high/critical)
- [ ] Secret scanning (0 exposed)
- [ ] ReDoS validation (all patterns safe)
- [ ] Security headers configured
- [ ] HTTPS enforced
- [ ] Rate limiting enabled
- [ ] Input validation complete
- [ ] Error handling secure
- [ ] Logging configured
- [ ] Backup tested

### Post-Deployment

- [ ] Security monitoring active
- [ ] Alerts configured
- [ ] Incident response plan
- [ ] Regular audits scheduled
- [ ] Penetration testing planned

## Incident Response

### Response Plan

```yaml
Detection:
  - Monitor security logs
  - Alert on anomalies
  - Automated scanning

Containment:
  - Isolate affected systems
  - Block malicious IPs
  - Disable compromised accounts

Eradication:
  - Remove malware/backdoors
  - Patch vulnerabilities
  - Update configurations

Recovery:
  - Restore from backups
  - Verify system integrity
  - Resume normal operations

Post-Incident:
  - Document timeline
  - Analyze root cause
  - Update security measures
  - Share lessons learned
```

## Integration Points

### With Other Agents
- **backend-api-agent**: Security implementation
- **infrastructure-deployment-agent**: Secure deployment
- **documentation-agent**: Security documentation

### External Tools
- GitHub security advisories
- CVE databases
- OWASP resources
- Security scanners

## Quality Metrics

### Security Metrics
- Vulnerability count: 0 critical/high
- Mean time to patch: <24 hours
- Security test coverage: >90%
- Incident response time: <1 hour

### Compliance Metrics
- OWASP compliance: 100%
- Audit pass rate: 100%
- Security training: Quarterly
- Review frequency: Monthly

## Best Practices

1. **Security by design** - Build security in from start
2. **Defense in depth** - Multiple security layers
3. **Least privilege** - Minimum necessary access
4. **Regular audits** - Continuous monitoring
5. **Incident planning** - Prepare for breaches
6. **Security training** - Educate developers
7. **Patch management** - Stay updated

## File Locations

```
.
├── security/
│   ├── policies/
│   ├── reports/
│   └── configs/
├── .trufflehog-ignore
├── security.log
└── audit-report.json
```

---

**Note:** This agent ensures comprehensive security coverage through continuous scanning, proactive remediation, and compliance monitoring.