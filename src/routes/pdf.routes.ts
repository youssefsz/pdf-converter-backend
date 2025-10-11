/**
 * PDF Routes
 * 
 * API endpoints for PDF conversion operations.
 */

import { Router, Request, Response, NextFunction } from 'express';
import archiver from 'archiver';
import { upload, getUploadErrorMessage } from '../config/upload';
import { pdfConverterService, PDFConverterService, ImageFormat } from '../services/pdfConverter.service';
import { asyncHandler } from '../utils/asyncHandler';

export const pdfRouter: Router = Router();

/**
 * POST /convert
 * 
 * Convert a PDF file to images and return as a ZIP archive.
 * 
 * Query Parameters:
 *   - format: Image format (png or jpeg), default: png
 * 
 * Request Body (multipart/form-data):
 *   - pdf: PDF file to convert
 * 
 * Response:
 *   - ZIP file containing all converted pages
 */
pdfRouter.post(
  '/convert',
  upload.single('pdf'),
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    // Check if file was uploaded
    if (!req.file) {
      res.status(400).json({
        status: 'error',
        message: 'No PDF file uploaded. Please provide a PDF file in the "pdf" field.',
      });
      return;
    }

    // Get and validate format parameter
    const formatParam = (req.query.format as string)?.toLowerCase() || 'png';
    
    if (!PDFConverterService.isValidFormat(formatParam)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid format. Supported formats: png, jpeg',
      });
      return;
    }

    const format: ImageFormat = formatParam;

    try {
      // Convert PDF to images
      const convertedPages = await pdfConverterService.convertPdfToImages(
        req.file.buffer,
        { format }
      );

      // Set response headers for ZIP download
      const originalFilename = req.file.originalname.replace(/\.pdf$/i, '');
      const zipFilename = `${originalFilename}_converted.zip`;
      
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);

      // Create ZIP archive
      const archive = archiver('zip', {
        zlib: { level: 9 }, // Maximum compression
      });

      // Handle archive errors
      archive.on('error', (err) => {
        throw err;
      });

      // Pipe archive to response
      archive.pipe(res);

      // Add each converted page to the archive
      for (const page of convertedPages) {
        archive.append(page.buffer, { name: page.filename });
      }

      // Finalize the archive
      await archive.finalize();

    } catch (error) {
      // Pass error to error handler
      next(error);
    }
  })
);

/**
 * POST /extract
 * 
 * Extract text and images from a PDF file and return as a ZIP archive.
 * The ZIP contains:
 * - page-{N}.txt: Text content for each page
 * - page-{N}-images/: Folder containing images from each page
 *   - page-{N}-image-{idx}.{format}: Individual images
 * 
 * Request Body (multipart/form-data):
 *   - pdf: PDF file to extract content from
 * 
 * Response:
 *   - ZIP file containing organized text files and image folders
 */
pdfRouter.post(
  '/extract',
  upload.single('pdf'),
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    // Check if file was uploaded
    if (!req.file) {
      res.status(400).json({
        status: 'error',
        message: 'No PDF file uploaded. Please provide a PDF file in the "pdf" field.',
      });
      return;
    }

    try {
      // Extract text and images from PDF
      const extractedContent = await pdfConverterService.extractPdfContent(
        req.file.buffer
      );

      // Set response headers for ZIP download
      const originalFilename = req.file.originalname.replace(/\.pdf$/i, '');
      const zipFilename = `${originalFilename}_extracted.zip`;
      
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);

      // Create ZIP archive
      const archive = archiver('zip', {
        zlib: { level: 9 }, // Maximum compression
      });

      // Handle archive errors
      archive.on('error', (err) => {
        throw err;
      });

      // Pipe archive to response
      archive.pipe(res);

      // Add content for each page
      for (const page of extractedContent) {
        const pageNum = page.pageNumber;
        
        // Add text file for the page
        archive.append(page.textContent, { 
          name: `page-${pageNum}.txt` 
        });

        // Add images if any exist for this page
        if (page.images.length > 0) {
          for (const image of page.images) {
            // Add images to page-specific folder
            archive.append(image.buffer, { 
              name: `page-${pageNum}-images/${image.filename}` 
            });
          }
        }
      }

      // Finalize the archive
      await archive.finalize();

    } catch (error) {
      // Pass error to error handler
      next(error);
    }
  })
);

/**
 * Error handler for multer errors
 * This middleware catches file upload errors
 */
pdfRouter.use((err: any, _req: Request, res: Response, next: NextFunction) => {
  // Check if it's a multer error
  if (err.name === 'MulterError' || err.message === 'Only PDF files are allowed') {
    res.status(400).json({
      status: 'error',
      message: getUploadErrorMessage(err),
    });
    return;
  }
  
  // Pass to global error handler
  next(err);
});

/**
 * GET /health
 * 
 * Health check endpoint for PDF conversion service
 */
pdfRouter.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'PDF conversion service is operational',
    endpoints: {
      convert: 'POST /convert - Convert PDF pages to images (png/jpeg)',
      extract: 'POST /extract - Extract text and images from PDF',
    },
    supportedFormats: ['png', 'jpeg'],
    maxFileSize: '10MB',
  });
});

