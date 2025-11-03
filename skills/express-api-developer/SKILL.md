# Express API Developer

## Overview
Backend API development for Vigil Guard's Express.js server (32 files .ts) including JWT authentication, RBAC, ClickHouse integration, and configuration management.

## When to Use This Skill
- Developing new API endpoints
- Implementing authentication flows
- Managing database queries (SQLite + ClickHouse)
- Rate limiting configuration
- CORS policy management
- Audit logging implementation

## Tech Stack
- Express 4.18.2
- TypeScript 5.6.3
- JWT (jsonwebtoken ^9.0.2)
- bcrypt ^5.1.1 (12 rounds)
- SQLite (better-sqlite3)
- ClickHouse client
- express-rate-limit ^8.1.0

## Project Structure
```
services/web-ui/backend/src/
├── server.ts              # Main Express app
├── auth.ts                # JWT + bcrypt
├── retention.ts           # ClickHouse retention API
├── clickhouse.ts          # CH connection
└── db/
    └── users.db           # SQLite for users/sessions
```

## Common Tasks

### Task 1: Add New Endpoint

```typescript
// server.ts
import { authMiddleware, requirePermission } from './auth';

app.post('/api/my-endpoint',
  authMiddleware,                           // JWT validation
  requirePermission('can_view_configuration'), // RBAC check
  async (req, res) => {
    try {
      const { param } = req.body;

      // Input validation
      if (!param || typeof param !== 'string') {
        return res.status(400).json({ error: 'Invalid parameter' });
      }

      // Business logic
      const result = await doSomething(param);

      // Audit log
      auditLog('my-endpoint', req.user.username, { param, result });

      res.json({ success: true, data: result });
    } catch (error) {
      console.error('my-endpoint error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);
```

### Task 2: ClickHouse Query

```typescript
import { getClickHouseClient } from './clickhouse';

async function queryEvents(sessionId: string) {
  const client = getClickHouseClient();

  const query = `
    SELECT
      timestamp,
      original_input,
      final_status,
      threat_score
    FROM n8n_logs.events_processed
    WHERE sessionId = {sessionId:String}
    ORDER BY timestamp DESC
    LIMIT 100
  `;

  const result = await client.query({
    query,
    query_params: { sessionId }
  });

  return await result.json();
}
```

### Task 3: Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

// Authentication endpoints (brute force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                     // 5 attempts
  message: 'Too many login attempts',
  standardHeaders: true
});

app.post('/api/auth/login', authLimiter, loginHandler);

// General API (DoS protection)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 100              // 100 requests
});

app.use('/api/', apiLimiter);
```

### Task 4: CORS Configuration

```typescript
import cors from 'cors';

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ?
    process.env.ALLOWED_ORIGINS.split(',') :
    /^http:\/\/localhost(:\d+)?$/,  // Any localhost port in dev
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## Security Best Practices

### Password Hashing
```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}
```

### JWT Token Management
```typescript
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET;  // 32+ chars from .env
const EXPIRY = '24h';

function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      permissions: user.permissions
    },
    SECRET,
    { expiresIn: EXPIRY }
  );
}

function verifyToken(token: string): any {
  return jwt.verify(token, SECRET);
}
```

### SQL Injection Prevention
```typescript
// ❌ WRONG: String concatenation
const query = `SELECT * FROM users WHERE username = '${username}'`;

// ✅ CORRECT: Parameterized query
const query = db.prepare('SELECT * FROM users WHERE username = ?');
const user = query.get(username);
```

## Integration with Other Skills

### With `clickhouse-grafana-monitoring`:
```yaml
when: New ClickHouse column needed
action:
  1. Add migration SQL
  2. Update TypeScript interfaces
  3. Modify query functions
  4. Test with curl
```

### With `react-tailwind-vigil-ui`:
```yaml
when: Frontend needs new API
action:
  1. Design endpoint (REST conventions)
  2. Implement with proper auth/validation
  3. Update api.ts in frontend
  4. Test CORS and token handling
```

## Quick Reference

```bash
# Start dev server
cd services/web-ui/backend && npm run dev

# Test endpoint
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Check TypeScript
npx tsc --noEmit

# View logs
docker logs vigil-web-ui-backend -f
```

---

**Last Updated:** 2025-11-02
**Backend Files:** 32 .ts files
**API Endpoints:** 20+ routes
