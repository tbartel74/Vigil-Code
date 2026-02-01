# Repository State Reference

> **Last Updated:** 2025-01-11
> **Version:** 1.0.0

This document provides agents with accurate, up-to-date information about the current state of the Vigil Guard Enterprise repository.

---

## Quick Reference

| Category | Value |
|----------|-------|
| Monorepo Tool | pnpm workspaces |
| Node Version | 20.19.6 |
| Python Version | 3.11.14 |
| Container Runtime | Docker Compose v2 |
| Message Backbone | NATS JetStream 2.10 |
| Vector Database | Qdrant 1.16.2 |
| Analytics Database | ClickHouse 24 |

---

## Docker Compose Architecture (CRITICAL)

### Three-File Strategy

The project uses a **split Docker Compose architecture** with three files:

| File | Purpose | Use Case |
|------|---------|----------|
| `docker-compose.base.yml` | Base configuration with all service definitions | Always used as base |
| `docker-compose.dev.yml` | Development overrides with local builds | Local development |
| `docker-compose.prod.yml` | Production with pre-built GHCR images | Production deployment |

### Starting Services

**Development (local builds):**
```bash
docker compose -f infra/docker/docker-compose.base.yml -f infra/docker/docker-compose.dev.yml up -d
```

**Production (pre-built images):**
```bash
docker compose -f infra/docker/docker-compose.base.yml -f infra/docker/docker-compose.prod.yml up -d
```

**Base only (for production-like testing):**
```bash
SECRETS_FILE=.env docker compose -f infra/docker/docker-compose.base.yml up -d
```

### Key Differences

| Aspect | base.yml | dev.yml | prod.yml |
|--------|----------|---------|----------|
| Image source | Pre-built GHCR | Local build | Pre-built GHCR |
| Build context | None | `.` (repo root) | None |
| Init services | Not defined | `init-nats`, `init-qdrant` | Not defined |
| Migration tools | Not defined | `migrate-bucket` | Not defined |

### Build Commands

**Rebuild single service (dev):**
```bash
docker compose -f infra/docker/docker-compose.base.yml -f infra/docker/docker-compose.dev.yml up -d --build <service-name>
```

**Rebuild all services (dev):**
```bash
docker compose -f infra/docker/docker-compose.base.yml -f infra/docker/docker-compose.dev.yml up -d --build
```

**Force rebuild without cache:**
```bash
docker compose -f infra/docker/docker-compose.base.yml -f infra/docker/docker-compose.dev.yml build --no-cache <service-name>
```

---

## Service Inventory

### Node.js Services (TypeScript Workers)

| Service | Dockerfile | Port | Health Endpoint |
|---------|------------|------|-----------------|
| api | `apps/api/Dockerfile` | 8787 | `/health` |
| detection-worker | `services/detection-worker/Dockerfile` | 9466 | `/health` |
| semantic-worker | `services/semantic-worker/Dockerfile` | 9465 | `/health` |
| pii-worker | `services/pii-worker/Dockerfile` | 9464 | `/health` |
| arbiter-worker | `services/arbiter-worker/Dockerfile` | 9464 | `/health` |
| logging-worker | `services/logging-worker/Dockerfile` | 9464 | `/health` |
| llm-guard-worker | `services/llm-guard-worker/Dockerfile` | 9464 | `/health` |
| web-ui-backend | `apps/web-ui/backend/Dockerfile` | 8788 | `/health` |
| web-ui-frontend | `apps/web-ui/frontend/Dockerfile` | 80 | HTTP GET `/` |

### Python Services

| Service | Dockerfile | Port | Health Check |
|---------|------------|------|--------------|
| presidio-api | `services/presidio-api/Dockerfile` | 5002 | NATS connectivity |
| language-detector | `services/language-detector/Dockerfile` | 5003 | NATS connectivity |
| llm-guard | `services/llm-guard/Dockerfile` | 8000 | NATS connectivity |

### Infrastructure Services

| Service | Image | Ports | Purpose |
|---------|-------|-------|---------|
| nats | `nats:2.10-alpine` | 4222, 8222 | JetStream message backbone |
| redis | `redis:7-alpine` | 6379 | Rate limiting, caching |
| clickhouse | `clickhouse/clickhouse-server:24-alpine` | 8123, 9000 | Analytics database |
| qdrant | `qdrant/qdrant:v1.16.2` | 6333, 6334 | Vector similarity search |
| prometheus | `prom/prometheus:v2.47.0` | 9090 | Metrics collection |
| traefik | `traefik:v3.2` | 80, 443 | Reverse proxy, TLS |

### Init Services (dev.yml only)

| Service | Purpose | Runs When |
|---------|---------|-----------|
| init-nats | Creates JetStream streams and KV config | On startup |
| init-qdrant | Loads pre-computed embeddings into Qdrant | On startup |
| init-api-data | Sets ownership of api-data volume | On startup |

---

## Dockerfile Build Patterns

### Node.js Services (Multi-stage)

```
Base Stage:     node:20.19.6-slim or node:20.19.6-alpine3.23
Build Stage:    pnpm 10.1.0 via corepack, --frozen-lockfile
Runtime Stage:  Minimal with only production dependencies
User:           UID 1001 (non-root)
```

**Cache mounting:**
```dockerfile
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
```

**Native module rebuilding:**
```dockerfile
RUN pnpm rebuild sharp protobufjs
```

### Python Services

```
Base Stage:     python:3.11.14-slim-bookworm
Models:         Loaded from local .whl files (offline-first)
Verification:   SHA256 checksums for model integrity
User:           UID 1001 (non-root)
```

### Security Hardening (All Services)

```yaml
read_only: true
tmpfs:
  - /tmp
security_opt:
  - no-new-privileges:true
cap_drop:
  - ALL
```

---

## Named Volumes

| Volume | Service | Purpose |
|--------|---------|---------|
| nats-data | nats | JetStream storage |
| redis-data | redis | AOF persistence |
| clickhouse-data | clickhouse | Analytics data |
| qdrant-data | qdrant | Vector embeddings |
| prometheus-data | prometheus | Metrics history |
| semantic-models | semantic-worker | ML models |
| api-data | api, arbiter-worker | SQLite databases |
| llm-guard-models | llm-guard | ONNX models |

---

## Network Configuration

**Network name:** `vigil-network`
**Driver:** bridge

**Internal DNS resolution:**
- Services communicate via container names
- Example: `nats://nats:4222`, `http://clickhouse:8123`

---

## Environment Configuration

### Required Environment Variables

```bash
# Loaded via env_file: ${SECRETS_FILE}
NATS_USER=<username>
NATS_PASSWORD=<password>
REDIS_PASSWORD=<password>
CLICKHOUSE_USER=<username>
CLICKHOUSE_PASSWORD=<password>
JWT_SECRET=<32+ chars>
ADMIN_PASSWORD=<password>
```

### Service-Specific Variables

| Variable | Service | Default |
|----------|---------|---------|
| COMM_MODE | presidio-api, language-detector, llm-guard | `nats` |
| NATS_URL | All workers | `nats://nats:4222` |
| CLICKHOUSE_URL | api, logging-worker | `http://clickhouse:8123` |
| QDRANT_HOST | semantic-worker, init-qdrant | `qdrant` |

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
| llm-guard | 1 | 1G |
| clickhouse | 2 | 4G |
| qdrant | 1 | 1G |

---

## NATS JetStream Configuration

### Streams

| Stream | Subject | Purpose |
|--------|---------|---------|
| VIGIL_DETECTION | `vigil.detection.*` | Detection requests/results |

### Consumers

| Consumer | Stream | Purpose |
|----------|--------|---------|
| detection-worker | VIGIL_DETECTION | Heuristics processing |
| semantic-worker | VIGIL_DETECTION | Embedding similarity |
| pii-worker | VIGIL_DETECTION | PII detection |
| arbiter-worker | VIGIL_DETECTION | Final decision |
| logging-worker | VIGIL_DETECTION | ClickHouse ingestion |

### Request-Reply Subjects

| Subject | Service | Timeout |
|---------|---------|---------|
| `vigil.pii.analyze` | presidio-api | 30s |
| `vigil.lang.detect` | language-detector | 2s |
| `vigil.llmguard.detect` | llm-guard | 60s |

---

## Traefik Routing

| Host | Service | Port |
|------|---------|------|
| `api.vigilguard` | api | 8787 |
| `app.vigilguard` (PathPrefix `/api`) | web-ui-backend | 8788 |
| `app.vigilguard` (other) | web-ui-frontend | 80 |

---

## Common Operations

### View All Service Status
```bash
docker compose -f infra/docker/docker-compose.base.yml -f infra/docker/docker-compose.dev.yml ps
```

### View Logs
```bash
# All services
docker compose -f infra/docker/docker-compose.base.yml -f infra/docker/docker-compose.dev.yml logs -f

# Specific service
docker compose -f infra/docker/docker-compose.base.yml -f infra/docker/docker-compose.dev.yml logs -f <service-name>

# Last 100 lines
docker compose -f infra/docker/docker-compose.base.yml -f infra/docker/docker-compose.dev.yml logs --tail=100 <service-name>
```

### Restart Service
```bash
docker compose -f infra/docker/docker-compose.base.yml -f infra/docker/docker-compose.dev.yml restart <service-name>
```

### Stop All
```bash
docker compose -f infra/docker/docker-compose.base.yml -f infra/docker/docker-compose.dev.yml down
```

### Stop and Remove Volumes (DESTRUCTIVE)
```bash
docker compose -f infra/docker/docker-compose.base.yml -f infra/docker/docker-compose.dev.yml down -v
```

---

## Health Check Endpoints

### HTTP Health Checks
```bash
# API
curl http://localhost:8787/health

# NATS
curl http://localhost:8222/healthz

# ClickHouse
curl http://localhost:8123/ping

# Qdrant
curl http://localhost:6333/health
```

### NATS Stream Status
```bash
# List streams
docker exec -it $(docker ps -qf name=nats) nats stream ls

# Stream info
docker exec -it $(docker ps -qf name=nats) nats stream info VIGIL_DETECTION

# Consumer status
docker exec -it $(docker ps -qf name=nats) nats consumer ls VIGIL_DETECTION
```

---

## File Locations

| Category | Path |
|----------|------|
| Docker Compose (base) | `infra/docker/docker-compose.base.yml` |
| Docker Compose (dev) | `infra/docker/docker-compose.dev.yml` |
| Docker Compose (prod) | `infra/docker/docker-compose.prod.yml` |
| Traefik config | `infra/traefik/` |
| Prometheus config | `infra/prometheus/prometheus.yml` |
| ClickHouse migrations | `infra/clickhouse/migrations/` |
| Qdrant seed data | `data/qdrant-seed/` |
| Scripts | `scripts/` |

---

## Version History

- **1.0.0** (2025-01-11): Initial version with three-file Docker Compose architecture
