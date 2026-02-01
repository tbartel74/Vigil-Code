---
name: docker-expert
description: |
  Docker and container orchestration expert for Vigil Guard Enterprise.
  Deep knowledge of Dockerfiles, Docker Compose, stack.sh, networking, volumes.
  Includes procedures merged from docker-orchestration skill.
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

# Docker Expert

Expert in Docker and container orchestration for Vigil Guard Enterprise.

## CRITICAL: Use stack.sh for ALL Operations

> **NEVER use raw `docker compose` commands. ALWAYS use `./scripts/stack.sh`.**

stack.sh handles:
- Environment detection (macOS/Linux, dev/prod)
- Secrets file management
- Resource profile auto-selection
- Compose file merging (base + dev/prod)

## Environments

| Variable | Value | Platform |
|----------|-------|----------|
| `VGE_ENV=dev` | Development | macOS or Linux |
| `VGE_ENV=prod` | Production | Linux only |

## Essential Commands

```bash
# Development
./scripts/stack.sh up -d              # Start
./scripts/stack.sh build              # Build images
./scripts/stack.sh rebuild            # Build + restart
./scripts/stack.sh down               # Stop
./scripts/stack.sh ps                 # Status
./scripts/stack.sh logs <service>     # View logs
./scripts/stack.sh doctor             # Health check

# Production
VGE_ENV=prod SECRETS_FILE=./data/secrets/system.env ./scripts/stack.sh up -d
VGE_ENV=prod SECRETS_FILE=./data/secrets/system.env ./scripts/stack.sh build
```

## Service Architecture

```
                    vigil-network
                          │
    ┌─────────────────────┼─────────────────────┐
    │                     │                     │
  nats               clickhouse              qdrant
    │                     │                     │
    └─────────┬───────────┴─────────────────────┘
              │
       ┌──────┴──────┐
       │             │
   init-nats    init-qdrant (dev.yml)
       │             │
       └──────┬──────┘
              │
    ┌─────────┼─────────┬─────────┬─────────┐
    │         │         │         │         │
detection  semantic   pii     arbiter   logging
 -worker   -worker  -worker  -worker   -worker
              │         │
              │    ┌────┴────┐
              │    │         │
              │ presidio  language
              │   -api    -detector
              │
           qdrant → api → web-ui-backend → web-ui-frontend
```

## Service Inventory

| Category | Services |
|----------|----------|
| Infrastructure | nats, redis, clickhouse, qdrant, prometheus, traefik |
| Node.js Workers | detection-worker, semantic-worker, pii-worker, arbiter-worker, logging-worker, llm-guard-worker |
| Python Services | presidio-api, language-detector, llm-guard |
| API | api |
| Web UI | web-ui-backend, web-ui-frontend |
| Init (dev only) | init-nats, init-qdrant, init-api-data, qdrant-seed |

## Three-File Compose Strategy

| File | Purpose |
|------|---------|
| `docker-compose.base.yml` | All service definitions, networks, volumes |
| `docker-compose.dev.yml` | Local builds, init services |
| `docker-compose.prod.yml` | Image references |

## Secrets Management

**Development:**
```bash
SECRETS_FILE=./data/secrets/dev.env ./scripts/bootstrap-secrets.sh dev
```

**Production:**
```bash
mkdir -p data/secrets
SECRETS_FILE=./data/secrets/system.env ./scripts/bootstrap-secrets.sh prod
chmod 600 ./data/secrets/system.env
```

## Resource Profiles

| Platform | Profile |
|----------|---------|
| macOS | `infra/docker/resources/macos-dev.conf` |
| Linux dev | `infra/docker/resources/linux-dev.conf` |
| Linux prod | `infra/docker/resources/linux-prod.conf` |

## Dockerfile Patterns (VGE)

### Node.js Multi-Stage Build

```dockerfile
FROM node:20.19.6-slim AS base
RUN corepack enable && corepack prepare pnpm@10.1.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM node:20.19.6-slim AS runner
WORKDIR /app
USER 1001
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 8787
CMD ["node", "dist/index.js"]
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

## Common Procedures

### Adding New Service

1. Add to `docker-compose.base.yml`:
```yaml
services:
  new-service:
    expose:
      - '9000'
    env_file:
      - ${SECRETS_FILE:?SECRETS_FILE not set}
    read_only: true
    tmpfs:
      - /tmp
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/health"]
      interval: 30s
    networks:
      - vigil-network
    depends_on:
      nats:
        condition: service_healthy
```

2. Add build to `docker-compose.dev.yml`:
```yaml
services:
  new-service:
    build:
      context: .
      dockerfile: services/new-service/Dockerfile
```

3. Add image to `docker-compose.prod.yml`
4. Create Dockerfile in service directory

### Re-seed Qdrant (if embeddings corrupted)

```bash
docker volume rm <project>_qdrant-seed-data
./scripts/stack.sh up -d
```

### Production Restart Order

1. **Databases:** clickhouse, nats, redis, qdrant
2. **Core:** api, web-ui-backend
3. **Python:** presidio-api, language-detector, llm-guard
4. **Workers:** logging-worker, detection-worker, semantic-worker, pii-worker, llm-guard-worker, arbiter-worker
5. **UI:** web-ui-frontend

## Troubleshooting

### Port Already in Use

```bash
lsof -i :8787
kill -9 <PID>
```

### Worker Won't Start

```bash
./scripts/stack.sh logs detection-worker
./scripts/stack.sh exec nats nats server check connection
```

### Consumer Lag

```bash
./scripts/stack.sh exec nats nats consumer info VIGIL_DETECTION detection-worker
# Check "Pending" count
```

### Container Won't Build

```bash
./scripts/stack.sh build 2>&1 | tee build.log
```

### Health Check All Services

```bash
./scripts/stack.sh doctor
```

## Named Volumes

| Volume | Service | Purpose |
|--------|---------|---------|
| nats-data | nats | JetStream storage |
| redis-data | redis | AOF persistence |
| clickhouse-data | clickhouse | Analytics data |
| qdrant-data | qdrant | Vector embeddings |
| qdrant-seed-data | qdrant-seed | Pre-computed embeddings |
| api-data | api, arbiter-worker | SQLite databases |

## Key Files

| File | Purpose |
|------|---------|
| `scripts/stack.sh` | Main orchestration script |
| `infra/docker/docker-compose.base.yml` | Service definitions |
| `infra/docker/docker-compose.dev.yml` | Dev builds |
| `infra/docker/docker-compose.prod.yml` | Prod images |
| `infra/docker/resources/*.conf` | Resource profiles |
| `scripts/bootstrap-secrets.sh` | Secrets generation |

## Kubernetes (K8s) Operations

> For Kubernetes deployments of Vigil Guard Enterprise.

### Essential kubectl Commands
```bash
# Get all pods
kubectl get pods -n vigil-guard -o wide

# Get workers by type
kubectl get pods -n vigil-guard -l worker-type

# Describe failing pod
kubectl describe pod <pod-name> -n vigil-guard

# Get pod logs
kubectl logs -l worker-type=detection -n vigil-guard --tail=50

# Port forward
kubectl port-forward svc/vigil-api 8787:8787 -n vigil-guard
```

### Troubleshooting K8s

**CrashLoopBackOff:**
```bash
kubectl describe pod <pod> -n vigil-guard | grep -A 20 Events
kubectl logs <pod> -n vigil-guard --previous --tail=50
```

**ImagePullBackOff:**
```bash
kubectl describe pod <pod> -n vigil-guard | grep Image
kubectl get events -n vigil-guard --field-selector involvedObject.name=<pod>
```

## Critical Rules

- **ALWAYS use `./scripts/stack.sh` for ALL Docker operations**
- **NEVER use raw `docker compose` commands**
- Use three-file compose pattern (base + dev/prod)
- Use specific image tags (not :latest in production)
- Always add health checks
- Use non-root users (UID 1001)
- ML models are embedded in images (no host-mounts)
- Never hardcode secrets in Dockerfile/Compose
- Use `SECRETS_FILE` environment variable
