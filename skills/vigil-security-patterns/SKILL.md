---
name: vigil-security-patterns
description: Security best practices and patterns for Vigil Guard development. Use when implementing authentication, handling secrets, validating input, preventing injection attacks, managing CORS, ensuring secure coding practices, or implementing Phase 3-4 security audit fixes (rate limiting, ReDoS protection, health checks).
version: 1.6.11
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob]
---

# Vigil Guard Security Patterns

## Overview
Comprehensive security best practices for developing and maintaining Vigil Guard's security-critical codebase.

## When to Use This Skill
- Implementing authentication flows
- Managing secrets and credentials
- Validating user input
- Preventing injection attacks
- Configuring CORS policies
- Handling password hashing
- Implementing RBAC permissions
- Secure session management
- Code review for security issues

## Authentication Security

### JWT Token Management
Best practices for secure token handling in authentication flows.

### Password Security
Always use bcrypt with 12 rounds for password hashing. Never log or store plaintext passwords.

### Permission Checks
Server-side permission validation is required. Client-side checks can be bypassed.

## Input Validation

### Path Traversal Prevention
Whitelist allowed filenames and sanitize all user input.

### SQL Injection Prevention
Always use parameterized queries, never string concatenation.

### XSS Prevention
React auto-escapes by default. Use DOMPurify for HTML sanitization.

## Secret Management

### Environment Variables
Store secrets in .env file, auto-generate during installation using openssl.

### Secret Masking in UI
Display masked values showing only first and last character.

## CORS Configuration

Restrict origin to localhost in development, specific domains in production.

## Audit Logging

Track all config changes and authentication events with timestamps and usernames.

## Rate Limiting

Implement rate limiting on authentication endpoints to prevent brute force attacks.

## ETag Concurrency Control

Use MD5 hash of content as ETag to prevent concurrent edit conflicts.

## Session Security

Implement session timeouts and logout on inactivity.

## RBAC Implementation

Granular permissions with last admin protection to prevent lockout.

## Common Vulnerabilities

OWASP Top 10 coverage with mitigations for broken access control, cryptographic failures, and injection attacks.

## Recent Security Fixes (v1.6.11 - Phase 3-4 Audit)

### Phase 2.1: Rate Limiting Implementation

**Library:** express-rate-limit ^8.1.0

**Authentication Endpoints (Brute Force Protection):**
```typescript
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                     // 5 attempts per window
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

app.post('/api/auth/login', authLimiter, loginHandler);
app.post('/api/auth/change-password', authLimiter, changePasswordHandler);
```

**General API (DoS Protection):**
```typescript
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,  // 1 minute
  max: 100,                 // 100 requests per minute
  message: 'Too many requests, please slow down'
});

app.use('/api/', apiLimiter);
```

**Best Practices:**
- Use different limits for sensitive vs general endpoints
- Return 429 status code (Too Many Requests)
- Don't leak information in error messages
- Consider IP-based vs user-based limiting

### Phase 2.2: ReDoS Protection

**Catastrophic Backtracking Prevention:**

**Reviewed:** 829-line rules.config.json for unsafe regex patterns

**Timeout Limits:**
```javascript
// Pattern_Matching_Engine node (n8n workflow)
const PATTERN_TIMEOUT_MS = 1000; // 1 second max per pattern

try {
  const match = text.match(new RegExp(pattern));
} catch (error) {
  if (error.message.includes('timeout')) {
    console.warn('Pattern timeout exceeded:', pattern);
    // Skip pattern, continue processing
  }
}
```

**Safe Regex Patterns:**
```javascript
// ❌ UNSAFE: Catastrophic backtracking
const unsafe = /^(a+)+$/;

// ✅ SAFE: Non-backtracking alternative
const safe = /^a+$/;

// ❌ UNSAFE: Nested quantifiers
const unsafe2 = /(x+x+)+y/;

// ✅ SAFE: Atomic grouping or simplified pattern
const safe2 = /x+y/;
```

**Testing for ReDoS:**
```bash
# Use redos-detector tool
npm install -g redos-detector

# Test pattern
redos-detector '^(a+)+$'
```

### Phase 2.5: Presidio Exception Handling

**Graceful Degradation:**
```javascript
// PII_Redactor_v2 node
try {
  const presidioResponse = await axios.post('http://vigil-presidio-pii:5001/analyze', {
    text: inputText,
    language: 'en',
    entities: ['EMAIL', 'PHONE', 'CREDIT_CARD']
  }, { timeout: 3000 });

  return presidioResponse.data;
} catch (error) {
  console.error('Presidio service unavailable, falling back to regex');

  // Automatic fallback to regex patterns
  return regexPiiDetection(inputText);
}
```

**Health Check Status Codes:**
```typescript
// services/presidio-pii-api/app.py
@app.route('/health', methods=['GET'])
def health():
    try:
        # Test spaCy models loaded
        nlp_en('test')
        nlp_pl('test')
        return jsonify({'status': 'healthy'}), 200
    except Exception as e:
        return jsonify({
            'status': 'degraded',
            'error': str(e)
        }), 503  # Service Unavailable
```

### Phase 2.6: Web UI Health Check Improvements

**Proper Status Codes:**
```typescript
// services/web-ui/backend/src/server.ts
app.get('/health', (req, res) => {
  // Check critical dependencies
  const clickhouseOk = await testClickHouseConnection();

  if (clickhouseOk) {
    res.status(200).json({ status: 'healthy' });
  } else {
    res.status(503).json({
      status: 'degraded',
      message: 'ClickHouse connection failed'
    });
  }
});
```

**Monitoring Integration:**
```bash
# Docker Compose health check
healthcheck:
  test: ["CMD", "wget", "--spider", "-q", "http://localhost:8787/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 10s
```

### Phase 3-4: Version Consistency

**Docker Image Tags:**
- Pin SHA256 digests (not just version tags)
- Unified pipeline_version across all services
- Semantic versioning enforcement

**Example:**
```yaml
# docker-compose.yml
services:
  clickhouse:
    image: clickhouse/clickhouse-server:24.1@sha256:44caeed7c81f7934...

  presidio-pii-api:
    image: vigil-presidio-pii:1.6.11  # Matches workflow version
```

### CORS Configuration Fixes

**Localhost Development:**
```typescript
// Backend: services/web-ui/backend/src/server.ts
app.use(cors({
  origin: /^http:\/\/localhost(:\d+)?$/,  // Any localhost port
  credentials: true,                       // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

**Production:**
```typescript
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

### Security Testing Tools

**Integrated:**
- TruffleHog (secret scanning in CI/CD)
- Vitest (58+ security test cases)
- Manual penetration testing (OWASP Top 10)

**Coverage:**
- ✅ Broken Access Control (RBAC, last admin protection)
- ✅ Cryptographic Failures (bcrypt, JWT, auto-generated secrets)
- ✅ Injection Attacks (parameterized queries, input validation)
- ✅ Insecure Design (defense in depth, fail-secure)
- ✅ Security Misconfiguration (defaults secure, audit logging)
- ✅ Vulnerable Components (pinned versions, SHA digests)
- ✅ Identification & Authentication (JWT, session management, MFA-ready)
- ✅ Software & Data Integrity (ETag, audit trail, backups)
- ✅ Security Logging (audit.log, ClickHouse, no sensitive data)
- ✅ Server-Side Request Forgery (URL validation, allowlist)

## Code Review Checklist

- No hardcoded secrets
- Input validation present
- SQL queries parameterized
- Permissions checked server-side
- Passwords hashed with bcrypt
- CORS configured properly
- Audit logging implemented
- ETag used for concurrent edits

## Related Skills
- `react-tailwind-vigil-ui` - Frontend security patterns
- `n8n-vigil-workflow` - Sanitization implementation
- `docker-vigil-orchestration` - Environment variable management

## References
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Security docs: `docs/SECURITY.md`
- Auth docs: `docs/AUTHENTICATION.md`
