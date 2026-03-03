import { FileCategory, FileFormat, getFileCategory } from '@omniconvert/utils';
import { ImageProcessor, ImageConversionOptions } from './image.processor';
import { DocumentProcessor, DocumentConversionOptions } from './document.processor';
import { MediaProcessor, MediaConversionOptions } from './media.processor';
import { OCRProcessor, OCROptions } from './ocr.processor';
import { logger } from '../config/logger';

export interface ConversionOptions {
  // Image options
  quality?: number;
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  compressionLevel?: number;

  // Document options
  pageRange?: string;
  documentQuality?: 'high' | 'medium' | 'low';

  // Media options
  videoBitrate?: string;
  audioBitrate?: string;
  resolution?: string;
  fps?: number;

  // OCR options
  ocr?: boolean;
  ocrLanguage?: string;
  preserveFormatting?: boolean;
}

export class ProcessorFactory {
  static async convert(
    inputBuffer: Buffer,
    inputFormat: FileFormat,
    outputFormat: FileFormat,
    options: ConversionOptions = {}
  ): Promise<Buffer> {
    try {
      const inputCategory = getFileCategory(inputFormat);
      const outputCategory = getFileCategory(outputFormat);

      logger.info(`Processing conversion: ${inputFormat} (${inputCategory}) -> ${outputFormat} (${outputCategory})`);

      // Handle OCR separately
      if (options.ocr && inputCategory === 'image') {
        return await this.handleOCR(inputBuffer, inputFormat, outputFormat, options);
      }

      // Image conversions
      if (inputCategory === 'image' && outputCategory === 'image') {
        return await ImageProcessor.convert(
          inputBuffer,
          inputFormat as any,
          outputFormat as any,
          {
            quality: options.quality,
            width: options.width,
            height: options.height,
            fit: options.fit,
            compressionLevel: options.compressionLevel,
          }
        );
      }

      // Document conversions
      if (inputCategory === 'document' && outputCategory === 'document') {
        return await DocumentProcessor.convert(
          inputBuffer,
          inputFormat as any,
          outputFormat as any,
          {
            pageRange: options.pageRange,
            quality: options.documentQuality,
          }
        );
      }

      // Audio conversions
      if (inputCategory === 'audio' && outputCategory === 'audio') {
        return await MediaProcessor.convert(
          inputBuffer,
          inputFormat as any,
          outputFormat as any,
          {
            quality: options.documentQuality,
            audioBitrate: options.audioBitrate,
          }
        );
      }

      // Video conversions
      if (inputCategory === 'video' && outputCategory === 'video') {
        return await MediaProcessor.convert(
          inputBuffer,
          inputFormat as any,
          outputFormat as any,
          {
            quality: options.documentQuality,
            videoBitrate: options.videoBitrate,
            audioBitrate: options.audioBitrate,
            resolution: options.resolution,
            fps: options.fps,
          }
        );
      }

      // Cross-category conversions
      // Image to Document (e.g., JPG to PDF)
      if (inputCategory === 'image' && outputCategory === 'document') {
        if (options.ocr) {
          return await OCRProcessor.imageToSearchablePDF(inputBuffer, {
            language: options.ocrLanguage,
            preserveFormatting: options.preserveFormatting,
          });
        }
        // Without OCR, just wrap image in PDF
        throw new Error('Image to document conversion without OCR not implemented');
      }

      throw new Error(
        `Unsupported conversion: ${inputFormat} (${inputCategory}) to ${outputFormat} (${outputCategory})`
      );
    } catch (error: any) {
      logger.error('Conversion processing failed:', error);
      throw error;
    }
  }

  private static async handleOCR(
    inputBuffer: Buffer,
    inputFormat: FileFormat,
    outputFormat: FileFormat,
    options: ConversionOptions
  ): Promise<Buffer> {
    const outputCategory = getFileCategory(outputFormat);

    if (outputCategory === 'document') {
      // OCR to PDF or DOCX
      return await OCRProcessor.imageToSearchablePDF(inputBuffer, {
        language: options.ocrLanguage,
        preserveFormatting: options.preserveFormatting,
      });
    } else {
      // OCR to text file
      const text = await OCRProcessor.extractText(inputBuffer, {
        language: options.ocrLanguage,
        preserveFormatting: options.preserveFormatting,
      });
      return Buffer.from(text, 'utf-8');
    }
  }
}
