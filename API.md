# PDF Converter API Documentation

Complete API reference for frontend integration. This API provides PDF conversion and content extraction endpoints.

## 📋 Base URL

```
http://localhost:3000/api
```

Replace with your production URL when deployed.

## 🔑 Authentication

Currently, no authentication is required. Rate limiting is applied per IP address (100 requests per 15 minutes by default).

---

## 📡 Endpoints

### 1. Health Check

Check if the server is running.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "success",
  "message": "Server is running",
  "timestamp": "2025-10-11T10:30:00.000Z",
  "uptime": 123.456,
  "environment": "development"
}
```

**Example (JavaScript/Fetch):**
```javascript
const response = await fetch('http://localhost:3000/api/health');
const data = await response.json();
console.log(data);
```

**Example (cURL):**
```bash
curl http://localhost:3000/api/health
```

---

### 2. PDF Service Health

Check if the PDF conversion service is operational and get service information.

**Endpoint:** `GET /pdf/health`

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

**Example (JavaScript/Fetch):**
```javascript
const response = await fetch('http://localhost:3000/api/pdf/health');
const data = await response.json();
console.log(data);
```

---

### 3. Convert PDF to Images

Convert all pages of a PDF document to images (PNG or JPEG format).

**Endpoint:** `POST /pdf/convert`

**Content-Type:** `multipart/form-data`

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `format` | string | No | `png` | Output image format: `png` or `jpeg` |

**Request Body:**
| Field | Type | Required | Max Size | Description |
|-------|------|----------|----------|-------------|
| `pdf` | File | Yes | 10MB | PDF file to convert |

**Response:** 
- **Content-Type:** `application/zip`
- **File:** ZIP archive containing images named `page-1.png`, `page-2.png`, etc.

**Success Status:** `200 OK`

**Error Responses:**
- `400 Bad Request` - No file uploaded or invalid format
- `413 Payload Too Large` - File exceeds 10MB
- `500 Internal Server Error` - Conversion failed

---

#### Frontend Integration Examples

**React with Axios:**
```javascript
import axios from 'axios';

const convertPdfToImages = async (pdfFile, format = 'png') => {
  const formData = new FormData();
  formData.append('pdf', pdfFile);

  try {
    const response = await axios.post(
      `http://localhost:3000/api/pdf/convert?format=${format}`,
      formData,
      {
        responseType: 'blob', // Important for binary data
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'converted.zip');
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return response.data;
  } catch (error) {
    console.error('Conversion failed:', error.response?.data || error.message);
    throw error;
  }
};

// Usage
const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (file) {
    await convertPdfToImages(file, 'png');
  }
};
```

**Vanilla JavaScript with Fetch:**
```javascript
async function convertPdfToImages(pdfFile, format = 'png') {
  const formData = new FormData();
  formData.append('pdf', pdfFile);

  try {
    const response = await fetch(
      `http://localhost:3000/api/pdf/convert?format=${format}`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Conversion failed');
    }

    // Get the ZIP file as blob
    const blob = await response.blob();
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted.zip';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    
    return blob;
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

// Usage with file input
document.getElementById('fileInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    await convertPdfToImages(file, 'png');
  }
});
```

**Vue.js 3 (Composition API):**
```javascript
import { ref } from 'vue';

export default {
  setup() {
    const isConverting = ref(false);
    const error = ref(null);

    const convertPdf = async (file, format = 'png') => {
      isConverting.value = true;
      error.value = null;

      const formData = new FormData();
      formData.append('pdf', file);

      try {
        const response = await fetch(
          `http://localhost:3000/api/pdf/convert?format=${format}`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message);
        }

        const blob = await response.blob();
        
        // Download file
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'converted.zip';
        a.click();
        URL.revokeObjectURL(url);
        
      } catch (err) {
        error.value = err.message;
        console.error('Conversion error:', err);
      } finally {
        isConverting.value = false;
      }
    };

    return { convertPdf, isConverting, error };
  }
};
```

**cURL (Command Line):**
```bash
# Convert to PNG (default)
curl -X POST "http://localhost:3000/api/pdf/convert?format=png" \
  -F "pdf=@document.pdf" \
  -o converted.zip

# Convert to JPEG
curl -X POST "http://localhost:3000/api/pdf/convert?format=jpeg" \
  -F "pdf=@document.pdf" \
  -o converted.zip
```

---

### 4. Convert Images to PDF

Convert multiple images (PNG/JPEG) into a single PDF document.

**Endpoint:** `POST /pdf/images-to-pdf`

**Content-Type:** `multipart/form-data`

**Request Body:**
| Field | Type | Required | Max Count | Max Size | Description |
|-------|------|----------|-----------|----------|-------------|
| `images` | File[] | Yes | 20 | 10MB each | Array of image files (PNG or JPEG) |

**Response:**
- **Content-Type:** `application/pdf`
- **File:** Single PDF document with each image as a separate page

**Success Status:** `200 OK`

**Error Responses:**
- `400 Bad Request` - No images uploaded, invalid format, or validation error
- `413 Payload Too Large` - File exceeds 10MB or too many files
- `500 Internal Server Error` - PDF creation failed

---

#### Frontend Integration Examples

**React with Axios:**
```javascript
import axios from 'axios';

const convertImagesToPdf = async (imageFiles) => {
  const formData = new FormData();
  
  // Append all images to the form data
  imageFiles.forEach((file) => {
    formData.append('images', file);
  });

  try {
    const response = await axios.post(
      'http://localhost:3000/api/pdf/images-to-pdf',
      formData,
      {
        responseType: 'blob', // Important for binary data
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`Upload Progress: ${percentCompleted}%`);
        },
      }
    );

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'converted.pdf');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return response.data;
  } catch (error) {
    console.error('Conversion failed:', error.response?.data || error.message);
    throw error;
  }
};

// Usage with multiple file input
const handleFileUpload = async (event) => {
  const files = Array.from(event.target.files);
  if (files.length > 0) {
    await convertImagesToPdf(files);
  }
};
```

**Vanilla JavaScript with Fetch:**
```javascript
async function convertImagesToPdf(imageFiles) {
  const formData = new FormData();
  
  // Append all images (order is preserved)
  imageFiles.forEach((file) => {
    formData.append('images', file);
  });

  try {
    const response = await fetch(
      'http://localhost:3000/api/pdf/images-to-pdf',
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Conversion failed');
    }

    // Get the PDF file as blob
    const blob = await response.blob();
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    
    return blob;
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

// Usage with file input (multiple)
document.getElementById('fileInput').addEventListener('change', async (e) => {
  const files = Array.from(e.target.files);
  if (files.length > 0) {
    await convertImagesToPdf(files);
  }
});
```

**Vue.js 3 (Composition API) with Drag & Drop and Reordering:**
```javascript
import { ref } from 'vue';

export default {
  setup() {
    const images = ref([]);
    const isConverting = ref(false);
    const error = ref(null);

    // Handle file selection
    const handleFileSelect = (event) => {
      const files = Array.from(event.target.files);
      images.value = files.map((file, index) => ({
        id: Date.now() + index,
        file,
        preview: URL.createObjectURL(file),
      }));
    };

    // Reorder images (for drag & drop)
    const reorderImages = (fromIndex, toIndex) => {
      const item = images.value.splice(fromIndex, 1)[0];
      images.value.splice(toIndex, 0, item);
    };

    // Remove image
    const removeImage = (index) => {
      URL.revokeObjectURL(images.value[index].preview);
      images.value.splice(index, 1);
    };

    // Convert to PDF
    const convertToPdf = async () => {
      if (images.value.length === 0) {
        error.value = 'Please select at least one image';
        return;
      }

      isConverting.value = true;
      error.value = null;

      const formData = new FormData();
      images.value.forEach((img) => {
        formData.append('images', img.file);
      });

      try {
        const response = await fetch(
          'http://localhost:3000/api/pdf/images-to-pdf',
          {
            method: 'POST',
            body: formData,
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message);
        }

        const blob = await response.blob();
        
        // Download file
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'converted.pdf';
        a.click();
        URL.revokeObjectURL(url);
        
      } catch (err) {
        error.value = err.message;
        console.error('Conversion error:', err);
      } finally {
        isConverting.value = false;
      }
    };

    return { 
      images, 
      isConverting, 
      error,
      handleFileSelect,
      reorderImages,
      removeImage,
      convertToPdf,
    };
  }
};
```

**React Component with Drag & Drop Reordering:**
```javascript
import React, { useState } from 'react';
import axios from 'axios';

const ImagesToPdfConverter = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate files
    const validFiles = files.filter(file => {
      if (!['image/png', 'image/jpeg'].includes(file.type)) {
        setError('Only PNG and JPEG images are allowed');
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('Each file must be less than 10MB');
        return false;
      }
      return true;
    });

    if (validFiles.length > 20) {
      setError('Maximum 20 images allowed');
      return;
    }

    setImages(validFiles.map((file, idx) => ({
      id: Date.now() + idx,
      file,
      preview: URL.createObjectURL(file),
    })));
    setError(null);
  };

  const removeImage = (id) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      const removed = prev.find(img => img.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      return filtered;
    });
  };

  const moveImage = (fromIndex, toIndex) => {
    setImages(prev => {
      const newImages = [...prev];
      const [moved] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, moved);
      return newImages;
    });
  };

  const handleConvert = async () => {
    if (images.length === 0) {
      setError('Please select at least one image');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    images.forEach(img => formData.append('images', img.file));

    try {
      const response = await axios.post(
        'http://localhost:3000/api/pdf/images-to-pdf',
        formData,
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'converted.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (err) {
      setError(err.response?.data?.message || 'Conversion failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Convert Images to PDF</h2>
      
      <input
        type="file"
        accept="image/png,image/jpeg"
        multiple
        onChange={handleFileChange}
        disabled={loading}
      />

      {error && <div className="error">{error}</div>}

      {images.length > 0 && (
        <div>
          <p>{images.length} image(s) selected. Drag to reorder:</p>
          <div className="image-list">
            {images.map((img, idx) => (
              <div key={img.id} className="image-item">
                <span>Page {idx + 1}</span>
                <img src={img.preview} alt={`Preview ${idx + 1}`} />
                <button onClick={() => removeImage(img.id)}>Remove</button>
                {idx > 0 && (
                  <button onClick={() => moveImage(idx, idx - 1)}>↑</button>
                )}
                {idx < images.length - 1 && (
                  <button onClick={() => moveImage(idx, idx + 1)}>↓</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleConvert}
        disabled={images.length === 0 || loading}
      >
        {loading ? 'Converting...' : 'Convert to PDF'}
      </button>
    </div>
  );
};

export default ImagesToPdfConverter;
```

**cURL (Command Line):**
```bash
# Convert multiple images to PDF
curl -X POST "http://localhost:3000/api/pdf/images-to-pdf" \
  -F "images=@image1.png" \
  -F "images=@image2.jpg" \
  -F "images=@image3.png" \
  -o converted.pdf

# Note: Images are processed in the order they appear in the command
```

---

### 5. Convert PDF to DOCX

Convert a PDF document to DOCX (Microsoft Word) format. Extracts text and images from the PDF and reconstructs them in a Word document.

**Endpoint:** `POST /pdf/pdf-to-docx`

**Content-Type:** `multipart/form-data`

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `includeImages` | boolean | No | `true` | Include images from PDF in DOCX |
| `preservePageBreaks` | boolean | No | `true` | Add page breaks between PDF pages |

**Request Body:**
| Field | Type | Required | Max Size | Description |
|-------|------|----------|----------|-------------|
| `pdf` | File | Yes | 10MB | PDF file to convert |

**Response:**
- **Content-Type:** `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- **File:** DOCX file with extracted content

**Success Status:** `200 OK`

**Error Responses:**
- `400 Bad Request` - No PDF uploaded or invalid file
- `413 Payload Too Large` - File exceeds 10MB
- `500 Internal Server Error` - Conversion failed

**Limitations:**
- Complex layouts may be simplified
- Tables are extracted as text (not structured tables)
- Font styles may not be preserved exactly
- Best suited for text-focused documents with basic formatting

---

#### Frontend Integration Examples

**React with Axios:**
```javascript
import axios from 'axios';

const convertPdfToDocx = async (pdfFile, options = {}) => {
  const formData = new FormData();
  formData.append('pdf', pdfFile);

  const { includeImages = true, preservePageBreaks = true } = options;

  try {
    const response = await axios.post(
      'http://localhost:3000/api/pdf/pdf-to-docx',
      formData,
      {
        params: {
          includeImages,
          preservePageBreaks,
        },
        responseType: 'blob',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`Upload Progress: ${percentCompleted}%`);
        },
      }
    );

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    const filename = pdfFile.name.replace(/\.pdf$/i, '.docx');
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return response.data;
  } catch (error) {
    console.error('Conversion failed:', error.response?.data || error.message);
    throw error;
  }
};

// Usage
const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (file && file.type === 'application/pdf') {
    await convertPdfToDocx(file, {
      includeImages: true,
      preservePageBreaks: true,
    });
  }
};
```

**Vanilla JavaScript with Fetch:**
```javascript
async function convertPdfToDocx(pdfFile, options = {}) {
  const formData = new FormData();
  formData.append('pdf', pdfFile);

  const { includeImages = true, preservePageBreaks = true } = options;
  const queryParams = new URLSearchParams({
    includeImages: includeImages.toString(),
    preservePageBreaks: preservePageBreaks.toString(),
  });

  try {
    const response = await fetch(
      `http://localhost:3000/api/pdf/pdf-to-docx?${queryParams}`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Conversion failed');
    }

    // Get the DOCX file as blob
    const blob = await response.blob();
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = pdfFile.name.replace(/\.pdf$/i, '.docx');
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    
    return blob;
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

// Usage with file input
document.getElementById('pdfInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    await convertPdfToDocx(file, {
      includeImages: true,
      preservePageBreaks: false, // Single document without page breaks
    });
  }
});
```

**cURL Examples:**
```bash
# Basic conversion (with all defaults)
curl -X POST http://localhost:3000/api/pdf/pdf-to-docx \
  -F "pdf=@document.pdf" \
  -o document.docx

# Without images
curl -X POST "http://localhost:3000/api/pdf/pdf-to-docx?includeImages=false" \
  -F "pdf=@document.pdf" \
  -o document.docx

# Without page breaks (continuous document)
curl -X POST "http://localhost:3000/api/pdf/pdf-to-docx?preservePageBreaks=false" \
  -F "pdf=@document.pdf" \
  -o document.docx

# Custom options
curl -X POST "http://localhost:3000/api/pdf/pdf-to-docx?includeImages=true&preservePageBreaks=true" \
  -F "pdf=@document.pdf" \
  -o document.docx
```

---

### 6. Extract Text and Images

Extract text content and embedded images from a PDF document.

**Endpoint:** `POST /pdf/extract`

**Content-Type:** `multipart/form-data`

**Request Body:**
| Field | Type | Required | Max Size | Description |
|-------|------|----------|----------|-------------|
| `pdf` | File | Yes | 10MB | PDF file to extract from |

**Response:**
- **Content-Type:** `application/zip`
- **File:** ZIP archive with organized structure:

```
document_extracted.zip
├── page-1.txt                    # Text content from page 1
├── page-1-images/                # Folder for images from page 1
│   ├── page-1-image-1.png       # First image from page 1
│   └── page-1-image-2.jpg       # Second image from page 1
├── page-2.txt                    # Text content from page 2
├── page-2-images/                # Folder for images from page 2
│   └── page-2-image-1.png       # First image from page 2
└── page-3.txt                    # Text content from page 3 (no images)
```

**Success Status:** `200 OK`

**Error Responses:**
- `400 Bad Request` - No file uploaded
- `413 Payload Too Large` - File exceeds 10MB
- `500 Internal Server Error` - Extraction failed

---

#### Frontend Integration Examples

**React with Axios:**
```javascript
import axios from 'axios';

const extractPdfContent = async (pdfFile) => {
  const formData = new FormData();
  formData.append('pdf', pdfFile);

  try {
    const response = await axios.post(
      'http://localhost:3000/api/pdf/extract',
      formData,
      {
        responseType: 'blob',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`Upload Progress: ${percentCompleted}%`);
        },
      }
    );

    // Download the ZIP file
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'extracted_content.zip');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return response.data;
  } catch (error) {
    console.error('Extraction failed:', error.response?.data || error.message);
    throw error;
  }
};

// Usage
const handleExtract = async (event) => {
  const file = event.target.files[0];
  if (file) {
    await extractPdfContent(file);
  }
};
```

**Vanilla JavaScript with Fetch:**
```javascript
async function extractPdfContent(pdfFile) {
  const formData = new FormData();
  formData.append('pdf', pdfFile);

  try {
    const response = await fetch('http://localhost:3000/api/pdf/extract', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Extraction failed');
    }

    const blob = await response.blob();
    
    // Trigger download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'extracted_content.zip';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    
    return blob;
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}
```

**cURL (Command Line):**
```bash
curl -X POST "http://localhost:3000/api/pdf/extract" \
  -F "pdf=@document.pdf" \
  -o extracted_content.zip
```

---

## 🚨 Error Handling

All endpoints return consistent error responses in JSON format:

```json
{
  "status": "error",
  "message": "Descriptive error message",
  "statusCode": 400
}
```

### Common Error Codes

| Status Code | Meaning | Common Causes |
|-------------|---------|---------------|
| `400` | Bad Request | Missing file, invalid format, invalid parameters |
| `413` | Payload Too Large | File exceeds 10MB limit |
| `429` | Too Many Requests | Rate limit exceeded (100 req/15min) |
| `500` | Internal Server Error | PDF processing failed, server error |

### Frontend Error Handling Example

```javascript
async function handlePdfOperation(file) {
  try {
    const response = await fetch('http://localhost:3000/api/pdf/convert', {
      method: 'POST',
      body: formData,
    });

    // Handle non-OK responses
    if (!response.ok) {
      const errorData = await response.json();
      
      switch (response.status) {
        case 400:
          alert(`Invalid request: ${errorData.message}`);
          break;
        case 413:
          alert('File is too large. Maximum size is 10MB.');
          break;
        case 429:
          alert('Too many requests. Please try again later.');
          break;
        case 500:
          alert(`Server error: ${errorData.message}`);
          break;
        default:
          alert(`Error: ${errorData.message}`);
      }
      
      throw new Error(errorData.message);
    }

    return await response.blob();
  } catch (error) {
    console.error('Operation failed:', error);
    throw error;
  }
}
```

---

### 7. Convert Text to PDF

Convert a plain text file (`.txt`) to a PDF document.

**Endpoint:** `POST /pdf/text-to-pdf`

**Content-Type:** `multipart/form-data`

**Request Body:**
| Field | Type | Required | Max Size | Description |
|-------|------|----------|----------|-------------|
| `text` | File | Yes | 10MB | Text file (`.txt`) to convert |

**Response:**
- **Content-Type:** `application/pdf`
- **File:** Binary PDF file

**Success Status:** `200 OK`

**Error Responses:**
- `400 Bad Request` - No file uploaded, invalid format (must be .txt)
- `413 Payload Too Large` - File exceeds 10MB
- `500 Internal Server Error` - PDF creation failed

---

## 📊 Rate Limiting

- **Limit:** 100 requests per 15 minutes per IP address
- **Headers:** Rate limit info is included in response headers:
  - `X-RateLimit-Limit` - Maximum requests allowed
  - `X-RateLimit-Remaining` - Requests remaining
  - `X-RateLimit-Reset` - Time when limit resets

**Example Response Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1697012345678
```

---

## 🔐 CORS Configuration

By default, CORS is configured to allow all origins (`*`). For production, configure specific origins in the `.env` file:

```env
CORS_ORIGIN=https://your-frontend-domain.com
```

Multiple origins:
```env
CORS_ORIGIN=https://app.example.com,https://admin.example.com
```

---

## 📝 File Size Limits

- **Maximum file size:** 10MB
- **Supported file type:** PDF only (`.pdf`)
- **MIME type validation:** `application/pdf`

---

## 🎯 Complete React Component Example

Here's a complete React component with both conversion and extraction:

```javascript
import React, { useState } from 'react';
import axios from 'axios';

const PdfConverter = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  const API_BASE_URL = 'http://localhost:3000/api';

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (selectedFile) {
      // Validate file type
      if (selectedFile.type !== 'application/pdf') {
        setError('Please select a PDF file');
        return;
      }
      
      // Validate file size (10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleConvert = async (format = 'png') => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);
    setProgress(0);

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/pdf/convert?format=${format}`,
        formData,
        {
          responseType: 'blob',
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProgress(percentCompleted);
          },
        }
      );

      // Download the result
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `converted_${format}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (err) {
      setError(err.response?.data?.message || 'Conversion failed');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const handleExtract = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);
    setProgress(0);

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/pdf/extract`,
        formData,
        {
          responseType: 'blob',
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProgress(percentCompleted);
          },
        }
      );

      // Download the result
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'extracted_content.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (err) {
      setError(err.response?.data?.message || 'Extraction failed');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="pdf-converter">
      <h2>PDF Converter</h2>
      
      <input
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
        disabled={loading}
      />

      {file && <p>Selected: {file.name}</p>}

      {error && <div className="error">{error}</div>}

      {loading && (
        <div className="progress">
          <div className="progress-bar" style={{ width: `${progress}%` }}>
            {progress}%
          </div>
        </div>
      )}

      <div className="actions">
        <button
          onClick={() => handleConvert('png')}
          disabled={!file || loading}
        >
          Convert to PNG
        </button>
        
        <button
          onClick={() => handleConvert('jpeg')}
          disabled={!file || loading}
        >
          Convert to JPEG
        </button>
        
        <button
          onClick={handleExtract}
          disabled={!file || loading}
        >
          Extract Content
        </button>
      </div>
    </div>
  );
};

export default PdfConverter;
```

---

## 🌐 Production Deployment

When deploying to production:

1. **Update API Base URL:**
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://your-api-domain.com/api';
```

2. **Configure CORS on server** with your frontend domain

3. **Handle HTTPS** - Ensure your API uses HTTPS in production

4. **Environment Variables:**
```bash
# .env.production
REACT_APP_API_URL=https://your-api-domain.com/api
```

---

## 💡 Tips & Best Practices

1. **Always validate files on the frontend** before uploading (file type, size)
2. **Show upload progress** to improve user experience
3. **Handle errors gracefully** with user-friendly messages
4. **Implement retry logic** for failed requests
5. **Consider chunked uploads** for very large files
6. **Cache health check results** to reduce unnecessary requests
7. **Use loading states** to prevent duplicate requests

---

## Support

For issues or questions, refer to the main `README.md` or contact the development team.

