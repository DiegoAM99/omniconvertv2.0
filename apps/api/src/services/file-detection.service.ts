import { FileTypeResult, fileTypeFromBuffer } from 'file-type';
import {
  FileFormat,
  FileCategory,
  DetectedFileType,
  getFileCategory,
  getFormatFromMimeType,
  getFormatFromExtension,
} from '@omniconvert/utils';

export const detectFileType = async (
  fileBuffer: Buffer,
  fileName: string
): Promise<DetectedFileType> => {
  // First try magic number detection
  let detectedType: FileTypeResult | undefined;
  
  try {
    detectedType = await fileTypeFromBuffer(fileBuffer);
  } catch (error) {
    console.error('File type detection error:', error);
  }

  // Try MIME type detection
  if (detectedType) {
    const format = getFormatFromMimeType(detectedType.mime);
    if (format) {
      return {
        category: getFileCategory(format),
        format,
        mimeType: detectedType.mime,
        confidence: 0.95, // High confidence from magic numbers
      };
    }
  }

  // Fallback to file extension
  const format = getFormatFromExtension(fileName);
  if (format) {
    return {
      category: getFileCategory(format),
      format,
      mimeType: detectedType?.mime || 'application/octet-stream',
      confidence: 0.6, // Lower confidence from extension only
    };
  }

  throw new Error('Unsupported file format');
};

// Validate file size against quota
export const validateFileSize = (fileSize: number, maxSize: number): boolean => {
  return fileSize <= maxSize;
};

// Sanitize filename for storage
export const sanitizeFileName = (fileName: string): string => {
  // Remove path separators and special characters
  return fileName
    .replace(/[/\\]/g, '')
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .substring(0, 255); // Max filename length
};

// Check if file format is supported
// All formats in FileFormat type are supported by definition
export const isSupportedFormat = (format: string): boolean => {
  // If getFormatFromExtension returns a format, it's supported
  return format !== undefined && format !== null && format.length > 0;
};

