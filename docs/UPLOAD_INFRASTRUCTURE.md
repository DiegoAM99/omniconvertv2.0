# Upload Infrastructure

This document describes the file upload system implemented in OmniConvert.

## Architecture Overview

The upload system uses a **direct-to-S3** approach with presigned URLs to optimize performance and reduce backend load.

### Flow Diagram

```
Client → API (Initialize) → S3 (Presigned URL)
   ↓                              ↓
   └─────── Upload File ──────────┘
   ↓
   → API (Complete Upload) → Create Conversion Record → Job Queue
```

## Components

### Backend Services

#### 1. S3 Service (`apps/api/src/services/s3.service.ts`)

Handles AWS S3 operations:

- **`generateUploadUrl()`**: Creates presigned PUT URL for client-side uploads
  - Parameters: userId, fileName, fileSize, contentType
  - Returns: uploadUrl, fileId, fileKey, expiresIn (1 hour)
  - File storage path: `uploads/{userId}/{fileId}/{sanitizedFileName}`
  
- **`generateDownloadUrl()`**: Creates presigned GET URL for downloads
  - Parameters: fileKey, expiresIn (default 15 minutes)
  - Returns: downloadUrl, expiresIn
  
- **`getFileUrl()`**: Internal helper for non-presigned URLs

**Configuration:**
- Uses LocalStack for development (port 4566)
- Production uses AWS S3 with proper credentials
- Buckets: `omniconvert-uploads`, `omniconvert-outputs`

#### 2. File Detection Service (`apps/api/src/services/file-detection.service.ts`)

Validates and detects file types:

- **`detectFileType()`**: Uses magic numbers (via `file-type` package) and fallback to extension
  - Returns: category, format, mimeType, confidence (0.95 for magic numbers, 0.6 for extension)
  
- **`validateFileSize()`**: Checks file size against quota limits
  
- **`sanitizeFileName()`**: Removes special characters and path separators
  - Max length: 255 characters
  
- **`isSupportedFormat()`**: Validates format is in supported list

#### 3. Upload Controller (`apps/api/src/controllers/upload.controller.ts`)

API endpoint handlers:

**POST /api/uploads/initialize**
- Validates: fileName, fileSize, contentType
- Checks: User quota limits (Free: 50MB, Pro: 2GB, Anonymous: 10MB)
- Returns: Presigned S3 upload URL + fileId

**POST /api/uploads/complete**
- Creates Prisma conversion record with status "pending"
- Updates user's daily usage quota
- Validates: Daily conversion limits, OCR permissions
- Returns: conversionId, status

### Frontend Components

#### 1. API Client (`apps/web/src/lib/api-client.ts`)

Centralized HTTP client with methods:

- `initializeUpload()`: Gets presigned URL
- `uploadToS3()`: Direct upload with progress tracking (XMLHttpRequest)
- `completeUpload()`: Finalizes conversion
- `getUserProfile()`, `getUserConversions()`: User data
- Auto-attaches Bearer token when authenticated

#### 2. Upload Zone Component (`apps/web/src/components/UploadZone.tsx`)

React dropzone with:
- Drag & drop interface (uses `react-dropzone`)
- Format selector (optional, auto-detects if empty)
- Upload progress bar (0-100%)
- S3 direct upload with XHR progress events
- Error handling with callbacks

**Props:**
- `onUploadComplete?: (conversionId: string) => void`
- `onError?: (error: string) => void`

**Supported formats:**
- Documents: PDF, DOCX, XLSX, TXT
- Images: JPG, PNG, WEBP, GIF
- Audio: MP3, WAV, AAC
- Video: MP4, MOV, WEBM

## Quota System

Implemented via Prisma `UsageQuota` model:

```typescript
{
  userId_date: { userId: string, date: Date } // Composite key
  conversionsCount: number
  bytesProcessed: bigint
}
```

**Limits (from `@omniconvert/utils`):**

| Tier      | Max File Size | Conversions/Day | OCR Support |
|-----------|---------------|-----------------|-------------|
| Anonymous | 10 MB         | 1               | ❌          |
| Free      | 50 MB         | 5               | ❌          |
| Pro       | 2 GB          | Unlimited       | ✅          |

**Enforcement:**
1. API checks quota on upload initialization
2. Returns 429 error if quota exceeded
3. UsageQuota updated after successful upload completion

## Security Features

1. **Rate Limiting** (via `express-rate-limit` + Redis):
   - Upload endpoints: 10 requests/minute
   
2. **File Sanitization**:
   - Removes path traversal characters (`/`, `\`)
   - Replaces special characters with `_`
   
3. **Size Validation**:
   - Enforced at initialization (server-side)
   - Quota-based limits
   
4. **Content-Type Validation**:
   - Required on upload initialization
   - Magic number detection in file-detection service
   
5. **Presigned URL Expiration**:
   - Upload URLs: 1 hour
   - Download URLs: 15 minutes

## Environment Variables

**Backend (`apps/api/.env`):**
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_ENDPOINT_URL=http://localhost:4566  # LocalStack
UPLOADS_BUCKET=omniconvert-uploads
OUTPUTS_BUCKET=omniconvert-outputs
```

**Frontend (`apps/web/.env.local`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Usage Example

### Client-side Upload Flow

```typescript
import { apiClient } from '@/lib/api-client';
import { useSession } from 'next-auth/react';

const session = useSession();

// 1. Set access token
apiClient.setAccessToken(session?.accessToken);

// 2. Initialize upload
const { data } = await apiClient.initializeUpload(
  'document.pdf',
  1024000, // 1MB
  'application/pdf'
);

// 3. Upload to S3 with progress
await apiClient.uploadToS3(data.uploadUrl, file, (progress) => {
  console.log(`Upload progress: ${progress}%`);
});

// 4. Complete upload
const result = await apiClient.completeUpload(
  data.fileId,
  'document.pdf',
  1024000,
  'pdf',
  'docx',
  { ocr: true } // Pro only
);

console.log(`Conversion ID: ${result.data.conversionId}`);
```

## Testing

### LocalStack S3 Setup

Start services:
```bash
docker-compose up -d
```

Initialize buckets:
```bash
bash scripts/init-s3.sh
```

Verify buckets:
```bash
aws s3 ls --endpoint-url=http://localhost:4566
```

### Manual Testing

1. Start dev servers:
   ```bash
   npm run dev
   ```

2. Navigate to `/dashboard`

3. Drag & drop a file

4. Monitor:
   - Browser DevTools Network tab for S3 PUT request
   - Terminal for API logs
   - Database for `Conversion` and `UsageQuota` records

## Dependencies

**Backend:**
- `@aws-sdk/client-s3` - S3 operations
- `@aws-sdk/s3-request-presigner` - Presigned URLs
- `file-type` - Magic number detection
- `uuid` - File ID generation

**Frontend:**
- `react-dropzone` - Drag & drop interface

## Next Steps

After upload infrastructure:

1. **Phase 6**: Implement conversion engines (Sharp, LibreOffice, CloudConvert)
2. **Phase 7**: Set up BullMQ job queue for background processing
3. **Phase 8**: Add SSE for real-time conversion progress
4. **Phase 9**: Implement download functionality

## Troubleshooting

**Upload fails with 403:**
- Check LocalStack is running: `docker ps`
- Verify bucket exists: `aws s3 ls --endpoint-url=http://localhost:4566`

**Quota exceeded:**
- Reset quota: Delete `UsageQuota` record for today
- Check subscription tier in database

**File detection fails:**
- Ensure `file-type` supports format
- Fallback to extension-based detection
- Add custom MIME type to `MIME_TYPE_MAP`
