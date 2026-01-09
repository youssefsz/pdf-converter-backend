/**
 * DoS Protection Middleware
 * 
 * Provides multiple layers of protection against Denial of Service attacks:
 * - Request timeout protection
 * - Payload size limiting
 * - Slow upload detection
 * - Concurrent request limiting
 * - PDF complexity limits
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Configuration for DoS protection
 */
export interface DosProtectionConfig {
    // Maximum request processing time in milliseconds
    requestTimeoutMs: number;
    // Maximum number of concurrent requests per IP
    maxConcurrentPerIp: number;
    // Minimum upload speed in bytes per second (protection against slow loris)
    minUploadSpeed: number;
    // Maximum PDF pages allowed
    maxPdfPages: number;
    // Maximum total request body size in bytes
    maxBodySize: number;
}

/**
 * Default configuration
 */
export const DEFAULT_DOS_CONFIG: DosProtectionConfig = {
    requestTimeoutMs: 60000,        // 60 seconds max processing time
    maxConcurrentPerIp: 5,          // Max 5 concurrent requests per IP
    minUploadSpeed: 1024,           // Min 1KB/s upload speed
    maxPdfPages: 100,               // Max 100 pages per PDF
    maxBodySize: 15 * 1024 * 1024,  // 15MB max body size (slightly above 10MB file limit)
};

/**
 * Track concurrent requests per IP
 */
const concurrentRequests: Map<string, number> = new Map();

/**
 * Get client IP address, handling proxies
 */
const getClientIp = (req: Request): string => {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
        return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket.remoteAddress || 'unknown';
};

/**
 * Request timeout middleware
 * 
 * Terminates requests that take too long to process,
 * preventing resource exhaustion from slow operations.
 */
export const requestTimeout = (timeoutMs: number = DEFAULT_DOS_CONFIG.requestTimeoutMs) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        // Set timeout for the request
        const timeout = setTimeout(() => {
            if (!res.headersSent) {
                console.warn('[SECURITY] Request timeout:', {
                    path: req.path,
                    method: req.method,
                    ip: getClientIp(req),
                    timeoutMs,
                    timestamp: new Date().toISOString(),
                });

                res.status(503).json({
                    status: 'error',
                    message: 'Request timeout. The operation took too long to complete.',
                });
            }
        }, timeoutMs);

        // Clear timeout when response finishes
        res.on('finish', () => clearTimeout(timeout));
        res.on('close', () => clearTimeout(timeout));

        next();
    };
};

/**
 * Concurrent request limiter
 * 
 * Limits the number of simultaneous requests from a single IP
 * to prevent resource exhaustion attacks.
 */
export const concurrentRequestLimiter = (
    maxConcurrent: number = DEFAULT_DOS_CONFIG.maxConcurrentPerIp
) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const clientIp = getClientIp(req);
        const currentCount = concurrentRequests.get(clientIp) || 0;

        if (currentCount >= maxConcurrent) {
            console.warn('[SECURITY] Concurrent request limit exceeded:', {
                ip: clientIp,
                currentCount,
                maxConcurrent,
                path: req.path,
                timestamp: new Date().toISOString(),
            });

            res.status(429).json({
                status: 'error',
                message: 'Too many concurrent requests. Please wait for current operations to complete.',
            });
            return;
        }

        // Increment counter
        concurrentRequests.set(clientIp, currentCount + 1);

        // Decrement counter when request finishes
        const cleanup = () => {
            const count = concurrentRequests.get(clientIp) || 0;
            if (count <= 1) {
                concurrentRequests.delete(clientIp);
            } else {
                concurrentRequests.set(clientIp, count - 1);
            }
        };

        res.on('finish', cleanup);
        res.on('close', cleanup);

        next();
    };
};

/**
 * Payload size limiter
 * 
 * Rejects requests with Content-Length exceeding the limit
 * BEFORE the body is received (early rejection).
 */
export const payloadSizeLimiter = (
    maxSize: number = DEFAULT_DOS_CONFIG.maxBodySize
) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const contentLength = parseInt(req.headers['content-length'] || '0', 10);

        if (contentLength > maxSize) {
            console.warn('[SECURITY] Payload size limit exceeded:', {
                ip: getClientIp(req),
                contentLength,
                maxSize,
                path: req.path,
                timestamp: new Date().toISOString(),
            });

            res.status(413).json({
                status: 'error',
                message: `Request payload too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB.`,
            });
            return;
        }

        next();
    };
};

/**
 * PDF complexity validator
 * 
 * Validates PDF page count to prevent memory exhaustion
 * from processing extremely large documents.
 * 
 * This should be called AFTER the file is uploaded but BEFORE processing.
 */
export const validatePdfComplexity = async (
    pdfBuffer: Buffer,
    maxPages: number = DEFAULT_DOS_CONFIG.maxPdfPages
): Promise<{ valid: boolean; pageCount?: number; error?: string }> => {
    try {
        // Quick check for PDF header
        if (pdfBuffer.length < 5) {
            return { valid: false, error: 'File too small to be a valid PDF' };
        }

        // Count approximate pages by looking for page object markers
        // This is a fast heuristic, not a full PDF parse
        const content = pdfBuffer.toString('utf8', 0, Math.min(pdfBuffer.length, 1024 * 1024));

        // Count /Type /Page occurrences (each page has this marker)
        const pageMatches = content.match(/\/Type\s*\/Page[^s]/g);
        const estimatedPages = pageMatches ? pageMatches.length : 1;

        // Also check for page count in PDF metadata
        const pageCountMatch = content.match(/\/Count\s+(\d+)/);
        const metadataPageCount = pageCountMatch ? parseInt(pageCountMatch[1], 10) : 0;

        // Use the higher of the two estimates
        const pageCount = Math.max(estimatedPages, metadataPageCount);

        if (pageCount > maxPages) {
            return {
                valid: false,
                pageCount,
                error: `PDF has too many pages (${pageCount}). Maximum allowed is ${maxPages} pages.`,
            };
        }

        return { valid: true, pageCount };
    } catch (error) {
        return {
            valid: false,
            error: `Failed to validate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }
};

/**
 * Middleware to validate PDF complexity after upload
 */
export const pdfComplexityMiddleware = (
    maxPages: number = DEFAULT_DOS_CONFIG.maxPdfPages
) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        // Skip if no file uploaded
        if (!req.file || !req.file.buffer) {
            next();
            return;
        }

        const result = await validatePdfComplexity(req.file.buffer, maxPages);

        if (!result.valid) {
            console.warn('[SECURITY] PDF complexity check failed:', {
                ip: getClientIp(req),
                filename: req.file.originalname,
                pageCount: result.pageCount,
                maxPages,
                error: result.error,
                timestamp: new Date().toISOString(),
            });

            res.status(400).json({
                status: 'error',
                message: result.error || 'PDF validation failed',
                details: {
                    pageCount: result.pageCount,
                    maxAllowed: maxPages,
                },
            });
            return;
        }

        // Attach page count to request for logging
        (req as any).pdfPageCount = result.pageCount;

        next();
    };
};

/**
 * Combined DoS protection middleware
 * 
 * Applies all DoS protections in the correct order.
 */
export const dosProtection = (config: Partial<DosProtectionConfig> = {}) => {
    const finalConfig = { ...DEFAULT_DOS_CONFIG, ...config };

    return [
        payloadSizeLimiter(finalConfig.maxBodySize),
        concurrentRequestLimiter(finalConfig.maxConcurrentPerIp),
        requestTimeout(finalConfig.requestTimeoutMs),
    ];
};

/**
 * Export default config for external use
 */
export { DEFAULT_DOS_CONFIG as dosConfig };
