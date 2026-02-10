---
name: backend
description: API development, authentication, and database operations (project)
---

# Backend API Command

Manage API endpoints, authentication, and database operations.

## Capabilities

- Create/modify REST API endpoints (apps/api/)
- Message queue request publishing
- API key authentication with HMAC hashing
- Analytics database queries
- Rate limiting
- CORS and security headers
- Tenant isolation

## Architecture

```
Client Request
    |
    v
[your-api] (:8787)
    |
    +---> Message Queue (publish)
    |     Subject: app.requests.analyze
    |
    +---> Wait for response
          Subject: app.responses.<request_id>
```

## Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /v1/analyze | Analyze text |
| POST | /v1/analyze/batch | Batch analysis (max 10) |
| GET | /v1/usage | Usage statistics |
| GET | /health | Basic liveness |
| GET | /health/ready | Readiness check |

## Example Tasks

"Create /v1/analyze endpoint with messaging integration"
"Implement API key authentication middleware"
"Optimize database query for tenant usage stats"
"Setup rate limiting for analyze endpoint"
"Add tenant isolation to analytics queries"

## Code Locations

- API source: `apps/api/src/`
- Routes: `apps/api/src/routes/`
- Middleware: `apps/api/src/middleware/`
- Services: `apps/api/src/services/`

## Related

- **frontend** - API integration
- **security** - Security audits
