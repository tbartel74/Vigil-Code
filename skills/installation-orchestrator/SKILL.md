# Installation Orchestrator

## Overview
Expert management of install.sh (2000+ lines bash) including idempotency, secret generation, volume migration, and troubleshooting installation failures.

## When to Use This Skill
- Troubleshooting installation failures
- Managing install.sh modifications
- Secret generation and validation
- Volume migration between versions
- Idempotency checks
- User onboarding flow

## Installation Flow

### 1. Pre-flight Checks
```bash
- Docker installed and running
- Ports available (80, 5678, 8123, 3001, 8787)
- Disk space >10GB
- No existing .install-state.lock
```

### 2. Secret Generation
```bash
CLICKHOUSE_PASSWORD=$(openssl rand -base64 32)
GF_SECURITY_ADMIN_PASSWORD=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 64)
JWT_SECRET=$(openssl rand -base64 32)
WEB_UI_ADMIN_PASSWORD=$(openssl rand -base64 24)
```

### 3. Service Startup Order
```yaml
1. clickhouse (data storage)
2. grafana (monitoring)
3. n8n (workflow engine)
4. presidio-pii-api, language-detector
5. web-ui-backend, web-ui-frontend
6. proxy (Caddy)
```

### 4. Health Checks
```bash
for service in clickhouse grafana n8n web-ui; do
  wait_for_health $service 120s || fail
done
```

### 5. Idempotency Lock
```bash
touch .install-state.lock
echo "INSTALL_DATE=$(date)" >> .install-state.lock
```

## Common Tasks

### Task 1: Fresh Installation

```bash
./install.sh

# Prompts:
# 1. Generate secrets? [Y/n]
# 2. Set admin password (or auto-generate)
# 3. Delete existing vigil_data? [y/N]
# 4. Download Llama model? [Y/n]
```

### Task 2: Troubleshoot Failed Installation

```bash
# Check state
cat .install-state.lock

# View logs
docker-compose logs --tail=100

# Retry specific service
docker-compose up -d clickhouse
docker logs vigil-clickhouse

# Clean slate
rm .install-state.lock .env vigil_data -rf
./install.sh
```

### Task 3: Validate Environment

```bash
./scripts/validate-env.sh

# Checks:
# - All required env vars present
# - Passwords meet requirements (min 8 chars)
# - Ports not in use
# - Docker network exists
```

### Task 4: Migrate Volumes (v1.6.11 → v1.7.0)

```bash
# Backup old data
docker run --rm -v vigil_clickhouse_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/clickhouse-v1.6.11-$(date +%Y%m%d).tar.gz /data

# Run migration SQL
docker exec vigil-clickhouse clickhouse-client < services/monitoring/sql/migrations/v1.7.0.sql

# Verify migration
docker exec vigil-clickhouse clickhouse-client -q "DESCRIBE n8n_logs.events_processed" | grep pii_sanitized
```

## Troubleshooting

### Issue: Port already in use

```bash
lsof -i :8123
kill -9 <PID>
```

### Issue: ClickHouse won't start

```bash
# Check volume permissions
ls -la vigil_data/clickhouse/

# Reset volume
docker-compose down -v
docker volume rm vigil_clickhouse_data
./install.sh
```

### Issue: Secrets not loaded

```bash
# Verify .env file
cat .env | grep -E "(CLICKHOUSE|JWT|SESSION)_"

# Reload
docker-compose down
docker-compose up -d
```

## Quick Reference

```bash
# Fresh install
./install.sh

# Status check
./scripts/status.sh

# View logs
./scripts/logs.sh

# Restart
./scripts/restart.sh

# Uninstall
docker-compose down -v
rm -rf vigil_data .env .install-state.lock
```

---

**Last Updated:** 2025-11-02
**Install Script:** 2000+ lines bash
**Services:** 9 containers
