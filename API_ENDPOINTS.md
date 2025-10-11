# PDF Converter API Endpoints

## Base URL
```
http://localhost:3000/api/pdf
```

## Endpoints

### 1. Health Check
**GET** `/health`

Check if the PDF service is operational.

**Response:**
```json
{
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

---

### 2. Convert PDF to Images
**POST** `/convert`

Convert all pages of a PDF to images (PNG or JPEG).

**Query Parameters:**
- `format` (optional): Output image format. Options: `png` (default), `jpeg`

**Request Body:**
- Content-Type: `multipart/form-data`
- Field: `pdf` (PDF file, max 10MB)

**Response:**
- ZIP file containing images: `page-1.png`, `page-2.png`, etc.

**Example:**
```bash
curl -X POST http://localhost:3000/api/pdf/convert?format=png \
  -F "pdf=@document.pdf" \
  --output converted.zip
```

---

### 3. Extract Text and Images from PDF
**POST** `/extract`

Extract text content and embedded images from a PDF file.

**Request Body:**
- Content-Type: `multipart/form-data`
- Field: `pdf` (PDF file, max 10MB)

**Response:**
- ZIP file with organized structure:
```
document_extracted.zip
├── page-1.txt              # Text from page 1
├── page-1-images/          # Images from page 1
│   ├── page-1-image-1.png
│   └── page-1-image-2.jpg
├── page-2.txt              # Text from page 2
├── page-2-images/          # Images from page 2
│   └── page-2-image-1.png
└── page-3.txt              # Text from page 3
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/pdf/extract \
  -F "pdf=@document.pdf" \
  --output extracted.zip
```

---

## Testing

### Using the Web Interface
Open `test-pdf-converter.html` in your browser for a user-friendly interface with:
- **Convert to Images** tab: Convert PDFs to PNG or JPEG images
- **Extract Content** tab: Extract text and images from PDFs

### Using cURL

**Convert to Images:**
```bash
# Convert to PNG (default)
curl -X POST http://localhost:3000/api/pdf/convert \
  -F "pdf=@sample.pdf" \
  --output converted.zip

# Convert to JPEG
curl -X POST http://localhost:3000/api/pdf/convert?format=jpeg \
  -F "pdf=@sample.pdf" \
  --output converted.zip
```

**Extract Content:**
```bash
curl -X POST http://localhost:3000/api/pdf/extract \
  -F "pdf=@sample.pdf" \
  --output extracted.zip
```

---

## Error Responses

**400 Bad Request:**
```json
{
  "status": "error",
  "message": "No PDF file uploaded. Please provide a PDF file in the 'pdf' field."
}
```

**400 Bad Request (Invalid Format):**
```json
{
  "status": "error",
  "message": "Invalid format. Supported formats: png, jpeg"
}
```

**500 Internal Server Error:**
```json
{
  "status": "error",
  "message": "PDF conversion failed: <error details>"
}
```

---

## Features

### Convert Endpoint
- ✅ Converts all PDF pages to images
- ✅ Supports PNG and JPEG formats
- ✅ High-quality rendering (2x scale by default)
- ✅ Returns ZIP archive with all pages

### Extract Endpoint
- ✅ Extracts text from all pages
- ✅ Extracts all embedded images
- ✅ Preserves original image format (JPEG, PNG)
- ✅ Organized folder structure per page
- ✅ Sequential image numbering

---

## Deployment

### Render.com
This service is optimized for Render.com deployment:
- ✅ In-memory processing (no disk I/O)
- ✅ Streaming responses for efficient memory usage
- ✅ Node.js 18+ compatible
- ✅ All dependencies included in `package.json`

### Environment Variables
No special environment variables required. The service uses defaults from `.env`:
- `PORT`: 3000 (default)
- `HOST`: 0.0.0.0
- `NODE_ENV`: production (on Render)

