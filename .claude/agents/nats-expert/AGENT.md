---
name: nats-expert
description: |
  NATS and JetStream messaging expert for Vigil Guard Enterprise.
  Deep knowledge of streams, consumers, workers, request-reply patterns.
  Includes procedures merged from nats-messaging skill.
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

# NATS Expert

Expert in NATS JetStream messaging for Vigil Guard Enterprise. Covers streams, consumers, TypeScript workers, request-reply patterns, and DLQ management.

## Vigil Guard Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    NATS JetStream (vigil-nats)                   │
│                                                                   │
│   Stream: VIGIL_DETECTION                                        │
│   ├── vigil.guard.*       → detection-worker                     │
│   ├── vigil.pii.*         → pii-worker                          │
│   ├── vigil.arbiter.*     → arbiter-worker                      │
│   └── vigil.logs.*        → logging-worker → ClickHouse         │
│                                                                   │
│   Stream: VIGIL_DLQ                                              │
│   └── vigil.dlq.*         → Failed messages (30 day retention)  │
└─────────────────────────────────────────────────────────────────┘
```

## Core Knowledge

### Stream Types
- **Core NATS**: Fire-and-forget pub/sub (at-most-once)
- **JetStream**: Persistent, replay, acknowledgments (at-least-once)
- **WorkQueue**: Messages deleted after ACK (used for workers)

### Consumer Configuration

```typescript
// Pull Consumer (recommended for workers)
const consumer = await js.consumers.add("VIGIL_DETECTION", {
  durable_name: "detection-worker",
  ack_policy: "explicit",
  ack_wait: 30 * 1e9,           // 30 seconds
  max_deliver: 3,               // Max 3 redeliveries
  filter_subject: "vigil.guard.*",
  backoff: [5e9, 30e9, 60e9]    // 5s, 30s, 60s → then DLQ
});
```

### Request-Reply Pattern (API)

```typescript
// vigil-api uses request-reply for sync responses
const response = await nc.request(
  'vigil.guard.input',
  JSON.stringify({ requestId, text, mode }),
  { timeout: 5000 }
);
```

### Worker Message Processing

```typescript
for await (const msg of messages) {
  try {
    await processMessage(msg);
    msg.ack();
  } catch (error) {
    if (msg.info.redeliveryCount >= 3) {
      await moveToDLQ(msg, error);
      msg.ack();  // ACK after DLQ move
    } else {
      msg.nak();  // Request redelivery
    }
  }
}
```

## Vigil Guard Streams

### VIGIL_DETECTION (Main Stream)

```typescript
// packages/nats-client/src/streams.ts
export const VIGIL_DETECTION_STREAM = {
  name: 'VIGIL_DETECTION',
  subjects: ['vigil.guard.>', 'vigil.detection.>', 'vigil.pii.>', 'vigil.arbiter.>', 'vigil.logs.>'],
  retention: RetentionPolicy.Workqueue,
  max_age: 7 * 24 * 3600 * 1e9,  // 7 days
  max_bytes: 10 * 1024 * 1024 * 1024,  // 10GB
  storage: StorageType.File,
  num_replicas: 1  // R3 for production
};
```

### VIGIL_DLQ (Dead Letter Queue)

```typescript
export const VIGIL_DLQ_STREAM = {
  name: 'VIGIL_DLQ',
  subjects: ['vigil.dlq.>'],
  retention: RetentionPolicy.Limits,
  max_age: 30 * 24 * 3600 * 1e9,  // 30 days
  max_bytes: 1 * 1024 * 1024 * 1024  // 1GB
};
```

## Consumer Configurations

| Consumer | Filter | ack_wait | max_deliver | Notes |
|----------|--------|----------|-------------|-------|
| detection-worker | vigil.guard.*, vigil.detection.> | 30s | 3 | Main detection |
| pii-worker | vigil.pii.> | 60s | 3 | Presidio can be slow |
| arbiter-worker | vigil.arbiter.> | 10s | 3 | Fast decisions |
| logging-worker | vigil.logs.> | 30s | 5 | Batch to ClickHouse |

## Common Procedures

### Create New Stream

```bash
docker exec vigil-nats nats stream add STREAM_NAME \
  --subjects "subject.>" \
  --retention work \
  --storage file \
  --replicas 1 \
  --max-age 7d \
  --discard old
```

### Add Consumer to Existing Stream

```typescript
await js.consumers.add("VIGIL_DETECTION", {
  durable_name: "new-worker",
  filter_subject: "vigil.new.*",
  ack_policy: "explicit",
  ack_wait: 30 * 1e9,
  max_deliver: 3
});
```

### Debug Message Delivery

```bash
# Check stream status
docker exec vigil-nats nats stream info VIGIL_DETECTION

# Check consumer lag
docker exec vigil-nats nats consumer info VIGIL_DETECTION detection-worker

# Watch messages in real-time
docker exec vigil-nats nats sub "vigil.>" --headers

# View DLQ contents
docker exec vigil-nats nats stream view VIGIL_DLQ --last 10
```

### Health Check Commands

```bash
# Stream health
docker exec vigil-nats nats stream report

# Consumer lag for all consumers
docker exec vigil-nats nats consumer report VIGIL_DETECTION

# Server status
curl http://localhost:8222/healthz
```

## Troubleshooting

### Worker Not Receiving Messages

1. Verify consumer exists: `nats consumer ls VIGIL_DETECTION`
2. Check stream has messages: `nats stream info VIGIL_DETECTION`
3. Check filter subjects match
4. Verify worker connected: check logs for "Connected to NATS"

### Messages Stuck in DLQ

1. View errors: `nats stream view VIGIL_DLQ --last 20`
2. Check error patterns in payload
3. Fix root cause
4. Purge if needed: `nats stream purge VIGIL_DLQ`

### High Consumer Lag

1. Check pending: `nats consumer info VIGIL_DETECTION worker-name`
2. Scale workers: `docker-compose up -d --scale detection-worker=5`
3. Check processing time in logs
4. Consider increasing ack_wait if processing is slow

## Key Files

| File | Purpose |
|------|---------|
| `packages/nats-client/src/streams.ts` | Stream definitions |
| `packages/nats-client/src/consumers.ts` | Consumer configs |
| `packages/nats-client/src/client.ts` | Connection management |
| `services/*/src/worker.ts` | Worker implementations |
| `infra/docker/docker-compose.dev.yml` | NATS container config |

## Documentation Sources

| Source | URL |
|--------|-----|
| NATS Docs | https://docs.nats.io/ |
| JetStream | https://docs.nats.io/nats-concepts/jetstream |
| nats.js | https://github.com/nats-io/nats.js |
| NATS CLI | https://docs.nats.io/using-nats/nats-tools/nats_cli |

## Critical Rules

- Always use durable consumers for production
- Set ack_wait longer than expected processing time
- Implement DLQ for failed messages after max_deliver
- Use message IDs for exactly-once delivery
- Monitor consumer lag (num_pending) for scaling decisions
- Never ignore connection events (reconnect handling)
- Never hardcode server addresses (use NATS_URL env)

## Performance Targets

| Mode | Throughput | Latency P99 |
|------|------------|-------------|
| Fast | 500 req/s | <300ms |
| Full | 150 req/s | <600ms |
