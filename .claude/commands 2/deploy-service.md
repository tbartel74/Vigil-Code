---
name: Deploy Service
description: Deploy or restart specific Vigil Guard service with health checks
---

# Deploy Service: $SERVICE_NAME

Deploy or restart a Vigil Guard service with pre/post health checks.

## Steps

### 1. Verify Current State
```bash
echo "========================================="
echo "Current Service Status"
echo "========================================="
docker ps | grep vigil-$SERVICE_NAME || echo "Service not running"
echo ""
```

### 2. Build Service (if needed)
```bash
echo "========================================="
echo "Building Service"
echo "========================================="

case "$SERVICE_NAME" in
  "web-ui-frontend")
    cd services/web-ui/frontend
    npm run build
    cd ../../..
    ;;
  "web-ui-backend")
    cd services/web-ui/backend
    npm run build
    cd ../../..
    ;;
esac

echo "✅ Build complete"
echo ""
```

### 3. Stop Service
```bash
echo "========================================="
echo "Stopping Service"
echo "========================================="
docker-compose stop $SERVICE_NAME
echo "✅ Service stopped"
echo ""
```

### 4. Start Service
```bash
echo "========================================="
echo "Starting Service"
echo "========================================="
docker-compose up -d --build $SERVICE_NAME
echo "✅ Service started"
echo ""
```

### 5. Health Check
```bash
echo "========================================="
echo "Health Check"
echo "========================================="

sleep 3

case "$SERVICE_NAME" in
  "n8n")
    curl -f http://localhost:5678/healthz && echo "✅ n8n healthy" || echo "❌ n8n unhealthy"
    ;;
  "clickhouse")
    docker logs vigil-clickhouse clickhouse-client -q "SELECT 1" && echo "✅ ClickHouse healthy" || echo "❌ ClickHouse unhealthy"
    ;;
  "grafana")
    curl -f http://localhost:3001 && echo "✅ Grafana healthy" || echo "❌ Grafana unhealthy"
    ;;
  "web-ui-backend")
    curl -f http://localhost:8787/api/files && echo "✅ Backend healthy" || echo "❌ Backend unhealthy"
    ;;
  "web-ui-frontend"|"proxy")
    curl -f http://localhost/ui/ && echo "✅ Frontend healthy" || echo "❌ Frontend unhealthy"
    ;;
esac

echo ""
```

### 6. View Logs
```bash
echo "========================================="
echo "Recent Logs (last 20 lines)"
echo "========================================="
docker-compose logs --tail=20 $SERVICE_NAME
```

### 7. Verify Network
```bash
echo ""
echo "========================================="
echo "Network Status"
echo "========================================="
docker network inspect vigil-network | grep $SERVICE_NAME && echo "✅ Connected to vigil-network" || echo "❌ Not in network"
```

## Quick Restart
```bash
docker-compose restart $SERVICE_NAME
```

## Deploy All Services
```bash
docker-compose up -d --build
```

## Rollback
```bash
# Stop new version
docker-compose stop $SERVICE_NAME

# Restore from backup
docker-compose up -d $SERVICE_NAME

# Check logs
docker-compose logs -f $SERVICE_NAME
```

## Example Usage
```
/deploy-service web-ui-backend
/deploy-service clickhouse
/deploy-service n8n
```

## Related Skills
- docker-vigil-orchestration - Container management
- clickhouse-grafana-monitoring - Service monitoring
