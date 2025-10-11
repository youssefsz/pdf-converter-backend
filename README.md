# PDF Converter API

A production-ready Express.js PDF conversion API built with TypeScript. Convert PDFs to images or extract text and images from PDF documents.

## 🛠️ Tech Stack

### Core Technologies
- **Runtime:** Node.js >= 18.0.0
- **Framework:** Express 5.1.0
- **Language:** TypeScript 5.9.3
- **Package Manager:** pnpm 10.18.2

### Key Libraries

**PDF Processing:**
- `pdfjs-dist` (5.4.296) - Mozilla's PDF parsing and rendering library
- `@napi-rs/canvas` (0.1.80) - High-performance canvas implementation for Node.js

**File Handling:**
- `multer` (2.0.2) - Multipart/form-data file upload middleware
- `archiver` (7.0.1) - ZIP file creation and streaming

**Security & Performance:**
- `helmet` (8.1.0) - Security HTTP headers
- `express-rate-limit` (8.1.0) - Rate limiting middleware
- `cors` (2.8.5) - Cross-Origin Resource Sharing
- `compression` (1.8.1) - Response compression (gzip/deflate)

**Configuration:**
- `dotenv` (17.2.3) - Environment variable management

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Installation

1. **Clone the repository** (if applicable)
```bash
git clone <repository-url>
cd pdf-converter
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Configure environment**
```bash
cp .env.example .env
```

Edit `.env` file as needed. Defaults work fine for development.

4. **Start the server**

**Development mode** (with hot reload):
```bash
pnpm dev
```

**Production mode:**
```bash
pnpm build
pnpm start:prod
```

Server will be running at `http://localhost:3000`

## 📝 Available Commands

```bash
pnpm dev          # Start development server with hot reload
pnpm build        # Compile TypeScript to JavaScript
pnpm start:prod   # Run production build
pnpm typecheck    # Type check without building
pnpm clean        # Remove build artifacts
```

## 🔐 Environment Configuration

Key environment variables in `.env`:

```env
# Server Configuration
NODE_ENV=development          # development | production | test
PORT=3000                     # Server port
HOST=0.0.0.0                 # Server host (0.0.0.0 for all interfaces)

# API Configuration
API_PREFIX=/api              # API route prefix

# CORS Configuration
CORS_ORIGIN=*                # Allowed origins (* for all, or comma-separated list)

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # Time window in ms (15 minutes)
RATE_LIMIT_MAX_REQUESTS=100  # Max requests per window per IP

# File Upload
MAX_FILE_SIZE=10485760       # Max upload size in bytes (10MB)
```

See `.env.example` for complete list of available configuration options.

## 📁 Project Structure

```
pdf-converter/
├── src/
│   ├── config/                    # Configuration files
│   │   ├── env.ts                # Environment variable validation
│   │   └── upload.ts             # File upload configuration (Multer)
│   │
│   ├── middleware/                # Express middleware
│   │   ├── errorHandler.ts      # Centralized error handling
│   │   ├── logging.ts           # Request/response logging
│   │   └── security.ts          # Security middleware (Helmet, CORS, Rate Limiting)
│   │
│   ├── routes/                    # API route handlers
│   │   ├── index.ts             # Main router
│   │   ├── health.routes.ts     # Health check endpoints
│   │   └── pdf.routes.ts        # PDF conversion endpoints
│   │
│   ├── services/                  # Business logic layer
│   │   └── pdfConverter.service.ts  # PDF processing service
│   │
│   ├── utils/                     # Utility functions
│   │   └── asyncHandler.ts      # Async error wrapper
│   │
│   ├── app.ts                     # Express application setup
│   └── server.ts                  # Server entry point & lifecycle
│
├── dist/                          # Compiled JavaScript (generated)
├── .env                          # Environment variables (not in git)
├── .env.example                  # Environment template
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
└── test-pdf-converter.html       # Web testing interface
```

## 🛡️ Security Features

- **Helmet:** Sets secure HTTP headers (CSP, HSTS, etc.)
- **CORS:** Configurable cross-origin resource sharing
- **Rate Limiting:** IP-based request throttling (100 req/15min default)
- **Input Validation:** File type and size validation
- **Error Sanitization:** No stack traces exposed in production
- **Memory Storage:** No temporary files written to disk

## 🎯 Features

### PDF to Images
- Convert any PDF to high-quality images
- Support for PNG and JPEG formats
- High resolution (2x scale factor)
- Returns ZIP archive with all pages

### Text & Image Extraction
- Extract text content from PDFs
- Extract embedded images with original quality
- Organized output structure
- Preserves image formats (JPEG, PNG)

### Performance
- In-memory processing (no disk I/O)
- Streaming ZIP responses
- Efficient for cloud deployments
- Handles multi-page PDFs efficiently

## 🚀 Deployment

This API is optimized for cloud platforms like Render.com, Railway, Vercel, and others.

### Build Command
```bash
pnpm install && pnpm build
```

### Start Command
```bash
pnpm start:prod
```

### Environment Setup
- Set `NODE_ENV=production`
- Configure `PORT` (usually provided by platform)
- Set `CORS_ORIGIN` to your frontend domain
- Adjust rate limits as needed

### Platform Compatibility
- ✅ **Render.com** - Fully compatible, no system dependencies
- ✅ **Railway** - Works out of the box
- ✅ **Heroku** - Compatible
- ✅ **Vercel** - Compatible (serverless)
- ✅ **AWS Lambda** - Compatible with adapter

## 🧪 Testing

### Web Interface
Open `test-pdf-converter.html` in your browser for a user-friendly testing interface with:
- Drag-and-drop file upload
- PDF to Images conversion
- Text & Image extraction
- Real-time progress tracking

### API Testing
See `API.md` for complete API documentation with cURL and JavaScript examples.

### Health Check
```bash
curl http://localhost:3000/api/health
```

## 🏗️ Architecture

### Middleware Chain
1. **Security** (Helmet, CORS, Rate Limiting)
2. **Parsing** (JSON, URL-encoded)
3. **Compression** (gzip/deflate)
4. **Logging** (Request/response)
5. **Routes** (API endpoints)
6. **Error Handling** (404 & error middleware)

### Error Handling
- Centralized error middleware
- Custom `AppError` class with status codes
- Async error wrapper for all route handlers
- Graceful shutdown on critical errors

### Type Safety
- Strict TypeScript configuration
- Full type coverage
- Type-safe environment variables
- Interface-driven development

## 📚 Documentation

- **API.md** - Complete API reference for frontend integration
- **.env.example** - Configuration template with descriptions
- **Inline Comments** - Code documentation

## 📄 License

ISC

## 👤 Author

Youssef Dhibi

---

**Need to integrate this API into your frontend?** Check out `API.md` for complete endpoint documentation with examples!
