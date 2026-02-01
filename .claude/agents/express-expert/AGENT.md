---
name: express-expert
description: |
  Express.js and Node.js backend expert for Vigil Guard Enterprise.
  REST API design, JWT auth, NATS integration, rate limiting, ClickHouse queries.
  Includes procedures merged from express-api-developer skill.
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

# Express Expert

Expert in Express.js backend development for Vigil Guard Enterprise.

## Vigil Guard API Architecture

```
Client Request
    │
    ▼
┌─────────────┐
│  vigil-api  │  (:8787)
│  Express.js │
└─────────────┘
    │
    ├─► NATS JetStream (publish)
    │   Subject: vigil.requests.analyze
    │
    └─► Wait for response (request-reply)
        Subject: vigil.responses.<request_id>
```

## Project Structure

```
apps/api/
├── src/
│   ├── index.ts              # Express app entry
│   ├── routes/
│   │   ├── analyze.ts        # /v1/analyze endpoint
│   │   ├── health.ts         # Health checks
│   │   └── keys.ts           # API key management
│   ├── middleware/
│   │   ├── auth.ts           # API key validation
│   │   ├── rateLimit.ts      # Rate limiting
│   │   └── requestId.ts      # Request ID injection
│   └── services/
│       ├── nats.ts           # NATS JetStream client
│       └── clickhouse.ts     # Analytics client
└── tests/
```

## Core Knowledge

### Middleware Patterns

```typescript
// Async wrapper (prevents unhandled rejections)
const asyncHandler = (fn: RequestHandler) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Error handling middleware (4 params, MUST be last)
const errorHandler = (err, req, res, next) => {
  res.status(err.status || 500).json({
    error: err.code || 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : err.message
  });
};
```

### API Key Authentication

```typescript
// middleware/auth.ts
export async function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Missing API key'
    });
  }

  const apiKey = authHeader.slice(7);
  const hashedKey = crypto.createHmac('sha256', API_KEY_SALT)
    .update(apiKey)
    .digest('hex');

  const keyRecord = await getApiKeyByHash(hashedKey);

  if (!keyRecord || !keyRecord.active) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid API key' });
  }

  req.apiKey = keyRecord;
  next();
}
```

### NATS Integration

```typescript
// services/nats.ts
async publishAnalyzeRequest(payload: AnalyzeRequest): Promise<string> {
  const requestId = crypto.randomUUID();

  await this.js.publish(
    'vigil.requests.analyze',
    sc.encode(JSON.stringify({
      request_id: requestId,
      text: payload.text,
      mode: payload.mode || 'fast',
      api_key_label: payload.apiKeyLabel,
      tenant_id: payload.tenantId,
      timestamp: Date.now()
    })),
    { msgID: requestId }
  );

  return requestId;
}
```

### Rate Limiting

```typescript
// middleware/rateLimit.ts
export const analyzeRateLimit = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: (req) => req.apiKey?.rateLimit || 100,
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: 'rl:analyze:'
  }),
  keyGenerator: (req) => req.apiKey?.label || req.ip,
  message: { error: 'RATE_LIMITED', message: 'Too many requests' }
});
```

### ClickHouse Analytics

```typescript
// services/clickhouse.ts
export async function getUsageStats(tenantId: string, hours: number = 24) {
  const result = await client.query({
    query: `
      SELECT
        count() as total_requests,
        countIf(decision = 'BLOCK') as blocked,
        round(avg(latency_ms), 0) as avg_latency_ms
      FROM detection_events
      WHERE tenant_id = {tenant_id:String}
        AND timestamp > now() - INTERVAL {hours:UInt32} HOUR
    `,
    query_params: { tenant_id: tenantId, hours }
  });
  return await result.json();
}
```

## API Endpoints

### Public API (v1)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/v1/analyze` | API Key | Analyze text for threats |
| POST | `/v1/analyze/batch` | API Key | Batch analysis (up to 10) |
| GET | `/v1/usage` | API Key | Get usage statistics |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Basic liveness |
| GET | `/health/ready` | Readiness (NATS, ClickHouse) |

### Admin (JWT)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/keys` | List API keys |
| POST | `/admin/keys` | Create API key |
| DELETE | `/admin/keys/:id` | Revoke API key |

## Common Procedures

### Adding New Endpoint

```typescript
// routes/new-endpoint.ts
import { Router } from 'express';
import { apiKeyAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/async';

const router = Router();

router.post('/v1/new-endpoint',
  apiKeyAuth,
  asyncHandler(async (req, res) => {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'Text field is required'
      });
    }

    // Process request...
    res.json({ result: 'success' });
  })
);

export default router;
```

### Error Response Format

```typescript
interface ErrorResponse {
  error: string;       // UPPERCASE_SNAKE error code
  message: string;     // Human-readable message
  request_id?: string; // For tracing
}

const ERROR_CODES = {
  INVALID_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  TIMEOUT: 504,
  INTERNAL_ERROR: 500
};
```

## Quick Reference

```bash
# Start dev server
cd apps/api && pnpm dev

# Test analyze endpoint
curl -X POST http://localhost:8787/v1/analyze \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text":"test input","mode":"fast"}'

# Health check
curl http://localhost:8787/health/ready

# Run tests
pnpm test -- apps/api
```

## Key Files

| File | Purpose |
|------|---------|
| `apps/api/src/index.ts` | Express app entry |
| `apps/api/src/routes/analyze.ts` | Main analyze endpoint |
| `apps/api/src/middleware/auth.ts` | API key authentication |
| `apps/api/src/services/nats.ts` | NATS JetStream client |
| `apps/api/src/services/clickhouse.ts` | Analytics queries |

## Redis Integration

### Connection with ioredis

```typescript
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  db: 0,
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    if (times > 10) return null;
    return Math.min(times * 100, 3000);
  }
});

redis.on('connect', () => console.log('Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err));

process.on('SIGTERM', async () => {
  await redis.quit();
});
```

### Caching Patterns

```typescript
// Cache-Aside (Lazy Loading)
async function getUserById(userId: string) {
  const cacheKey = `user:${userId}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const user = await db.users.findById(userId);
  if (user) {
    await redis.setex(cacheKey, 3600, JSON.stringify(user));
  }
  return user;
}

// Write-Through
async function updateUser(userId: string, data: UserData) {
  const user = await db.users.update(userId, data);
  await redis.setex(`user:${userId}`, 3600, JSON.stringify(user));
  return user;
}

// Cache Invalidation
async function invalidateUserCache(userId: string) {
  const keys = await redis.keys(`user:${userId}*`);
  if (keys.length > 0) await redis.del(...keys);
}
```

### Sliding Window Rate Limiter

```typescript
async function slidingWindowRateLimit(key: string, limit: number, windowSec: number) {
  const now = Date.now();
  const windowStart = now - (windowSec * 1000);
  const redisKey = `ratelimit:${key}`;

  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(redisKey, 0, windowStart);
  pipeline.zadd(redisKey, now, `${now}-${Math.random()}`);
  pipeline.zcard(redisKey);
  pipeline.expire(redisKey, windowSec);

  const results = await pipeline.exec();
  const count = results[2][1] as number;

  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    resetAt: new Date(now + windowSec * 1000)
  };
}
```

### Session Storage

```typescript
import crypto from 'crypto';

async function createSession(userId: string, metadata = {}) {
  const sessionId = crypto.randomBytes(32).toString('hex');
  const sessionData = { userId, createdAt: Date.now(), ...metadata };

  await redis.setex(`session:${sessionId}`, 86400, JSON.stringify(sessionData));
  await redis.sadd(`user:${userId}:sessions`, sessionId);

  return sessionId;
}

async function getSession(sessionId: string) {
  const data = await redis.get(`session:${sessionId}`);
  return data ? JSON.parse(data) : null;
}

async function destroySession(sessionId: string) {
  const session = await getSession(sessionId);
  if (session) {
    await redis.del(`session:${sessionId}`);
    await redis.srem(`user:${session.userId}:sessions`, sessionId);
  }
}
```

### Distributed Lock

```typescript
const LOCK_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
`;

async function acquireLock(resource: string, ttlMs = 10000) {
  const lockKey = `lock:${resource}`;
  const lockValue = crypto.randomUUID();

  const acquired = await redis.set(lockKey, lockValue, 'PX', ttlMs, 'NX');
  if (!acquired) return null;

  return {
    release: async () => {
      await redis.eval(LOCK_SCRIPT, 1, lockKey, lockValue);
    }
  };
}
```

### Key Patterns and TTL Guidelines

```typescript
const KEY_PATTERNS = {
  session: 'session:{sessionId}',
  userSession: 'user:{userId}:sessions',
  apiKey: 'apikey:{hash}',
  rateLimit: 'ratelimit:{type}:{identifier}',
  cache: 'cache:{entity}:{id}',
  lock: 'lock:{resource}:{id}'
};

const TTL_GUIDELINES = {
  session: 86400,      // 24 hours
  apiKeyCache: 300,    // 5 minutes
  rateLimit: 60,       // 1 minute
  shortCache: 60,      // 1 minute
  mediumCache: 3600,   // 1 hour
  longCache: 86400     // 24 hours
};
```

### Redis Debugging

```bash
# Health check
docker exec vigil-redis redis-cli INFO | grep -E "(redis_version|connected_clients|used_memory_human)"

# Check keys by pattern
docker exec vigil-redis redis-cli --scan --pattern "ratelimit:*" | head -20

# Monitor commands
docker exec vigil-redis redis-cli MONITOR

# Memory analysis
docker exec vigil-redis redis-cli MEMORY DOCTOR
```

### Redis Critical Rules

- Always set TTL on cache keys
- Use pipelines for multiple operations
- Implement connection retry logic
- Use Lua scripts for atomic operations
- Never use KEYS in production (use SCAN)
- Never store sensitive data without encryption
- Never use FLUSHALL/FLUSHDB without confirmation

## Security Rules

- Always use async error handling (asyncHandler or try/catch)
- Validate all input (never trust client data)
- Use parameterized queries for ClickHouse (never string concatenation)
- Apply security middleware (helmet, cors, rate-limit)
- Return appropriate HTTP status codes
- Never expose stack traces in production
- Never log full API keys (only labels)
- Never store secrets in code
