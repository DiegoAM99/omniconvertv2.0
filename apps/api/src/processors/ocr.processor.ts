import Tesseract from 'tesseract.js';
import { ImageFormat, DocumentFormat } from '@omniconvert/types';
import { logger } from '../config/logger';

export interface OCROptions {
  language?: string; // 'eng', 'spa', 'fra', etc.
  preserveFormatting?: boolean;
  outputFormat?: 'text' | 'pdf' | 'hocr';
}

export class OCRProcessor {
  static async extractText(
    imageBuffer: Buffer,
    options: OCROptions = {}
  ): Promise<string> {
    try {
      logger.info('Starting OCR text extraction');

      const { language = 'eng', preserveFormatting = false } = options;

      const worker = await Tesseract.createWorker(language);

      const result = await worker.recognize(imageBuffer);
      
      await worker.terminate();

      logger.info(`OCR completed. Confidence: ${result.data.confidence}%`);

      if (preserveFormatting) {
        return this.formatWithLayout(result.data.lines);
      }

      return result.data.text;
    } catch (error: any) {
      logger.error('OCR extraction failed:', error);
      throw new Error(`OCR extraction failed: ${error.message}`);
    }
  }

  static async imageToSearchablePDF(
    imageBuffer: Buffer,
    options: OCROptions = {}
  ): Promise<Buffer> {
    try {
      logger.info('Creating searchable PDF with OCR');

      const { language = 'eng' } = options;

      const worker = await Tesseract.createWorker(language);
      
      const result = await worker.recognize(imageBuffer);

      // In a production system, we'd use something like pdf-lib to create a PDF
      // with the image as background and invisible text layer
      // For MVP, we'll just extract text and return it as a simple PDF
      
      await worker.terminate();

      // Generate simple PDF with text (simplified for MVP)
      const pdfBuffer = await this.generateSimplePDF(result.data.text);

      logger.info('Searchable PDF created successfully');
      return pdfBuffer;
    } catch (error: any) {
      logger.error('Searchable PDF creation failed:', error);
      throw new Error(`Searchable PDF creation failed: ${error.message}`);
    }
  }

  private static formatWithLayout(lines: any[]): string {
    // Preserve approximate spacing and line breaks
    return lines
      .map((line) => {
        const words = line.words.map((w: any) => w.text).join(' ');
        return words;
      })
      .join('\n');
  }

  private static async generateSimplePDF(text: string): Promise<Buffer> {
    // Simplified PDF generation
    // In production, use pdf-lib or similar
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
>>
endobj
4 0 obj
<<
/Length ${text.length + 50}
>>
stream
BT
/F1 12 Tf
50 700 Td
(${text.replace(/\n/g, ') Tj T* (')}) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000300 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
${400 + text.length}
%%EOF`;

    return Buffer.from(pdfContent, 'utf-8');
  }
}
