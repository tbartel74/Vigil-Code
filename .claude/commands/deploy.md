---
name: deploy
description: Docker deployment - all services or specific service with health checks
argument-hint: "[service-name] [--build] [--prod] - Deploy services"
---

# Deploy Command

Docker orchestration and service deployment for Vigil Guard Enterprise.

## Usage

```bash
/deploy                      # Deploy all services (dev)
/deploy api                  # Deploy specific service
/deploy api --build          # Rebuild and deploy service
/deploy --prod               # Deploy in production mode
```

**IMPORTANT:** Use `./scripts/stack.sh` for all Docker operations (see CLAUDE.md Golden Rule #16).

---

## Quick Reference

### Deploy All Services

```bash
# Development (ALWAYS use stack.sh)
./scripts/stack.sh up -d

# Production
VGE_ENV=prod SECRETS_FILE=./data/secrets/system.env ./scripts/stack.sh up -d
```

### Deploy Specific Service

```bash
# Start/restart
./scripts/stack.sh up -d <service-name>

# Rebuild and start
./scripts/stack.sh build <service-name>
./scripts/stack.sh up -d <service-name>

# Full rebuild
./scripts/stack.sh rebuild <service-name>
```

### Other Commands

```bash
./scripts/stack.sh down          # Stop all
./scripts/stack.sh ps            # Status
./scripts/stack.sh logs <svc>    # View logs
./scripts/stack.sh doctor        # Health check
```

---

## Services

### Node.js Services

| Service | Port | Description |
|---------|------|-------------|
| api | 8787 | Public REST API |
| detection-worker | 9466 | Heuristics detection |
| semantic-worker | 9465 | Embedding similarity |
| pii-worker | 9464 | PII detection |
| arbiter-worker | 9464 | Decision fusion |
| logging-worker | 9464 | ClickHouse ingestion |
| llm-guard-worker | 9464 | LLM-based detection |
| web-ui-backend | 8788 | Config management |
| web-ui-frontend | 80 | Dashboard UI |

### Python Services

| Service | Port | Description |
|---------|------|-------------|
| presidio-api | 5001 | PII detection |
| language-detector | 5002 | Language detection |
| llm-guard | 5004 | Llama Prompt Guard |

### Infrastructure

| Service | Ports | Description |
|---------|-------|-------------|
| nats | 4222, 8222 | Message broker |
| redis | 6379 | Rate limiting |
| clickhouse | 8123 | Analytics DB |
| qdrant | 6333 | Vector DB |
| prometheus | 9090 | Metrics |
| traefik | 80, 443 | Reverse proxy |

---

## Health Checks

```bash
# API
curl -f http://localhost:8787/health

# NATS
curl -f http://localhost:8222/healthz

# ClickHouse
curl -f http://localhost:8123/ping

# Qdrant
curl -f http://localhost:6333/health

# Workers (check NATS consumers)
docker exec vigil-nats nats consumer ls VIGIL_DETECTION
```

---

## Production Restart Order

1. **Databases:** clickhouse, nats, redis, qdrant
2. **Core:** api, web-ui-backend
3. **Python:** presidio-api, language-detector, llm-guard
4. **Workers:** logging-worker, detection-worker, semantic-worker, pii-worker, llm-guard-worker, arbiter-worker
5. **UI:** web-ui-frontend

---

## Troubleshooting

### Service Won't Start

```bash
./scripts/stack.sh logs <service-name>
./scripts/stack.sh doctor
```

### Worker Not Processing

```bash
docker exec vigil-nats nats consumer info VIGIL_DETECTION <worker-name>
```

### Port Already in Use

```bash
lsof -i :<port>
kill -9 <PID>
```

---

## Example Tasks

- "Deploy api service with health checks"
- "Rebuild detection-worker container"
- "Deploy all services in production"
- "Restart pii-worker"
- "View logs for all workers"

## Related

- **docker-expert** agent - Complex troubleshooting
- **nats-expert** agent - Stream management
