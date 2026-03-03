import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ConversionService } from '../services/conversion.service';
import { generateDownloadUrl } from '../services/s3.service';
import { AppError } from '../middleware/error-handler';

// Get conversion details
export const getConversion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || null;

    const conversion = await prisma.conversion.findUnique({
      where: { id },
    });

    if (!conversion) {
      throw new AppError('Conversion not found', 404, 'NOT_FOUND');
    }

    // Check ownership (anonymous conversions accessible by anyone with ID)
    if (conversion.userId && conversion.userId !== userId) {
      throw new AppError('Unauthorized', 403, 'FORBIDDEN');
    }

    // Generate download URL if completed
    let downloadUrl = null;
    if (conversion.status === 'completed' && conversion.outputFileUrl) {
      const urlData = await generateDownloadUrl(conversion.outputFileUrl);
      downloadUrl = urlData.downloadUrl;
    }

    res.json({
      success: true,
      data: {
        id: conversion.id,
        status: conversion.status,
        inputFormat: conversion.inputFormat,
        outputFormat: conversion.outputFormat,
        inputFileSize: conversion.inputFileSize.toString(),
        outputFileSize: conversion.outputFileSize?.toString(),
        createdAt: conversion.createdAt,
        startedAt: conversion.startedAt,
        completedAt: conversion.completedAt,
        processingTimeMs: conversion.processingTimeMs,
        error: conversion.error,
        downloadUrl,
        expiresAt: conversion.expiresAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get conversion status only (lightweight)
export const getConversionStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || null;

    const conversion = await prisma.conversion.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        error: true,
        processingTimeMs: true,
        userId: true,
      },
    });

    if (!conversion) {
      throw new AppError('Conversion not found', 404, 'NOT_FOUND');
    }

    // Check ownership
    if (conversion.userId && conversion.userId !== userId) {
      throw new AppError('Unauthorized', 403, 'FORBIDDEN');
    }

    res.json({
      success: true,
      data: {
        id: conversion.id,
        status: conversion.status,
        error: conversion.error,
        processingTimeMs: conversion.processingTimeMs,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Trigger conversion manually (for testing)
export const triggerConversion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || null;

    const conversion = await prisma.conversion.findUnique({
      where: { id },
    });

    if (!conversion) {
      throw new AppError('Conversion not found', 404, 'NOT_FOUND');
    }

    // Check ownership
    if (conversion.userId && conversion.userId !== userId) {
      throw new AppError('Unauthorized', 403, 'FORBIDDEN');
    }

    if (conversion.status !== 'pending') {
      throw new AppError('Conversion already processed', 400, 'ALREADY_PROCESSED');
    }

    // Process conversion synchronously (in real app, this would be queued)
    await ConversionService.processConversion(id);

    // Fetch updated conversion
    const updatedConversion = await prisma.conversion.findUnique({
      where: { id },
    });

    res.json({
      success: true,
      data: {
        id: updatedConversion!.id,
        status: updatedConversion!.status,
        error: updatedConversion!.error,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Download converted file
export const downloadConversion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || null;

    const conversion = await prisma.conversion.findUnique({
      where: { id },
    });

    if (!conversion) {
      throw new AppError('Conversion not found', 404, 'NOT_FOUND');
    }

    // Check ownership (anonymous conversions accessible by anyone with ID)
    if (conversion.userId && conversion.userId !== userId) {
      throw new AppError('Unauthorized', 403, 'FORBIDDEN');
    }

    if (conversion.status !== 'completed') {
      throw new AppError('Conversion not completed yet', 400, 'NOT_COMPLETED');
    }

    if (!conversion.outputFileUrl) {
      throw new AppError('Output file not found', 404, 'FILE_NOT_FOUND');
    }

    // Generate presigned download URL
    const urlData = await generateDownloadUrl(conversion.outputFileUrl);

    // Redirect to S3 download URL
    res.redirect(urlData.downloadUrl);
  } catch (error) {
    next(error);
  }
};
