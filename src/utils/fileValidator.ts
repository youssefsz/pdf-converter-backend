/**
 * File Validator Utility
 * 
 * Professional-grade file validation that verifies file authenticity using:
 * - Magic bytes (file signatures)
 * - MIME type validation
 * - File extension validation
 * 
 * This prevents malicious file uploads by verifying the actual file content
 * matches the claimed file type, protecting against MIME type spoofing attacks.
 */

/**
 * Supported file types with their validation rules
 */
export interface FileTypeDefinition {
    mimeTypes: string[];
    extensions: string[];
    magicBytes: MagicByteRule[];
    description: string;
}

/**
 * Magic byte validation rule
 */
export interface MagicByteRule {
    bytes: number[];
    offset?: number; // Default: 0
}

/**
 * Validation result
 */
export interface ValidationResult {
    isValid: boolean;
    detectedType: string | null;
    errors: string[];
}

/**
 * File type definitions with magic bytes signatures
 * Reference: https://en.wikipedia.org/wiki/List_of_file_signatures
 */
export const FILE_TYPE_DEFINITIONS: Record<string, FileTypeDefinition> = {
    pdf: {
        mimeTypes: ['application/pdf'],
        extensions: ['.pdf'],
        magicBytes: [
            { bytes: [0x25, 0x50, 0x44, 0x46, 0x2D] }, // %PDF-
        ],
        description: 'PDF Document',
    },
    png: {
        mimeTypes: ['image/png'],
        extensions: ['.png'],
        magicBytes: [
            { bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] }, // PNG signature
        ],
        description: 'PNG Image',
    },
    jpeg: {
        mimeTypes: ['image/jpeg', 'image/jpg'],
        extensions: ['.jpg', '.jpeg'],
        magicBytes: [
            { bytes: [0xFF, 0xD8, 0xFF, 0xE0] }, // JPEG JFIF
            { bytes: [0xFF, 0xD8, 0xFF, 0xE1] }, // JPEG Exif
            { bytes: [0xFF, 0xD8, 0xFF, 0xE2] }, // JPEG SPIFF
            { bytes: [0xFF, 0xD8, 0xFF, 0xE3] }, // JPEG SPIFF
            { bytes: [0xFF, 0xD8, 0xFF, 0xE8] }, // JPEG SPIFF
            { bytes: [0xFF, 0xD8, 0xFF, 0xDB] }, // JPEG RAW
            { bytes: [0xFF, 0xD8, 0xFF] },       // Generic JPEG (minimum)
        ],
        description: 'JPEG Image',
    },
};

/**
 * File Validator Class
 * 
 * Provides comprehensive file validation to prevent malicious uploads.
 */
export class FileValidator {
    /**
     * Check if buffer starts with specific magic bytes
     * 
     * @param buffer - File buffer to check
     * @param rule - Magic byte rule to match
     * @returns True if magic bytes match
     */
    private static matchesMagicBytes(buffer: Buffer, rule: MagicByteRule): boolean {
        const offset = rule.offset || 0;
        const requiredLength = offset + rule.bytes.length;

        if (buffer.length < requiredLength) {
            return false;
        }

        for (let i = 0; i < rule.bytes.length; i++) {
            if (buffer[offset + i] !== rule.bytes[i]) {
                return false;
            }
        }

        return true;
    }

    /**
     * Detect file type from buffer using magic bytes
     * 
     * @param buffer - File buffer to analyze
     * @returns Detected file type key or null
     */
    static detectFileType(buffer: Buffer): string | null {
        for (const [typeKey, definition] of Object.entries(FILE_TYPE_DEFINITIONS)) {
            for (const rule of definition.magicBytes) {
                if (this.matchesMagicBytes(buffer, rule)) {
                    return typeKey;
                }
            }
        }
        return null;
    }

    /**
     * Get file extension from filename (lowercase, with dot)
     * 
     * @param filename - Original filename
     * @returns File extension with dot (e.g., '.pdf')
     */
    static getExtension(filename: string): string {
        const lastDot = filename.lastIndexOf('.');
        if (lastDot === -1 || lastDot === filename.length - 1) {
            return '';
        }
        return filename.substring(lastDot).toLowerCase();
    }

    /**
     * Validate a text file
     * 
     * @param buffer - File buffer
     * @param filename - Original filename
     * @param mimeType - Claimed MIME type
     * @returns Validation result
     */
    static validateText(
        buffer: Buffer,
        filename: string,
        mimeType: string
    ): ValidationResult {
        const errors: string[] = [];

        // 1. Check MIME type
        if (mimeType !== 'text/plain') {
            errors.push(`Invalid MIME type: ${mimeType}. Expected: text/plain`);
        }

        // 2. Check extension
        const extension = this.getExtension(filename);
        if (extension !== '.txt') {
            errors.push(`Invalid file extension: ${extension}. Expected: .txt`);
        }

        // 3. Content check (Basic heuristic: check for null bytes)
        const checkLimit = Math.min(buffer.length, 1000);
        for (let i = 0; i < checkLimit; i++) {
            if (buffer[i] === 0) {
                errors.push('File appears to be binary (contains null bytes)');
                break;
            }
        }

        return {
            isValid: errors.length === 0,
            detectedType: errors.length === 0 ? 'text/plain' : null,
            errors,
        };
    }

    /**
     * Validate a PDF file
     * 
     * @param buffer - File buffer
     * @param filename - Original filename
     * @param mimeType - Claimed MIME type
     * @returns Validation result
     */
    static validatePdf(
        buffer: Buffer,
        filename: string,
        mimeType: string
    ): ValidationResult {
        return this.validateFile(buffer, filename, mimeType, ['pdf']);
    }

    /**
     * Validate an image file (PNG or JPEG)
     * 
     * @param buffer - File buffer
     * @param filename - Original filename
     * @param mimeType - Claimed MIME type
     * @returns Validation result
     */
    static validateImage(
        buffer: Buffer,
        filename: string,
        mimeType: string
    ): ValidationResult {
        return this.validateFile(buffer, filename, mimeType, ['png', 'jpeg']);
    }

    /**
     * Comprehensive file validation
     * 
     * Validates file against:
     * 1. Magic bytes (actual file content)
     * 2. MIME type (claimed content type)
     * 3. File extension (filename check)
     * 
     * @param buffer - File buffer
     * @param filename - Original filename
     * @param mimeType - Claimed MIME type
     * @param allowedTypes - Array of allowed type keys
     * @returns Validation result
     */
    static validateFile(
        buffer: Buffer,
        filename: string,
        mimeType: string,
        allowedTypes: string[]
    ): ValidationResult {
        const errors: string[] = [];
        let detectedType: string | null = null;

        // Validate buffer exists and has content
        if (!buffer || buffer.length === 0) {
            return {
                isValid: false,
                detectedType: null,
                errors: ['File is empty or invalid'],
            };
        }

        // Minimum file size check (at least 8 bytes for magic byte detection)
        if (buffer.length < 8) {
            return {
                isValid: false,
                detectedType: null,
                errors: ['File is too small to be valid'],
            };
        }

        // Step 1: Detect actual file type from magic bytes
        detectedType = this.detectFileType(buffer);

        if (!detectedType) {
            errors.push('Unable to determine file type from content. File may be corrupted or unsupported.');
        } else if (!allowedTypes.includes(detectedType)) {
            const allowedDescriptions = allowedTypes
                .map(t => FILE_TYPE_DEFINITIONS[t]?.description || t)
                .join(', ');
            errors.push(
                `File content is ${FILE_TYPE_DEFINITIONS[detectedType]?.description || detectedType}, ` +
                `but only ${allowedDescriptions} files are allowed`
            );
        }

        // Step 2: Validate MIME type matches allowed types
        const allowedMimeTypes = allowedTypes.flatMap(
            t => FILE_TYPE_DEFINITIONS[t]?.mimeTypes || []
        );

        if (!allowedMimeTypes.includes(mimeType.toLowerCase())) {
            errors.push(
                `Invalid MIME type: ${mimeType}. Allowed types: ${allowedMimeTypes.join(', ')}`
            );
        }

        // Step 3: Validate file extension
        const extension = this.getExtension(filename);
        const allowedExtensions = allowedTypes.flatMap(
            t => FILE_TYPE_DEFINITIONS[t]?.extensions || []
        );

        if (extension && !allowedExtensions.includes(extension)) {
            errors.push(
                `Invalid file extension: ${extension}. Allowed extensions: ${allowedExtensions.join(', ')}`
            );
        }

        // Step 4: Cross-validate - Ensure detected type matches claimed type
        if (detectedType && allowedTypes.includes(detectedType)) {
            const definition = FILE_TYPE_DEFINITIONS[detectedType];

            // Check if MIME type is consistent with detected type
            if (!definition.mimeTypes.includes(mimeType.toLowerCase())) {
                errors.push(
                    `MIME type mismatch: File content indicates ${definition.description}, ` +
                    `but MIME type is ${mimeType}`
                );
            }

            // Check if extension is consistent with detected type
            if (extension && !definition.extensions.includes(extension)) {
                errors.push(
                    `Extension mismatch: File content indicates ${definition.description}, ` +
                    `but extension is ${extension}`
                );
            }
        }

        return {
            isValid: errors.length === 0,
            detectedType,
            errors,
        };
    }

    /**
     * Create a user-friendly error message from validation result
     * 
     * @param result - Validation result
     * @returns Human-readable error message
     */
    static formatValidationError(result: ValidationResult): string {
        if (result.isValid) {
            return '';
        }

        if (result.errors.length === 1) {
            return result.errors[0];
        }

        return `File validation failed: ${result.errors.join('; ')}`;
    }
}

/**
 * Convenience functions for common validations
 */
export const validatePdfFile = FileValidator.validatePdf.bind(FileValidator);
export const validateImageFile = FileValidator.validateImage.bind(FileValidator);
export const detectFileType = FileValidator.detectFileType.bind(FileValidator);
