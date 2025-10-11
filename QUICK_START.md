# Quick Start Guide

## 🚀 Get Up and Running in 2 Minutes

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Set Up Environment
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env if needed (defaults work fine for development)
```

### 3. Start Development Server
```bash
pnpm dev
```

The server will start at `http://localhost:3000`

### 4. Test the Endpoints

**Root Endpoint:**
```bash
curl http://localhost:3000
# Response: {"status":"success","message":"Youssef Dhibi","timestamp":"..."}
```

**Health Check:**
```bash
curl http://localhost:3000/api/health
# Response: {"status":"success","message":"Server is running",...}
```

**Server Info:**
```bash
curl http://localhost:3000/api/health/info
# Response: {"status":"success","data":{"name":"Youssef Dhibi",...}}
```

## 📝 Available Scripts

```bash
# Development with hot reload
pnpm dev

# Build for production
pnpm build

# Run production build
pnpm start:prod

# Type checking only
pnpm typecheck

# Clean build directory
pnpm clean
```

## 🔧 Common Configuration

### Change Port
Edit `.env`:
```env
PORT=4000
```

### Configure CORS
Edit `.env`:
```env
# Allow all origins
CORS_ORIGIN=*

# Allow specific origin
CORS_ORIGIN=http://localhost:3000

# Allow multiple origins
CORS_ORIGIN=http://localhost:3000,https://yourdomain.com
```

### Adjust Rate Limits
Edit `.env`:
```env
# 1000 requests per 15 minutes
RATE_LIMIT_MAX_REQUESTS=1000
RATE_LIMIT_WINDOW_MS=900000
```

## 🎯 Adding Your First API Endpoint

### 1. Create a Route File
Create `src/routes/example.routes.ts`:
```typescript
import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';

export const exampleRouter: Router = Router();

exampleRouter.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    res.json({
      status: 'success',
      message: 'Example endpoint works!',
    });
  })
);
```

### 2. Register the Route
Edit `src/routes/index.ts`:
```typescript
import { Router } from 'express';
import { healthRouter } from './health.routes';
import { exampleRouter } from './example.routes'; // Add this

export const createRouter = (): Router => {
  const router = Router();
  
  router.use('/health', healthRouter);
  router.use('/example', exampleRouter); // Add this
  
  return router;
};
```

### 3. Test It
```bash
curl http://localhost:3000/api/example
```

## 🛠️ Project Structure
```
src/
├── config/          # Configuration (environment variables)
├── middleware/      # Express middleware
├── routes/          # API route handlers
├── utils/           # Utility functions
├── app.ts           # Express app setup
└── server.ts        # Server entry point
```

## 📚 Next Steps

- Read [README.md](README.md) for detailed documentation
- Read [ARCHITECTURE.md](ARCHITECTURE.md) for architecture details
- Start adding your API endpoints
- Implement your business logic

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Change port in .env
PORT=3001
```

### TypeScript Errors
```bash
# Check for type errors
pnpm typecheck
```

### Server Won't Start
1. Check `.env` file exists
2. Verify all dependencies installed: `pnpm install`
3. Check Node.js version: `node --version` (needs >= 18.0.0)

## 💡 Tips

1. **Auto-reload**: The dev server automatically reloads on file changes
2. **Type Safety**: Use TypeScript types for all your code
3. **Error Handling**: Wrap async routes with `asyncHandler`
4. **Environment**: Use `env` object from `config/env.ts` for all config
5. **Logging**: Logs are automatically generated for all requests

## 🎉 You're Ready!

Your production-ready Express server is now running. Start building your API endpoints!

