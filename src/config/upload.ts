/**
 * File Upload Configuration
 * 
 * Configures Multer for handling PDF and image file uploads.
 * Uses memory storage for compatibility with serverless/cloud platforms like Render.
 */

import multer from 'multer';
import { Request } from 'express';

/**
 * Maximum file size in bytes (10MB)
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Configure Multer storage
 * Using memory storage for serverless/cloud compatibility
 */
const storage = multer.memoryStorage();

/**
 * File filter to accept only PDF files
 */
const pdfFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  // Accept only PDF files
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'));
  }
};

/**
 * File filter to accept only image files (PNG and JPEG)
 */
const imageFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  // Accept only PNG and JPEG images
  if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg') {
    cb(null, true);
  } else {
    cb(new Error('Only PNG and JPEG images are allowed'));
  }
};

/**
 * Multer upload configuration for PDF files
 */
export const upload = multer({
  storage,
  fileFilter: pdfFileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

/**
 * Multer upload configuration for image files (PNG and JPEG)
 */
export const imageUpload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 20, // Maximum 20 images per request
  },
});

/**
 * Custom error messages for upload errors
 */
export const getUploadErrorMessage = (error: any): string => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return `File size exceeds the maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return 'Unexpected field in upload';
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return 'Maximum 20 images allowed per request';
    }
    return `Upload error: ${error.message}`;
  }
  
  if (error.message === 'Only PDF files are allowed') {
    return error.message;
  }
  
  if (error.message === 'Only PNG and JPEG images are allowed') {
    return error.message;
  }
  
  return 'An error occurred during file upload';
};

