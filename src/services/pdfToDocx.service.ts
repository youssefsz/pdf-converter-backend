/**
 * PDF to DOCX Conversion Service
 * 
 * Converts PDF files to DOCX format using pure Node.js libraries.
 * Extracts text and images from PDF and reconstructs them in DOCX format.
 */

import { Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType, PageBreak } from 'docx';
import { pdfConverterService, ExtractedPageContent } from './pdfConverter.service';

/**
 * Options for PDF to DOCX conversion
 */
export interface PdfToDocxOptions {
  includeImages?: boolean;
  preservePageBreaks?: boolean;
}

/**
 * PDF to DOCX Conversion Service Class
 */
export class PdfToDocxService {
  /**
   * Convert PDF buffer to DOCX buffer
   * 
   * @param pdfBuffer - PDF file buffer
   * @param options - Conversion options
   * @returns DOCX file buffer
   */
  async convertPdfToDocx(
    pdfBuffer: Buffer,
    options: PdfToDocxOptions = {}
  ): Promise<Buffer> {
    const { includeImages = true, preservePageBreaks = true } = options;

    try {
      // Extract content from PDF using existing service
      const extractedContent = await pdfConverterService.extractPdfContent(pdfBuffer);

      if (!extractedContent || extractedContent.length === 0) {
        throw new Error('No content extracted from PDF');
      }

      // Build DOCX document
      const docxChildren = await this.buildDocxContent(
        extractedContent,
        includeImages,
        preservePageBreaks
      );

      // Create document
      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                margin: {
                  top: 1440, // 1 inch in twips (1/1440 inch)
                  right: 1440,
                  bottom: 1440,
                  left: 1440,
                },
              },
            },
            children: docxChildren,
          },
        ],
      });

      // Convert to buffer
      const buffer = await Packer.toBuffer(doc);
      return buffer;

    } catch (error) {
      throw new Error(
        `PDF to DOCX conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Build DOCX content from extracted PDF pages
   * 
   * @param extractedContent - Array of extracted page content
   * @param includeImages - Whether to include images
   * @param preservePageBreaks - Whether to add page breaks between PDF pages
   * @returns Array of DOCX paragraphs
   */
  private async buildDocxContent(
    extractedContent: ExtractedPageContent[],
    includeImages: boolean,
    preservePageBreaks: boolean
  ): Promise<Paragraph[]> {
    const paragraphs: Paragraph[] = [];

    for (let i = 0; i < extractedContent.length; i++) {
      const page = extractedContent[i];

      // Add page number comment if multiple pages
      if (extractedContent.length > 1) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Page ${page.pageNumber}`,
                italics: true,
                size: 20, // 10pt font
                color: '808080', // Gray color
              }),
            ],
            spacing: {
              after: 200, // Space after paragraph
            },
          })
        );
      }

      // Process text content
      if (page.textContent && page.textContent.trim().length > 0) {
        const textParagraphs = this.convertTextToParagraphs(page.textContent);
        paragraphs.push(...textParagraphs);
      }

      // Process images if enabled
      if (includeImages && page.images && page.images.length > 0) {
        for (const image of page.images) {
          try {
            const imageParagraph = await this.createImageParagraph(image.buffer);
            paragraphs.push(imageParagraph);
          } catch (error) {
            console.error(`Failed to embed image ${image.filename}:`, error);
            // Continue with other images
          }
        }
      }

      // Add page break between pages (except after last page)
      if (preservePageBreaks && i < extractedContent.length - 1) {
        paragraphs.push(
          new Paragraph({
            children: [new PageBreak()],
          })
        );
      }
    }

    return paragraphs;
  }

  /**
   * Convert text content to DOCX paragraphs
   * 
   * @param textContent - Text content from PDF
   * @returns Array of DOCX paragraphs
   */
  private convertTextToParagraphs(textContent: string): Paragraph[] {
    const paragraphs: Paragraph[] = [];
    
    // Split by line breaks and create paragraphs
    const lines = textContent.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines but preserve paragraph spacing
      if (trimmedLine.length === 0) {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun('')],
            spacing: {
              after: 100, // Small space for empty lines
            },
          })
        );
        continue;
      }

      // Create paragraph with text
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmedLine,
              size: 24, // 12pt font
            }),
          ],
          spacing: {
            after: 200, // Space after paragraph
          },
        })
      );
    }

    return paragraphs;
  }

  /**
   * Create a paragraph containing an image
   * 
   * @param imageBuffer - Image buffer
   * @returns Paragraph with embedded image
   */
  private async createImageParagraph(imageBuffer: Buffer): Promise<Paragraph> {
    // Determine image dimensions (default to reasonable size)
    // In production, you might want to detect actual dimensions
    const maxWidth = 600; // Max width in pixels
    const maxHeight = 400; // Max height in pixels

    // Detect image type from buffer
    const imageType = this.detectImageType(imageBuffer);

    return new Paragraph({
      children: [
        new ImageRun({
          data: imageBuffer,
          type: imageType,
          transformation: {
            width: maxWidth,
            height: maxHeight,
          },
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: {
        before: 200,
        after: 200,
      },
    });
  }

  /**
   * Detect image type from buffer
   * 
   * @param buffer - Image buffer
   * @returns Image type ('png' or 'jpg')
   */
  private detectImageType(buffer: Buffer): 'png' | 'jpg' {
    // Check PNG signature (89 50 4E 47)
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      return 'png';
    }
    
    // Check JPEG signature (FF D8)
    if (buffer[0] === 0xff && buffer[1] === 0xd8) {
      return 'jpg';
    }
    
    // Default to PNG if unknown
    return 'png';
  }

  /**
   * Validate conversion options
   * 
   * @param options - Options to validate
   * @throws Error if options are invalid
   */
  static validateOptions(options: PdfToDocxOptions): void {
    if (options.includeImages !== undefined && typeof options.includeImages !== 'boolean') {
      throw new Error('includeImages must be a boolean');
    }
    if (options.preservePageBreaks !== undefined && typeof options.preservePageBreaks !== 'boolean') {
      throw new Error('preservePageBreaks must be a boolean');
    }
  }
}

// Export singleton instance
export const pdfToDocxService = new PdfToDocxService();

