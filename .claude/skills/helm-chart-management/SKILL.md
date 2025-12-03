---
name: helm-chart-management
description: Helm chart development and management for Vigil Guard. Use when creating Vigil Guard Helm charts, managing chart dependencies, configuring values for different environments, or publishing charts to repositories.
version: 1.0.0
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob]
---

# Vigil Guard Helm Chart Management

## Overview
Project-specific guidance for developing and managing Helm charts for Vigil Guard. This skill bridges the generic helm-expert knowledge with Vigil Guard's specific multi-service architecture.

## When to Use This Skill
- Creating Vigil Guard Helm chart from scratch
- Packaging existing Docker Compose setup as Helm chart
- Managing multi-environment deployments (dev, staging, prod)
- Configuring chart dependencies (PostgreSQL, Redis if needed)
- Publishing Vigil Guard chart to Artifact Hub or OCI registry
- Creating umbrella chart for all Vigil Guard services
- Templating Vigil Guard configurations

## Vigil Guard Chart Architecture

### Recommended Chart Structure
```
charts/
├── vigil-guard/                    # Umbrella chart
│   ├── Chart.yaml
│   ├── Chart.lock
│   ├── values.yaml
│   ├── values-dev.yaml
│   ├── values-staging.yaml
│   ├── values-prod.yaml
│   ├── templates/
│   │   ├── NOTES.txt
│   │   ├── _helpers.tpl
│   │   └── tests/
│   └── charts/                     # Subcharts
│       ├── n8n/
│       ├── web-ui/
│       ├── presidio-pii/
│       ├── language-detector/
│       ├── prompt-guard/
│       ├── clickhouse/
│       └── grafana/
└── vigil-guard-common/             # Library chart
    ├── Chart.yaml
    └── templates/
        └── _common.tpl
```

### Chart.yaml (Umbrella Chart)
```yaml
apiVersion: v2
name: vigil-guard
version: 1.0.0
appVersion: "1.6.11"
description: |
  Enterprise-grade prompt injection detection and defense platform
  for Large Language Model applications.
type: application
keywords:
  - security
  - llm
  - prompt-injection
  - pii-detection
  - ai-safety
home: https://github.com/vigil-guard/vigil-guard
sources:
  - https://github.com/vigil-guard/vigil-guard
maintainers:
  - name: Vigil Guard Team
    email: team@vigil-guard.example
icon: https://vigil-guard.example/icon.png
dependencies:
  # Internal subcharts
  - name: n8n
    version: "1.x.x"
    repository: "file://charts/n8n"
    condition: n8n.enabled
  - name: web-ui
    version: "1.x.x"
    repository: "file://charts/web-ui"
    condition: webUI.enabled
  - name: presidio-pii
    version: "1.x.x"
    repository: "file://charts/presidio-pii"
    condition: presidio.enabled
  - name: language-detector
    version: "1.x.x"
    repository: "file://charts/language-detector"
    condition: languageDetector.enabled
  - name: prompt-guard
    version: "1.x.x"
    repository: "file://charts/prompt-guard"
    condition: promptGuard.enabled
  # External dependencies
  - name: clickhouse
    version: "4.x.x"
    repository: "https://charts.bitnami.com/bitnami"
    condition: clickhouse.enabled
  - name: grafana
    version: "7.x.x"
    repository: "https://grafana.github.io/helm-charts"
    condition: grafana.enabled
```

## Master values.yaml

```yaml
# values.yaml - Vigil Guard Umbrella Chart

global:
  # Image settings
  imageRegistry: ""
  imagePullSecrets: []
  storageClass: ""

  # Vigil Guard version
  vigilVersion: "1.6.11"

  # Network
  domain: "vigil.example.com"
  tlsEnabled: true

  # Security
  podSecurityContext:
    runAsNonRoot: true
    runAsUser: 1000
    fsGroup: 1000

# ========================================
# n8n Workflow Engine
# ========================================
n8n:
  enabled: true
  replicaCount: 1  # n8n doesn't support multiple replicas well

  image:
    repository: n8nio/n8n
    tag: "1.20.0"
    pullPolicy: IfNotPresent

  service:
    type: ClusterIP
    port: 5678

  persistence:
    enabled: true
    size: 5Gi
    storageClass: ""

  resources:
    requests:
      cpu: 200m
      memory: 512Mi
    limits:
      cpu: 1000m
      memory: 2Gi

  config:
    timezone: "Europe/Warsaw"
    webhookUrl: ""  # Auto-generated if empty

  # Workflow configuration
  workflow:
    autoImport: true
    configPath: /home/node/.n8n/config

# ========================================
# Web UI (Frontend + Backend)
# ========================================
webUI:
  enabled: true

  frontend:
    replicaCount: 2
    image:
      repository: vigil-guard/web-ui-frontend
      tag: ""  # Defaults to global.vigilVersion
    resources:
      requests:
        cpu: 50m
        memory: 64Mi
      limits:
        cpu: 200m
        memory: 128Mi

  backend:
    replicaCount: 2
    image:
      repository: vigil-guard/web-ui-backend
      tag: ""
    resources:
      requests:
        cpu: 100m
        memory: 128Mi
      limits:
        cpu: 500m
        memory: 512Mi

    config:
      sessionSecret: ""  # Required, use existing secret
      jwtSecret: ""      # Required, use existing secret
      jwtExpiry: "24h"

    existingSecret: ""   # Name of existing secret with credentials

# ========================================
# Presidio PII Detection
# ========================================
presidio:
  enabled: true
  replicaCount: 2

  image:
    repository: vigil-guard/presidio-pii-api
    tag: "1.8.1"

  resources:
    requests:
      cpu: 200m
      memory: 512Mi
    limits:
      cpu: 1000m
      memory: 1Gi

  config:
    dualLanguageMode: true
    languages:
      - "pl"
      - "en"
    scoreThreshold: 0.7
    contextEnhancement: true

# ========================================
# Language Detector
# ========================================
languageDetector:
  enabled: true
  replicaCount: 2

  image:
    repository: vigil-guard/language-detector
    tag: "1.0.1"

  resources:
    requests:
      cpu: 100m
      memory: 256Mi
    limits:
      cpu: 500m
      memory: 512Mi

# ========================================
# Prompt Guard (LLM Validation)
# ========================================
promptGuard:
  enabled: false  # Optional component
  replicaCount: 1

  image:
    repository: vigil-guard/prompt-guard-api
    tag: ""

  resources:
    requests:
      cpu: 500m
      memory: 2Gi
    limits:
      cpu: 2000m
      memory: 8Gi

  config:
    modelPath: /models/prompt-guard

  # Model download job
  modelDownload:
    enabled: true
    image: curlimages/curl:latest

# ========================================
# ClickHouse Analytics
# ========================================
clickhouse:
  enabled: true

  # Using Bitnami ClickHouse chart
  auth:
    username: admin
    existingSecret: vigil-clickhouse-secret
    existingSecretKey: password

  persistence:
    enabled: true
    size: 50Gi
    storageClass: "ssd"

  resources:
    requests:
      cpu: 500m
      memory: 2Gi
    limits:
      cpu: 2000m
      memory: 8Gi

  # Custom init scripts for Vigil Guard schema
  initdbScripts:
    init-vigil.sql: |
      CREATE DATABASE IF NOT EXISTS n8n_logs;
      CREATE TABLE IF NOT EXISTS n8n_logs.events_raw (...);
      CREATE TABLE IF NOT EXISTS n8n_logs.events_processed (...);

# ========================================
# Grafana Monitoring
# ========================================
grafana:
  enabled: true

  # Using Grafana Helm chart
  adminPassword: ""  # Use existingSecret

  persistence:
    enabled: true
    size: 5Gi

  datasources:
    datasources.yaml:
      apiVersion: 1
      datasources:
        - name: ClickHouse
          type: grafana-clickhouse-datasource
          url: http://vigil-clickhouse:8123
          access: proxy
          isDefault: true

  dashboardProviders:
    dashboardproviders.yaml:
      apiVersion: 1
      providers:
        - name: 'vigil-guard'
          folder: 'Vigil Guard'
          type: file
          options:
            path: /var/lib/grafana/dashboards/vigil-guard

  dashboardsConfigMaps:
    vigil-guard: vigil-grafana-dashboards

# ========================================
# Ingress Configuration
# ========================================
ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
  hosts:
    - host: vigil.example.com
      paths:
        - path: /ui
          pathType: Prefix
          service: web-ui-frontend
        - path: /api
          pathType: Prefix
          service: web-ui-backend
        - path: /n8n
          pathType: Prefix
          service: n8n
        - path: /grafana
          pathType: Prefix
          service: grafana
  tls:
    - secretName: vigil-tls
      hosts:
        - vigil.example.com

# ========================================
# Network Policies
# ========================================
networkPolicy:
  enabled: true
  # Allow traffic only within vigil-guard namespace
  # Plus ingress from ingress-nginx namespace

# ========================================
# Pod Disruption Budgets
# ========================================
podDisruptionBudget:
  enabled: true
  minAvailable: 1

# ========================================
# Service Account
# ========================================
serviceAccount:
  create: true
  annotations: {}
  name: ""

# ========================================
# Autoscaling
# ========================================
autoscaling:
  enabled: false
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 80
  targetMemoryUtilizationPercentage: 80
```

## Environment-Specific Values

### values-dev.yaml
```yaml
global:
  domain: "vigil-dev.example.com"
  tlsEnabled: false

n8n:
  replicaCount: 1
  resources:
    requests:
      cpu: 100m
      memory: 256Mi

webUI:
  frontend:
    replicaCount: 1
  backend:
    replicaCount: 1

presidio:
  replicaCount: 1

languageDetector:
  replicaCount: 1

clickhouse:
  persistence:
    size: 10Gi

ingress:
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-staging
```

### values-prod.yaml
```yaml
global:
  domain: "vigil.example.com"
  tlsEnabled: true

n8n:
  resources:
    requests:
      cpu: 500m
      memory: 1Gi
    limits:
      cpu: 2000m
      memory: 4Gi

webUI:
  frontend:
    replicaCount: 3
  backend:
    replicaCount: 3

presidio:
  replicaCount: 4

languageDetector:
  replicaCount: 3

clickhouse:
  persistence:
    size: 100Gi
    storageClass: "ssd-premium"
  resources:
    requests:
      cpu: 2000m
      memory: 8Gi
    limits:
      cpu: 4000m
      memory: 16Gi

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 20

podDisruptionBudget:
  enabled: true
  minAvailable: 2
```

## Common Tasks

### Create Vigil Guard Chart from Scratch
```bash
# 1. Create chart structure
helm create charts/vigil-guard
cd charts/vigil-guard

# 2. Remove default templates (we'll create custom ones)
rm -rf templates/*.yaml

# 3. Create subchart directories
mkdir -p charts/{n8n,web-ui,presidio-pii,language-detector}

# 4. For each subchart:
for chart in n8n web-ui presidio-pii language-detector; do
  helm create charts/$chart
  # Customize templates for each service
done

# 5. Update Chart.yaml with dependencies

# 6. Update umbrella chart dependencies
helm dependency update .

# 7. Lint all charts
helm lint .

# 8. Template to verify
helm template vigil-guard . -f values-dev.yaml
```

### Package and Publish Chart
```bash
# 1. Package chart
helm package charts/vigil-guard

# 2. Push to OCI registry
helm push vigil-guard-1.0.0.tgz oci://registry.example.com/charts

# 3. Or publish to chart repository
helm repo index . --url https://charts.example.com
# Upload index.yaml and .tgz to hosting

# 4. Add repository
helm repo add vigil-guard https://charts.example.com
helm repo update
```

### Deploy to Different Environments
```bash
# Development
helm upgrade --install vigil-guard ./charts/vigil-guard \
  -f ./charts/vigil-guard/values-dev.yaml \
  -n vigil-dev \
  --create-namespace

# Staging
helm upgrade --install vigil-guard ./charts/vigil-guard \
  -f ./charts/vigil-guard/values-staging.yaml \
  -n vigil-staging \
  --create-namespace

# Production (with extra safety)
helm upgrade --install vigil-guard ./charts/vigil-guard \
  -f ./charts/vigil-guard/values-prod.yaml \
  -n vigil-prod \
  --create-namespace \
  --atomic \
  --timeout 15m \
  --wait
```

### Upgrade with Custom Values
```bash
# Override specific values
helm upgrade vigil-guard ./charts/vigil-guard \
  -f values-prod.yaml \
  --set presidio.replicaCount=6 \
  --set global.vigilVersion=1.7.0 \
  -n vigil-prod

# Check diff before upgrade
helm diff upgrade vigil-guard ./charts/vigil-guard \
  -f values-prod.yaml \
  -n vigil-prod
```

### Add Custom Configuration
```yaml
# In templates/configmap-workflow.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "vigil-guard.fullname" . }}-workflow-config
  labels:
    {{- include "vigil-guard.labels" . | nindent 4 }}
data:
  unified_config.json: |
    {{- .Values.workflow.config.unified | toJson | nindent 4 }}
  rules.config.json: |
    {{- .Values.workflow.config.rules | toJson | nindent 4 }}
```

```yaml
# In values.yaml
workflow:
  config:
    unified:
      normalization:
        unicode_form: "NFKC"
        max_iterations: 3
      thresholds:
        allow_max: 29
        sanitize_light_max: 64
    rules:
      categories:
        SQL_XSS_ATTACKS:
          base_weight: 50
          multiplier: 1.3
```

## Template Helpers (_helpers.tpl)

```yaml
{{/*
Vigil Guard common labels
*/}}
{{- define "vigil-guard.labels" -}}
helm.sh/chart: {{ include "vigil-guard.chart" . }}
{{ include "vigil-guard.selectorLabels" . }}
app.kubernetes.io/version: {{ .Values.global.vigilVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: vigil-guard
{{- end }}

{{/*
Generate service URL based on component
*/}}
{{- define "vigil-guard.serviceUrl" -}}
{{- $component := index . 0 -}}
{{- $root := index . 1 -}}
{{- $port := "" -}}
{{- if eq $component "n8n" }}{{ $port = "5678" }}{{ end -}}
{{- if eq $component "presidio" }}{{ $port = "5001" }}{{ end -}}
{{- if eq $component "language-detector" }}{{ $port = "5002" }}{{ end -}}
{{- if eq $component "clickhouse" }}{{ $port = "8123" }}{{ end -}}
http://{{ include "vigil-guard.fullname" $root }}-{{ $component }}:{{ $port }}
{{- end }}

{{/*
Generate n8n webhook URL
*/}}
{{- define "vigil-guard.webhookUrl" -}}
{{- if .Values.n8n.config.webhookUrl -}}
{{ .Values.n8n.config.webhookUrl }}
{{- else if .Values.ingress.enabled -}}
{{- $scheme := ternary "https" "http" .Values.global.tlsEnabled -}}
{{ $scheme }}://{{ .Values.global.domain }}/n8n
{{- else -}}
http://{{ include "vigil-guard.fullname" . }}-n8n:5678
{{- end -}}
{{- end }}
```

## Troubleshooting

### Chart Lint Errors
```bash
# Fix common lint errors
helm lint ./charts/vigil-guard --strict

# Common issues:
# - Missing required values: Add defaults or required() function
# - Invalid YAML: Check indentation, use yamllint
# - Deprecated API versions: Update to current K8s versions
```

### Dependency Issues
```bash
# Update dependencies
helm dependency update ./charts/vigil-guard

# Verify dependencies downloaded
ls ./charts/vigil-guard/charts/

# Check dependency versions
helm dependency list ./charts/vigil-guard
```

### Template Rendering Errors
```bash
# Debug with --debug flag
helm template vigil-guard ./charts/vigil-guard --debug 2>&1 | less

# Check specific template
helm template vigil-guard ./charts/vigil-guard \
  -s templates/deployment-n8n.yaml

# Validate with kubeval
helm template vigil-guard ./charts/vigil-guard | kubeval --strict
```

## Best Practices

1. **Use library charts** for common templates (_helpers.tpl)
2. **Validate values** with values.schema.json
3. **Version bump Chart.yaml** on every change
4. **Test with helm test** hooks after deployment
5. **Use --atomic** for production upgrades
6. **Separate values files** per environment
7. **Document all values** in README.md
8. **Use existing secrets** instead of generating
9. **Add NOTES.txt** with post-install instructions
10. **Pin dependency versions** (avoid wildcards in prod)

## Related Skills
- `kubernetes-operations` - For K8s deployment details
- `n8n-vigil-workflow` - For workflow configuration
- `docker-vigil-orchestration` - For Docker Compose reference

## References
- Docker Compose: `docker-compose.yml`
- Service structure: `services/*/`
- Current configs: `services/workflow/config/`
