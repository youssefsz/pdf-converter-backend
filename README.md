# PDF Converter API

A production-ready Express.js server built with TypeScript, following best practices for security, performance, and maintainability.

## 🚀 Features

- **TypeScript** - Full type safety and modern JavaScript features
- **Express 5.x** - Latest version with improved performance and features
- **PDF Conversion** - Convert PDF files to images (PNG/JPEG) with ZIP output
- **Content Extraction** - Extract text and images from PDFs with organized structure
- **Security First** - Helmet, CORS, rate limiting, and input validation
- **File Upload** - Secure file handling with Multer and validation
- **Error Handling** - Centralized error handling with async support
- **Environment Configuration** - Type-safe environment variable management
- **Logging** - Request logging with detailed information
- **Production Ready** - Graceful shutdown, compression, and optimization
- **Clean Architecture** - Modular structure for easy scaling
- **Cloud-Friendly** - No system dependencies, perfect for Render.com deployment

## 📋 Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

## 🔧 Installation

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env
```

## 🎯 Usage

### Development

```bash
# Run in development mode with hot reload
pnpm dev
```

### Production

```bash
# Build the project
pnpm build

# Run in production mode
pnpm start:prod
```

### Other Commands

```bash
# Type checking
pnpm typecheck

# Clean build directory
pnpm clean

# Build without cleaning
pnpm build
```

## 📁 Project Structure

```
pdf-converter/
├── src/
│   ├── config/           # Configuration files
│   │   ├── env.ts        # Environment variable management
│   │   └── upload.ts     # File upload configuration
│   ├── middleware/       # Express middleware
│   │   ├── errorHandler.ts
│   │   ├── logging.ts
│   │   └── security.ts
│   ├── routes/           # API routes
│   │   ├── index.ts
│   │   ├── health.routes.ts
│   │   └── pdf.routes.ts # PDF conversion endpoints
│   ├── services/         # Business logic
│   │   └── pdfConverter.service.ts
│   ├── utils/            # Utility functions
│   │   └── asyncHandler.ts
│   ├── app.ts            # Express app configuration
│   └── server.ts         # Server entry point
├── dist/                 # Compiled JavaScript (generated)
├── .env                  # Environment variables (not in git)
├── .env.example          # Environment variables template
├── tsconfig.json         # TypeScript configuration
└── package.json          # Project dependencies and scripts
```

## 🔐 Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `NODE_ENV` - Environment (development/production/test)
- `PORT` - Server port (default: 3000)
- `HOST` - Server host (default: 0.0.0.0)
- `API_PREFIX` - API route prefix (default: /api)
- `CORS_ORIGIN` - Allowed CORS origins
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window per IP

## 📡 API Endpoints

### Root Endpoint
```
GET /
Response: { "status": "success", "message": "Youssef Dhibi", "timestamp": "..." }
```

### Health Check
```
GET /api/health
Response: { "status": "success", "message": "Server is running", ... }
```

### Server Information
```
GET /api/health/info
Response: { "status": "success", "data": { "name": "Youssef Dhibi", ... } }
```

### PDF Conversion

#### Convert PDF to Images
```
POST /api/pdf/convert?format=png
Content-Type: multipart/form-data
Body: pdf file (max 10MB)

Response: ZIP file containing all pages as images

Query Parameters:
- format: Image format (png or jpeg), default: png
```

**Example with cURL:**
```bash
curl -X POST "http://localhost:3000/api/pdf/convert?format=png" \
  -F "pdf=@document.pdf" \
  -o output.zip
```

**Example with JavaScript/Fetch:**
```javascript
const formData = new FormData();
formData.append('pdf', pdfFile);

const response = await fetch('http://localhost:3000/api/pdf/convert?format=png', {
  method: 'POST',
  body: formData
});

const blob = await response.blob();
// Save or process the ZIP file
```

#### Extract Text and Images from PDF
```
POST /api/pdf/extract
Content-Type: multipart/form-data
Body: pdf file (max 10MB)

Response: ZIP file containing:
- page-{N}.txt: Text content for each page
- page-{N}-images/: Folder with images from each page
  - page-{N}-image-{idx}.{format}: Individual images
```

**Example with cURL:**
```bash
curl -X POST "http://localhost:3000/api/pdf/extract" \
  -F "pdf=@document.pdf" \
  -o extracted.zip
```

**Output Structure:**
```
document_extracted.zip
├── page-1.txt
├── page-1-images/
│   ├── page-1-image-1.png
│   └── page-1-image-2.jpg
├── page-2.txt
└── page-2-images/
    └── page-2-image-1.png
```

#### PDF Service Health Check
```
GET /api/pdf/health
Response: { 
  "status": "success", 
  "message": "PDF conversion service is operational",
  "endpoints": {
    "convert": "POST /convert - Convert PDF pages to images (png/jpeg)",
    "extract": "POST /extract - Extract text and images from PDF"
  },
  "supportedFormats": ["png", "jpeg"],
  "maxFileSize": "10MB"
}
```

## 🛡️ Security Features

- **Helmet** - Sets secure HTTP headers
- **CORS** - Configurable cross-origin resource sharing
- **Rate Limiting** - Prevents abuse with IP-based limits
- **Input Validation** - JSON and URL-encoded body parsing with size limits
- **Error Sanitization** - Production errors don't leak stack traces

## 🚦 Error Handling

The server includes comprehensive error handling:
- Async error wrapper for route handlers
- Centralized error middleware
- Custom error classes with status codes
- Graceful shutdown on uncaught exceptions
- Unhandled rejection handling

## 📊 Logging

- Request logging with method, path, duration, and status
- Development mode includes additional verbose logging
- Structured JSON logs for production parsing
- Error logging with stack traces in development

## 🔄 Graceful Shutdown

The server handles SIGTERM and SIGINT signals gracefully:
- Closes server connections
- Waits for ongoing requests to complete
- Forces shutdown after 30 seconds timeout
- Cleans up resources properly

## 🎨 Best Practices

- ✅ TypeScript strict mode enabled
- ✅ Environment variable validation
- ✅ Async/await error handling
- ✅ Middleware separation of concerns
- ✅ Clean code architecture
- ✅ Production-ready configuration
- ✅ Security headers and CORS
- ✅ Request compression
- ✅ Rate limiting

## 📝 Adding New Endpoints

1. Create a new route file in `src/routes/`
2. Import and use `asyncHandler` for async routes
3. Register the route in `src/routes/index.ts`
4. Use the `AppError` class for throwing errors

Example:

```typescript
// src/routes/users.routes.ts
import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../middleware/errorHandler';

export const userRouter = Router();

userRouter.get('/', asyncHandler(async (req, res) => {
  const users = await fetchUsers();
  res.json({ status: 'success', data: users });
}));
```

## 🤝 Contributing

1. Follow the existing code structure
2. Use TypeScript strict types
3. Handle errors properly with asyncHandler
4. Update documentation for new features

## 📄 License

ISC

## 👤 Author

Youssef Dhibi

