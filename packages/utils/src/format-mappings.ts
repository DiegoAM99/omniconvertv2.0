import {
  FileCategory,
  DocumentFormat,
  ImageFormat,
  AudioFormat,
  VideoFormat,
  FileFormat,
  FormatCompatibility,
  SubscriptionTier,
  QuotaLimits,
} from '@omniconvert/types';

// Format mappings - which formats can be converted to which
export const FORMAT_COMPATIBILITY: Record<FileFormat, FormatCompatibility> = {
  // Document formats
  [DocumentFormat.PDF]: {
    inputFormat: DocumentFormat.PDF,
    supportedOutputFormats: [
      DocumentFormat.DOCX,
      DocumentFormat.TXT,
      DocumentFormat.XLSX,
      ImageFormat.JPG,
      ImageFormat.PNG,
    ],
    requiresOCR: true, // For scanned PDFs
  },
  [DocumentFormat.DOCX]: {
    inputFormat: DocumentFormat.DOCX,
    supportedOutputFormats: [
      DocumentFormat.PDF,
      DocumentFormat.TXT,
      DocumentFormat.EPUB,
      DocumentFormat.MOBI,
    ],
  },
  [DocumentFormat.XLSX]: {
    inputFormat: DocumentFormat.XLSX,
    supportedOutputFormats: [DocumentFormat.PDF, DocumentFormat.CSV],
  },
  [DocumentFormat.PPTX]: {
    inputFormat: DocumentFormat.PPTX,
    supportedOutputFormats: [DocumentFormat.PDF, ImageFormat.JPG, ImageFormat.PNG],
  },
  [DocumentFormat.TXT]: {
    inputFormat: DocumentFormat.TXT,
    supportedOutputFormats: [DocumentFormat.PDF, DocumentFormat.DOCX, DocumentFormat.EPUB],
  },
  [DocumentFormat.CSV]: {
    inputFormat: DocumentFormat.CSV,
    supportedOutputFormats: [DocumentFormat.XLSX, DocumentFormat.PDF],
  },
  [DocumentFormat.EPUB]: {
    inputFormat: DocumentFormat.EPUB,
    supportedOutputFormats: [DocumentFormat.PDF, DocumentFormat.MOBI, DocumentFormat.TXT],
  },
  [DocumentFormat.MOBI]: {
    inputFormat: DocumentFormat.MOBI,
    supportedOutputFormats: [DocumentFormat.PDF, DocumentFormat.EPUB, DocumentFormat.TXT],
  },

  // Image formats
  [ImageFormat.JPG]: {
    inputFormat: ImageFormat.JPG,
    supportedOutputFormats: [
      ImageFormat.PNG,
      ImageFormat.WEBP,
      ImageFormat.GIF,
      ImageFormat.TIFF,
      ImageFormat.HEIC,
      DocumentFormat.PDF,
    ],
  },
  [ImageFormat.JPEG]: {
    inputFormat: ImageFormat.JPEG,
    supportedOutputFormats: [
      ImageFormat.PNG,
      ImageFormat.WEBP,
      ImageFormat.GIF,
      ImageFormat.TIFF,
      ImageFormat.HEIC,
      DocumentFormat.PDF,
    ],
  },
  [ImageFormat.PNG]: {
    inputFormat: ImageFormat.PNG,
    supportedOutputFormats: [
      ImageFormat.JPG,
      ImageFormat.WEBP,
      ImageFormat.GIF,
      ImageFormat.TIFF,
      ImageFormat.HEIC,
      DocumentFormat.PDF,
    ],
  },
  [ImageFormat.WEBP]: {
    inputFormat: ImageFormat.WEBP,
    supportedOutputFormats: [
      ImageFormat.JPG,
      ImageFormat.PNG,
      ImageFormat.GIF,
      ImageFormat.TIFF,
      DocumentFormat.PDF,
    ],
  },
  [ImageFormat.GIF]: {
    inputFormat: ImageFormat.GIF,
    supportedOutputFormats: [
      ImageFormat.JPG,
      ImageFormat.PNG,
      ImageFormat.WEBP,
      ImageFormat.TIFF,
      DocumentFormat.PDF,
    ],
  },
  [ImageFormat.SVG]: {
    inputFormat: ImageFormat.SVG,
    supportedOutputFormats: [
      ImageFormat.PNG,
      ImageFormat.JPG,
      ImageFormat.WEBP,
      DocumentFormat.PDF,
    ],
  },
  [ImageFormat.HEIC]: {
    inputFormat: ImageFormat.HEIC,
    supportedOutputFormats: [
      ImageFormat.JPG,
      ImageFormat.PNG,
      ImageFormat.WEBP,
      DocumentFormat.PDF,
    ],
  },
  [ImageFormat.TIFF]: {
    inputFormat: ImageFormat.TIFF,
    supportedOutputFormats: [
      ImageFormat.JPG,
      ImageFormat.PNG,
      ImageFormat.WEBP,
      DocumentFormat.PDF,
    ],
  },

  // Audio formats
  [AudioFormat.MP3]: {
    inputFormat: AudioFormat.MP3,
    supportedOutputFormats: [
      AudioFormat.WAV,
      AudioFormat.AAC,
      AudioFormat.FLAC,
      AudioFormat.OGG,
    ],
  },
  [AudioFormat.WAV]: {
    inputFormat: AudioFormat.WAV,
    supportedOutputFormats: [
      AudioFormat.MP3,
      AudioFormat.AAC,
      AudioFormat.FLAC,
      AudioFormat.OGG,
    ],
  },
  [AudioFormat.AAC]: {
    inputFormat: AudioFormat.AAC,
    supportedOutputFormats: [
      AudioFormat.MP3,
      AudioFormat.WAV,
      AudioFormat.FLAC,
      AudioFormat.OGG,
    ],
  },
  [AudioFormat.FLAC]: {
    inputFormat: AudioFormat.FLAC,
    supportedOutputFormats: [
      AudioFormat.MP3,
      AudioFormat.WAV,
      AudioFormat.AAC,
      AudioFormat.OGG,
    ],
  },
  [AudioFormat.OGG]: {
    inputFormat: AudioFormat.OGG,
    supportedOutputFormats: [
      AudioFormat.MP3,
      AudioFormat.WAV,
      AudioFormat.AAC,
      AudioFormat.FLAC,
    ],
  },

  // Video formats
  [VideoFormat.MP4]: {
    inputFormat: VideoFormat.MP4,
    supportedOutputFormats: [
      VideoFormat.MOV,
      VideoFormat.AVI,
      VideoFormat.MKV,
      VideoFormat.WEBM,
    ],
  },
  [VideoFormat.MOV]: {
    inputFormat: VideoFormat.MOV,
    supportedOutputFormats: [
      VideoFormat.MP4,
      VideoFormat.AVI,
      VideoFormat.MKV,
      VideoFormat.WEBM,
    ],
  },
  [VideoFormat.AVI]: {
    inputFormat: VideoFormat.AVI,
    supportedOutputFormats: [
      VideoFormat.MP4,
      VideoFormat.MOV,
      VideoFormat.MKV,
      VideoFormat.WEBM,
    ],
  },
  [VideoFormat.MKV]: {
    inputFormat: VideoFormat.MKV,
    supportedOutputFormats: [
      VideoFormat.MP4,
      VideoFormat.MOV,
      VideoFormat.AVI,
      VideoFormat.WEBM,
    ],
  },
  [VideoFormat.WEBM]: {
    inputFormat: VideoFormat.WEBM,
    supportedOutputFormats: [
      VideoFormat.MP4,
      VideoFormat.MOV,
      VideoFormat.AVI,
      VideoFormat.MKV,
    ],
  },
};

// Get file category from format
export function getFileCategory(format: FileFormat): FileCategory {
  if (Object.values(DocumentFormat).includes(format as DocumentFormat)) {
    return FileCategory.DOCUMENT;
  }
  if (Object.values(ImageFormat).includes(format as ImageFormat)) {
    return FileCategory.IMAGE;
  }
  if (Object.values(AudioFormat).includes(format as AudioFormat)) {
    return FileCategory.AUDIO;
  }
  if (Object.values(VideoFormat).includes(format as VideoFormat)) {
    return FileCategory.VIDEO;
  }
  throw new Error(`Unknown format: ${format}`);
}

// Get supported output formats for an input format
export function getSupportedOutputFormats(inputFormat: FileFormat): FileFormat[] {
  const compatibility = FORMAT_COMPATIBILITY[inputFormat];
  return compatibility ? compatibility.supportedOutputFormats : [];
}

// Check if conversion is supported
export function isConversionSupported(
  inputFormat: FileFormat,
  outputFormat: FileFormat
): boolean {
  const supportedFormats = getSupportedOutputFormats(inputFormat);
  return supportedFormats.includes(outputFormat);
}

// Quota limits by tier
export const QUOTA_LIMITS: Record<SubscriptionTier, QuotaLimits> = {
  [SubscriptionTier.FREE]: {
    maxConversionsPerDay: 5,
    maxFileSizeBytes: 50 * 1024 * 1024, // 50 MB
    maxConcurrentConversions: 1,
    allowOCR: false,
    allowBatch: false,
  },
  [SubscriptionTier.PRO]: {
    maxConversionsPerDay: -1, // Unlimited
    maxFileSizeBytes: 2 * 1024 * 1024 * 1024, // 2 GB
    maxConcurrentConversions: 10,
    allowOCR: true,
    allowBatch: true,
  },
};

// Anonymous user limits (stricter than free tier)
export const ANONYMOUS_QUOTA_LIMITS: QuotaLimits = {
  maxConversionsPerDay: 1,
  maxFileSizeBytes: 10 * 1024 * 1024, // 10 MB
  maxConcurrentConversions: 1,
  allowOCR: false,
  allowBatch: false,
};

// Format file size helper
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// MIME type mappings
export const MIME_TYPE_MAP: Record<string, FileFormat> = {
  // Documents
  'application/pdf': DocumentFormat.PDF,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': DocumentFormat.DOCX,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': DocumentFormat.XLSX,
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': DocumentFormat.PPTX,
  'text/plain': DocumentFormat.TXT,
  'text/csv': DocumentFormat.CSV,
  'application/epub+zip': DocumentFormat.EPUB,
  'application/x-mobipocket-ebook': DocumentFormat.MOBI,

  // Images
  'image/jpeg': ImageFormat.JPEG,
  'image/png': ImageFormat.PNG,
  'image/webp': ImageFormat.WEBP,
  'image/gif': ImageFormat.GIF,
  'image/svg+xml': ImageFormat.SVG,
  'image/heic': ImageFormat.HEIC,
  'image/tiff': ImageFormat.TIFF,

  // Audio
  'audio/mpeg': AudioFormat.MP3,
  'audio/wav': AudioFormat.WAV,
  'audio/aac': AudioFormat.AAC,
  'audio/flac': AudioFormat.FLAC,
  'audio/ogg': AudioFormat.OGG,

  // Video
  'video/mp4': VideoFormat.MP4,
  'video/quicktime': VideoFormat.MOV,
  'video/x-msvideo': VideoFormat.AVI,
  'video/x-matroska': VideoFormat.MKV,
  'video/webm': VideoFormat.WEBM,
};

// Extension to format mapping
export const EXTENSION_FORMAT_MAP: Record<string, FileFormat> = {
  // Documents
  pdf: DocumentFormat.PDF,
  docx: DocumentFormat.DOCX,
  xlsx: DocumentFormat.XLSX,
  pptx: DocumentFormat.PPTX,
  txt: DocumentFormat.TXT,
  csv: DocumentFormat.CSV,
  epub: DocumentFormat.EPUB,
  mobi: DocumentFormat.MOBI,

  // Images
  jpg: ImageFormat.JPG,
  jpeg: ImageFormat.JPEG,
  png: ImageFormat.PNG,
  webp: ImageFormat.WEBP,
  gif: ImageFormat.GIF,
  svg: ImageFormat.SVG,
  heic: ImageFormat.HEIC,
  tiff: ImageFormat.TIFF,
  tif: ImageFormat.TIFF,

  // Audio
  mp3: AudioFormat.MP3,
  wav: AudioFormat.WAV,
  aac: AudioFormat.AAC,
  flac: AudioFormat.FLAC,
  ogg: AudioFormat.OGG,

  // Video
  mp4: VideoFormat.MP4,
  mov: VideoFormat.MOV,
  avi: VideoFormat.AVI,
  mkv: VideoFormat.MKV,
  webm: VideoFormat.WEBM,
};

// Get format from file extension
export function getFormatFromExtension(fileName: string): FileFormat | null {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (!ext) return null;
  return EXTENSION_FORMAT_MAP[ext] || null;
}

// Get format from MIME type
export function getFormatFromMimeType(mimeType: string): FileFormat | null {
  return MIME_TYPE_MAP[mimeType] || null;
}
