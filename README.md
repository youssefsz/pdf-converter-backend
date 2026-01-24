# PDF Converter API

A production-ready Express.js PDF conversion API built with TypeScript. The API supports converting PDFs to images, converting PDFs to DOCX (Word), extracting text and images from PDFs, and generating PDFs from images.

---

## Technology Stack

### Core Technologies

Node.js version 18.0.0 or higher is required as the runtime environment.  
The API is built using Express version 5.1.0 and written in TypeScript version 5.9.3.  
Package management is handled using pnpm version 10.18.2.

### Key Libraries

#### PDF Processing

The API uses `pdfjs-dist` for PDF parsing and rendering, `pdf-lib` for PDF creation and manipulation, and `docx` for generating Microsoft Word documents. Rendering and image generation are handled by `@napi-rs/canvas`, providing a high-performance canvas implementation for Node.js.

#### File Handling

File uploads are managed using `multer`, while ZIP archives are generated and streamed using `archiver`.

#### Security and Performance

Security headers are applied using `helmet`.  
Request rate limiting is enforced using `express-rate-limit`.  
Cross-origin requests are handled with `cors`.  
Response compression is enabled through `compression` to improve performance.

#### Configuration

Environment variables are managed using `dotenv`.

---

## Getting Started

### Prerequisites

Node.js version 18.0.0 or higher is required.  
pnpm version 8.0.0 or higher is recommended.

### Installation

1. Clone the repository and navigate into the project directory.
2. Install dependencies using pnpm.
3. Copy the environment configuration template and adjust values if needed.
4. Start the server in either development or production mode.

In development mode, the server runs with hot reload enabled.  
In production mode, the project must first be built before starting the server.

The API will be available at `http://localhost:3000`.

---

## Available Commands

The following commands are available:

- `pnpm dev` starts the development server with hot reload  
- `pnpm build` compiles TypeScript to JavaScript  
- `pnpm start:prod` runs the production build  
- `pnpm typecheck` performs type checking without building  
- `pnpm clean` removes build artifacts  

---

## Environment Configuration

Environment variables are defined in the `.env` file. Key configuration options include server environment, port, host, API prefix, CORS configuration, rate limiting parameters, and maximum file upload size.

Defaults are suitable for development. The `.env.example` file contains the full list of supported variables with descriptions.

---

## Project Structure

The project is organized into configuration files, middleware, routes, services, utilities, and application bootstrap files. Business logic is separated into service classes, while middleware handles security, logging, and error management. The compiled output is generated in the `dist` directory.

A browser-based testing interface is included for manual testing and validation.

---

## Security Features

The API applies secure HTTP headers, configurable CORS policies, and IP-based rate limiting.  
Uploaded files are validated for type and size.  
Errors are sanitized in production to avoid exposing stack traces.  
All file processing is performed in memory, with no temporary files written to disk.

---

## Features

### PDF to Images

PDF documents can be converted into high-quality PNG or JPEG images. Each page is rendered at high resolution and returned as a ZIP archive containing all generated images.

### PDF to DOCX

PDF files can be converted into Microsoft Word documents. Text content is extracted and formatted appropriately, and embedded images are included. Optional page breaks may be added between pages. The implementation is fully based on Node.js with no system-level dependencies, making it compatible with most cloud platforms.

### Images to PDF

Multiple images can be combined into a single PDF document. Each image is placed on its own page using its original dimensions. Upload order is preserved, and up to 20 images are supported per request.

### Text and Image Extraction

The API can extract raw text and embedded images from PDF documents. Images are preserved in their original format and returned in an organized structure.

### Performance

All processing is performed in memory, eliminating disk I/O overhead. ZIP responses are streamed efficiently, and the API is optimized for cloud environments and multi-page documents.

---

## Deployment

The API is designed for deployment on modern cloud platforms.

### Build Command

`pnpm install && pnpm build`

### Start Command

`pnpm start:prod`

### Production Environment

In production, the environment should be configured with `NODE_ENV=production`.  
The server port should be provided by the hosting platform.  
CORS origins should be restricted to trusted frontend domains.  
Rate limits may be adjusted based on expected traffic.

### Platform Compatibility

The API is compatible with Render, Railway, Heroku, Vercel, and AWS Lambda environments.

---

## Testing

A web-based testing interface is provided in `test-pdf-converter.html`, allowing drag-and-drop uploads and real-time conversion testing.

API-level testing can be performed using cURL or JavaScript examples provided in `API.md`.

A health check endpoint is available at `/api/health`.

---

## Architecture

### Middleware Flow

Requests pass through security middleware, request parsing, compression, logging, routing, and centralized error handling.

### Error Handling

The API uses centralized error middleware and a custom error class to standardize responses. All asynchronous route handlers are wrapped to ensure consistent error propagation. The server shuts down gracefully on critical failures.

### Type Safety

Strict TypeScript settings are enabled across the project. Environment variables are validated and strongly typed, ensuring reliability and maintainability.

---

## Documentation

Comprehensive API documentation is available in `API.md`.  
Configuration options are documented in `.env.example`.  
Inline comments are included throughout the codebase.

---

## License

ISC

---

## Author

Youssef Dhibi
