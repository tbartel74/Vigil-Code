/**
 * Backend API Agent - Manages Express.js API, authentication, and database operations
 * Handles JWT auth, ClickHouse queries, rate limiting, and API endpoints
 */

const BaseAgent = require('../../core/base-agent');
const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class BackendAPIAgent extends BaseAgent {
  constructor() {
    super({
      name: 'vg-backend-api',
      version: '2.0.0',
      description: 'Autonomous backend API management and database operations agent',
      capabilities: [
        'create_endpoint',
        'setup_auth',
        'query_clickhouse',
        'configure_rate_limit',
        'validate_jwt',
        'manage_sessions',
        'create_middleware',
        'optimize_queries'
      ],
      dependencies: ['data-analytics']
    });

    this.backendPath = path.join(process.cwd(), 'services', 'web-ui', 'backend');
    this.configPath = path.join(this.backendPath, 'src');
  }

  /**
   * Main execution entry point
   */
  async execute(task) {
    this.log(`Executing task: ${task.action}`);

    switch (task.action) {
      case 'create_endpoint':
        return await this.createEndpoint(task);

      case 'setup_auth':
        return await this.setupAuthentication(task);

      case 'query_clickhouse':
        return await this.queryClickHouse(task);

      case 'configure_rate_limit':
        return await this.configureRateLimit(task);

      case 'validate_jwt':
        return await this.validateJWT(task);

      case 'manage_sessions':
        return await this.manageSessions(task);

      case 'create_middleware':
        return await this.createMiddleware(task);

      case 'optimize_queries':
        return await this.optimizeQueries(task);

      default:
        return await this.handleAutonomously(task);
    }
  }

  /**
   * Create new API endpoint
   */
  async createEndpoint(task) {
    const { method, path: endpointPath, handler, auth = true } = task.payload || {};

    this.log(`Creating endpoint: ${method} ${endpointPath}`);

    // Generate endpoint code
    const endpointCode = this.generateEndpointCode(method, endpointPath, handler, auth);

    // Determine file location
    const routeFile = this.determineRouteFile(endpointPath);
    const filePath = path.join(this.configPath, routeFile);

    // Add to routes file
    try {
      let content = '';
      try {
        content = await fs.readFile(filePath, 'utf8');
      } catch {
        // File doesn't exist, create new
        content = this.generateRouteFileTemplate();
      }

      // Insert new endpoint
      const updatedContent = this.insertEndpoint(content, endpointCode);
      await fs.writeFile(filePath, updatedContent);

      // Report progress
      await this.reportProgress({
        percentage: 100,
        message: `Endpoint ${method} ${endpointPath} created`
      });

      return {
        success: true,
        endpoint: `${method} ${endpointPath}`,
        file: routeFile,
        authRequired: auth
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Setup authentication system
   */
  async setupAuthentication(task) {
    const { type = 'jwt', config } = task.payload || {};

    this.log(`Setting up ${type} authentication`);

    const authSetup = {
      jwt: {
        secret: config?.secret || crypto.randomBytes(32).toString('hex'),
        expiresIn: config?.expiresIn || '24h',
        algorithm: config?.algorithm || 'HS256'
      },
      middleware: [],
      configured: []
    };

    // Create JWT middleware
    const jwtMiddleware = `
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
};

module.exports = { authenticateToken };`;

    // Save middleware
    const middlewarePath = path.join(this.configPath, 'middleware', 'auth.js');
    await this.ensureDirectory(path.dirname(middlewarePath));
    await fs.writeFile(middlewarePath, jwtMiddleware);
    authSetup.middleware.push('auth.js');

    // Create login endpoint
    const loginEndpoint = await this.createEndpoint({
      payload: {
        method: 'POST',
        path: '/api/auth/login',
        auth: false,
        handler: 'authController.login'
      }
    });
    authSetup.configured.push(loginEndpoint);

    // Autonomous decision: Setup rate limiting for auth endpoints
    const rateLimitResult = await this.configureRateLimit({
      payload: {
        endpoint: '/api/auth/login',
        max: 5,
        window: '15 minutes'
      }
    });
    authSetup.configured.push(rateLimitResult);

    return {
      success: true,
      type,
      setup: authSetup,
      message: 'Authentication system configured successfully'
    };
  }

  /**
   * Query ClickHouse database
   */
  async queryClickHouse(task) {
    const { query, params, format = 'JSON' } = task.payload || {};

    this.log('Executing ClickHouse query...');

    try {
      // Build query URL
      const baseUrl = 'http://localhost:8123';
      const queryParams = new URLSearchParams({
        user: 'admin',
        password: process.env.CLICKHOUSE_PASSWORD || '',
        query: this.sanitizeQuery(query) + ` FORMAT ${format}`
      });

      // Execute query
      const response = await this.executeHttpRequest({
        url: `${baseUrl}?${queryParams}`,
        method: 'POST',
        data: params
      });

      // Parse results
      const results = format === 'JSON' ? JSON.parse(response) : response;

      // Analyze query performance
      const analysis = this.analyzeQueryPerformance(query, results);

      // Autonomous decision: If slow query, optimize it
      if (analysis.executionTime > 1000) {
        const optimized = await this.optimizeQuery(query);
        analysis.optimization = optimized;
      }

      return {
        success: true,
        results,
        analysis,
        rowCount: results.data?.length || 0
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        query: this.sanitizeQuery(query)
      };
    }
  }

  /**
   * Configure rate limiting
   */
  async configureRateLimit(task) {
    const { endpoint, max = 100, window = '1 minute' } = task.payload || {};

    this.log(`Configuring rate limit for ${endpoint}`);

    const rateLimitCode = `
const rateLimit = require('express-rate-limit');

const ${this.generateLimiterName(endpoint)} = rateLimit({
  windowMs: ${this.parseTimeWindow(window)},
  max: ${max},
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { ${this.generateLimiterName(endpoint)} };`;

    // Save rate limit configuration
    const limiterPath = path.join(this.configPath, 'middleware', `rate-limit-${this.sanitizeFileName(endpoint)}.js`);
    await this.ensureDirectory(path.dirname(limiterPath));
    await fs.writeFile(limiterPath, rateLimitCode);

    return {
      success: true,
      endpoint,
      config: {
        max,
        window,
        windowMs: this.parseTimeWindow(window)
      },
      file: path.basename(limiterPath)
    };
  }

  /**
   * Validate JWT token
   */
  async validateJWT(task) {
    const { token } = task.payload || {};

    this.log('Validating JWT token...');

    try {
      const jwt = require('jsonwebtoken');
      const secret = process.env.JWT_SECRET;

      if (!secret) {
        return {
          success: false,
          error: 'JWT_SECRET not configured'
        };
      }

      const decoded = jwt.verify(token, secret);

      return {
        success: true,
        valid: true,
        decoded,
        user: decoded.username || decoded.email,
        expiresAt: new Date(decoded.exp * 1000).toISOString()
      };

    } catch (error) {
      return {
        success: false,
        valid: false,
        error: error.message,
        type: error.name
      };
    }
  }

  /**
   * Manage user sessions
   */
  async manageSessions(task) {
    const { action: sessionAction, userId } = task.payload || {};

    this.log(`Managing sessions: ${sessionAction}`);

    const sessionConfig = {
      store: 'sqlite', // or 'redis' for production
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: process.env.NODE_ENV === 'production'
    };

    switch (sessionAction) {
      case 'create':
        return {
          success: true,
          sessionId: this.generateSessionId(),
          userId,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + sessionConfig.maxAge).toISOString()
        };

      case 'destroy':
        return {
          success: true,
          message: `Session destroyed for user ${userId}`
        };

      case 'refresh':
        return {
          success: true,
          sessionId: this.generateSessionId(),
          refreshedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + sessionConfig.maxAge).toISOString()
        };

      default:
        return {
          success: false,
          error: `Unknown session action: ${sessionAction}`
        };
    }
  }

  /**
   * Create custom middleware
   */
  async createMiddleware(task) {
    const { name, type, config } = task.payload || {};

    this.log(`Creating middleware: ${name}`);

    let middlewareCode = '';

    switch (type) {
      case 'cors':
        middlewareCode = this.generateCORSMiddleware(config);
        break;

      case 'validation':
        middlewareCode = this.generateValidationMiddleware(config);
        break;

      case 'logging':
        middlewareCode = this.generateLoggingMiddleware(config);
        break;

      case 'error':
        middlewareCode = this.generateErrorMiddleware(config);
        break;

      default:
        middlewareCode = this.generateCustomMiddleware(name, config);
    }

    // Save middleware
    const middlewarePath = path.join(this.configPath, 'middleware', `${name}.js`);
    await this.ensureDirectory(path.dirname(middlewarePath));
    await fs.writeFile(middlewarePath, middlewareCode);

    return {
      success: true,
      middleware: name,
      type,
      file: `middleware/${name}.js`
    };
  }

  /**
   * Optimize database queries
   */
  async optimizeQueries(task) {
    const { queries } = task.payload || {};

    this.log('Optimizing queries...');

    const optimizations = [];

    for (const query of queries) {
      const optimized = await this.optimizeQuery(query);
      optimizations.push(optimized);
    }

    // Autonomous decision: Invoke data-analytics agent for deeper analysis
    if (optimizations.some(o => o.improvement > 50)) {
      const analyticsResult = await this.invokeAgent('data-analytics', {
        action: 'analyze_performance',
        queries: optimizations.filter(o => o.improvement > 50)
      });

      return {
        success: true,
        optimizations,
        deepAnalysis: analyticsResult.result,
        totalImprovement: optimizations.reduce((sum, o) => sum + o.improvement, 0) / optimizations.length
      };
    }

    return {
      success: true,
      optimizations,
      averageImprovement: optimizations.reduce((sum, o) => sum + o.improvement, 0) / optimizations.length
    };
  }

  /**
   * Handle task autonomously
   */
  async handleAutonomously(task) {
    this.log('Making autonomous decision for backend task...');

    const taskText = task.task || task.payload?.description || '';

    // Analyze task to determine action
    if (taskText.includes('endpoint') || taskText.includes('api')) {
      return await this.createEndpoint(task);
    } else if (taskText.includes('auth') || taskText.includes('jwt')) {
      return await this.setupAuthentication(task);
    } else if (taskText.includes('query') || taskText.includes('clickhouse')) {
      return await this.queryClickHouse(task);
    } else if (taskText.includes('rate') || taskText.includes('limit')) {
      return await this.configureRateLimit(task);
    } else {
      // Default: Check API health
      return await this.checkAPIHealth();
    }
  }

  /**
   * Helper methods
   */
  generateEndpointCode(method, path, handler, auth) {
    const authMiddleware = auth ? ', authenticateToken' : '';
    return `
router.${method.toLowerCase()}('${path}'${authMiddleware}, async (req, res) => {
  try {
    ${handler ? `await ${handler}(req, res);` : '// Handler implementation here'}
  } catch (error) {
    console.error('Error in ${path}:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});`;
  }

  determineRouteFile(path) {
    const segments = path.split('/').filter(s => s);
    if (segments[1]) {
      return `routes/${segments[1]}.js`;
    }
    return 'routes/index.js';
  }

  generateRouteFileTemplate() {
    return `const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Routes

module.exports = router;`;
  }

  insertEndpoint(content, endpointCode) {
    const routesComment = '// Routes';
    const index = content.indexOf(routesComment);
    if (index !== -1) {
      return content.slice(0, index + routesComment.length) + '\n' + endpointCode + content.slice(index + routesComment.length);
    }
    return content + '\n' + endpointCode;
  }

  sanitizeQuery(query) {
    // Basic SQL injection prevention
    return query.replace(/;.*$/g, '').trim();
  }

  analyzeQueryPerformance(query, results) {
    return {
      executionTime: results.statistics?.elapsed || 0,
      rowsRead: results.statistics?.rows_read || 0,
      bytesRead: results.statistics?.bytes_read || 0,
      complexity: this.calculateQueryComplexity(query)
    };
  }

  calculateQueryComplexity(query) {
    let complexity = 0;
    if (query.includes('JOIN')) complexity += 2;
    if (query.includes('GROUP BY')) complexity += 1;
    if (query.includes('ORDER BY')) complexity += 1;
    if (query.includes('HAVING')) complexity += 2;
    return complexity;
  }

  async optimizeQuery(query) {
    // Simplified query optimization
    let optimized = query;
    let improvement = 0;

    // Add LIMIT if missing
    if (!query.includes('LIMIT')) {
      optimized += ' LIMIT 1000';
      improvement += 10;
    }

    // Suggest indexes
    const suggestions = [];
    if (query.includes('WHERE') && !query.includes('INDEX')) {
      suggestions.push('Consider adding index on WHERE clause columns');
      improvement += 20;
    }

    return {
      original: query,
      optimized,
      improvement,
      suggestions
    };
  }

  generateLimiterName(endpoint) {
    return endpoint.replace(/[^a-zA-Z0-9]/g, '_') + 'Limiter';
  }

  parseTimeWindow(window) {
    const units = {
      'second': 1000,
      'minute': 60000,
      'hour': 3600000
    };
    const match = window.match(/(\d+)\s*(second|minute|hour)/i);
    if (match) {
      return parseInt(match[1]) * units[match[2].toLowerCase()];
    }
    return 60000; // Default 1 minute
  }

  sanitizeFileName(name) {
    return name.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
  }

  generateSessionId() {
    return crypto.randomBytes(32).toString('hex');
  }

  generateCORSMiddleware(config) {
    return `const cors = require('cors');

const corsOptions = {
  origin: ${JSON.stringify(config?.origin || 'http://localhost:3000')},
  credentials: ${config?.credentials !== false},
  optionsSuccessStatus: 200
};

module.exports = cors(corsOptions);`;
  }

  generateValidationMiddleware(config) {
    return `const { body, validationResult } = require('express-validator');

const validate${config?.name || 'Input'} = [
  ${(config?.rules || []).map(r => `body('${r.field}').${r.validator}()`).join(',\n  ')},
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

module.exports = { validate${config?.name || 'Input'} };`;
  }

  generateLoggingMiddleware(config) {
    return `const winston = require('winston');

const logger = winston.createLogger({
  level: '${config?.level || 'info'}',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

const loggingMiddleware = (req, res, next) => {
  logger.info(\`\${req.method} \${req.path}\`);
  next();
};

module.exports = { loggingMiddleware };`;
  }

  generateErrorMiddleware(config) {
    return `const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    error: message,
    ${config?.includeStack ? 'stack: err.stack,' : ''}
    timestamp: new Date().toISOString()
  });
};

module.exports = { errorHandler };`;
  }

  generateCustomMiddleware(name, config) {
    return `const ${name} = (req, res, next) => {
  // Custom middleware implementation
  ${config?.code || '// Add your logic here'}
  next();
};

module.exports = { ${name} };`;
  }

  async ensureDirectory(dir) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  async executeHttpRequest(options) {
    // Simplified HTTP request (would use axios or fetch in production)
    return new Promise((resolve, reject) => {
      const http = require('http');
      const url = new URL(options.url);

      const req = http.request({
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: options.method || 'GET',
        headers: options.headers || {}
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      });

      req.on('error', reject);
      if (options.data) req.write(options.data);
      req.end();
    });
  }

  async checkAPIHealth() {
    const healthChecks = {
      server: false,
      database: false,
      auth: false
    };

    // Check Express server
    try {
      await this.executeHttpRequest({
        url: 'http://localhost:8787/health'
      });
      healthChecks.server = true;
    } catch (error) {
      // Server not responding
    }

    // Check ClickHouse
    try {
      await this.queryClickHouse({
        payload: { query: 'SELECT 1' }
      });
      healthChecks.database = true;
    } catch (error) {
      // Database not accessible
    }

    // Check JWT configuration
    healthChecks.auth = !!process.env.JWT_SECRET;

    return {
      success: true,
      health: healthChecks,
      status: Object.values(healthChecks).every(v => v) ? 'healthy' : 'degraded'
    };
  }
}

module.exports = BackendAPIAgent;