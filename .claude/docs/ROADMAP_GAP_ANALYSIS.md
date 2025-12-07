# Analiza Luk: Vigil-Roadmap vs Vigil-Guard

**Data analizy:** 2025-12-07
**Wersja:** 1.0.0
**Status:** Aktywny

---

## Spis treści

1. [Brakujące Agenty](#1-brakujące-agenty)
2. [Brakujące Skille](#2-brakujące-skille)
3. [Aktualizacje Istniejących Agentów](#3-aktualizacje-istniejących-agentów)
4. [Priorytetyzacja Wdrożenia](#4-priorytetyzacja-wdrożenia)
5. [Szablon Nowego Agenta](#5-szablon-nowego-agenta)

---

## 1. Brakujące Agenty

### 1.1 nats-expert

**Źródło wymagania:** `n8n-migration/etap1-nats-api/architecture/NATS_JETSTREAM_TECHNICAL_GUIDE.md`

**Zakres wiedzy:**
- NATS JetStream streams i consumers
- Request-Reply pattern
- Work queues z exactly-once delivery
- Monitoring (nats-top, Prometheus metrics)
- Konfiguracja klastrów (3-node)

**Przykładowe zadania:**
- "Skonfiguruj stream VIGIL.REQUESTS z retention limits"
- "Zaimplementuj consumer dla detection-worker"
- "Debuguj problem z message acknowledgment"

---

### 1.2 llama-guard-expert

**Źródło wymagania:** `bielik-integration/Bielik-Guard-PRD-v4.2.md`

**Zakres wiedzy:**
- Llama Guard 3-1B model architecture
- 14 kategorii szkodliwości (S1-S14)
- Prompt formatting dla safety classification
- Integration z vLLM/TGI
- Fine-tuning na custom categories

**Przykładowe zadania:**
- "Skonfiguruj Llama Guard dla kategorii S1-S14"
- "Zoptymalizuj batch inference dla throughput"
- "Dodaj custom category O13 (Polish legal)"

---

### 1.3 bielik-expert

**Źródło wymagania:** `bielik-integration/Bielik-Guard-Architecture-v4.2.md`

**Zakres wiedzy:**
- Bielik-7B-Instruct model (SpeakLeash)
- Polish language understanding
- Sojka classifier (32 kategorii)
- Dual-classifier routing (PL vs EN/OTHER)
- Unified rewriter z Bielik-7B

**Przykładowe zadania:**
- "Skonfiguruj Sojka classifier dla polskich kategorii"
- "Zaimplementuj routing PL→Sojka, EN→Llama Guard"
- "Tune risk multipliers dla kategorii C1-C32"

---

### 1.4 kubernetes-expert

**Źródło wymagania:** `n8n-migration/etap2-kubernetes/K8S_EXECUTIVE_SUMMARY.md`

**Zakres wiedzy:**
- Helm charts i values.yaml
- HPA (Horizontal Pod Autoscaler)
- KEDA (event-driven scaling)
- NetworkPolicies (zero-trust)
- ArgoCD GitOps
- External Secrets Operator (ESO)

**Przykładowe zadania:**
- "Napisz Helm chart dla vigil-api"
- "Skonfiguruj KEDA scaler dla NATS queue depth"
- "Zaimplementuj NetworkPolicy dla vigil-net"

---

### 1.5 siem-expert

**Źródło wymagania:** `bielik-integration/SIEM_INTEGRATION_PLAN.md`

**Zakres wiedzy:**
- CEF (Common Event Format)
- RFC5424 Syslog
- Vector log-forwarder
- HMAC signing (integrity)
- Splunk/QRadar/Sentinel integration

**Przykładowe zadania:**
- "Skonfiguruj Vector sink dla Splunk HEC"
- "Zaimplementuj CEF formatter dla threat events"
- "Dodaj HMAC signing do log pipeline"

---

### 1.6 redis-expert

**Źródło wymagania:** `n8n-migration/etap1-nats-api/architecture/VIGIL_2.0_COMPLETE_ARCHITECTURE.md`

**Zakres wiedzy:**
- Redis caching patterns
- API key hash storage
- Rate limiting z sliding window
- Session management
- Redis Cluster (HA)

**Przykładowe zadania:**
- "Zaimplementuj rate limiter z Redis sorted sets"
- "Skonfiguruj API key cache z TTL"
- "Debuguj Redis connection pooling"

---

## 2. Brakujące Skille

### 2.1 Skille związane z NATS (Etap 1)

| Skill | Opis | Źródło |
|-------|------|--------|
| `nats-stream-manager` | Zarządzanie streams, consumers, retention | PRD_ETAP1.md |
| `vigil-api-developer` | Public REST API z Express.js | VIGIL_2.0_ARCHITECTURE.md |
| `vigil-worker-developer` | TypeScript workers (detection, PII, arbiter) | PRD_ETAP1.md |
| `api-key-security` | bcrypt hash, LUKS, anti-enumeration | PRD_ETAP1.md (R8, NFR-15) |

### 2.2 Skille związane z Bielik (Faza 2)

| Skill | Opis | Źródło |
|-------|------|--------|
| `bielik-integration` | Dual-classifier, unified rewriter | Bielik-Guard-v4.2.md |
| `llm-safety-classifier` | Llama Guard + Sojka configuration | Bielik-Guard-Architecture.md |
| `category-risk-tuning` | Risk multipliers, thresholds | Bielik-Guard-Architecture.md |

### 2.3 Skille związane z infrastrukturą (Etap 2)

| Skill | Opis | Źródło |
|-------|------|--------|
| `helm-chart-developer` | Kubernetes Helm charts | K8S_EXECUTIVE_SUMMARY.md |
| `keda-scaler-config` | Event-driven autoscaling | K8S_FINAL_MIGRATION_PLAN.md |
| `siem-log-forwarder` | Vector, CEF, Splunk integration | SIEM_INTEGRATION_PLAN.md |
| `secret-rotation` | Vault, ESO, LUKS keys | ESO_SECRET_MANAGEMENT.md |

---

## 3. Aktualizacje Istniejących Agentów

### 3.1 orchestrator

**Obecny stan:** Koordynacja 12 technology experts
**Wymagane aktualizacje:**
- [ ] Dodać routing do nowych agentów (nats, llama-guard, bielik, k8s, siem, redis)
- [ ] Rozszerzyć decision tree o NATS/K8s/Bielik domeny
- [ ] Dodać workflow dla migracji n8n → NATS

---

### 3.2 express-expert

**Obecny stan:** REST APIs, middleware, auth
**Wymagane aktualizacje:**
- [ ] Wiedza o vigil-api endpoints (`/v1/analyze`, `/v1/analyze/async`)
- [ ] API key authentication (bcrypt hash lookup)
- [ ] Rate limiting z Redis (sliding window)
- [ ] Request-Reply pattern z NATS
- [ ] OpenAPI 3.1 specification

---

### 3.3 docker-expert

**Obecny stan:** Containers, compose, networking
**Wymagane aktualizacje:**
- [ ] NATS JetStream container configuration
- [ ] Redis container z persistence
- [ ] Multi-stage builds dla TypeScript workers
- [ ] Health checks dla nowych serwisów
- [ ] Docker Compose profiles (dev/prod/test)

---

### 3.4 security-expert

**Obecny stan:** OWASP, auth, vulnerabilities
**Wymagane aktualizacje:**
- [ ] API key security (NFR-15 anti-enumeration)
- [ ] LUKS encryption at rest
- [ ] HMAC log signing
- [ ] Zero-trust networking (NetworkPolicies)
- [ ] Secret rotation procedures
- [ ] Rate limiting bypass prevention

---

### 3.5 vitest-expert

**Obecny stan:** Testing, TDD, fixtures
**Wymagane aktualizacje:**
- [ ] NATS mock/stub patterns
- [ ] Worker integration tests
- [ ] API contract testing (OpenAPI)
- [ ] Performance benchmarks (P99 latency)
- [ ] Chaos testing scenarios

---

### 3.6 clickhouse-expert

**Obecny stan:** Analytics SQL, schema
**Wymagane aktualizacje:**
- [ ] Nowe kolumny dla Bielik (classifier_used, language_detected)
- [ ] SIEM export views
- [ ] API usage analytics (requests/day, latency percentiles)
- [ ] Partitioning dla high-volume API logs

---

### 3.7 presidio-expert

**Obecny stan:** PII detection, NLP
**Wymagane aktualizacje:**
- [ ] Integracja z pii-worker (NATS consumer)
- [ ] Batch processing dla async API
- [ ] Custom recognizers dla Bielik categories
- [ ] Performance tuning dla 150 req/s

---

### 3.8 python-expert

**Obecny stan:** Flask, FastAPI
**Wymagane aktualizacje:**
- [ ] vLLM/TGI integration dla Llama Guard
- [ ] Bielik-7B inference optimization
- [ ] Sojka classifier wrapper
- [ ] Model loading i warm-up

---

### 3.9 react-expert

**Obecny stan:** Components, hooks, UI
**Wymagane aktualizacje:**
- [ ] API key management UI
- [ ] Usage dashboard (requests, latency, errors)
- [ ] Bielik classifier configuration panel
- [ ] NATS stream monitoring widget

---

### 3.10 git-expert

**Obecny stan:** Version control, PRs
**Wymagane aktualizacje:**
- [ ] Monorepo structure (vigil-api, workers, sdk)
- [ ] Release workflow dla SDK (npm, PyPI)
- [ ] Changelog generation dla API versions
- [ ] GitOps patterns (ArgoCD sync)

---

## 4. Priorytetyzacja Wdrożenia

### Faza 1: NATS Migration (Tygodnie 1-5)

**Priorytet: KRYTYCZNY**

| Komponent | Typ | Priorytet |
|-----------|-----|-----------|
| nats-expert | Agent | P0 |
| redis-expert | Agent | P0 |
| nats-stream-manager | Skill | P0 |
| vigil-api-developer | Skill | P0 |
| vigil-worker-developer | Skill | P0 |
| api-key-security | Skill | P1 |
| express-expert updates | Update | P0 |
| docker-expert updates | Update | P0 |
| security-expert updates | Update | P1 |

---

### Faza 2: Bielik Integration (Tygodnie 6-10)

**Priorytet: WYSOKI**

| Komponent | Typ | Priorytet |
|-----------|-----|-----------|
| llama-guard-expert | Agent | P0 |
| bielik-expert | Agent | P0 |
| bielik-integration | Skill | P0 |
| llm-safety-classifier | Skill | P0 |
| category-risk-tuning | Skill | P1 |
| python-expert updates | Update | P0 |
| clickhouse-expert updates | Update | P1 |

---

### Faza 3: Security Hardening (Tygodnie 8-12)

**Priorytet: WYSOKI**

| Komponent | Typ | Priorytet |
|-----------|-----|-----------|
| siem-expert | Agent | P1 |
| siem-log-forwarder | Skill | P1 |
| secret-rotation | Skill | P1 |
| security-expert updates | Update | P0 |

---

### Faza 4: Kubernetes (Tygodnie 11-18)

**Priorytet: ŚREDNI**

| Komponent | Typ | Priorytet |
|-----------|-----|-----------|
| kubernetes-expert | Agent | P0 |
| helm-chart-developer | Skill | P0 |
| keda-scaler-config | Skill | P1 |
| git-expert updates | Update | P1 |

---

## 5. Szablon Nowego Agenta

### Przykład: nats-expert

**Lokalizacja:** `.claude/agents/nats-expert/AGENT.md`

```markdown
# NATS Expert Agent

## Identity
You are nats-expert, a specialized technology expert for NATS JetStream messaging.

## Core Knowledge (Tier 1)

### NATS JetStream Fundamentals
- Streams: durable message storage with configurable retention
- Consumers: push/pull delivery with acknowledgment
- Subjects: hierarchical topic naming (VIGIL.REQUESTS.*)
- Request-Reply: synchronous RPC pattern over NATS

### Common Patterns
```javascript
// Stream creation
await js.streams.add({
  name: "VIGIL_REQUESTS",
  subjects: ["vigil.requests.*"],
  retention: RetentionPolicy.Limits,
  max_msgs: 1000000,
  max_age: 86400 * 1e9 // 24h in nanoseconds
});

// Consumer with exactly-once
const consumer = await js.consumers.get("VIGIL_REQUESTS", "detection-worker");
for await (const msg of consumer) {
  await processMessage(msg);
  msg.ack();
}
```

### Configuration Best Practices
- Use work queues for load balancing (durable, pull-based)
- Set appropriate ack_wait (30s default, increase for slow workers)
- Enable flow control for backpressure
- Use max_deliver for retry limits

## Documentation Protocol (Tier 2)

When uncertain, fetch official documentation:
- NATS Docs: https://docs.nats.io/
- JetStream: https://docs.nats.io/nats-concepts/jetstream
- nats.js: https://github.com/nats-io/nats.js

## Project Context

Read from:
- `.claude/state/progress.json` for current workflow
- `CLAUDE.md` for project conventions
- `services/vigil-api/` for API integration points

## Actions

### create_stream
Create or update NATS JetStream stream configuration.

### create_consumer
Configure consumer for worker message processing.

### debug_delivery
Diagnose message delivery issues (ack failures, redelivery).

### monitor_stream
Check stream health, message counts, consumer lag.
```

---

## Dokumenty źródłowe

| Dokument | Lokalizacja |
|----------|-------------|
| PRD Etap 1 | `Vigil-Roadmap/n8n-migration/etap1-nats-api/PRD_ETAP1.md` |
| Architektura 2.0 | `Vigil-Roadmap/n8n-migration/etap1-nats-api/architecture/VIGIL_2.0_COMPLETE_ARCHITECTURE.md` |
| Bielik PRD v4.2 | `Vigil-Roadmap/bielik-integration/Bielik-Guard-PRD-v4.2.md` |
| Bielik Architecture | `Vigil-Roadmap/bielik-integration/Bielik-Guard-Architecture-v4.2.md` |
| K8s Executive Summary | `Vigil-Roadmap/n8n-migration/etap2-kubernetes/K8S_EXECUTIVE_SUMMARY.md` |
| SIEM Integration | `Vigil-Roadmap/bielik-integration/SIEM_INTEGRATION_PLAN.md` |
| Custom PII Spike | `Vigil-Roadmap/spike-custom-pii/README.md` |

---

**Ostatnia aktualizacja:** 2025-12-07
**Autor:** Claude Code (Vigil Guard Analysis)
