import { spawn } from 'child_process';
import { writeFile, unlink, readFile } from 'fs/promises';
import path from 'path';
import { DocumentFormat } from '@omniconvert/types';
import { logger } from '../config/logger';
import { v4 as uuidv4 } from 'uuid';

// Mock processor for testing without LibreOffice
const { MockDocumentProcessor } = require('./mock-document.processor');

export interface DocumentConversionOptions {
  pageRange?: string; // e.g., "1-5" for PDF
  quality?: 'high' | 'medium' | 'low';
}

export class DocumentProcessor {
  private static readonly TEMP_DIR = process.env.TEMP_DIR || '/tmp';
  private static readonly USE_MOCK = process.env.USE_MOCK_PROCESSOR === 'true' || true; // Enable mock by default
  
  // LibreOffice supported formats
  private static libreOfficeFormats = [
    DocumentFormat.PDF,
    DocumentFormat.DOCX,
    DocumentFormat.XLSX,
    DocumentFormat.PPTX,
    DocumentFormat.TXT,
    DocumentFormat.CSV,
  ];

  static async convert(
    inputBuffer: Buffer,
    inputFormat: DocumentFormat,
    outputFormat: DocumentFormat,
    options: DocumentConversionOptions = {}
  ): Promise<Buffer> {
    try {
      logger.info(`Converting document from ${inputFormat} to ${outputFormat}`);

      // Use mock processor for testing
      if (this.USE_MOCK) {
        logger.info('Using MOCK processor for testing (LibreOffice not required)');
        return await MockDocumentProcessor.convert(inputBuffer, inputFormat, outputFormat, options);
      }

      // Check if we can use LibreOffice
      if (
        this.libreOfficeFormats.includes(inputFormat) &&
        this.libreOfficeFormats.includes(outputFormat)
      ) {
        return await this.convertWithLibreOffice(inputBuffer, inputFormat, outputFormat, options);
      }

      // For EPUB/MOBI, we'd use Calibre (not implemented in MVP)
      if (inputFormat === DocumentFormat.EPUB || outputFormat === DocumentFormat.EPUB ||
          inputFormat === DocumentFormat.MOBI || outputFormat === DocumentFormat.MOBI) {
        throw new Error('EPUB/MOBI conversion requires Calibre (not available in MVP)');
      }

      throw new Error(`Unsupported conversion: ${inputFormat} to ${outputFormat}`);
    } catch (error: any) {
      logger.error('Document conversion failed:', error);
      throw new Error(`Document conversion failed: ${error.message}`);
    }
  }

  private static async convertWithLibreOffice(
    inputBuffer: Buffer,
    inputFormat: DocumentFormat,
    outputFormat: DocumentFormat,
    options: DocumentConversionOptions
  ): Promise<Buffer> {
    const tempId = uuidv4();
    const inputFile = path.join(this.TEMP_DIR, `${tempId}.${inputFormat}`);
    const outputDir = path.join(this.TEMP_DIR, tempId);

    try {
      // Write input buffer to temp file
      await writeFile(inputFile, inputBuffer);

      // Determine LibreOffice filter
      const filter = this.getLibreOfficeFilter(outputFormat);

      // Execute LibreOffice conversion
      await this.execLibreOffice(inputFile, outputDir, filter);

      // Read output file
      const outputFile = path.join(outputDir, `${tempId}.${outputFormat}`);
      const outputBuffer = await readFile(outputFile);

      // Cleanup
      await unlink(inputFile);
      await unlink(outputFile);

      logger.info(`Document conversion completed. Output size: ${outputBuffer.length} bytes`);
      return outputBuffer;
    } catch (error: any) {
      // Cleanup on error
      try {
        await unlink(inputFile);
      } catch {}
      
      throw new Error(`LibreOffice conversion failed: ${error.message}`);
    }
  }

  private static getLibreOfficeFilter(format: DocumentFormat): string {
    const filters: Record<string, string> = {
      [DocumentFormat.PDF]: 'writer_pdf_Export',
      [DocumentFormat.DOCX]: 'MS Word 2007 XML',
      [DocumentFormat.XLSX]: 'MS Excel 2007 XML',
      [DocumentFormat.PPTX]: 'Impress MS PowerPoint 2007 XML',
      [DocumentFormat.TXT]: 'Text',
      [DocumentFormat.CSV]: 'Text - txt - csv (StarCalc)',
    };

    return filters[format] || format;
  }

  private static execLibreOffice(
    inputFile: string,
    outputDir: string,
    filter: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // LibreOffice command for headless conversion
      const args = [
        '--headless',
        '--convert-to',
        filter,
        '--outdir',
        outputDir,
        inputFile,
      ];

      const libreOffice = spawn('libreoffice', args);

      let stdout = '';
      let stderr = '';

      libreOffice.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      libreOffice.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      libreOffice.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`LibreOffice exited with code ${code}. stderr: ${stderr}`));
        }
      });

      libreOffice.on('error', (error) => {
        reject(new Error(`Failed to start LibreOffice: ${error.message}`));
      });

      // Timeout after 60 seconds
      setTimeout(() => {
        libreOffice.kill();
        reject(new Error('LibreOffice conversion timeout (60s)'));
      }, 60000);
    });
  }
}
