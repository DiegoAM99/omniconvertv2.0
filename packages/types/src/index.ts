// File formats supported by OmniConvert
export enum FileCategory {
  DOCUMENT = 'document',
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
}

export enum DocumentFormat {
  PDF = 'pdf',
  DOCX = 'docx',
  XLSX = 'xlsx',
  PPTX = 'pptx',
  TXT = 'txt',
  CSV = 'csv',
  EPUB = 'epub',
  MOBI = 'mobi',
}

export enum ImageFormat {
  JPG = 'jpg',
  JPEG = 'jpeg',
  PNG = 'png',
  WEBP = 'webp',
  GIF = 'gif',
  SVG = 'svg',
  HEIC = 'heic',
  TIFF = 'tiff',
}

export enum AudioFormat {
  MP3 = 'mp3',
  WAV = 'wav',
  AAC = 'aac',
  FLAC = 'flac',
  OGG = 'ogg',
}

export enum VideoFormat {
  MP4 = 'mp4',
  MOV = 'mov',
  AVI = 'avi',
  MKV = 'mkv',
  WEBM = 'webm',
}

export type FileFormat = DocumentFormat | ImageFormat | AudioFormat | VideoFormat;

// User types
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum SubscriptionTier {
  FREE = 'free',
  PRO = 'pro',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  PAST_DUE = 'past_due',
  TRIALING = 'trialing',
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  emailVerified: Date | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  paddleSubscriptionId: string | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Conversion types
export enum ConversionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface Conversion {
  id: string;
  userId: string | null; // null for anonymous conversions
  status: ConversionStatus;
  inputFormat: FileFormat;
  outputFormat: FileFormat;
  inputFileUrl: string;
  outputFileUrl: string | null;
  inputFileSize: number;
  outputFileSize: number | null;
  errorMessage: string | null;
  processingTimeMs: number | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversionJob {
  id: string;
  conversionId: string;
  inputFormat: FileFormat;
  outputFormat: FileFormat;
  inputFileUrl: string;
  options?: ConversionOptions;
}

export interface ConversionOptions {
  quality?: number; // 1-100 for images
  ocr?: boolean; // Enable OCR for documents
  ocrLanguage?: string; // 'eng', 'spa', 'fra', 'deu', 'chi_sim'
  compress?: boolean;
  width?: number;
  height?: number;
}

export interface ConversionProgress {
  conversionId: string;
  status: ConversionStatus;
  progress: number; // 0-100
  message: string;
}

// Usage quota types
export interface UsageQuota {
  id: string;
  userId: string;
  date: Date;
  conversionsCount: number;
  bytesProcessed: bigint;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuotaLimits {
  maxConversionsPerDay: number;
  maxFileSizeBytes: number;
  maxConcurrentConversions: number;
  allowOCR: boolean;
  allowBatch: boolean;
}

// API request/response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface PresignedUploadResponse {
  uploadUrl: string;
  fileId: string;
  expiresAt: Date;
}

export interface InitiateConversionRequest {
  fileId: string;
  fileName: string;
  fileSize: number;
  inputFormat: FileFormat;
  outputFormat: FileFormat;
  options?: ConversionOptions;
}

export interface InitiateConversionResponse {
  conversionId: string;
  status: ConversionStatus;
}

export interface ConversionStatusResponse {
  conversion: Conversion;
  downloadUrl?: string; // Presigned S3 URL for download
}

export interface BatchConversionRequest {
  fileIds: string[];
  outputFormat: FileFormat;
  options?: ConversionOptions;
}

export interface UserProfileResponse {
  user: User;
  subscription: Subscription;
  todayUsage: {
    conversionsCount: number;
    bytesProcessed: number;
  };
  quotaLimits: QuotaLimits;
}

// Format detection types
export interface DetectedFileType {
  category: FileCategory;
  format: FileFormat;
  mimeType: string;
  confidence: number; // 0-1
}
// Extended Request type for Express with user
export interface AuthenticatedRequest {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}
export interface FormatCompatibility {
  inputFormat: FileFormat;
  supportedOutputFormats: FileFormat[];
  requiresOCR?: boolean;
  requiresPro?: boolean;
}
