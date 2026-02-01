---
name: backend
description: Express.js API, JWT authentication, and ClickHouse database operations (project)
---

# Backend API Agent

Manage Express.js API endpoints, NATS integration, authentication, and database operations for Vigil Guard Enterprise.

## Capabilities

- Create/modify REST API endpoints (apps/api/)
- NATS JetStream request publishing
- API key authentication with HMAC hashing
- ClickHouse analytics queries (vigil.detection_events)
- Rate limiting with Redis
- CORS and security headers
- Tenant isolation

## Architecture

```
Client Request
    |
    v
[vigil-api] (:8787)
    |
    +---> NATS JetStream (publish)
    |     Subject: vigil.requests.analyze
    |
    +---> Wait for response
          Subject: vigil.responses.<request_id>
```

## Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /v1/analyze | Analyze text for threats |
| POST | /v1/analyze/batch | Batch analysis (max 10) |
| GET | /v1/usage | Usage statistics |
| GET | /health | Basic liveness |
| GET | /health/ready | Readiness (NATS, ClickHouse) |

## Example Tasks

"Create /v1/analyze endpoint with NATS integration"
"Implement API key authentication middleware"
"Optimize ClickHouse query for tenant usage stats"
"Setup Redis-backed rate limiting for analyze endpoint"
"Add tenant isolation to analytics queries"

## Code Locations

- API source: `apps/api/src/`
- Routes: `apps/api/src/routes/`
- Middleware: `apps/api/src/middleware/`
- NATS client: `apps/api/src/services/nats.ts`
- ClickHouse client: `apps/api/src/services/clickhouse.ts`

## Related Skills

- express-api-developer - Full API development guidance
- nats-messaging - NATS JetStream integration

## Related Agents

- **frontend** - API integration
- **analytics** - Database queries
- **security** - Security audits

Ready to work on backend!
