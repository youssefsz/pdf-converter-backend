/**
 * File Validation Middleware
 * 
 * Express middleware for validating uploaded files using magic bytes,
 * MIME type, and file extension verification.
 * 
 * This middleware should be used AFTER multer middleware to validate
 * file contents after they've been received.
 */

import { Request, Response, NextFunction } from 'express';
import { FileValidator, ValidationResult } from '../utils/fileValidator';

/**
 * Error class for file validation failures
 */
export class FileValidationError extends Error {
    public readonly statusCode: number;
    public readonly validationResult: ValidationResult;

    constructor(message: string, validationResult: ValidationResult) {
        super(message);
        this.name = 'FileValidationError';
        this.statusCode = 400;
        this.validationResult = validationResult;
    }
}

/**
 * Middleware to validate a single PDF file upload
 * 
 * Use after multer's upload.single() middleware.
 * Validates that the uploaded file is an authentic PDF.
 */
export const validatePdfUpload = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // Skip if no file uploaded (let route handler deal with it)
    if (!req.file) {
        next();
        return;
    }

    const { buffer, originalname, mimetype } = req.file;

    const result = FileValidator.validatePdf(buffer, originalname, mimetype);

    if (!result.isValid) {
        const errorMessage = FileValidator.formatValidationError(result);

        // Log security-relevant information
        console.warn('[SECURITY] PDF validation failed:', {
            filename: originalname,
            mimetype,
            detectedType: result.detectedType,
            fileSize: buffer.length,
            errors: result.errors,
            ip: req.ip,
            timestamp: new Date().toISOString(),
        });

        res.status(400).json({
            status: 'error',
            message: 'Invalid PDF file',
            details: errorMessage,
        });
        return;
    }

    // File is valid, proceed
    next();
};

/**
 * Middleware to validate multiple image file uploads
 * 
 * Use after multer's imageUpload.array() middleware.
 * Validates that all uploaded files are authentic PNG or JPEG images.
 */
export const validateImageUploads = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // Skip if no files uploaded (let route handler deal with it)
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        next();
        return;
    }

    const validationErrors: Array<{ filename: string; error: string }> = [];

    for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const { buffer, originalname, mimetype } = file;

        const result = FileValidator.validateImage(buffer, originalname, mimetype);

        if (!result.isValid) {
            validationErrors.push({
                filename: originalname,
                error: FileValidator.formatValidationError(result),
            });

            // Log security-relevant information
            console.warn('[SECURITY] Image validation failed:', {
                index: i + 1,
                filename: originalname,
                mimetype,
                detectedType: result.detectedType,
                fileSize: buffer.length,
                errors: result.errors,
                ip: req.ip,
                timestamp: new Date().toISOString(),
            });
        }
    }

    if (validationErrors.length > 0) {
        res.status(400).json({
            status: 'error',
            message: 'One or more images failed validation',
            invalidFiles: validationErrors,
        });
        return;
    }

    // All files are valid, proceed
    next();
};

/**
 * Middleware to validate a single Text file upload
 * 
 * Use after multer's textUpload.single() middleware.
 * Validates that the uploaded file is a valid text file.
 */
export const validateTextUpload = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // Skip if no file uploaded (let route handler deal with it)
    if (!req.file) {
        next();
        return;
    }

    const { buffer, originalname, mimetype } = req.file;

    const result = FileValidator.validateText(buffer, originalname, mimetype);

    if (!result.isValid) {
        const errorMessage = FileValidator.formatValidationError(result);

        // Log security-relevant information
        console.warn('[SECURITY] Text file validation failed:', {
            filename: originalname,
            mimetype,
            detectedType: result.detectedType,
            fileSize: buffer.length,
            errors: result.errors,
            ip: req.ip,
            timestamp: new Date().toISOString(),
        });

        res.status(400).json({
            status: 'error',
            message: 'Invalid text file',
            details: errorMessage,
        });
        return;
    }

    // File is valid, proceed
    next();
};

/**
 * Factory function to create custom file validation middleware
 * 
 * @param allowedTypes - Array of allowed file type keys (e.g., ['pdf', 'png'])
 * @param fieldType - 'single' for single file, 'array' for multiple files
 * @returns Express middleware function
 */
export const createFileValidationMiddleware = (
    allowedTypes: string[],
    fieldType: 'single' | 'array' = 'single'
) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (fieldType === 'single') {
            if (!req.file) {
                next();
                return;
            }

            const { buffer, originalname, mimetype } = req.file;
            const result = FileValidator.validateFile(buffer, originalname, mimetype, allowedTypes);

            if (!result.isValid) {
                console.warn('[SECURITY] File validation failed:', {
                    filename: originalname,
                    mimetype,
                    detectedType: result.detectedType,
                    errors: result.errors,
                    ip: req.ip,
                    timestamp: new Date().toISOString(),
                });

                res.status(400).json({
                    status: 'error',
                    message: 'Invalid file',
                    details: FileValidator.formatValidationError(result),
                });
                return;
            }
        } else {
            if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
                next();
                return;
            }

            const errors: Array<{ filename: string; error: string }> = [];

            for (const file of req.files) {
                const { buffer, originalname, mimetype } = file;
                const result = FileValidator.validateFile(buffer, originalname, mimetype, allowedTypes);

                if (!result.isValid) {
                    errors.push({
                        filename: originalname,
                        error: FileValidator.formatValidationError(result),
                    });

                    console.warn('[SECURITY] File validation failed:', {
                        filename: originalname,
                        mimetype,
                        detectedType: result.detectedType,
                        errors: result.errors,
                        ip: req.ip,
                        timestamp: new Date().toISOString(),
                    });
                }
            }

            if (errors.length > 0) {
                res.status(400).json({
                    status: 'error',
                    message: 'One or more files failed validation',
                    invalidFiles: errors,
                });
                return;
            }
        }

        next();
    };
};
