---
name: redis-vigil-caching
description: Redis caching and rate limiting for Vigil Guard 2.0 architecture. Use when implementing API key caching, rate limiting, session management, or optimizing detection pipeline performance.
version: 2.0.0
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob]
---

# Redis Caching for Vigil Guard

## Overview

Redis integration for Vigil Guard 2.0 architecture, providing high-performance caching for API key validation, rate limiting for abuse prevention, and session management. This skill covers the complete caching infrastructure for the detection pipeline.

## When to Use This Skill

- Implementing API key caching (reduce database lookups)
- Adding rate limiting to prevent abuse
- Session management for Web UI
- Caching detection results (idempotency)
- Distributed locking for exactly-once processing
- Migrating from in-memory to Redis-backed rate limiting
- Debugging cache misses or stale data

## Tech Stack

| Component | Version | Purpose |
|-----------|---------|---------|
| Redis Server | 7.2+ | Data store |
| ioredis | 5.x | Node.js client |
| TypeScript | 5.x | Type-safe implementation |

## Architecture (Vigil Guard 2.0)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Vigil Guard 2.0                              │
│                                                                      │
│  ┌─────────────┐     ┌─────────────────────────────────────────┐   │
│  │ vigil-api   │     │              Redis                       │   │
│  │ (Express)   │────▶│                                         │   │
│  │ /v1/analyze │     │  ┌─────────────┐   ┌─────────────┐      │   │
│  └─────────────┘     │  │ API Key     │   │ Rate Limit  │      │   │
│                      │  │ Cache       │   │ Counters    │      │   │
│                      │  └─────────────┘   └─────────────┘      │   │
│                      │                                         │   │
│  ┌─────────────┐     │  ┌─────────────┐   ┌─────────────┐      │   │
│  │ web-ui      │────▶│  │ Session     │   │ Idempotency │      │   │
│  │ backend     │     │  │ Store       │   │ Keys        │      │   │
│  └─────────────┘     │  └─────────────┘   └─────────────┘      │   │
│                      │                                         │   │
│  ┌─────────────┐     │  ┌─────────────┐                       │   │
│  │ detection   │────▶│  │ Distributed │                       │   │
│  │ workers     │     │  │ Locks       │                       │   │
│  └─────────────┘     │  └─────────────┘                       │   │
│                      └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
services/vigil-api/
├── src/
│   ├── config/
│   │   └── redis.config.ts        # Redis connection settings
│   ├── cache/
│   │   ├── index.ts               # Cache client singleton
│   │   ├── api-keys.ts            # API key caching
│   │   ├── rate-limiter.ts        # Rate limiting
│   │   └── sessions.ts            # Session management
│   ├── middleware/
│   │   ├── rate-limit.ts          # Rate limit middleware
│   │   └── api-key-auth.ts        # API key validation
│   └── lib/
│       └── redis-client.ts        # Redis connection singleton
├── docker-compose.yml             # Redis service definition
└── package.json
```

## Common Tasks

### 1. Initialize Redis Connection

```typescript
// services/vigil-api/src/lib/redis-client.ts
import Redis from 'ioredis';

let redis: Redis | null = null;

export function getRedisClient(): Redis {
  if (redis) return redis;

  redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),

    // Connection options
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },

    // Performance options
    enableReadyCheck: true,
    enableOfflineQueue: true,
    lazyConnect: false
  });

  redis.on('error', (err) => {
    console.error('Redis connection error:', err);
  });

  redis.on('connect', () => {
    console.log('Connected to Redis');
  });

  return redis;
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
```

### 2. API Key Caching

```typescript
// services/vigil-api/src/cache/api-keys.ts
import { getRedisClient } from '../lib/redis-client';
import crypto from 'crypto';

const API_KEY_PREFIX = 'apikey:';
const API_KEY_TTL = 300; // 5 minutes

interface ApiKeyData {
  userId: string;
  organizationId: string;
  permissions: string[];
  rateLimit: number;
  validUntil: string;
}

export async function getCachedApiKey(apiKey: string): Promise<ApiKeyData | null> {
  const redis = getRedisClient();
  const hash = crypto.createHash('sha256').update(apiKey).digest('hex');
  const cacheKey = `${API_KEY_PREFIX}${hash}`;

  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  return null;
}

export async function cacheApiKey(apiKey: string, data: ApiKeyData): Promise<void> {
  const redis = getRedisClient();
  const hash = crypto.createHash('sha256').update(apiKey).digest('hex');
  const cacheKey = `${API_KEY_PREFIX}${hash}`;

  await redis.setex(cacheKey, API_KEY_TTL, JSON.stringify(data));
}

export async function invalidateApiKey(apiKey: string): Promise<void> {
  const redis = getRedisClient();
  const hash = crypto.createHash('sha256').update(apiKey).digest('hex');
  const cacheKey = `${API_KEY_PREFIX}${hash}`;

  await redis.del(cacheKey);
}
```

### 3. Sliding Window Rate Limiter

```typescript
// services/vigil-api/src/cache/rate-limiter.ts
import { getRedisClient } from '../lib/redis-client';

const RATE_LIMIT_PREFIX = 'ratelimit:';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export async function checkRateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const redis = getRedisClient();
  const key = `${RATE_LIMIT_PREFIX}${identifier}`;
  const now = Date.now();
  const windowStart = now - (windowSeconds * 1000);

  // Lua script for atomic sliding window
  const script = `
    local key = KEYS[1]
    local now = tonumber(ARGV[1])
    local windowStart = tonumber(ARGV[2])
    local limit = tonumber(ARGV[3])
    local windowSec = tonumber(ARGV[4])

    -- Remove old entries
    redis.call('ZREMRANGEBYSCORE', key, 0, windowStart)

    -- Count current requests
    local count = redis.call('ZCARD', key)

    if count < limit then
      -- Add new request
      redis.call('ZADD', key, now, now .. '-' .. math.random())
      redis.call('EXPIRE', key, windowSec)
      return {1, limit - count - 1, now + (windowSec * 1000)}
    else
      -- Rate limited
      local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
      local resetAt = oldest[2] and (tonumber(oldest[2]) + (windowSec * 1000)) or (now + (windowSec * 1000))
      return {0, 0, resetAt}
    end
  `;

  const result = await redis.eval(
    script,
    1,
    key,
    now.toString(),
    windowStart.toString(),
    limit.toString(),
    windowSeconds.toString()
  ) as [number, number, number];

  return {
    allowed: result[0] === 1,
    remaining: result[1],
    resetAt: result[2]
  };
}

// Token bucket for burst handling
export async function checkTokenBucket(
  identifier: string,
  bucketSize: number,
  refillRate: number // tokens per second
): Promise<RateLimitResult> {
  const redis = getRedisClient();
  const key = `bucket:${identifier}`;
  const now = Date.now();

  const script = `
    local key = KEYS[1]
    local bucketSize = tonumber(ARGV[1])
    local refillRate = tonumber(ARGV[2])
    local now = tonumber(ARGV[3])

    local bucket = redis.call('HMGET', key, 'tokens', 'lastRefill')
    local tokens = tonumber(bucket[1]) or bucketSize
    local lastRefill = tonumber(bucket[2]) or now

    -- Refill tokens based on time elapsed
    local elapsed = (now - lastRefill) / 1000
    tokens = math.min(bucketSize, tokens + (elapsed * refillRate))

    if tokens >= 1 then
      tokens = tokens - 1
      redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', now)
      redis.call('EXPIRE', key, bucketSize / refillRate + 1)
      return {1, math.floor(tokens), 0}
    else
      local waitTime = ((1 - tokens) / refillRate) * 1000
      return {0, 0, now + waitTime}
    end
  `;

  const result = await redis.eval(
    script,
    1,
    key,
    bucketSize.toString(),
    refillRate.toString(),
    now.toString()
  ) as [number, number, number];

  return {
    allowed: result[0] === 1,
    remaining: result[1],
    resetAt: result[2]
  };
}
```

### 4. Session Management

```typescript
// services/vigil-api/src/cache/sessions.ts
import { getRedisClient } from '../lib/redis-client';
import crypto from 'crypto';

const SESSION_PREFIX = 'session:';
const SESSION_TTL = 86400; // 24 hours

interface SessionData {
  userId: string;
  username: string;
  permissions: string[];
  createdAt: number;
  lastActivity: number;
  metadata?: Record<string, any>;
}

export async function createSession(sessionId: string, data: SessionData): Promise<void> {
  const redis = getRedisClient();
  const key = `${SESSION_PREFIX}${sessionId}`;

  await redis.setex(key, SESSION_TTL, JSON.stringify(data));
}

export async function getSession(sessionId: string): Promise<SessionData | null> {
  const redis = getRedisClient();
  const key = `${SESSION_PREFIX}${sessionId}`;

  const cached = await redis.get(key);
  if (!cached) return null;

  const session = JSON.parse(cached) as SessionData;

  // Update last activity
  session.lastActivity = Date.now();
  await redis.setex(key, SESSION_TTL, JSON.stringify(session));

  return session;
}

export async function destroySession(sessionId: string): Promise<void> {
  const redis = getRedisClient();
  const key = `${SESSION_PREFIX}${sessionId}`;

  await redis.del(key);
}

export async function destroyUserSessions(userId: string): Promise<number> {
  const redis = getRedisClient();

  // Use scan to find all sessions for user
  let cursor = '0';
  let deleted = 0;

  do {
    const [nextCursor, keys] = await redis.scan(
      cursor,
      'MATCH', `${SESSION_PREFIX}*`,
      'COUNT', '100'
    );
    cursor = nextCursor;

    for (const key of keys) {
      const session = await redis.get(key);
      if (session) {
        const data = JSON.parse(session) as SessionData;
        if (data.userId === userId) {
          await redis.del(key);
          deleted++;
        }
      }
    }
  } while (cursor !== '0');

  return deleted;
}
```

### 5. Idempotency Keys (Exactly-Once Processing)

```typescript
// services/vigil-api/src/cache/idempotency.ts
import { getRedisClient } from '../lib/redis-client';

const IDEMPOTENCY_PREFIX = 'idempotency:';
const IDEMPOTENCY_TTL = 86400; // 24 hours

interface IdempotencyResult {
  requestId: string;
  result: any;
  createdAt: number;
}

export async function getIdempotencyResult(
  idempotencyKey: string
): Promise<IdempotencyResult | null> {
  const redis = getRedisClient();
  const key = `${IDEMPOTENCY_PREFIX}${idempotencyKey}`;

  const cached = await redis.get(key);
  if (cached) {
    return JSON.parse(cached);
  }

  return null;
}

export async function setIdempotencyResult(
  idempotencyKey: string,
  requestId: string,
  result: any
): Promise<void> {
  const redis = getRedisClient();
  const key = `${IDEMPOTENCY_PREFIX}${idempotencyKey}`;

  const data: IdempotencyResult = {
    requestId,
    result,
    createdAt: Date.now()
  };

  await redis.setex(key, IDEMPOTENCY_TTL, JSON.stringify(data));
}

// Check and set atomically (prevent race conditions)
export async function trySetIdempotency(
  idempotencyKey: string,
  requestId: string
): Promise<boolean> {
  const redis = getRedisClient();
  const key = `${IDEMPOTENCY_PREFIX}${idempotencyKey}`;

  // SETNX + EXPIRE atomically
  const result = await redis.set(
    key,
    JSON.stringify({ requestId, processing: true, createdAt: Date.now() }),
    'EX', IDEMPOTENCY_TTL,
    'NX'
  );

  return result === 'OK';
}
```

### 6. Docker Compose Integration

```yaml
# docker-compose.yml
services:
  redis:
    image: redis:7.2-alpine
    container_name: vigil-redis
    ports:
      - "6379:6379"
    command: >
      redis-server
      --appendonly yes
      --maxmemory 256mb
      --maxmemory-policy allkeys-lru
      --tcp-keepalive 300
    volumes:
      - redis-data:/data
    networks:
      - vigil-net
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3
    restart: unless-stopped

volumes:
  redis-data:
```

### 7. Express Middleware

```typescript
// services/vigil-api/src/middleware/rate-limit.ts
import { Request, Response, NextFunction } from 'express';
import { checkRateLimit } from '../cache/rate-limiter';

interface RateLimitOptions {
  limit: number;
  windowSeconds: number;
  keyGenerator?: (req: Request) => string;
}

export function rateLimitMiddleware(options: RateLimitOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = options.keyGenerator
      ? options.keyGenerator(req)
      : req.ip || 'anonymous';

    const result = await checkRateLimit(key, options.limit, options.windowSeconds);

    res.setHeader('X-RateLimit-Limit', options.limit);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetAt / 1000));

    if (!result.allowed) {
      return res.status(429).json({
        error: 'Too Many Requests',
        retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000)
      });
    }

    next();
  };
}

// Usage in Express app
// app.use('/api/analyze', rateLimitMiddleware({ limit: 100, windowSeconds: 60 }));
```

### 8. Health Check Endpoint

```typescript
// services/vigil-api/src/api/health.ts
router.get('/health/redis', async (req, res) => {
  try {
    const redis = getRedisClient();

    const start = Date.now();
    await redis.ping();
    const latency = Date.now() - start;

    const info = await redis.info('memory');
    const memMatch = info.match(/used_memory_human:(\S+)/);
    const usedMemory = memMatch ? memMatch[1] : 'unknown';

    const keyCount = await redis.dbsize();

    res.json({
      status: 'healthy',
      latencyMs: latency,
      usedMemory,
      keyCount,
      connected: redis.status === 'ready'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

## Best Practices

### DO's

- **Use appropriate TTLs** for different data types:
  - API keys: 5 minutes (frequent validation, quick invalidation)
  - Sessions: 24 hours (longer lifespan with activity refresh)
  - Rate limits: Match window size
  - Idempotency: 24 hours (cover retry scenarios)

- **Hash sensitive keys** before storing:
  ```typescript
  const hash = crypto.createHash('sha256').update(apiKey).digest('hex');
  ```

- **Use Lua scripts** for atomic operations:
  - Rate limiting (check + increment)
  - Token bucket refill
  - Idempotency check-and-set

- **Set maxmemory-policy** to `allkeys-lru`:
  - Graceful degradation when memory is full
  - Least recently used keys evicted first

- **Monitor memory usage** via Redis INFO:
  ```bash
  docker exec vigil-redis redis-cli INFO memory
  ```

### DON'Ts

- **Never store sensitive data unencrypted**
- **Never use KEYS command in production** (use SCAN instead)
- **Never skip TTL** on cache entries (memory leak)
- **Never use Redis as primary data store** (volatile)
- **Never expose Redis port publicly** (6379)

## Integration with Other Skills

### With `nats-vigil-messaging`:
- Redis for idempotency keys
- NATS for message delivery
- Combined for exactly-once processing

### With `express-api-developer`:
- Rate limiting middleware
- Session management
- API key caching

### With `vitest-expert`:
- Redis test container (testcontainers)
- Mock Redis for unit tests
- Integration tests with real Redis

### With `docker-vigil-orchestration`:
- Redis container management
- Network configuration
- Volume persistence

## Quick Reference

### Redis CLI Commands

```bash
# Connect to Redis
docker exec -it vigil-redis redis-cli

# Check connection
PING

# View all keys (use with caution)
SCAN 0 MATCH "ratelimit:*" COUNT 100

# Check rate limit state
ZRANGE ratelimit:192.168.1.1 0 -1 WITHSCORES

# Get API key cache
GET apikey:abc123hash

# View memory usage
INFO memory

# Monitor in real-time
MONITOR

# Clear rate limits (CAREFUL!)
KEYS "ratelimit:*" | xargs redis-cli DEL
```

### Environment Variables

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_MAX_RETRIES=3
```

## Troubleshooting

### High Memory Usage

1. Check current memory: `INFO memory`
2. Identify large keys: `MEMORY USAGE key`
3. Review TTL settings: `TTL key`
4. Consider increasing maxmemory or reducing TTLs

### Connection Issues

1. Verify Redis container: `docker ps | grep redis`
2. Check network: `docker network inspect vigil-net`
3. Test connectivity: `redis-cli -h localhost ping`
4. Review connection options (retryStrategy)

### Rate Limiting Not Working

1. Check key format: `KEYS "ratelimit:*"`
2. Verify window timing: `ZRANGE key 0 -1 WITHSCORES`
3. Test Lua script independently
4. Check clock synchronization

### Cache Misses

1. Verify key naming convention
2. Check TTL expiration: `TTL key`
3. Monitor with `MONITOR` command
4. Review cache population logic

## Related Skills

- `nats-vigil-messaging` - Message queue integration
- `express-api-developer` - API middleware
- `docker-vigil-orchestration` - Container management
- `vitest-expert` - Testing Redis components

## References

- Redis Configuration: `services/vigil-api/src/config/redis.config.ts`
- Cache Modules: `services/vigil-api/src/cache/`
- Docker Compose: `docker-compose.yml`
- Redis Docs: https://redis.io/docs/
- ioredis: https://github.com/redis/ioredis
