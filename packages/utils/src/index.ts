import { z } from 'zod';
import {
  FileFormat,
  DocumentFormat,
  ImageFormat,
  AudioFormat,
  VideoFormat,
  UserRole,
  SubscriptionTier,
  SubscriptionStatus,
  ConversionStatus,
} from '@omniconvert/types';

// User validation schemas
export const emailSchema = z.string().email('Invalid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(1, 'Name is required').max(100),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// File validation schemas
const allFormats = [
  ...Object.values(DocumentFormat),
  ...Object.values(ImageFormat),
  ...Object.values(AudioFormat),
  ...Object.values(VideoFormat),
] as const;

export const fileFormatSchema = z.enum(allFormats as [string, ...string[]]);

export const conversionOptionsSchema = z.object({
  quality: z.number().min(1).max(100).optional(),
  ocr: z.boolean().optional(),
  ocrLanguage: z.enum(['eng', 'spa', 'fra', 'deu', 'chi_sim']).optional(),
  compress: z.boolean().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
});

export const initiateConversionSchema = z.object({
  fileId: z.string().uuid(),
  fileName: z.string().min(1).max(255),
  fileSize: z.number().positive(),
  inputFormat: fileFormatSchema,
  outputFormat: fileFormatSchema,
  options: conversionOptionsSchema.optional(),
});

export const batchConversionSchema = z.object({
  fileIds: z.array(z.string().uuid()).min(1).max(50),
  outputFormat: fileFormatSchema,
  options: conversionOptionsSchema.optional(),
});

// Export all schemas
export * from './format-mappings';

// Re-export types from @omniconvert/types for convenience
export type {
  FileFormat,
  FileCategory,
  DetectedFileType,
} from '@omniconvert/types';
