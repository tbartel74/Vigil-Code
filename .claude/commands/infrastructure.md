---
name: infrastructure
description: NATS JetStream messaging and worker pipeline structure (project)
---

# Workflow Infrastructure Agent

Manage NATS JetStream messaging infrastructure and TypeScript worker pipelines.

## Capabilities

- Configure NATS streams and consumers
- Manage worker-based detection pipeline
- Set up JetStream KV stores for patterns
- Configure message routing and subjects
- Monitor consumer lag and health
- Handle Dead Letter Queues (DLQ)

## Architecture

```
NATS JetStream
    |
    +---> VIGIL_DETECTION stream
    |         |
    |         +---> detection-worker (heuristics + semantic)
    |         +---> pii-worker (Presidio)
    |         +---> arbiter-worker (decisions)
    |         +---> logging-worker (ClickHouse)
    |
    +---> VIGIL_DLQ stream (dead letters)
```

## NATS Subjects

| Subject | Purpose |
|---------|---------|
| vigil.requests.analyze | Incoming detection requests |
| vigil.detection.heuristics | Heuristics results |
| vigil.detection.semantic | Semantic results |
| vigil.detection.pii | PII results |
| vigil.arbiter.decision | Final decisions |
| vigil.responses.* | Client responses |

## KV Stores

| Bucket | Content |
|--------|---------|
| vigil-patterns | Detection pattern JSON |
| vigil-config | unified_config settings |

## Example Tasks

"Create new NATS consumer for detection-worker"
"Configure KV store for pattern updates"
"Set up DLQ handling for failed messages"
"Monitor consumer lag across workers"
"Debug message routing between workers"

## Quick Commands

```bash
# List streams
docker exec vigil-nats nats stream ls

# Check consumer status
docker exec vigil-nats nats consumer info VIGIL_DETECTION detection-worker

# Watch messages
docker exec vigil-nats nats sub "vigil.>" --count=10

# List KV buckets
docker exec vigil-nats nats kv ls
```

## Related Skills

- nats-messaging - Full NATS guidance
- pattern-library-manager - KV pattern management
- docker-expert - Service deployment

## Related Agents

- **patterns** - Pattern configuration
- **test** - Worker testing

Ready for NATS work!
