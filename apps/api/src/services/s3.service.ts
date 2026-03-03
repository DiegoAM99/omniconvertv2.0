import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getS3Client, UPLOADS_BUCKET, OUTPUTS_BUCKET } from '../config/s3';
import { v4 as uuidv4 } from 'uuid';

export interface PresignedUploadUrl {
  uploadUrl: string;
  fileId: string;
  fileKey: string;
  expiresIn: number;
}

export interface PresignedDownloadUrl {
  downloadUrl: string;
  expiresIn: number;
}

// Generate presigned URL for file upload
export const generateUploadUrl = async (
  userId: string | null,
  fileName: string,
  fileSize: number,
  contentType: string
): Promise<PresignedUploadUrl> => {
  const fileId = uuidv4();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const userPrefix = userId || 'anonymous';
  const fileKey = `uploads/${userPrefix}/${fileId}/${sanitizedFileName}`;

  const command = new PutObjectCommand({
    Bucket: UPLOADS_BUCKET,
    Key: fileKey,
    ContentType: contentType,
    ContentLength: fileSize,
    Metadata: {
      userId: userId || 'anonymous',
      originalFileName: fileName,
      uploadedAt: new Date().toISOString(),
    },
  });

  let uploadUrl = await getSignedUrl(getS3Client(), command, {
    expiresIn: 3600, // 1 hour
  });

  // For LocalStack, replace the AWS S3 hostname with localhost:4566
  if (process.env.USE_LOCALSTACK === 'true' || process.env.NODE_ENV === 'development') {
    const s3Endpoint = process.env.S3_ENDPOINT || 'http://localhost:4566';
    uploadUrl = uploadUrl.replace(
      /https?:\/\/[^.]+\.s3\.[^.]+\.amazonaws\.com/,
      s3Endpoint + '/' + UPLOADS_BUCKET
    ).replace(/^https:/, 'http:');
  }

  return {
    uploadUrl,
    fileId,
    fileKey,
    expiresIn: 3600,
  };
};

// Generate presigned URL for file download
export const generateDownloadUrl = async (
  fileKey: string,
  expiresIn: number = 900 // 15 minutes
): Promise<PresignedDownloadUrl> => {
  const command = new GetObjectCommand({
    Bucket: OUTPUTS_BUCKET,
    Key: fileKey,
  });

  const downloadUrl = await getSignedUrl(getS3Client(), command, { expiresIn });

  return {
    downloadUrl,
    expiresIn,
  };
};

// Get file URL without signing (for internal use)
export const getFileUrl = (bucket: string, key: string): string => {
  const endpoint = process.env.AWS_ENDPOINT_URL || `https://s3.${process.env.AWS_REGION}.amazonaws.com`;
  return `${endpoint}/${bucket}/${key}`;
};
