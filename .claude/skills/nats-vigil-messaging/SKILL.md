---
name: nats-vigil-messaging
description: NATS JetStream messaging for Vigil Guard 2.0 architecture. Use when working with message queues, detection workers, request-reply API, async processing, or migrating from n8n webhooks to NATS-based architecture.
version: 2.0.0
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob]
---

# NATS Messaging for Vigil Guard

## Overview

NATS JetStream integration for Vigil Guard 2.0 architecture, replacing n8n webhooks with high-performance message-based processing. This skill covers the complete messaging infrastructure for detection pipeline.

## When to Use This Skill

- Configuring NATS streams for Vigil Guard
- Implementing detection workers (TypeScript)
- Setting up request-reply for synchronous API
- Migrating from n8n webhooks to NATS
- Debugging message delivery issues
- Monitoring queue depth and consumer lag
- Implementing exactly-once processing

## Tech Stack

| Component | Version | Purpose |
|-----------|---------|---------|
| NATS Server | 2.10+ | Message broker |
| JetStream | Built-in | Persistent messaging |
| nats.js | 2.x | Node.js client |
| TypeScript | 5.x | Worker implementation |

## Architecture (Vigil Guard 2.0)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Vigil Guard 2.0                              │
│                                                                      │
│  ┌─────────────┐     ┌─────────────────────────────────────────┐   │
│  │ vigil-api   │     │              NATS JetStream              │   │
│  │ (Express)   │────▶│                                         │   │
│  │ /v1/analyze │     │  ┌─────────────┐   ┌─────────────┐      │   │
│  └─────────────┘     │  │ VIGIL_REQ   │   │ VIGIL_RES   │      │   │
│                      │  │ Stream      │   │ Stream      │      │   │
│                      │  └──────┬──────┘   └──────▲──────┘      │   │
│                      │         │                 │              │   │
│  ┌─────────────┐     │  ┌──────┴──────┐  ┌──────┴──────┐      │   │
│  │ detection   │◀────┼──│  Consumer   │  │  Publisher  │      │   │
│  │ worker      │     │  │  (pull)     │  │             │      │   │
│  └─────────────┘     │  └─────────────┘  └─────────────┘      │   │
│                      │                                         │   │
│  ┌─────────────┐     │  ┌─────────────┐                       │   │
│  │ pii-worker  │◀────┼──│  Consumer   │                       │   │
│  └─────────────┘     │  │  pii-proc   │                       │   │
│                      │  └─────────────┘                       │   │
│  ┌─────────────┐     │                                         │   │
│  │ arbiter     │◀────┼──│  Consumer   │                       │   │
│  │ worker      │     │  │  arbiter    │                       │   │
│  └─────────────┘     │  └─────────────┘                       │   │
│                      └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
services/vigil-api/
├── src/
│   ├── config/
│   │   └── nats.config.ts       # NATS connection settings
│   ├── streams/
│   │   ├── index.ts             # Stream initialization
│   │   ├── vigil-requests.ts    # Request stream config
│   │   └── vigil-results.ts     # Results stream config
│   ├── workers/
│   │   ├── detection-worker.ts  # Pattern matching worker
│   │   ├── pii-worker.ts        # PII detection worker
│   │   └── arbiter-worker.ts    # Final decision worker
│   ├── api/
│   │   └── analyze.ts           # /v1/analyze endpoint
│   └── lib/
│       └── nats-client.ts       # NATS connection singleton
├── docker-compose.yml           # NATS service definition
└── package.json
```

## Stream Configuration

### VIGIL_REQUESTS Stream

```typescript
// services/vigil-api/src/streams/vigil-requests.ts
import { JetStreamManager, RetentionPolicy, StorageType, DiscardPolicy } from 'nats';

export async function createRequestsStream(jsm: JetStreamManager) {
  await jsm.streams.add({
    name: "VIGIL_REQUESTS",
    subjects: [
      "vigil.requests.analyze",
      "vigil.requests.async"
    ],
    retention: RetentionPolicy.Limits,
    storage: StorageType.File,
    max_msgs: 1000000,
    max_bytes: 1024 * 1024 * 500,    // 500MB
    max_age: 86400 * 1e9,             // 24 hours
    max_msg_size: 1024 * 1024,        // 1MB per message
    discard: DiscardPolicy.Old,
    duplicate_window: 120 * 1e9,      // 2 min dedup
    num_replicas: 1                   // 3 for production
  });
}
```

### Consumer Configuration

```typescript
// services/vigil-api/src/workers/detection-worker.ts
import { JetStreamClient, AckPolicy, DeliverPolicy } from 'nats';

export async function createDetectionConsumer(js: JetStreamClient) {
  return await js.consumers.add("VIGIL_REQUESTS", {
    durable_name: "detection-worker",
    ack_policy: AckPolicy.Explicit,
    ack_wait: 30 * 1e9,              // 30 seconds
    max_deliver: 3,                   // Max 3 redeliveries
    filter_subject: "vigil.requests.analyze",
    deliver_policy: DeliverPolicy.All,
    max_ack_pending: 100              // Backpressure limit
  });
}
```

## Common Tasks

### 1. Initialize NATS Connection

```typescript
// services/vigil-api/src/lib/nats-client.ts
import { connect, NatsConnection, JetStreamClient } from 'nats';

let nc: NatsConnection | null = null;
let js: JetStreamClient | null = null;

export async function getNatsConnection(): Promise<NatsConnection> {
  if (nc) return nc;

  nc = await connect({
    servers: process.env.NATS_URL || 'nats://localhost:4222',
    name: 'vigil-api',
    reconnect: true,
    maxReconnectAttempts: -1,
    reconnectTimeWait: 1000
  });

  console.log('Connected to NATS');
  return nc;
}

export async function getJetStream(): Promise<JetStreamClient> {
  if (js) return js;
  const conn = await getNatsConnection();
  js = conn.jetstream();
  return js;
}
```

### 2. Implement Detection Worker

```typescript
// services/vigil-api/src/workers/detection-worker.ts
import { getJetStream } from '../lib/nats-client';
import { detectThreats } from '../detection/engine';

export async function startDetectionWorker() {
  const js = await getJetStream();
  const consumer = await js.consumers.get("VIGIL_REQUESTS", "detection-worker");

  console.log('Detection worker started');

  const messages = await consumer.consume();
  for await (const msg of messages) {
    try {
      const request = JSON.parse(msg.string());

      // Run detection
      const result = await detectThreats(request.text, request.options);

      // Publish result to next stage
      await js.publish('vigil.stage.pii', JSON.stringify({
        requestId: request.requestId,
        detection: result,
        originalText: request.text
      }));

      msg.ack();
    } catch (error) {
      console.error('Detection failed:', error);

      if (msg.info.redeliveryCount >= 3) {
        // Send to DLQ
        await js.publish('vigil.dlq', msg.data, {
          headers: { 'Original-Subject': msg.subject }
        });
        msg.term();
      } else {
        msg.nak(5000); // Retry after 5s
      }
    }
  }
}
```

### 3. Request-Reply API Endpoint

```typescript
// services/vigil-api/src/api/analyze.ts
import { Router } from 'express';
import { getNatsConnection } from '../lib/nats-client';
import { StringCodec } from 'nats';

const router = Router();
const sc = StringCodec();

router.post('/v1/analyze', async (req, res) => {
  const nc = await getNatsConnection();

  const request = {
    requestId: crypto.randomUUID(),
    text: req.body.text,
    options: req.body.options || {},
    timestamp: Date.now()
  };

  try {
    // Synchronous request-reply
    const response = await nc.request(
      'vigil.analyze.sync',
      sc.encode(JSON.stringify(request)),
      { timeout: 5000 }
    );

    const result = JSON.parse(sc.decode(response.data));
    res.json(result);
  } catch (error) {
    if (error.code === 'TIMEOUT') {
      res.status(504).json({ error: 'Analysis timeout' });
    } else {
      res.status(500).json({ error: 'Analysis failed' });
    }
  }
});

export default router;
```

### 4. Async Processing Endpoint

```typescript
// services/vigil-api/src/api/analyze-async.ts
router.post('/v1/analyze/async', async (req, res) => {
  const js = await getJetStream();

  const requestId = crypto.randomUUID();
  const request = {
    requestId,
    text: req.body.text,
    callbackUrl: req.body.callbackUrl,
    timestamp: Date.now()
  };

  // Publish to stream (fire-and-forget)
  const ack = await js.publish(
    'vigil.requests.async',
    JSON.stringify(request),
    { msgID: requestId } // For deduplication
  );

  res.status(202).json({
    requestId,
    status: 'accepted',
    streamSeq: ack.seq
  });
});
```

### 5. Docker Compose Integration

```yaml
# docker-compose.yml
services:
  nats:
    image: nats:2.10-alpine
    container_name: vigil-nats
    ports:
      - "4222:4222"   # Client connections
      - "8222:8222"   # HTTP monitoring
    command: >
      --jetstream
      --store_dir /data
      --http_port 8222
    volumes:
      - nats-data:/data
    networks:
      - vigil-net
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:8222/healthz"]
      interval: 10s
      timeout: 5s
      retries: 3

volumes:
  nats-data:
```

### 6. Health Check Endpoint

```typescript
// services/vigil-api/src/api/health.ts
router.get('/health/nats', async (req, res) => {
  try {
    const js = await getJetStream();
    const jsm = await js.jetstreamManager();

    const streams = await jsm.streams.list().next();
    const streamCount = streams.length;

    // Check consumer lag
    const consumerInfo = await js.consumers.info('VIGIL_REQUESTS', 'detection-worker');

    res.json({
      status: 'healthy',
      streams: streamCount,
      detectionWorker: {
        pending: consumerInfo.num_pending,
        ackPending: consumerInfo.num_ack_pending,
        redelivered: consumerInfo.num_redelivered
      }
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

- ✅ Use durable consumers for all production workloads
- ✅ Set ack_wait longer than max processing time
- ✅ Implement dead letter queues for failed messages
- ✅ Use message IDs for exactly-once delivery
- ✅ Monitor num_pending for consumer lag
- ✅ Use request-reply for sync API, streams for async
- ✅ Set appropriate max_deliver for retry limits

### DON'Ts

- ❌ Use ephemeral consumers for critical processing
- ❌ Ignore connection/reconnection events
- ❌ Skip message acknowledgments
- ❌ Set ack_wait shorter than processing time
- ❌ Use KEYS-style operations for high-volume subjects

## Integration with Other Skills

### With `express-api-developer`:
- Route handlers publish to NATS
- Request-reply for sync endpoints
- Async endpoints return request ID

### With `vitest-expert`:
- Mock NATS connection for unit tests
- Integration tests with real NATS container
- Test fixtures for message payloads

### With `docker-vigil-orchestration`:
- NATS container management
- Health checks configuration
- Volume persistence

### With `clickhouse-grafana-monitoring`:
- Log message processing metrics
- Track consumer lag over time
- Alert on queue depth

## Quick Reference

### NATS CLI Commands

```bash
# List streams
docker exec vigil-nats nats stream ls

# Stream info
docker exec vigil-nats nats stream info VIGIL_REQUESTS

# Consumer info
docker exec vigil-nats nats consumer info VIGIL_REQUESTS detection-worker

# Watch messages
docker exec vigil-nats nats sub "vigil.>" --headers

# Publish test message
docker exec vigil-nats nats pub vigil.requests.analyze '{"text":"test"}'

# Purge stream (CAREFUL!)
docker exec vigil-nats nats stream purge VIGIL_REQUESTS --force

# Server stats
docker exec vigil-nats nats-top
```

### Environment Variables

```bash
NATS_URL=nats://localhost:4222
NATS_CLUSTER_NAME=vigil-cluster
NATS_MAX_RECONNECTS=-1
NATS_RECONNECT_WAIT=1000
```

## Troubleshooting

### Consumer Not Receiving Messages

1. Check consumer exists: `nats consumer ls STREAM_NAME`
2. Verify filter_subject matches published subjects
3. Check ack_pending count (might be maxed out)
4. Verify stream has messages: `nats stream info STREAM_NAME`

### Message Redelivery Loop

1. Check ack_wait vs processing time
2. Verify ack() is called on success
3. Check max_deliver setting
4. Look for exceptions preventing ack

### High Consumer Lag

1. Scale workers horizontally
2. Increase max_ack_pending
3. Check for slow downstream dependencies
4. Consider parallel processing within worker

### Connection Issues

1. Verify NATS container is running
2. Check network connectivity (vigil-net)
3. Review reconnection settings
4. Check server logs: `docker logs vigil-nats`

## Related Skills

- `express-api-developer` - API endpoint implementation
- `docker-vigil-orchestration` - Container management
- `vitest-expert` - Testing workers
- `redis-vigil-caching` - Complementary caching layer

## References

- NATS Configuration: `services/vigil-api/src/config/nats.config.ts`
- Workers: `services/vigil-api/src/workers/`
- Docker Compose: `docker-compose.yml`
- NATS Docs: https://docs.nats.io/
