# Architecture Documentation

## Overview

This is a production-ready Express.js server built with TypeScript, following industry best practices for security, performance, and maintainability.

## Technology Stack

- **Runtime**: Node.js >= 18.0.0
- **Framework**: Express.js 5.1.0
- **Language**: TypeScript 5.9.3
- **Package Manager**: pnpm 10.18.2

## Key Dependencies

### Production Dependencies
- `express` (5.1.0) - Web framework
- `helmet` (8.1.0) - Security headers
- `cors` (2.8.5) - Cross-Origin Resource Sharing
- `compression` (1.8.1) - Response compression
- `express-rate-limit` (8.1.0) - Rate limiting
- `dotenv` (17.2.3) - Environment variables

### Development Dependencies
- `typescript` - Type safety and modern JavaScript features
- `ts-node` - TypeScript execution for development
- `rimraf` - Cross-platform directory cleaning
- Type definitions for all packages

## Architecture Principles

### 1. **Separation of Concerns**
- Configuration isolated in `config/`
- Middleware separated by function in `middleware/`
- Routes organized in `routes/`
- Utilities in `utils/`

### 2. **Type Safety**
- Strict TypeScript configuration
- Full type coverage for all code
- Type-safe environment variables

### 3. **Security First**
- Helmet for security headers
- CORS configuration
- Rate limiting per IP
- Input validation and sanitization
- No stack traces in production

### 4. **Error Handling**
- Centralized error handling middleware
- Custom error classes with status codes
- Async error wrapper for route handlers
- Graceful shutdown on critical errors

### 5. **Performance**
- Response compression
- Efficient middleware ordering
- Graceful shutdown for zero-downtime deployments

## Project Structure

```
src/
├── config/
│   └── env.ts              # Environment variable validation and export
├── middleware/
│   ├── errorHandler.ts     # Error handling and 404 handler
│   ├── logging.ts          # Request logging
│   └── security.ts         # Security middleware (helmet, CORS, rate limiting)
├── routes/
│   ├── index.ts            # Main router configuration
│   └── health.routes.ts    # Health check endpoints
├── utils/
│   └── asyncHandler.ts     # Async error wrapper
├── app.ts                  # Express app configuration
└── server.ts               # Server startup and shutdown
```

## Middleware Chain

The middleware is applied in this specific order for optimal security and performance:

1. **Security Middleware**
   - Helmet (security headers)
   - CORS (cross-origin)
   - Rate limiting

2. **Parsing Middleware**
   - JSON parser (10MB limit)
   - URL-encoded parser (10MB limit)

3. **Performance Middleware**
   - Compression

4. **Logging Middleware**
   - Request logger
   - Development logger

5. **Routes**
   - Root endpoint
   - API routes under `/api`

6. **Error Handling**
   - 404 handler
   - Global error handler

## Configuration Management

### Environment Variables

All configuration is managed through environment variables defined in `.env`:

- **Server**: PORT, HOST, NODE_ENV
- **API**: API_PREFIX
- **Security**: CORS_ORIGIN
- **Rate Limiting**: RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS
- **Logging**: LOG_LEVEL

Environment variables are:
- Validated at startup
- Type-safe with TypeScript
- Required variables throw errors if missing
- Default values provided for optional variables

## Error Handling Strategy

### AppError Class
Custom error class with:
- HTTP status code
- Error message
- Operational flag (expected vs unexpected errors)

### Async Handler
Wrapper function that:
- Catches promise rejections
- Passes errors to Express error middleware
- Eliminates try-catch boilerplate

### Error Middleware
- Logs all errors with context
- Returns consistent JSON error responses
- Hides stack traces in production
- Includes detailed debug info in development

### Process-Level Error Handling
- `uncaughtException` - Logs and exits
- `unhandledRejection` - Logs and exits in production
- `SIGTERM`/`SIGINT` - Graceful shutdown

## Security Features

### Helmet Configuration
- Content Security Policy (disabled in development)
- Cross-Origin-Embedder-Policy
- Cross-Origin-Opener-Policy
- Cross-Origin-Resource-Policy
- Origin-Agent-Cluster
- Referrer-Policy
- Strict-Transport-Security
- X-Content-Type-Options
- X-DNS-Prefetch-Control
- X-Download-Options
- X-Frame-Options
- X-Permitted-Cross-Domain-Policies
- X-Powered-By (removed)
- X-XSS-Protection

### CORS Configuration
- Configurable origins (single, multiple, or all)
- Credentials support
- Preflight request handling

### Rate Limiting
- Window-based rate limiting (default: 15 minutes)
- Per-IP request limits (default: 100 requests)
- Customizable via environment variables
- Disabled in test environment

### Input Validation
- Body size limits (10MB)
- JSON parsing errors handled
- URL-encoded parsing

## Logging Strategy

### Request Logging
All requests are logged with:
- Timestamp
- HTTP method
- Request path
- Query parameters
- Status code
- Response time
- User agent
- IP address

### Development Logging
Additional verbose logging in development:
- Request method and path
- Query parameters
- Request body

### Error Logging
All errors logged with:
- Timestamp
- Request method and path
- Status code
- Error message
- Stack trace

### Log Format
- JSON format for production parsing
- Human-readable format in development

## Performance Optimizations

### Compression
- Gzip/Deflate response compression
- Automatic content negotiation
- Threshold-based compression

### Middleware Ordering
- Security checks first
- Parsing before route handling
- Compression early in chain
- Error handling last

### Graceful Shutdown
- Closes server on termination signals
- Waits for active connections
- 30-second timeout for forced shutdown
- Prevents new connections during shutdown

## Scalability Considerations

### Horizontal Scaling
- Stateless design
- No in-memory session storage
- Environment-based configuration

### Adding New Features

#### New Routes
1. Create route file in `src/routes/`
2. Use `asyncHandler` for async routes
3. Register in `src/routes/index.ts`

#### New Middleware
1. Create middleware in `src/middleware/`
2. Register in `src/app.ts`
3. Order matters - security first

#### New Configuration
1. Add to `.env.example`
2. Add validation in `src/config/env.ts`
3. Use type-safe exports

## Testing Strategy (Future)

### Unit Tests
- Middleware functions
- Utility functions
- Error handlers

### Integration Tests
- API endpoints
- Error scenarios
- Authentication flows

### End-to-End Tests
- Full request/response cycles
- Multiple endpoint interactions

## Deployment

### Build Process
```bash
pnpm build
```
- Cleans `dist/` directory
- Compiles TypeScript to JavaScript
- Generates source maps
- Creates declaration files

### Production Startup
```bash
NODE_ENV=production node dist/server.js
```
or
```bash
pnpm start:prod
```

### Environment Variables
Ensure all required environment variables are set in production:
- Use secrets management
- Never commit `.env` files
- Use `.env.example` as template

### Health Checks
- `GET /` - Basic server check
- `GET /api/health` - Detailed health status
- `GET /api/health/info` - Server information

## Best Practices Implemented

✅ **TypeScript Strict Mode** - Full type safety
✅ **Environment Validation** - Fail fast on missing config
✅ **Async Error Handling** - No try-catch boilerplate
✅ **Security Headers** - Helmet protection
✅ **CORS Configuration** - Controlled access
✅ **Rate Limiting** - Abuse prevention
✅ **Request Logging** - Observability
✅ **Error Logging** - Debug support
✅ **Graceful Shutdown** - Zero downtime
✅ **Response Compression** - Performance
✅ **Clean Architecture** - Maintainability
✅ **Modular Structure** - Scalability

## Monitoring (Future Enhancements)

- Integration with APM tools (New Relic, DataDog)
- Structured logging with Winston/Pino
- Metrics collection (Prometheus)
- Health check endpoints for load balancers
- Distributed tracing
- Error tracking (Sentry)

## Documentation

- `README.md` - Getting started guide
- `ARCHITECTURE.md` - This file
- `.env.example` - Configuration template
- Inline code comments - Implementation details

