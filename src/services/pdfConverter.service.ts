/**
 * PDF Converter Service
 * 
 * Handles conversion of PDF files to images using pdfjs-dist and node-canvas.
 * Supports PNG and JPEG output formats for all pages.
 */

import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from '@napi-rs/canvas';
import { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { OPS } from 'pdfjs-dist/legacy/build/pdf.mjs';

/**
 * Supported image formats
 */
export type ImageFormat = 'png' | 'jpeg';

/**
 * Configuration options for PDF conversion
 */
export interface ConversionOptions {
  format: ImageFormat;
  scale?: number;
  quality?: number; // JPEG quality (0-1)
}

/**
 * Result of a single page conversion
 */
export interface ConvertedPage {
  pageNumber: number;
  buffer: Buffer;
  filename: string;
}

/**
 * Extracted image from PDF
 */
export interface ExtractedImage {
  buffer: Buffer;
  filename: string;
  format: string;
}

/**
 * Extracted content from a single page
 */
export interface ExtractedPageContent {
  pageNumber: number;
  textContent: string;
  images: ExtractedImage[];
}

/**
 * PDF Converter Service Class
 */
export class PDFConverterService {
  private readonly defaultScale = 2.0; // Higher scale for better quality
  private readonly defaultQuality = 0.95; // JPEG quality

  /**
   * Convert PDF buffer to array of image buffers
   * 
   * @param pdfBuffer - PDF file buffer
   * @param options - Conversion options
   * @returns Array of converted pages with buffers
   */
  async convertPdfToImages(
    pdfBuffer: Buffer,
    options: ConversionOptions
  ): Promise<ConvertedPage[]> {
    const { format, scale = this.defaultScale, quality = this.defaultQuality } = options;

    try {
      // Load PDF document
      const pdfDoc = await this.loadPdfDocument(pdfBuffer);
      const numPages = pdfDoc.numPages;
      const convertedPages: ConvertedPage[] = [];

      // Convert each page
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const imageBuffer = await this.convertPageToImage(page, format, scale, quality);
        
        convertedPages.push({
          pageNumber: pageNum,
          buffer: imageBuffer,
          filename: `page-${pageNum}.${format}`,
        });
      }

      return convertedPages;
    } catch (error) {
      throw new Error(
        `PDF conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Load PDF document from buffer
   * 
   * @param pdfBuffer - PDF file buffer
   * @returns PDF document proxy
   */
  private async loadPdfDocument(pdfBuffer: Buffer): Promise<PDFDocumentProxy> {
    try {
      const loadingTask = pdfjs.getDocument({
        data: new Uint8Array(pdfBuffer),
        useSystemFonts: true,
      });

      return await loadingTask.promise;
    } catch (error) {
      throw new Error(
        `Failed to load PDF: ${error instanceof Error ? error.message : 'Invalid PDF file'}`
      );
    }
  }

  /**
   * Convert a single PDF page to image buffer
   * 
   * @param page - PDF page proxy
   * @param format - Image format (png or jpeg)
   * @param scale - Rendering scale
   * @param quality - JPEG quality (0-1)
   * @returns Image buffer
   */
  private async convertPageToImage(
    page: PDFPageProxy,
    format: ImageFormat,
    scale: number,
    quality: number
  ): Promise<Buffer> {
    // Get page viewport
    const viewport = page.getViewport({ scale });

    // Create canvas
    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d');

    // Render PDF page to canvas
    const renderContext = {
      canvasContext: context as any,
      viewport: viewport,
      canvas: canvas as any,
    };

    await page.render(renderContext).promise;

    // Convert canvas to buffer
    if (format === 'jpeg') {
      return canvas.encode('jpeg', quality * 100); // quality is 0-100 for @napi-rs/canvas
    } else {
      return canvas.encode('png');
    }
  }

  /**
   * Validate image format
   * 
   * @param format - Format string to validate
   * @returns True if valid format
   */
  static isValidFormat(format: string): format is ImageFormat {
    return format === 'png' || format === 'jpeg';
  }

  /**
   * Extract text content from a PDF page
   * 
   * @param page - PDF page proxy
   * @returns Formatted text content
   */
  private async extractTextFromPage(page: PDFPageProxy): Promise<string> {
    try {
      const textContent = await page.getTextContent();
      let text = '';
      let lastY = -1;

      // Combine text items into readable format with line breaks
      for (const item of textContent.items) {
        if ('str' in item) {
          // Check if we're on a new line (Y position changed significantly)
          if (lastY !== -1 && Math.abs(lastY - item.transform[5]) > 5) {
            text += '\n';
          }
          text += item.str;
          lastY = item.transform[5];
        }
      }

      return text;
    } catch (error) {
      throw new Error(
        `Failed to extract text: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Extract images from a PDF page
   * 
   * @param page - PDF page proxy
   * @param pageNum - Page number for filename generation
   * @returns Array of extracted images with buffers
   */
  private async extractImagesFromPage(
    page: PDFPageProxy,
    pageNum: number
  ): Promise<ExtractedImage[]> {
    try {
      const operatorList = await page.getOperatorList();
      const images: ExtractedImage[] = [];
      let imageIndex = 1;

      // Iterate through operators to find image operations
      for (let i = 0; i < operatorList.fnArray.length; i++) {
        const op = operatorList.fnArray[i];
        
        // Check for image painting operations
        if (
          op === OPS.paintImageXObject ||
          op === OPS.paintXObject ||
          op === OPS.paintImageMaskXObject
        ) {
          try {
            const imageName = operatorList.argsArray[i][0];
            
            // Get image object from page resources
            const imageObj = await new Promise<any>((resolve) => {
              page.objs.get(imageName, resolve);
            });

            if (imageObj) {
              const { buffer, format } = await this.convertImageObjToBuffer(imageObj);
              
              images.push({
                buffer,
                filename: `page-${pageNum}-image-${imageIndex}.${format}`,
                format,
              });
              
              imageIndex++;
            }
          } catch (imgError) {
            // Skip individual image errors but continue processing
            console.error(`Failed to extract image ${imageIndex} from page ${pageNum}:`, imgError);
          }
        }
      }

      return images;
    } catch (error) {
      throw new Error(
        `Failed to extract images: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Convert PDF image object to buffer
   * 
   * @param imageObj - PDF image object
   * @returns Buffer and format information
   */
  private async convertImageObjToBuffer(
    imageObj: any
  ): Promise<{ buffer: Buffer; format: string }> {
    try {
      const width = imageObj.width;
      const height = imageObj.height;
      let format = 'png';

      // Create canvas for image rendering
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      // Check if it's a JPEG (has data property with JPEG data)
      if (imageObj.data && imageObj.kind === 1) {
        // Try to detect JPEG format
        const data = imageObj.data;
        if (data[0] === 0xff && data[1] === 0xd8) {
          format = 'jpg';
          return { buffer: Buffer.from(data), format };
        }
      }

      // For other formats, render to canvas
      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;

      // Copy pixel data
      if (imageObj.data) {
        const srcData = imageObj.data;
        for (let i = 0; i < srcData.length; i += 4) {
          data[i] = srcData[i];       // R
          data[i + 1] = srcData[i + 1]; // G
          data[i + 2] = srcData[i + 2]; // B
          data[i + 3] = srcData[i + 3] !== undefined ? srcData[i + 3] : 255; // A
        }
      }

      ctx.putImageData(imageData, 0, 0);

      // Encode to PNG
      const buffer = await canvas.encode('png');
      return { buffer, format: 'png' };
    } catch (error) {
      throw new Error(
        `Failed to convert image object: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Extract all content (text and images) from PDF
   * 
   * @param pdfBuffer - PDF file buffer
   * @returns Array of extracted page content
   */
  async extractPdfContent(pdfBuffer: Buffer): Promise<ExtractedPageContent[]> {
    try {
      // Load PDF document
      const pdfDoc = await this.loadPdfDocument(pdfBuffer);
      const numPages = pdfDoc.numPages;
      const extractedContent: ExtractedPageContent[] = [];

      // Process each page
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        
        // Extract text and images in parallel
        const [textContent, images] = await Promise.all([
          this.extractTextFromPage(page),
          this.extractImagesFromPage(page, pageNum),
        ]);

        extractedContent.push({
          pageNumber: pageNum,
          textContent,
          images,
        });
      }

      return extractedContent;
    } catch (error) {
      throw new Error(
        `PDF content extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

// Export singleton instance
export const pdfConverterService = new PDFConverterService();

