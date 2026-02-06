/**
 * Text to PDF Converter Service
 * 
 * Handles conversion of text content to a PDF document.
 * Supports pagination and basic text wrapping.
 */

import { PDFDocument, StandardFonts, rgb, PageSizes, PDFFont } from 'pdf-lib';

/**
 * Options for Text to PDF conversion
 */
export interface TextToPdfOptions {
  fontSize?: number;
  lineHeight?: number;
  margin?: number;
}

/**
 * Text to PDF Converter Service Class
 */
export class TextToPdfService {
  /**
   * Convert text string to a PDF document
   * 
   * @param text - The text content to convert
   * @param options - Formatting options
   * @returns PDF document buffer
   */
  async convertTextToPdf(text: string, options: TextToPdfOptions = {}): Promise<Buffer> {
    // Handle empty text
    if (!text) {
      throw new Error('Text content cannot be empty');
    }

    try {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      const fontSize = options.fontSize || 12;
      const margin = options.margin || 50;
      const lineHeightFactor = options.lineHeight || 1.2;
      const lineHeight = fontSize * lineHeightFactor;

      // Initial page setup
      let page = pdfDoc.addPage(PageSizes.A4);
      const { width, height } = page.getSize();
      const maxWidth = width - (2 * margin);
      
      // Start position (top of page minus margin)
      let y = height - margin;

      // Normalize line endings to \n
      const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      const paragraphs = normalizedText.split('\n');

      for (const paragraph of paragraphs) {
        // Handle empty paragraphs (blank lines)
        if (paragraph.trim() === '') {
          y -= lineHeight;
          if (y < margin) {
            page = pdfDoc.addPage(PageSizes.A4);
            y = height - margin;
          }
          continue;
        }

        const lines = this.breakTextIntoLines(paragraph, font, fontSize, maxWidth);
        
        for (const line of lines) {
          // Check if we need a new page
          if (y < margin + lineHeight) {
            page = pdfDoc.addPage(PageSizes.A4);
            y = height - margin;
          }
          
          page.drawText(line, {
            x: margin,
            y: y,
            size: fontSize,
            font: font,
            color: rgb(0, 0, 0),
          });
          
          y -= lineHeight;
        }
      }

      const pdfBytes = await pdfDoc.save();
      return Buffer.from(pdfBytes);
    } catch (error) {
      throw new Error(
        `PDF creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Helper to break text into lines that fit within maxWidth
   */
  private breakTextIntoLines(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
    if (text === '') return [''];
    
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const testLine = `${currentLine} ${word}`;
      const width = font.widthOfTextAtSize(testLine, fontSize);
      
      if (width < maxWidth) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  }
}

export const textToPdfService = new TextToPdfService();
