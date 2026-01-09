/**
 * PDF Routes
 * 
 * API endpoints for PDF conversion operations.
 */

import { Router, Request, Response, NextFunction } from 'express';
import archiver from 'archiver';
import { upload, imageUpload, getUploadErrorMessage } from '../config/upload';
import { pdfConverterService, PDFConverterService, ImageFormat } from '../services/pdfConverter.service';
import { imageToPdfService, ImageToPdfService } from '../services/imageToPdf.service';
import { pdfToDocxService, PdfToDocxService } from '../services/pdfToDocx.service';
import { asyncHandler } from '../utils/asyncHandler';
import { validatePdfUpload, validateImageUploads } from '../middleware/fileValidation';

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
  validatePdfUpload,
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
  validatePdfUpload,
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
 * POST /images-to-pdf
 * 
 * Convert multiple images (PNG/JPEG) to a single PDF document.
 * Each image becomes one page in the PDF, preserving original dimensions.
 * Images are processed in upload order.
 * 
 * Request Body (multipart/form-data):
 *   - images: Array of image files (PNG or JPEG)
 *   - Max 20 images per request
 *   - Max 10MB per image
 * 
 * Response:
 *   - PDF file for download
 */
pdfRouter.post(
  '/images-to-pdf',
  imageUpload.array('images', 20),
  validateImageUploads,
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    // Check if files were uploaded
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      res.status(400).json({
        status: 'error',
        message: 'No images uploaded. Please provide at least one image in the "images" field.',
      });
      return;
    }

    try {
      // Prepare image data for conversion
      const images = req.files.map(file => ({
        buffer: file.buffer,
        mimetype: file.mimetype,
        originalname: file.originalname,
      }));

      // Validate images
      ImageToPdfService.validateImages(images);

      // Convert images to PDF
      const pdfBuffer = await imageToPdfService.convertImagesToPdf(images);

      // Set response headers for PDF download
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const pdfFilename = `images-to-pdf-${timestamp}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${pdfFilename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      // Send the PDF buffer
      res.send(pdfBuffer);

    } catch (error) {
      // Pass error to error handler
      next(error);
    }
  })
);

/**
 * POST /pdf-to-docx
 * 
 * Convert a PDF file to DOCX (Microsoft Word) format.
 * Extracts text and images from the PDF and reconstructs them in a Word document.
 * 
 * Request Body (multipart/form-data):
 *   - pdf: PDF file to convert
 * 
 * Query Parameters (optional):
 *   - includeImages: Include images in DOCX (default: true)
 *   - preservePageBreaks: Add page breaks between PDF pages (default: true)
 * 
 * Response:
 *   - DOCX file for download
 */
pdfRouter.post(
  '/pdf-to-docx',
  upload.single('pdf'),
  validatePdfUpload,
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
      // Parse query parameters
      const includeImages = req.query.includeImages !== 'false'; // Default true
      const preservePageBreaks = req.query.preservePageBreaks !== 'false'; // Default true

      // Validate options
      const options = { includeImages, preservePageBreaks };
      PdfToDocxService.validateOptions(options);

      // Convert PDF to DOCX
      const docxBuffer = await pdfToDocxService.convertPdfToDocx(
        req.file.buffer,
        options
      );

      // Set response headers for DOCX download
      const originalFilename = req.file.originalname.replace(/\.pdf$/i, '');
      const docxFilename = `${originalFilename}.docx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${docxFilename}"`);
      res.setHeader('Content-Length', docxBuffer.length);

      // Send the DOCX buffer
      res.send(docxBuffer);

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
  if (err.name === 'MulterError' ||
    err.message === 'Only PDF files are allowed' ||
    err.message === 'Only PNG and JPEG images are allowed') {
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
      imagesToPdf: 'POST /images-to-pdf - Convert multiple images to a single PDF',
      pdfToDocx: 'POST /pdf-to-docx - Convert PDF to DOCX (Microsoft Word)',
    },
    supportedFormats: {
      pdfToImages: ['png', 'jpeg'],
      imagesToPdf: ['png', 'jpeg'],
      pdfToDocx: ['docx'],
    },
    maxFileSize: '10MB',
    maxImagesPerRequest: 20,
  });
});

