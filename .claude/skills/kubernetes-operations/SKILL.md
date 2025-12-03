---
name: kubernetes-operations
description: Kubernetes deployment and operations for Vigil Guard. Use when deploying Vigil Guard to K8s clusters, configuring services, managing namespaces, troubleshooting pods, or migrating from Docker Compose to Kubernetes.
version: 1.0.0
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob]
---

# Vigil Guard Kubernetes Operations

## Overview
Project-specific guidance for deploying and operating Vigil Guard on Kubernetes clusters. This skill bridges the generic kubernetes-expert knowledge with Vigil Guard's specific architecture.

## When to Use This Skill
- Deploying Vigil Guard to Kubernetes
- Migrating from Docker Compose to K8s
- Configuring K8s services for Vigil Guard components
- Troubleshooting Vigil Guard pods
- Setting up monitoring (Grafana, ClickHouse) on K8s
- Managing secrets for Vigil Guard services
- Scaling Vigil Guard components

## Vigil Guard Service Architecture (9 Services)

### Service Dependencies
```
┌─────────────────────────────────────────────────────────────────┐
│                    VIGIL GUARD ON KUBERNETES                    │
│                                                                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │   Caddy     │────▶│  Web UI     │────▶│  Backend    │       │
│  │  (Ingress)  │     │  Frontend   │     │  Express    │       │
│  └─────────────┘     └─────────────┘     └──────┬──────┘       │
│                                                  │              │
│  ┌─────────────────────────────────────────────┼──────────────┐│
│  │                        n8n                   ▼              ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        ││
│  │  │  Language   │  │  Presidio   │  │  Prompt     │        ││
│  │  │  Detector   │  │  PII API    │  │  Guard API  │        ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘        ││
│  └────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              DATA LAYER                                     ││
│  │  ┌─────────────┐     ┌─────────────┐                       ││
│  │  │ ClickHouse  │     │   Grafana   │                       ││
│  │  │  (Analytics)│◀────│ (Monitoring)│                       ││
│  │  └─────────────┘     └─────────────┘                       ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### Recommended Namespace Structure
```yaml
# Namespaces
vigil-guard:           # Main application namespace
  - n8n (StatefulSet)
  - web-ui-frontend (Deployment)
  - web-ui-backend (Deployment)
  - presidio-pii-api (Deployment)
  - language-detector (Deployment)
  - prompt-guard-api (Deployment, optional)
  - caddy (Deployment or Ingress)

vigil-monitoring:      # Monitoring namespace
  - clickhouse (StatefulSet)
  - grafana (Deployment)

vigil-secrets:         # External secrets (optional)
  - External Secrets Operator
```

## Docker Compose to Kubernetes Migration

### Mapping docker-compose.yml to K8s Resources

| Docker Compose | Kubernetes Resource | Notes |
|----------------|---------------------|-------|
| `services:` | Deployment/StatefulSet | StatefulSet for n8n, ClickHouse |
| `ports:` | Service (ClusterIP/NodePort) | Use ClusterIP for internal |
| `volumes:` | PVC + PV | StorageClass for dynamic |
| `environment:` | ConfigMap + Secret | Secrets for passwords |
| `depends_on:` | initContainers | Or rely on readiness probes |
| `networks:` | Network Policies | vigil-net → vigil-network-policy |
| `restart: always` | Pod restartPolicy: Always | Default for Deployments |

### Service Configurations

#### n8n (StatefulSet)
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: vigil-n8n
  namespace: vigil-guard
spec:
  serviceName: vigil-n8n
  replicas: 1  # n8n doesn't support multi-replica well
  selector:
    matchLabels:
      app: vigil-n8n
  template:
    metadata:
      labels:
        app: vigil-n8n
    spec:
      containers:
        - name: n8n
          image: n8nio/n8n:latest
          ports:
            - containerPort: 5678
          env:
            - name: N8N_HOST
              value: "0.0.0.0"
            - name: N8N_PROTOCOL
              value: "http"
            - name: WEBHOOK_URL
              value: "http://vigil-n8n:5678"
            - name: GENERIC_TIMEZONE
              value: "Europe/Warsaw"
          volumeMounts:
            - name: n8n-data
              mountPath: /home/node/.n8n
          resources:
            requests:
              cpu: 200m
              memory: 512Mi
            limits:
              cpu: 1000m
              memory: 2Gi
          livenessProbe:
            httpGet:
              path: /healthz
              port: 5678
            initialDelaySeconds: 60
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /healthz
              port: 5678
            initialDelaySeconds: 30
            periodSeconds: 10
  volumeClaimTemplates:
    - metadata:
        name: n8n-data
      spec:
        accessModes: ["ReadWriteOnce"]
        storageClassName: standard
        resources:
          requests:
            storage: 5Gi
---
apiVersion: v1
kind: Service
metadata:
  name: vigil-n8n
  namespace: vigil-guard
spec:
  type: ClusterIP
  selector:
    app: vigil-n8n
  ports:
    - port: 5678
      targetPort: 5678
```

#### Presidio PII API (Deployment)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vigil-presidio-pii
  namespace: vigil-guard
spec:
  replicas: 2  # Can scale for load
  selector:
    matchLabels:
      app: vigil-presidio-pii
  template:
    metadata:
      labels:
        app: vigil-presidio-pii
    spec:
      containers:
        - name: presidio
          image: vigil-guard/presidio-pii-api:1.8.1
          ports:
            - containerPort: 5001
          env:
            - name: FLASK_ENV
              value: "production"
            - name: PYTHONUNBUFFERED
              value: "1"
          resources:
            requests:
              cpu: 200m
              memory: 512Mi
            limits:
              cpu: 1000m
              memory: 1Gi
          livenessProbe:
            httpGet:
              path: /health
              port: 5001
            initialDelaySeconds: 30
          readinessProbe:
            httpGet:
              path: /health
              port: 5001
            initialDelaySeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: vigil-presidio-pii
  namespace: vigil-guard
spec:
  type: ClusterIP
  selector:
    app: vigil-presidio-pii
  ports:
    - port: 5001
      targetPort: 5001
```

#### ClickHouse (StatefulSet)
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: vigil-clickhouse
  namespace: vigil-monitoring
spec:
  serviceName: vigil-clickhouse
  replicas: 1
  selector:
    matchLabels:
      app: vigil-clickhouse
  template:
    metadata:
      labels:
        app: vigil-clickhouse
    spec:
      containers:
        - name: clickhouse
          image: clickhouse/clickhouse-server:24.1
          ports:
            - containerPort: 8123  # HTTP
            - containerPort: 9000  # Native
          env:
            - name: CLICKHOUSE_USER
              value: "admin"
            - name: CLICKHOUSE_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: vigil-secrets
                  key: clickhouse-password
          volumeMounts:
            - name: clickhouse-data
              mountPath: /var/lib/clickhouse
            - name: clickhouse-logs
              mountPath: /var/log/clickhouse-server
          resources:
            requests:
              cpu: 500m
              memory: 2Gi
            limits:
              cpu: 2000m
              memory: 8Gi
  volumeClaimTemplates:
    - metadata:
        name: clickhouse-data
      spec:
        accessModes: ["ReadWriteOnce"]
        storageClassName: ssd  # Use SSD for performance
        resources:
          requests:
            storage: 50Gi
    - metadata:
        name: clickhouse-logs
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 10Gi
```

### Secrets Management
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: vigil-secrets
  namespace: vigil-guard
type: Opaque
stringData:
  clickhouse-password: "${CLICKHOUSE_PASSWORD}"
  jwt-secret: "${JWT_SECRET}"
  session-secret: "${SESSION_SECRET}"
  grafana-admin-password: "${GF_SECURITY_ADMIN_PASSWORD}"
---
# Using External Secrets Operator (recommended for production)
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: vigil-secrets
  namespace: vigil-guard
spec:
  refreshInterval: 1h
  secretStoreRef:
    kind: ClusterSecretStore
    name: vault-backend  # or aws-secrets-manager
  target:
    name: vigil-secrets
  data:
    - secretKey: clickhouse-password
      remoteRef:
        key: vigil-guard/clickhouse
        property: password
    - secretKey: jwt-secret
      remoteRef:
        key: vigil-guard/auth
        property: jwt-secret
```

### ConfigMaps for Configuration
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: vigil-workflow-config
  namespace: vigil-guard
data:
  unified_config.json: |
    {
      "normalization": { "unicode_form": "NFKC", "max_iterations": 3 },
      "thresholds": { "allow_max": 29, "sanitize_light_max": 64 },
      "pii_detection": { "presidio_enabled": true, "dual_language_mode": true }
    }
  rules.config.json: |
    {
      "categories": {
        "SQL_XSS_ATTACKS": { "base_weight": 50, "multiplier": 1.3 }
      }
    }
---
# Mount in n8n pod
volumeMounts:
  - name: workflow-config
    mountPath: /home/node/.n8n/config
volumes:
  - name: workflow-config
    configMap:
      name: vigil-workflow-config
```

### Ingress Configuration
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: vigil-ingress
  namespace: vigil-guard
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /$2
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - vigil.example.com
      secretName: vigil-tls
  rules:
    - host: vigil.example.com
      http:
        paths:
          - path: /ui(/|$)(.*)
            pathType: Prefix
            backend:
              service:
                name: vigil-web-ui-frontend
                port:
                  number: 80
          - path: /api(/|$)(.*)
            pathType: Prefix
            backend:
              service:
                name: vigil-web-ui-backend
                port:
                  number: 8787
          - path: /n8n(/|$)(.*)
            pathType: Prefix
            backend:
              service:
                name: vigil-n8n
                port:
                  number: 5678
          - path: /grafana(/|$)(.*)
            pathType: Prefix
            backend:
              service:
                name: vigil-grafana
                port:
                  number: 3001
```

## Common Operations

### Deploy Vigil Guard to K8s
```bash
# 1. Create namespace
kubectl create namespace vigil-guard
kubectl create namespace vigil-monitoring

# 2. Create secrets
kubectl create secret generic vigil-secrets \
  --from-literal=clickhouse-password=$(openssl rand -base64 32) \
  --from-literal=jwt-secret=$(openssl rand -base64 32) \
  --from-literal=session-secret=$(openssl rand -base64 64) \
  -n vigil-guard

# 3. Apply ConfigMaps
kubectl apply -f k8s/configmaps/

# 4. Deploy services (order matters)
kubectl apply -f k8s/clickhouse/
kubectl apply -f k8s/presidio/
kubectl apply -f k8s/language-detector/
kubectl apply -f k8s/n8n/
kubectl apply -f k8s/web-ui/
kubectl apply -f k8s/grafana/
kubectl apply -f k8s/ingress/

# 5. Verify
kubectl get pods -n vigil-guard
kubectl get pods -n vigil-monitoring
```

### Troubleshoot Vigil Guard Pods
```bash
# Check all pods status
kubectl get pods -n vigil-guard -o wide

# Check events for issues
kubectl get events -n vigil-guard --sort-by='.lastTimestamp'

# Debug specific pod
kubectl describe pod vigil-n8n-0 -n vigil-guard
kubectl logs vigil-n8n-0 -n vigil-guard --tail=100

# Check previous container logs (if crashed)
kubectl logs vigil-presidio-pii-xxx -n vigil-guard --previous

# Exec into pod for debugging
kubectl exec -it vigil-n8n-0 -n vigil-guard -- /bin/sh

# Port forward for local testing
kubectl port-forward svc/vigil-n8n 5678:5678 -n vigil-guard
```

### Scale Vigil Guard Components
```bash
# Scale Presidio for more PII processing capacity
kubectl scale deployment vigil-presidio-pii --replicas=4 -n vigil-guard

# Enable HPA for Web UI Backend
kubectl autoscale deployment vigil-web-ui-backend \
  --cpu-percent=80 \
  --min=2 \
  --max=10 \
  -n vigil-guard

# Check HPA status
kubectl get hpa -n vigil-guard
```

### Update Configuration
```bash
# Update ConfigMap
kubectl edit configmap vigil-workflow-config -n vigil-guard

# Restart pods to pick up changes (n8n reads config on startup)
kubectl rollout restart statefulset vigil-n8n -n vigil-guard

# Or update specific key
kubectl patch configmap vigil-workflow-config -n vigil-guard \
  --type merge \
  -p '{"data":{"unified_config.json":"{...}"}}'
```

## Troubleshooting

### Pod Won't Start
```bash
# 1. Check pod status
kubectl describe pod <pod-name> -n vigil-guard

# Common issues:
# - ImagePullBackOff: Check image name, registry credentials
# - Pending: Check resource requests, node capacity
# - CrashLoopBackOff: Check logs, environment variables
```

### Service Not Accessible
```bash
# 1. Check service endpoints
kubectl get endpoints -n vigil-guard

# 2. Check pod labels match selector
kubectl get pods -n vigil-guard --show-labels

# 3. Test internal connectivity
kubectl run debug --rm -it --image=busybox -n vigil-guard -- wget -O- vigil-n8n:5678/healthz
```

### PII Detection Not Working
```bash
# 1. Check Presidio pods
kubectl get pods -n vigil-guard -l app=vigil-presidio-pii

# 2. Check logs
kubectl logs -l app=vigil-presidio-pii -n vigil-guard --tail=50

# 3. Test directly
kubectl port-forward svc/vigil-presidio-pii 5001:5001 -n vigil-guard
curl http://localhost:5001/health
```

## Best Practices

1. **Use StatefulSets for stateful services** (n8n, ClickHouse)
2. **Use Deployments for stateless services** (Presidio, Web UI)
3. **Always set resource limits** to prevent noisy neighbors
4. **Use PodDisruptionBudgets** for high availability
5. **Store secrets in external secret manager** (Vault, AWS SM)
6. **Use NetworkPolicies** to restrict pod-to-pod traffic
7. **Enable pod security standards** (restricted profile)
8. **Back up ClickHouse data** regularly (PVC snapshots)
9. **Monitor with Prometheus/Grafana** (already included)
10. **Use Rolling Updates** with proper readiness probes

## Related Skills
- `helm-chart-management` - For packaging as Helm chart
- `n8n-vigil-workflow` - For workflow configuration
- `docker-vigil-orchestration` - For Docker Compose reference
- `clickhouse-grafana-monitoring` - For monitoring setup

## References
- Docker Compose: `docker-compose.yml`
- Service configs: `services/*/Dockerfile`
- Environment variables: `.env.example`
