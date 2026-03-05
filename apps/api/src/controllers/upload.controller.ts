import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { generateUploadUrl } from '../services/s3.service';
import { sanitizeFileName, validateFileSize } from '../services/file-detection.service';
import { AppError } from '../middleware/error-handler';
import { QUOTA_LIMITS, ANONYMOUS_QUOTA_LIMITS, getFormatFromExtension } from '@omniconvert/utils';
import { addConversionJob } from '../queues/conversion.queue';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getS3Client, UPLOADS_BUCKET } from '../config/s3';
import * as azureStorage from '../services/azure-storage.service';
import { v4 as uuidv4 } from 'uuid';

const USE_AZURE = process.env.USE_AZURE_STORAGE === 'true';

// Initialize upload - get presigned URL
export const initializeUpload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fileName, fileSize, contentType } = req.body;
    const userId = req.user?.userId || null;

    if (!fileName || !fileSize || !contentType) {
      throw new AppError('Missing required fields: fileName, fileSize, contentType', 400, 'MISSING_FIELDS');
    }

    // Get user's quota limits
    let quotaLimits = ANONYMOUS_QUOTA_LIMITS;
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
      });

      if (user?.subscription) {
        quotaLimits = QUOTA_LIMITS[user.subscription.tier as 'free' | 'pro'] || QUOTA_LIMITS.free;
      }
    }

    // Validate file size
    if (!validateFileSize(fileSize, quotaLimits.maxFileSizeBytes)) {
      const maxSizeMB = quotaLimits.maxFileSizeBytes / (1024 * 1024);
      throw new AppError(
        `File size exceeds limit of ${maxSizeMB}MB`,
        400,
        'FILE_TOO_LARGE'
      );
    }

    // Sanitize filename
    const sanitizedFileName = sanitizeFileName(fileName);

    // Generate presigned upload URL
    const uploadData = await generateUploadUrl(userId, sanitizedFileName, fileSize, contentType);

    res.json({
      success: true,
      data: {
        uploadUrl: uploadData.uploadUrl,
        fileId: uploadData.fileId,
        fileKey: uploadData.fileKey,
        expiresIn: uploadData.expiresIn,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Complete upload and create conversion record
export const completeUpload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fileId, fileName, fileSize, inputFormat, outputFormat, options } = req.body;
    const userId = req.user?.userId || null;

    if (!fileId || !fileName || !fileSize || !inputFormat || !outputFormat) {
      throw new AppError('Missing required fields', 400, 'MISSING_FIELDS');
    }

    // Validate formats
    const inputFormatDetected = getFormatFromExtension(fileName);
    if (!inputFormatDetected) {
      throw new AppError('Unsupported input format', 400, 'UNSUPPORTED_FORMAT');
    }

    // Check user quota
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
      });

      const quotaLimits = user?.subscription 
        ? QUOTA_LIMITS[user.subscription.tier as 'free' | 'pro']
        : QUOTA_LIMITS.free;

      // Check daily conversion limit
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayUsage = await prisma.usageQuota.findUnique({
        where: {
          userId_date: {
            userId,
            date: today,
          },
        },
      });

      if (quotaLimits.maxConversionsPerDay !== -1 && 
          todayUsage && 
          todayUsage.conversionsCount >= quotaLimits.maxConversionsPerDay) {
        throw new AppError(
          'Daily conversion quota exceeded',
          429,
          'QUOTA_EXCEEDED'
        );
      }

      // Check if OCR is requested but not allowed
      if (options?.ocr && !quotaLimits.allowOCR) {
        throw new AppError(
          'OCR is only available for Pro users',
          403,
          'OCR_NOT_ALLOWED'
        );
      }
    }

    // Create conversion record
    const userPrefix = userId || 'anonymous';
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const inputFileUrl = `uploads/${userPrefix}/${fileId}/${sanitizedFileName}`;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now

    const conversion = await prisma.conversion.create({
      data: {
        userId,
        status: 'queued',
        inputFormat,
        outputFormat,
        inputFileUrl,
        inputFileSize: BigInt(fileSize),
        options: options || {},
        expiresAt,
      },
    });

    // Update usage quota
    if (userId) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await prisma.usageQuota.upsert({
        where: {
          userId_date: {
            userId,
            date: today,
          },
        },
        update: {
          conversionsCount: { increment: 1 },
          bytesProcessed: { increment: BigInt(fileSize) },
        },
        create: {
          userId,
          date: today,
          conversionsCount: 1,
          bytesProcessed: BigInt(fileSize),
        },
      });
    }

    // Determine priority based on user tier
    let priority = 1; // Anonymous
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
      });

      if (user?.subscription?.tier === 'pro') {
        priority = 10; // Pro users get highest priority
      } else {
        priority = 5; // Free users get medium priority
      }
    }

    // Add conversion job to queue
    await addConversionJob(
      {
        conversionId: conversion.id,
        userId,
        inputFormat,
        outputFormat,
        options: options || {},
      },
      priority
    );

    res.json({
      success: true,
      data: {
        conversionId: conversion.id,
        status: conversion.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Direct upload - upload file directly through API (avoids CORS issues)
export const directUpload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = req.file;
    const { inputFormat, outputFormat, options } = req.body;
    const userId = req.user?.userId || null;

    if (!file) {
      throw new AppError('No file uploaded', 400, 'NO_FILE');
    }

    if (!inputFormat || !outputFormat) {
      throw new AppError('Missing required fields: inputFormat, outputFormat', 400, 'MISSING_FIELDS');
    }

    // Get user's quota limits
    let quotaLimits = ANONYMOUS_QUOTA_LIMITS;
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
      });

      if (user?.subscription) {
        quotaLimits = QUOTA_LIMITS[(user.subscription.tier as 'free' | 'pro')] || QUOTA_LIMITS.free;
      }
    }

    // Validate file size
    if (!validateFileSize(file.size, quotaLimits.maxFileSizeBytes)) {
      const maxSizeMB = quotaLimits.maxFileSizeBytes / (1024 * 1024);
      throw new AppError(
        `File size exceeds limit of ${maxSizeMB}MB`,
        400,
        'FILE_TOO_LARGE'
      );
    }

    // Check daily quota
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
      });

      const quotaLimits = user?.subscription 
        ? QUOTA_LIMITS[user.subscription.tier as 'free' | 'pro']
        : QUOTA_LIMITS.free;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayUsage = await prisma.usageQuota.findUnique({
        where: {
          userId_date: {
            userId,
            date: today,
          },
        },
      });

      if (quotaLimits.maxConversionsPerDay !== -1 && 
          todayUsage && 
          todayUsage.conversionsCount >= quotaLimits.maxConversionsPerDay) {
        throw new AppError(
          'Daily conversion quota exceeded',
          429,
          'QUOTA_EXCEEDED'
        );
      }

      if (options?.ocr && !quotaLimits.allowOCR) {
        throw new AppError(
          'OCR is only available for Pro users',
          403,
          'OCR_NOT_ALLOWED'
        );
      }
    }

    // Upload to storage (Azure or S3)
    const fileId = uuidv4();
    const sanitizedFileName = sanitizeFileName(file.originalname);
    const userPrefix = userId || 'anonymous';
    const fileKey = `uploads/${userPrefix}/${fileId}/${sanitizedFileName}`;

    if (USE_AZURE) {
      // Upload to Azure Blob Storage
      await azureStorage.uploadFile(
        azureStorage.UPLOADS_CONTAINER,
        fileKey,
        file.buffer,
        file.mimetype
      );
    } else {
      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: UPLOADS_BUCKET,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          userId: userId || 'anonymous',
          originalFileName: file.originalname,
          uploadedAt: new Date().toISOString(),
        },
      });

      await getS3Client().send(command);
    }

    // Create conversion record
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const conversion = await prisma.conversion.create({
      data: {
        userId,
        status: 'queued',
        inputFormat,
        outputFormat,
        inputFileUrl: fileKey,
        inputFileSize: BigInt(file.size),
        options: JSON.parse(options || '{}'),
        expiresAt,
      },
    });

    // Update usage quota
    if (userId) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await prisma.usageQuota.upsert({
        where: {
          userId_date: {
            userId,
            date: today,
          },
        },
        update: {
          conversionsCount: { increment: 1 },
          bytesProcessed: { increment: BigInt(file.size) },
        },
        create: {
          userId,
          date: today,
          conversionsCount: 1,
          bytesProcessed: BigInt(file.size),
        },
      });
    }

    // Determine priority
    let priority = 1;
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
      });

      if (user?.subscription?.tier === 'pro') {
        priority = 10;
      } else {
        priority = 5;
      }
    }

    // Add conversion job to queue
    await addConversionJob(
      {
        conversionId: conversion.id,
        userId,
        inputFormat,
        outputFormat,
        options: JSON.parse(options || '{}'),
      },
      priority
    );

    res.json({
      success: true,
      data: {
        conversionId: conversion.id,
        status: conversion.status,
        fileId,
      },
    });
  } catch (error) {
    next(error);
  }
};
