/**
 * Image to PDF Converter Service
 * 
 * Handles conversion of multiple images (PNG/JPEG) to a single PDF document.
 * Each image becomes one page in the PDF, preserving original dimensions.
 */

import { PDFDocument } from 'pdf-lib';

/**
 * Supported image formats
 */
export type SupportedImageFormat = 'image/png' | 'image/jpeg';

/**
 * Image data with metadata
 */
export interface ImageData {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

/**
 * Options for PDF conversion
 */
export interface ConversionOptions {
  filename?: string;
}

/**
 * Image to PDF Converter Service Class
 */
export class ImageToPdfService {
  /**
   * Convert multiple images to a single PDF document
   * 
   * @param images - Array of image buffers with metadata (in upload order)
   * @param options - Conversion options
   * @returns PDF document buffer
   */
  async convertImagesToPdf(
    images: ImageData[],
    _options?: ConversionOptions
  ): Promise<Buffer> {
    if (!images || images.length === 0) {
      throw new Error('At least one image is required');
    }

    try {
      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();

      // Process each image in order
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        
        try {
          await this.addImageToPdf(pdfDoc, image, i + 1);
        } catch (error) {
          throw new Error(
            `Failed to process image ${i + 1} (${image.originalname}): ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          );
        }
      }

      // Save the PDF to bytes
      const pdfBytes = await pdfDoc.save();
      
      return Buffer.from(pdfBytes);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Failed to process image')) {
        throw error;
      }
      throw new Error(
        `PDF creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Add a single image as a page to the PDF document
   * 
   * @param pdfDoc - PDF document instance
   * @param imageData - Image data with metadata
   * @param pageNumber - Page number (for error messages)
   */
  private async addImageToPdf(
    pdfDoc: PDFDocument,
    imageData: ImageData,
    _pageNumber: number
  ): Promise<void> {
    // Embed the image based on its format
    let embeddedImage;
    
    try {
      if (imageData.mimetype === 'image/png') {
        embeddedImage = await pdfDoc.embedPng(imageData.buffer);
      } else if (imageData.mimetype === 'image/jpeg') {
        embeddedImage = await pdfDoc.embedJpg(imageData.buffer);
      } else {
        throw new Error(
          `Unsupported image format: ${imageData.mimetype}. Only PNG and JPEG are supported.`
        );
      }
    } catch (error) {
      throw new Error(
        `Failed to embed image: ${error instanceof Error ? error.message : 'Invalid image data'}`
      );
    }

    // Get image dimensions
    const { width, height } = embeddedImage.scale(1);

    // Create a page with dimensions matching the image
    const page = pdfDoc.addPage([width, height]);

    // Draw the image on the page (filling the entire page)
    page.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width,
      height,
    });
  }

  /**
   * Validate image format
   * 
   * @param mimetype - MIME type to validate
   * @returns True if valid format
   */
  static isValidImageFormat(mimetype: string): mimetype is SupportedImageFormat {
    return mimetype === 'image/png' || mimetype === 'image/jpeg';
  }

  /**
   * Validate image data
   * 
   * @param images - Array of images to validate
   * @throws Error if validation fails
   */
  static validateImages(images: ImageData[]): void {
    if (!images || images.length === 0) {
      throw new Error('At least one image is required');
    }

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      
      if (!image.buffer || image.buffer.length === 0) {
        throw new Error(`Image ${i + 1} has no data`);
      }

      if (!this.isValidImageFormat(image.mimetype)) {
        throw new Error(
          `Image ${i + 1} (${image.originalname}) has unsupported format: ${image.mimetype}`
        );
      }
    }
  }
}

// Export singleton instance
export const imageToPdfService = new ImageToPdfService();

