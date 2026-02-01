# Vigil Guard Enterprise - Services Inventory

> **Last Updated:** 2025-01-11
> **Version:** 1.0.0

This document provides a complete inventory of all services in Vigil Guard Enterprise, their Dockerfiles, ports, and dependencies.

---

## Node.js Services (TypeScript)

### API Service

| Property | Value |
|----------|-------|
| Service Name | `api` |
| Dockerfile | `apps/api/Dockerfile` |
| Internal Port | 8787 |
| Health Endpoint | `/health` |
| Base Image | `node:20.19.6-slim` |
| Build Type | Multi-stage with pnpm |
| Dependencies | nats, redis |

### Detection Worker

| Property | Value |
|----------|-------|
| Service Name | `detection-worker` |
| Dockerfile | `services/detection-worker/Dockerfile` |
| Health Port | 9466 |
| Health Endpoint | `/health` |
| Base Image | `node:20.19.6-slim` |
| Build Type | Multi-stage with pnpm |
| Dependencies | nats, redis, init-nats |
| Native Modules | sharp, protobufjs |

### Semantic Worker

| Property | Value |
|----------|-------|
| Service Name | `semantic-worker` |
| Dockerfile | `services/semantic-worker/Dockerfile` |
| Health Port | 9465 |
| Health Endpoint | `/health` |
| Base Image | `node:20.19.6-slim` |
| Build Type | Multi-stage with pnpm |
| Dependencies | nats, qdrant, init-nats, init-qdrant |
| Volumes | semantic-models |
| Native Modules | sharp |

### PII Worker

| Property | Value |
|----------|-------|
| Service Name | `pii-worker` |
| Dockerfile | `services/pii-worker/Dockerfile` |
| Health Port | 9464 |
| Health Endpoint | `/health` |
| Base Image | `node:20.19.6-slim` |
| Build Type | Multi-stage with pnpm |
| Dependencies | nats, presidio-api, init-nats |

### Arbiter Worker

| Property | Value |
|----------|-------|
| Service Name | `arbiter-worker` |
| Dockerfile | `services/arbiter-worker/Dockerfile` |
| Health Port | 9464 |
| Health Endpoint | `/health` |
| Base Image | `node:20.19.6-slim` |
| Build Type | Multi-stage with pnpm |
| Dependencies | nats, init-nats |
| Volumes | api-data (SQLite) |
| Native Modules | RE2 |

### Logging Worker

| Property | Value |
|----------|-------|
| Service Name | `logging-worker` |
| Dockerfile | `services/logging-worker/Dockerfile` |
| Health Port | 9464 |
| Health Endpoint | `/health` |
| Base Image | `node:20.19.6-slim` |
| Build Type | Multi-stage with pnpm |
| Dependencies | nats, clickhouse, init-nats |

### LLM Guard Worker

| Property | Value |
|----------|-------|
| Service Name | `llm-guard-worker` |
| Dockerfile | `services/llm-guard-worker/Dockerfile` |
| Health Port | 9464 |
| Health Endpoint | `/health` |
| Base Image | `node:20.19.6-alpine3.23` |
| Build Type | Multi-stage with pnpm |
| Dependencies | nats, llm-guard, init-nats |

### Web UI Backend

| Property | Value |
|----------|-------|
| Service Name | `web-ui-backend` |
| Dockerfile | `apps/web-ui/backend/Dockerfile` |
| Internal Port | 8788 |
| Health Endpoint | `/health` |
| Base Image | `node:20.19.6-slim` |
| Build Type | Multi-stage with pnpm |
| Dependencies | api, nats, redis, clickhouse |
| Volumes | api-data (SQLite) |
| Native Modules | better-sqlite3 |

### Web UI Frontend

| Property | Value |
|----------|-------|
| Service Name | `web-ui-frontend` |
| Dockerfile | `apps/web-ui/frontend/Dockerfile` |
| Internal Port | 80 |
| Health Check | HTTP GET `/` |
| Base Image | Build: `node:20.19.6-alpine3.23`, Runtime: `nginx:1.29.4-alpine3.23` |
| Build Type | Multi-stage (build + nginx) |
| Dependencies | web-ui-backend |

---

## Python Services

### Presidio API

| Property | Value |
|----------|-------|
| Service Name | `presidio-api` |
| Dockerfile | `services/presidio-api/Dockerfile` |
| NATS Subject | `vigil.pii.analyze` |
| Timeout | 30s |
| Base Image | `python:3.11.14-slim-bookworm` |
| Build Type | Multi-stage with offline models |
| Dependencies | nats |
| Models | spaCy (en, pl) - loaded from local .whl files |
| Communication | NATS Request-Reply |

### Language Detector

| Property | Value |
|----------|-------|
| Service Name | `language-detector` |
| Dockerfile | `services/language-detector/Dockerfile` |
| NATS Subject | `vigil.lang.detect` |
| Timeout | 2s |
| Base Image | `python:3.11.14-slim` |
| Build Type | Single stage with offline models |
| Dependencies | nats |
| Models | fastText - embedded |
| Communication | NATS Request-Reply |

### LLM Guard

| Property | Value |
|----------|-------|
| Service Name | `llm-guard` |
| Dockerfile | `services/llm-guard/Dockerfile` |
| Internal Port | 8000 |
| NATS Subject | `vigil.llmguard.detect` |
| Timeout | 60s |
| Base Image | `python:3.11.14-slim` |
| Build Type | Single stage with ONNX models |
| Dependencies | nats |
| Volumes | llm-guard-models |
| Models | Llama Prompt Guard 2 (ONNX) |
| Communication | NATS Request-Reply + HTTP |

---

## Infrastructure Services

### NATS

| Property | Value |
|----------|-------|
| Service Name | `nats` |
| Image | `nats:2.10-alpine` |
| Ports | 4222 (client), 8222 (monitoring) |
| Health Check | HTTP GET `/healthz` |
| Volumes | nats-data |
| Features | JetStream enabled |

### Redis

| Property | Value |
|----------|-------|
| Service Name | `redis` |
| Image | `redis:7-alpine` |
| Port | 6379 |
| Health Check | `redis-cli ping` |
| Volumes | redis-data |
| Features | AOF persistence |

### ClickHouse

| Property | Value |
|----------|-------|
| Service Name | `clickhouse` |
| Image | `clickhouse/clickhouse-server:24-alpine` |
| Ports | 8123 (HTTP), 9000 (native) |
| Health Check | SQL query |
| Volumes | clickhouse-data |
| Migrations | `infra/clickhouse/migrations/` |
| Resource Limits | 2 CPU, 4GB RAM |

### Qdrant

| Property | Value |
|----------|-------|
| Service Name | `qdrant` |
| Image | `qdrant/qdrant:v1.16.2` |
| Ports | 6333 (REST), 6334 (gRPC) |
| Health Check | HTTP GET `/health` |
| Volumes | qdrant-data |
| Resource Limits | 1 CPU, 1GB RAM |

### Prometheus

| Property | Value |
|----------|-------|
| Service Name | `prometheus` |
| Image | `prom/prometheus:v2.47.0` |
| Port | 9090 |
| Health Check | HTTP GET `/-/healthy` |
| Volumes | prometheus-data |
| Config | `infra/prometheus/prometheus.yml` |

### Traefik

| Property | Value |
|----------|-------|
| Service Name | `traefik` |
| Image | `traefik:v3.2` |
| Ports | 80 (HTTP), 443 (HTTPS) |
| Health Check | `traefik healthcheck` |
| Config | `infra/traefik/` |

### NATS Exporter

| Property | Value |
|----------|-------|
| Service Name | `nats-exporter` |
| Image | `natsio/prometheus-nats-exporter:0.18.0` |
| Dependencies | nats |

---

## Init Services (dev.yml only)

### Init NATS

| Property | Value |
|----------|-------|
| Service Name | `init-nats` |
| Dockerfile | `infra/docker/Dockerfile.scripts` |
| Command | `npx tsx scripts/seed-config.ts` |
| Dependencies | nats |
| Purpose | Seeds JetStream streams and KV config |
| Restart | No |

### Init Qdrant

| Property | Value |
|----------|-------|
| Service Name | `init-qdrant` |
| Dockerfile | `infra/docker/Dockerfile.init-qdrant` |
| Dependencies | qdrant |
| Purpose | Loads pre-computed embeddings |
| Volumes | `./data/qdrant-seed:/data/qdrant-seed:ro` |
| Restart | No |

### Init API Data

| Property | Value |
|----------|-------|
| Service Name | `init-api-data` |
| Image | `alpine:3.20` |
| Command | `chown -R 1001:1001 /data` |
| Purpose | Sets ownership of api-data volume |
| Volumes | api-data |
| Restart | No |

### Migrate Bucket

| Property | Value |
|----------|-------|
| Service Name | `migrate-bucket` |
| Dockerfile | `infra/docker/Dockerfile.scripts` |
| Command | `npx tsx scripts/migrate-config-bucket.ts --live` |
| Profile | `migrate` |
| Purpose | Migrates NATS KV bucket configuration |
| Restart | No |

---

## Named Volumes

| Volume | Used By | Purpose |
|--------|---------|---------|
| nats-data | nats | JetStream storage |
| redis-data | redis | AOF persistence |
| clickhouse-data | clickhouse | Analytics data |
| qdrant-data | qdrant | Vector embeddings |
| prometheus-data | prometheus | Metrics history |
| semantic-models | semantic-worker | ML models |
| api-data | api, arbiter-worker, web-ui-backend | SQLite databases |
| llm-guard-models | llm-guard | ONNX models |

---

## Network

| Property | Value |
|----------|-------|
| Name | vigil-network |
| Driver | bridge |
| DNS | Container names |

---

## Traefik Routing

| Host | Path | Service | Port |
|------|------|---------|------|
| `api.vigilguard` | `/` | api | 8787 |
| `app.vigilguard` | `/api/*` | web-ui-backend | 8788 |
| `app.vigilguard` | `/*` | web-ui-frontend | 80 |

---

## Resource Limits

| Service | CPU | Memory |
|---------|-----|--------|
| api | 0.5 | 512M |
| detection-worker | 2 | 2G |
| semantic-worker | 1 | 2G |
| pii-worker | 1 | 2G |
| arbiter-worker | 1 | 1G |
| logging-worker | 1 | 1G |
| llm-guard-worker | 1 | 1G |
| llm-guard | 1 | 1G |
| language-detector | 1 | 1G |
| presidio-api | 1 | 2G |
| web-ui-backend | 0.5 | 512M |
| clickhouse | 2 | 4G |
| qdrant | 1 | 1G |

---

## Security Configuration

All custom services have:

```yaml
read_only: true
tmpfs:
  - /tmp
security_opt:
  - no-new-privileges:true
cap_drop:
  - ALL
user: 1001
```

---

## Health Check Intervals

| Service Type | Interval | Timeout | Retries | Start Period |
|--------------|----------|---------|---------|--------------|
| Infrastructure | 10s | 5-10s | 3 | - |
| API | 10s | 5s | 3 | - |
| Workers | 30s | 10-15s | 3 | 40s |
| Python Services | 30s | 10s | 3 | 10-60s |

---

## Build Characteristics

### Node.js Build Pattern

```dockerfile
FROM node:20.19.6-slim AS base
RUN corepack enable && corepack prepare pnpm@10.1.0 --activate

FROM base AS deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM base AS builder
RUN pnpm build

FROM node:20.19.6-slim AS runner
USER 1001
```

### Python Build Pattern

```dockerfile
FROM python:3.11.14-slim-bookworm AS builder
# Copy local model files
COPY models/ /app/models/
# Verify checksums
RUN sha256sum -c checksums.txt

FROM python:3.11.14-slim-bookworm AS runtime
USER 1001
```
