# Backend API Agent

## Overview

The Backend API Agent manages Express.js server development for Vigil Guard, including authentication, database operations, API endpoints, and security implementations. This agent handles all backend logic for the web configuration interface.

**Version:** 1.0.0
**Based on:** express-api-developer
**Status:** Active

## Core Responsibilities

### 1. API Development
- Create RESTful API endpoints
- Implement request/response handling
- Manage route organization
- Handle error responses

### 2. Authentication & Authorization
- JWT token management
- bcrypt password hashing (12 rounds)
- RBAC permission system
- Session management

### 3. Database Operations
- SQLite user management
- ClickHouse analytics queries
- Query optimization
- Connection pooling

### 4. Security Implementation
- Rate limiting (express-rate-limit)
- CORS configuration
- Input validation
- SQL injection prevention

### 5. Configuration Management
- ETag concurrency control
- Backup rotation
- Audit logging
- File validation

## Tech Stack

- **Express:** 4.18.2
- **TypeScript:** 5.6.3
- **JWT:** jsonwebtoken ^9.0.2
- **bcrypt:** ^5.1.1 (12 rounds)
- **SQLite:** better-sqlite3
- **ClickHouse:** @clickhouse/client
- **Rate Limiting:** express-rate-limit ^8.1.0

## Supported Tasks

### Task Identifiers
- `add_endpoint` - Create new API endpoint
- `configure_auth` - Setup authentication
- `optimize_query` - Optimize database queries
- `add_validation` - Add input validation
- `implement_rbac` - Setup role-based access
- `add_rate_limiting` - Configure rate limits
- `review_auth` - Security review
- `add_audit_logging` - Implement audit trails

## Project Structure

```
services/web-ui/backend/
├── src/
│   ├── server.ts           # Main Express app
│   ├── auth.ts            # JWT + bcrypt
│   ├── retention.ts       # ClickHouse retention API
│   ├── clickhouse.ts      # CH connection
│   ├── config/
│   │   └── index.ts       # Config management
│   └── db/
│       └── users.db       # SQLite database
├── package.json
└── tsconfig.json
```

## Authentication System

### JWT Implementation

```typescript
// Token generation
const token = jwt.sign(
  {
    id: user.id,
    username: user.username,
    role: user.role
  },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);

// Middleware
export const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

### RBAC Permissions

```typescript
// Permission levels
const permissions = {
  admin: ['can_manage_users', 'can_view_configuration', 'can_view_monitoring'],
  editor: ['can_view_configuration', 'can_view_monitoring'],
  viewer: ['can_view_monitoring']
};

// Permission check
export const requirePermission = (permission: string) => {
  return (req, res, next) => {
    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};
```

## Database Operations

### SQLite User Management

```typescript
// User creation
const stmt = db.prepare(`
  INSERT INTO users (username, email, password_hash, role, permissions)
  VALUES (?, ?, ?, ?, ?)
`);

const hashedPassword = await bcrypt.hash(password, 12);
stmt.run(username, email, hashedPassword, role, JSON.stringify(permissions));
```

### ClickHouse Analytics

```typescript
// Query with parameters
async function getDetectionStats(days: number) {
  const query = `
    SELECT
      toDate(timestamp) as date,
      count() as total_events,
      countIf(final_status = 'BLOCKED') as blocked,
      countIf(final_status = 'ALLOWED') as allowed
    FROM n8n_logs.events_processed
    WHERE timestamp > now() - INTERVAL {days:UInt32} DAY
    GROUP BY date
    ORDER BY date DESC
  `;

  const result = await client.query({
    query,
    query_params: { days }
  });

  return await result.json();
}
```

## API Endpoints

### Core Endpoints

```typescript
// Configuration management
GET    /api/config/:file          // Get config file
PUT    /api/config/:file          // Update config (ETag required)
GET    /api/config/backups/:file  // List backups

// Authentication
POST   /api/auth/login            // Login
POST   /api/auth/logout           // Logout
GET    /api/auth/me              // Current user
POST   /api/auth/change-password  // Password change

// User management
GET    /api/users                 // List users (admin)
POST   /api/users                 // Create user (admin)
DELETE /api/users/:id            // Delete user (admin)

// PII Detection
GET    /api/pii-detection/status      // Service health
GET    /api/pii-detection/entity-types // Available entities
POST   /api/pii-detection/analyze     // Test detection

// Analytics
GET    /api/analytics/events      // Event statistics
GET    /api/analytics/threats     // Threat breakdown
GET    /api/retention/policy      // Retention settings
```

## Security Implementation

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

// Login rate limit
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                      // 5 attempts
  message: 'Too many login attempts'
});

app.post('/api/auth/login', loginLimiter, ...);

// API rate limit
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,        // 1 minute
  max: 100                     // 100 requests
});

app.use('/api/', apiLimiter);
```

### Input Validation

```typescript
// Sanitize filename
function sanitizeFilename(filename: string): string {
  const validFiles = ['rules.config.json', 'unified_config.json'];

  if (!validFiles.includes(filename)) {
    throw new Error('Invalid file');
  }

  // Remove path traversal attempts
  return filename.replace(/[^\w.-]/g, '');
}

// Validate JSON
function validateConfig(content: string): void {
  try {
    JSON.parse(content);
  } catch {
    throw new Error('Invalid JSON');
  }
}
```

### CORS Configuration

```typescript
app.use(cors({
  origin: /^http:\/\/localhost(:\d+)?$/,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'If-Match']
}));
```

## Error Handling

### Global Error Handler

```typescript
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Don't expose internal errors
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  res.status(err.status || 500).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});
```

### Async Error Wrapper

```typescript
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

app.get('/api/data', asyncHandler(async (req, res) => {
  const data = await fetchData();
  res.json(data);
}));
```

## Performance Optimization

### Query Optimization
- Use prepared statements
- Implement connection pooling
- Cache frequent queries
- Paginate large results

### Response Optimization
- Enable gzip compression
- Implement response caching
- Use streaming for large data
- Optimize JSON serialization

## Testing

### Unit Tests

```typescript
describe('Auth API', () => {
  test('should hash passwords with bcrypt', async () => {
    const password = 'testpass123';
    const hash = await hashPassword(password);
    expect(await bcrypt.compare(password, hash)).toBe(true);
  });

  test('should generate valid JWT', () => {
    const token = generateToken(user);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.username).toBe(user.username);
  });
});
```

## Integration Points

### With Other Agents
- **frontend-ui-agent**: API consumption
- **data-analytics-agent**: ClickHouse queries
- **security-compliance-agent**: Security implementation

### External Services
- n8n workflow engine
- ClickHouse database
- Presidio PII service
- Language detector service

## Quality Metrics

### API Quality
- Response time: <200ms (p95)
- Error rate: <1%
- Uptime: >99.9%
- Security headers: 100%

### Code Quality
- TypeScript strict mode
- ESLint compliance
- Test coverage: >80%
- No SQL injection vulnerabilities

## Best Practices

1. **Always validate input** - Never trust client data
2. **Use parameterized queries** - Prevent SQL injection
3. **Implement rate limiting** - Prevent abuse
4. **Log security events** - Audit trail
5. **Hash passwords properly** - bcrypt with salt
6. **Handle errors gracefully** - Don't expose internals
7. **Version your API** - Maintain compatibility

## Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| AUTH_INVALID_CREDENTIALS | Wrong username/password | Check credentials |
| AUTH_TOKEN_EXPIRED | JWT expired | Refresh token |
| PERMISSION_DENIED | Insufficient permissions | Check RBAC |
| RATE_LIMIT_EXCEEDED | Too many requests | Wait and retry |
| VALIDATION_ERROR | Invalid input | Fix request data |

## File Locations

```
services/web-ui/backend/
├── src/
│   ├── server.ts
│   ├── auth.ts
│   ├── retention.ts
│   └── clickhouse.ts
├── config/
│   └── audit.log
└── data/
    └── users.db
```

---

**Note:** This agent ensures secure, performant backend API operations while maintaining proper authentication, authorization, and data integrity.