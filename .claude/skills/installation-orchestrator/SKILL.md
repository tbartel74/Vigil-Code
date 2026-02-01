---
name: installation-orchestrator
description: Expert management of installation for Vigil Guard Enterprise. Use for installation troubleshooting, idempotency checks, secret generation, Docker Compose orchestration, NATS worker startup, and user onboarding.
version: 2.0.0
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob]
---

# Installation Orchestrator (Enterprise)

## Overview

Expert management of Vigil Guard Enterprise installation including idempotency, secret generation, Docker Compose orchestration, NATS worker startup order, and troubleshooting installation failures.

## When to Use This Skill

- Troubleshooting installation failures
- Managing Docker Compose modifications
- Secret generation and validation
- Volume migration between versions
- Idempotency checks
- User onboarding flow
- NATS worker startup order

---

## Docker Compose Architecture (CRITICAL)

### Three-File Strategy

This project uses a **split Docker Compose architecture**:

| File | Purpose |
|------|---------|
| `infra/docker/docker-compose.base.yml` | Base configuration with all services |
| `infra/docker/docker-compose.dev.yml` | Development builds, init services |
| `infra/docker/docker-compose.prod.yml` | Production GHCR images |

### Starting Services

**Development (local builds):**
```bash
docker compose -f infra/docker/docker-compose.base.yml -f infra/docker/docker-compose.dev.yml up -d
```

**Production (pre-built images):**
```bash
docker compose -f infra/docker/docker-compose.base.yml -f infra/docker/docker-compose.prod.yml up -d
```

**Environment variable shorthand:**
```bash
export COMPOSE_FILE=infra/docker/docker-compose.base.yml:infra/docker/docker-compose.dev.yml
docker compose up -d
```

---

## Enterprise Architecture

### Service Inventory

```yaml
Infrastructure (base.yml):
  - traefik (Reverse proxy, ports 80, 443)
  - nats (NATS JetStream, ports 4222, 8222)
  - redis (Cache, port 6379)
  - clickhouse (Analytics, ports 8123, 9000)
  - qdrant (Vector DB, ports 6333, 6334)
  - prometheus (Metrics, port 9090)

API Layer:
  - api (REST API, port 8787)

Node.js Workers:
  - detection-worker (Heuristics, port 9466)
  - semantic-worker (Embeddings, port 9465)
  - pii-worker (PII coordination, port 9464)
  - arbiter-worker (Decision fusion, port 9464)
  - logging-worker (ClickHouse ingestion, port 9464)
  - llm-guard-worker (LLM Guard orchestration, port 9464)

Python Services (NATS Request-Reply):
  - presidio-api (Presidio PII detection)
  - language-detector (Language detection)
  - llm-guard (Llama Prompt Guard 2)

Web Interface:
  - web-ui-backend (Config API, port 8788)
  - web-ui-frontend (React SPA, port 80)

Init Services (dev.yml only):
  - init-nats (Seeds JetStream streams and KV)
  - init-qdrant (Loads pre-computed embeddings)
  - init-api-data (Sets volume ownership)
```

---

## Installation Flow

### 1. Pre-flight Checks

```bash
# Docker and Docker Compose installed
docker --version
docker compose version

# pnpm installed
pnpm --version

# Check disk space (>10GB)
df -h .

# Check memory (>8GB recommended)
free -h
```

### 2. Secret Generation

Create `.env` file with required secrets:

```bash
# Generate secrets
NATS_USER=vigil
NATS_PASSWORD=$(openssl rand -base64 32)
REDIS_PASSWORD=$(openssl rand -base64 32)
CLICKHOUSE_USER=vigil
CLICKHOUSE_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)
ADMIN_PASSWORD=$(openssl rand -base64 24)
```

### 3. Service Startup Order (Enterprise)

```yaml
Phase 1 - Infrastructure:
  1. traefik (Reverse proxy)
  2. nats (NATS JetStream messaging)
  3. redis (Caching)
  4. clickhouse (Analytics storage)
  5. qdrant (Vector search)
  6. prometheus (Metrics)

Phase 2 - Init Services (dev only):
  7. init-api-data (Sets volume ownership)
  8. init-nats (Seeds JetStream streams and KV)
  9. init-qdrant (Loads embeddings)

Phase 3 - Python Services:
  10. presidio-api (PII detection)
  11. language-detector (Language detection)
  12. llm-guard (Prompt Guard)

Phase 4 - Workers (NATS Consumers):
  13. detection-worker (Heuristics)
  14. semantic-worker (Embeddings)
  15. pii-worker (PII coordination)
  16. arbiter-worker (Decision fusion)
  17. logging-worker (ClickHouse writer)
  18. llm-guard-worker (LLM Guard orchestration)

Phase 5 - API & Web:
  19. api (REST API, port 8787)
  20. web-ui-backend (Config API, port 8788)
  21. web-ui-frontend (React app)
```

### 4. Health Checks (Enterprise)

```bash
# Infrastructure
curl -f http://localhost:8222/healthz  # NATS
curl -f http://localhost:8123/ping     # ClickHouse
curl -f http://localhost:6333/health   # Qdrant

# Workers
curl -f http://localhost:9466/health   # detection-worker
curl -f http://localhost:9465/health   # semantic-worker

# API
curl -k https://api.vigilguard/health

# Web UI
curl -k https://app.vigilguard/api/health

# NATS consumers
docker exec -it $(docker ps -qf name=nats) nats consumer ls VIGIL_DETECTION
```

### 5. Idempotency Lock

```bash
touch .install-state.lock
echo "INSTALL_DATE=$(date)" >> .install-state.lock
echo "VERSION=1.0.0" >> .install-state.lock
echo "ARCHITECTURE=nats-workers-v2" >> .install-state.lock
```

---

## Common Tasks

### Task 1: Fresh Installation

```bash
# Clone repository
git clone https://github.com/vigil-guard/vigil-guard-enterprise.git
cd vigil-guard-enterprise

# Install dependencies
pnpm install

# Create secrets file
cp .env.example .env
# Edit .env with generated secrets

# Start services (development)
SECRETS_FILE=.env docker compose -f infra/docker/docker-compose.base.yml -f infra/docker/docker-compose.dev.yml up -d

# Verify workers
docker exec -it $(docker ps -qf name=nats) nats consumer ls VIGIL_DETECTION
```

### Task 2: Troubleshoot Failed Installation

```bash
# Check state
cat .install-state.lock

# View all logs
docker compose -f infra/docker/docker-compose.base.yml -f infra/docker/docker-compose.dev.yml logs --tail=100

# Check specific worker
docker compose -f infra/docker/docker-compose.base.yml -f infra/docker/docker-compose.dev.yml logs detection-worker --tail=50

# Retry specific service
docker compose -f infra/docker/docker-compose.base.yml -f infra/docker/docker-compose.dev.yml up -d --build detection-worker

# Clean slate
rm .install-state.lock .env -f
docker compose -f infra/docker/docker-compose.base.yml -f infra/docker/docker-compose.dev.yml down -v
```

### Task 3: Validate Environment

```bash
# Check Docker Compose config
docker compose -f infra/docker/docker-compose.base.yml -f infra/docker/docker-compose.dev.yml config

# Check env vars
grep -E "(NATS|CLICKHOUSE|JWT|REDIS)_" .env

# Check Docker network
docker network inspect vge_vigil-network
```

### Task 4: Verify NATS Workers

```bash
#!/bin/bash

echo "Verifying NATS Workers..."

# Check workers via NATS
for worker in detection-worker semantic-worker pii-worker arbiter-worker logging-worker llm-guard-worker; do
  STATUS=$(docker exec -it $(docker ps -qf name=nats) nats consumer info VIGIL_DETECTION $worker 2>/dev/null | grep -c "ack pending")
  if [ "$STATUS" -ge 0 ]; then
    echo "$worker: Connected"
  else
    echo "$worker: Not connected"
  fi
done
```

---

## Troubleshooting

### Issue: Service won't start

```bash
# Check logs
docker compose -f infra/docker/docker-compose.base.yml -f infra/docker/docker-compose.dev.yml logs <service-name>

# Check configuration
docker compose -f infra/docker/docker-compose.base.yml -f infra/docker/docker-compose.dev.yml config | grep -A 20 <service-name>

# Rebuild
docker compose -f infra/docker/docker-compose.base.yml -f infra/docker/docker-compose.dev.yml up -d --build <service-name>
```

### Issue: Worker won't start

```bash
# Check detection-worker
docker compose -f infra/docker/docker-compose.base.yml -f infra/docker/docker-compose.dev.yml logs detection-worker --tail=100
# Common issue: NATS not ready
# Fix: Ensure init-nats completed successfully

# Check semantic-worker
docker compose -f infra/docker/docker-compose.base.yml -f infra/docker/docker-compose.dev.yml logs semantic-worker --tail=100
# Common issue: Qdrant not ready
# Fix: Ensure init-qdrant completed successfully

# Check arbiter-worker
docker compose -f infra/docker/docker-compose.base.yml -f infra/docker/docker-compose.dev.yml logs arbiter-worker --tail=100
# Common issue: Config not in NATS KV
# Fix: Restart init-nats
```

### Issue: ClickHouse won't start

```bash
# Check volume permissions
docker volume inspect vge_clickhouse-data

# Reset volume
docker compose -f infra/docker/docker-compose.base.yml -f infra/docker/docker-compose.dev.yml down
docker volume rm vge_clickhouse-data
docker compose -f infra/docker/docker-compose.base.yml -f infra/docker/docker-compose.dev.yml up -d
```

### Issue: Secrets not loaded

```bash
# Verify SECRETS_FILE is set
echo $SECRETS_FILE

# Verify .env file exists
ls -la .env

# Reload services
docker compose -f infra/docker/docker-compose.base.yml -f infra/docker/docker-compose.dev.yml down
SECRETS_FILE=.env docker compose -f infra/docker/docker-compose.base.yml -f infra/docker/docker-compose.dev.yml up -d
```

### Issue: NATS connection refused

```bash
# Check NATS is running
docker compose -f infra/docker/docker-compose.base.yml -f infra/docker/docker-compose.dev.yml ps nats

# Check NATS logs
docker compose -f infra/docker/docker-compose.base.yml -f infra/docker/docker-compose.dev.yml logs nats

# Verify JetStream is enabled
curl http://localhost:8222/healthz
```

---

## Port Reference (Enterprise)

| Port | Service | Description |
|------|---------|-------------|
| 80, 443 | traefik | Reverse proxy with TLS |
| 4222 | nats | NATS JetStream messaging |
| 8222 | nats | NATS monitoring |
| 6379 | redis | Cache |
| 8123 | clickhouse | Analytics database |
| 9000 | clickhouse | Native protocol |
| 6333 | qdrant | Vector search REST |
| 6334 | qdrant | Vector search gRPC |
| 9090 | prometheus | Metrics |
| 8787 | api | Public REST API |
| 8788 | web-ui-backend | Configuration API |
| 9464-9466 | workers | Health endpoints |

---

## Quick Reference

```bash
# Fresh install (development)
pnpm install
SECRETS_FILE=.env docker compose -f infra/docker/docker-compose.base.yml -f infra/docker/docker-compose.dev.yml up -d

# Status check
docker compose -f infra/docker/docker-compose.base.yml -f infra/docker/docker-compose.dev.yml ps

# View logs
docker compose -f infra/docker/docker-compose.base.yml -f infra/docker/docker-compose.dev.yml logs -f

# Restart all
docker compose -f infra/docker/docker-compose.base.yml -f infra/docker/docker-compose.dev.yml restart

# Stop all
docker compose -f infra/docker/docker-compose.base.yml -f infra/docker/docker-compose.dev.yml down

# Stop and remove volumes
docker compose -f infra/docker/docker-compose.base.yml -f infra/docker/docker-compose.dev.yml down -v
```

---

## Integration Points

### With docker-orchestration skill:
```yaml
when: Service won't start
action:
  1. Check vigil-network connectivity
  2. Verify service dependencies
  3. Check health conditions
  4. Review Docker resource limits
```

### With nats-messaging skill:
```yaml
when: Worker not consuming
action:
  1. Verify init-nats completed
  2. Check consumer configuration
  3. Verify VIGIL_DETECTION stream exists
  4. Check NATS KV for config
```

### ClickHouse Analytics Troubleshooting:
```yaml
when: Analytics not working
action:
  1. Verify ClickHouse is healthy
  2. Check logging-worker is consuming
  3. Verify events_v2 table exists
```

---

## References

- Docker Compose (base): `infra/docker/docker-compose.base.yml`
- Docker Compose (dev): `infra/docker/docker-compose.dev.yml`
- Docker Compose (prod): `infra/docker/docker-compose.prod.yml`
- Repository State: `.claude/core/repository-state.md`

---

**Last Updated:** 2025-01-11
**Architecture:** NATS JetStream Workers (three-file compose)
**Services:** 18+ services across 5 phases
