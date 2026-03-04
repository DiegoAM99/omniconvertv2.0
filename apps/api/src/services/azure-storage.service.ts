import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import { PassThrough } from 'stream';

let _blobServiceClient: BlobServiceClient | null = null;

function getBlobServiceClient(): BlobServiceClient {
  if (!_blobServiceClient) {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    
    if (!connectionString) {
      throw new Error('AZURE_STORAGE_CONNECTION_STRING not configured');
    }

    _blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    console.log('✅ Azure Blob Storage client initialized');
  }
  
  return _blobServiceClient;
}

const UPLOADS_CONTAINER = process.env.AZURE_STORAGE_UPLOADS_CONTAINER || 'uploads';
const OUTPUTS_CONTAINER = process.env.AZURE_STORAGE_OUTPUTS_CONTAINER || 'outputs';

export async function uploadFile(
  containerName: string,
  blobName: string,
  buffer: Buffer,
  contentType?: string
): Promise<string> {
  const blobServiceClient = getBlobServiceClient();
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.upload(buffer, buffer.length, {
    blobHTTPHeaders: {
      blobContentType: contentType || 'application/octet-stream',
    },
  });

  console.log(`✅ Uploaded to Azure Blob: ${containerName}/${blobName}`);
  return blockBlobClient.url;
}

export async function downloadFile(
  containerName: string,
  blobName: string
): Promise<Buffer> {
  const blobServiceClient = getBlobServiceClient();
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  const downloadResponse = await blockBlobClient.download(0);
  
  if (!downloadResponse.readableStreamBody) {
    throw new Error('Failed to download blob');
  }

  const chunks: Buffer[] = [];
  for await (const chunk of downloadResponse.readableStreamBody) {
    chunks.push(Buffer.from(chunk));
  }

  const buffer = Buffer.concat(chunks);
  console.log(`✅ Downloaded from Azure Blob: ${containerName}/${blobName}`);
  return buffer;
}

export async function generateDownloadUrl(
  containerName: string,
  blobName: string,
  expiresInMinutes: number = 60
): Promise<string> {
  const blobServiceClient = getBlobServiceClient();
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  // For public/anonymous access, just return the URL
  // For private access, you'd generate a SAS token here
  return blockBlobClient.url;
}

export { UPLOADS_CONTAINER, OUTPUTS_CONTAINER };
