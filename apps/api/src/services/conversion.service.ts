import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getS3Client, UPLOADS_BUCKET, OUTPUTS_BUCKET } from '../config/s3';
import { prisma } from '../config/database';
import { ProcessorFactory, ConversionOptions } from '../processors/processor.factory';
import { FileFormat } from '@omniconvert/types';
import { logger } from '../config/logger';
import { Readable } from 'stream';
import * as azureStorage from './azure-storage.service';

const USE_AZURE = process.env.USE_AZURE_STORAGE === 'true';

export class ConversionService {
  static async processConversion(
    conversionId: string,
    progressCallback?: (stage: string, percentage: number) => Promise<void>
  ): Promise<void> {
    try {
      // Fetch conversion record
      const conversion = await prisma.conversion.findUnique({
        where: { id: conversionId },
      });

      if (!conversion) {
        throw new Error(`Conversion ${conversionId} not found`);
      }

      // Update status to processing
      await prisma.conversion.update({
        where: { id: conversionId },
        data: { status: 'processing', startedAt: new Date() },
      });

      logger.info(`Starting conversion ${conversionId}: ${conversion.inputFormat} -> ${conversion.outputFormat}`);

      const startTime = Date.now();

      // Download input file from storage (Azure or S3)
      if (progressCallback) {
        await progressCallback('downloading', 20);
      }
      const inputBuffer = USE_AZURE 
        ? await this.downloadFromAzure(conversion.inputFileUrl)
        : await this.downloadFromS3(UPLOADS_BUCKET, conversion.inputFileUrl);

      // Perform conversion
      if (progressCallback) {
        await progressCallback('processing', 50);
      }
      const outputBuffer = await ProcessorFactory.convert(
        inputBuffer,
        conversion.inputFormat as FileFormat,
        conversion.outputFormat as FileFormat,
        conversion.options as ConversionOptions
      );

      // Upload output file to storage (Azure or S3)
      if (progressCallback) {
        await progressCallback('uploading', 80);
      }
      const outputFileUrl = USE_AZURE
        ? await this.uploadToAzure(outputBuffer, conversionId, conversion.outputFormat)
        : await this.uploadToS3(OUTPUTS_BUCKET, outputBuffer, conversionId, conversion.outputFormat);

      const processingTime = Date.now() - startTime;

      // Update conversion record with success
      await prisma.conversion.update({
        where: { id: conversionId },
        data: {
          status: 'completed',
          outputFileUrl,
          outputFileSize: BigInt(outputBuffer.length),
          completedAt: new Date(),
          processingTimeMs: processingTime,
        },
      });

      logger.info(`Conversion ${conversionId} completed in ${processingTime}ms`);
    } catch (error: any) {
      logger.error(`Conversion ${conversionId} failed:`, error);

      // Update conversion record with error
      await prisma.conversion.update({
        where: { id: conversionId },
        data: {
          status: 'failed',
          error: error.message,
          completedAt: new Date(),
        },
      });

      throw error;
    }
  }

  private static async downloadFromS3(bucket: string, key: string): Promise<Buffer> {
    try {
      logger.info(`Attempting S3 download - Bucket: ${bucket}, Key: ${key}`);
      logger.info(`S3 Client config - Endpoint: ${process.env.S3_ENDPOINT}, LocalStack: ${process.env.USE_LOCALSTACK}`);
      
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      const response = await getS3Client().send(command);

      if (!response.Body) {
        throw new Error('No body in S3 response');
      }

      // Convert stream to buffer
      const stream = response.Body as Readable;
      const chunks: Buffer[] = [];

      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }

      logger.info(`Successfully downloaded ${chunks.length} chunks from S3`);
      return Buffer.concat(chunks);
    } catch (error: any) {
      logger.error(`Failed to download from S3: ${bucket}/${key}`, error);
      throw new Error(`S3 download failed: ${error.message}`);
    }
  }

  private static async uploadToS3(
    bucket: string,
    buffer: Buffer,
    conversionId: string,
    format: string
  ): Promise<string> {
    try {
      const key = `outputs/${conversionId}/output.${format}`;

      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: this.getContentType(format),
        Metadata: {
          conversionId,
          generatedAt: new Date().toISOString(),
        },
      });

      await getS3Client().send(command);

      logger.info(`Uploaded output to S3: ${bucket}/${key}`);
      return key;
    } catch (error: any) {
      logger.error('Failed to upload to S3', error);
      throw new Error(`S3 upload failed: ${error.message}`);
    }
  }

  private static async downloadFromAzure(blobKey: string): Promise<Buffer> {
    try {
      logger.info(`Attempting Azure download - Blob: ${blobKey}`);
      
      // Extract container and blob name from the key
      // Format: uploads/userPrefix/fileId/filename
      const buffer = await azureStorage.downloadFile(azureStorage.UPLOADS_CONTAINER, blobKey);
      
      logger.info(`Successfully downloaded from Azure Blob Storage`);
      return buffer;
    } catch (error: any) {
      logger.error(`Failed to download from Azure: ${blobKey}`, error);
      throw new Error(`Azure download failed: ${error.message}`);
    }
  }

  private static async uploadToAzure(
    buffer: Buffer,
    conversionId: string,
    format: string
  ): Promise<string> {
    try {
      const key = `outputs/${conversionId}/output.${format}`;
      
      await azureStorage.uploadFile(
        azureStorage.OUTPUTS_CONTAINER,
        key,
        buffer,
        this.getContentType(format)
      );

      logger.info(`Uploaded output to Azure: ${key}`);
      return key;
    } catch (error: any) {
      logger.error('Failed to upload to Azure', error);
      throw new Error(`Azure upload failed: ${error.message}`);
    }
  }

  private static getContentType(format: string): string {
    const contentTypes: Record<string, string> = {
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      txt: 'text/plain',
      csv: 'text/csv',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      gif: 'image/gif',
      svg: 'image/svg+xml',
      heic: 'image/heic',
      tiff: 'image/tiff',
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      aac: 'audio/aac',
      flac: 'audio/flac',
      ogg: 'audio/ogg',
      mp4: 'video/mp4',
      mov: 'video/quicktime',
      avi: 'video/x-msvideo',
      mkv: 'video/x-matroska',
      webm: 'video/webm',
    };

    return contentTypes[format.toLowerCase()] || 'application/octet-stream';
  }
}
