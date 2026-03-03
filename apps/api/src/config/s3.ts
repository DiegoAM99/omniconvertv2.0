import { S3Client } from '@aws-sdk/client-s3';

let _s3Client: S3Client | null = null;

function getS3Config() {
  const s3Config: any = {
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
    },
  };

  // Use LocalStack in development
  if (process.env.NODE_ENV === 'development' || process.env.USE_LOCALSTACK === 'true') {
    s3Config.endpoint = process.env.S3_ENDPOINT || 'http://localhost:4566';
    s3Config.forcePathStyle = true; // Required for LocalStack
    console.log('S3 Client Config: Using LocalStack endpoint:', s3Config.endpoint);
  } else {
    console.log('S3 Client Config: Using AWS S3');
  }

  return s3Config;
}

export function getS3Client(): S3Client {
  if (!_s3Client) {
    _s3Client = new S3Client(getS3Config());
  }
  return _s3Client;
}

export const UPLOADS_BUCKET = process.env.S3_UPLOADS_BUCKET || 'omniconvert-uploads';
export const OUTPUTS_BUCKET = process.env.S3_OUTPUTS_BUCKET || 'omniconvert-outputs';
