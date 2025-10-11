/**
 * File Upload Configuration
 * 
 * Configures Multer for handling PDF file uploads.
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
const fileFilter = (
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
 * Multer upload configuration
 */
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
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
    return `Upload error: ${error.message}`;
  }
  
  if (error.message === 'Only PDF files are allowed') {
    return error.message;
  }
  
  return 'An error occurred during file upload';
};

