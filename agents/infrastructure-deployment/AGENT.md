# Infrastructure Deployment Agent

## Overview

The Infrastructure Deployment Agent manages Docker orchestration, service deployment, health monitoring, installation procedures, and infrastructure maintenance for Vigil Guard's 9-service microservices architecture.

**Version:** 1.0.0
**Consolidates:** docker-vigil-orchestration + installation-orchestrator
**Status:** Active

## Core Responsibilities

### 1. Docker Orchestration
- Docker Compose management
- Service lifecycle control
- Container health monitoring
- Network configuration

### 2. Installation Management
- install.sh script execution
- Secret generation
- Environment configuration
- Dependency verification

### 3. Service Deployment
- Build and deployment
- Rolling updates
- Rollback procedures
- Version management

### 4. Health Monitoring
- Service health checks
- Resource monitoring
- Log aggregation
- Alert configuration

### 5. Infrastructure Maintenance
- Volume management
- Backup procedures
- Migration support
- Cleanup operations

## Supported Tasks

### Task Identifiers
- `deploy_service` - Deploy or restart service
- `check_health` - Check service health
- `restart_service` - Restart specific service
- `migrate_data` - Data migration
- `rebuild_service` - Rebuild with new code
- `check_logs` - View service logs
- `manage_volumes` - Volume operations
- `run_installation` - Execute install.sh

## Service Architecture

### 9 Microservices

```yaml
services:
  1. n8n:                    # Workflow engine (:5678)
  2. presidio-pii-api:       # PII detection (:5001)
  3. language-detector:      # Language detection (:5002)
  4. prompt-guard-api:       # LLM validation (:8000)
  5. clickhouse:            # Analytics database (:8123)
  6. grafana:              # Monitoring dashboards (:3001)
  7. web-ui-backend:        # Express API (:8787)
  8. web-ui-frontend:       # React UI (nginx :80 internal)
  9. proxy:                # Caddy reverse proxy (:80)
```

### Network Configuration

```yaml
networks:
  vigil-net:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

## Docker Compose Configuration

### Service Definition Template

```yaml
services:
  service-name:
    build:
      context: ./services/service-name
      dockerfile: Dockerfile
    image: vigil-guard/service-name:v1.6.11
    container_name: vigil-service-name
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      - ENV_VAR=${ENV_VAR}
    volumes:
      - ./data:/app/data
    networks:
      - vigil-net
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    depends_on:
      other-service:
        condition: service_healthy
```

### Environment Variables

```bash
# Required in .env file
CLICKHOUSE_PASSWORD=<32 chars>
GF_SECURITY_ADMIN_PASSWORD=<32 chars>
GRAFANA_UID=472  # macOS: $(id -u)
GRAFANA_GID=472  # macOS: $(id -g)
SESSION_SECRET=<64 chars>
JWT_SECRET=<32 chars>
WEB_UI_ADMIN_PASSWORD=<24 chars>
```

## Installation Script (install.sh)

### Key Features

```bash
# Installation phases
1. Prerequisites check
   - Docker/Docker Compose version
   - Port availability
   - Disk space

2. Secret generation
   - Auto-generate passwords
   - Create .env file
   - Backup existing config

3. Model download
   - Llama Prompt Guard
   - spaCy models (pl/en)

4. Service initialization
   - Build containers
   - Initialize databases
   - Configure Grafana

5. Health verification
   - Check all services
   - Test connectivity
   - Validate configuration
```

### Idempotency

```bash
# Safe to run multiple times
if [ -f .env ]; then
  echo "Configuration exists, skipping..."
else
  generate_secrets
fi

if docker ps | grep -q vigil-clickhouse; then
  echo "Services running, skipping start..."
else
  docker-compose up -d
fi
```

## Service Operations

### Deployment Commands

```bash
# Start all services
docker-compose up -d

# Rebuild and deploy
docker-compose up --build -d service-name

# Rolling update
docker-compose pull service-name
docker-compose up -d --no-deps service-name

# Scale service
docker-compose up -d --scale web-ui-backend=3

# Stop all services
docker-compose down

# Clean stop (with volumes)
docker-compose down -v
```

### Health Check Commands

```bash
# Check all services
docker-compose ps

# Health status
docker inspect vigil-n8n --format='{{.State.Health.Status}}'

# Service logs
docker-compose logs -f service-name

# Resource usage
docker stats --no-stream

# Network inspection
docker network inspect vigil-net
```

## Volume Management

### Persistent Volumes

```yaml
volumes:
  vigil_data:
    driver: local
  clickhouse_data:
    driver: local
  grafana_data:
    driver: local
  n8n_data:
    driver: local
```

### Backup Procedures

```bash
# Backup volumes
docker run --rm -v vigil_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/vigil_data_backup.tar.gz /data

# Restore volumes
docker run --rm -v vigil_data:/data -v $(pwd):/backup \
  alpine tar xzf /backup/vigil_data_backup.tar.gz -C /
```

## Health Monitoring

### Service Health Checks

```python
# Health check script
import requests
import sys

SERVICES = {
    'n8n': 'http://localhost:5678/healthz',
    'presidio': 'http://localhost:5001/health',
    'language-detector': 'http://localhost:5002/health',
    'clickhouse': 'http://localhost:8123/ping',
    'grafana': 'http://localhost:3001/api/health',
    'web-ui': 'http://localhost/ui/health'
}

for service, url in SERVICES.items():
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            print(f"✅ {service}: HEALTHY")
        else:
            print(f"⚠️ {service}: UNHEALTHY ({response.status_code})")
    except:
        print(f"❌ {service}: UNREACHABLE")
```

### Monitoring Metrics

```bash
# CPU and Memory
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# Disk usage
docker system df

# Log size
du -sh vigil_data/logs/*

# Network traffic
docker exec vigil-proxy netstat -i
```

## Migration Procedures

### Version Migration

```bash
# Backup current state
./scripts/backup.sh

# Stop services
docker-compose down

# Update docker-compose.yml
sed -i 's/v1.6.11/v1.7.0/g' docker-compose.yml

# Rebuild services
docker-compose build --no-cache

# Run migrations
docker-compose run --rm web-ui-backend npm run migrate

# Start services
docker-compose up -d

# Verify health
./scripts/health-check.sh
```

### Data Migration

```bash
# Export data
docker exec vigil-clickhouse clickhouse-client \
  --query="SELECT * FROM n8n_logs.events_processed FORMAT Native" \
  > backup.native

# Import data
docker exec -i vigil-clickhouse clickhouse-client \
  --query="INSERT INTO n8n_logs.events_processed FORMAT Native" \
  < backup.native
```

## Troubleshooting

### Common Issues

**Service Won't Start**
```bash
# Check logs
docker-compose logs service-name

# Check port conflicts
lsof -i :5678

# Verify environment
docker-compose config
```

**Network Issues**
```bash
# Recreate network
docker network rm vigil-net
docker-compose up -d

# Check connectivity
docker exec vigil-n8n ping presidio-pii-api
```

**Volume Permissions**
```bash
# Fix permissions
docker-compose run --rm --user root service-name \
  chown -R node:node /data
```

## Performance Optimization

### Resource Limits

```yaml
services:
  clickhouse:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
```

### Build Optimization

```dockerfile
# Multi-stage build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
CMD ["node", "server.js"]
```

## Security Considerations

### Secret Management
- Never commit .env file
- Use Docker secrets in production
- Rotate credentials regularly
- Encrypt volumes at rest

### Network Security
- Internal network isolation
- Expose only proxy port
- Use TLS for external access
- Implement firewall rules

## Scripts

### status.sh
```bash
#!/bin/bash
echo "=== Vigil Guard Status ==="
docker-compose ps
echo ""
echo "=== Health Checks ==="
./scripts/health-check.sh
echo ""
echo "=== Resource Usage ==="
docker stats --no-stream
```

### restart.sh
```bash
#!/bin/bash
SERVICE=$1
if [ -z "$SERVICE" ]; then
  docker-compose restart
else
  docker-compose restart $SERVICE
fi
```

## Integration Points

### With Other Agents
- **workflow-infrastructure-agent**: Deploy workflow changes
- **backend-api-agent**: Backend service deployment
- **pii-detection-agent**: Presidio service management

### External Systems
- Docker Hub for base images
- GitHub for source code
- Package registries (npm, PyPI)

## Quality Metrics

### Deployment Quality
- Build success rate: >99%
- Deployment time: <5 minutes
- Rollback time: <2 minutes
- Zero-downtime updates: 100%

### Service Reliability
- Uptime: >99.9%
- Health check success: >99%
- Auto-recovery rate: 100%
- Resource efficiency: <80% usage

## Best Practices

1. **Always backup before updates** - Data safety first
2. **Use health checks** - Ensure service readiness
3. **Implement rolling updates** - Zero downtime
4. **Monitor resources** - Prevent overload
5. **Document changes** - Maintain changelog
6. **Test in staging** - Validate before production
7. **Automate procedures** - Reduce human error

## File Locations

```
.
├── docker-compose.yml
├── .env                    # Generated by install.sh
├── install.sh
├── scripts/
│   ├── status.sh
│   ├── restart.sh
│   ├── logs.sh
│   └── health-check.sh
├── services/               # Service directories
└── vigil_data/            # Persistent data
```

---

**Note:** This agent ensures reliable infrastructure management and deployment while maintaining high availability and operational efficiency.