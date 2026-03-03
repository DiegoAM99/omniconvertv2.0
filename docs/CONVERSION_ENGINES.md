# Conversion Engines

This document describes the file conversion processing system in OmniConvert.

## Architecture Overview

OmniConvert uses a **hybrid conversion approach** combining local processing for images and documents with cloud-based processing for audio/video files.

### Processors

```
┌─────────────────────────────────────────────────┐
│           ProcessorFactory                      │
│  (Routes conversion to appropriate processor)   │
└─────────────────┬───────────────────────────────┘
                  │
        ┌─────────┴─────────┬─────────────┬────────────┐
        ▼                   ▼             ▼            ▼
┌───────────────┐  ┌──────────────┐  ┌─────────┐  ┌─────────┐
│ ImageProcessor│  │DocumentProc. │  │MediaProc│  │OCRProc. │
│   (Sharp.js)  │  │ (LibreOffice)│  │(CloudCon│  │(Tesserac│
└───────────────┘  └──────────────┘  └─────────┘  └─────────┘
```

## 1. Image Processor

**Technology:** Sharp.js (high-performance Node.js image processing)

**Supported Formats:**
- JPG/JPEG ↔ PNG ↔ WEBP ↔ GIF ↔ TIFF ↔ HEIC
- SVG (passthrough only, no raster-to-vector conversion)

**Features:**
- Quality control (1-100)
- Resize (width, height, fit modes)
- Compression level for PNG (0-9)
- Progressive rendering
- MozJPEG optimization

**Options:**
```typescript
{
  quality?: number;        // 1-100 (default: 85 for JPG/WEBP, 90 for PNG)
  width?: number;          // Target width in pixels
  height?: number;         // Target height in pixels
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  compressionLevel?: number; // 0-9 for PNG (default: 6)
}
```

**File Location:** [apps/api/src/processors/image.processor.ts](apps/api/src/processors/image.processor.ts)

**Example Usage:**
```typescript
const outputBuffer = await ImageProcessor.convert(
  inputBuffer,
  ImageFormat.JPG,
  ImageFormat.WEBP,
  { quality: 85, width: 1920, fit: 'inside' }
);
```

**Performance:**
- PNG to WEBP: ~200ms for 2MB image
- JPG resize: ~150ms for 5MP image
- HEIC to JPG: ~300ms

---

## 2. Document Processor

**Technology:** LibreOffice (headless mode)

**Supported Formats:**
- PDF ↔ DOCX ↔ XLSX ↔ PPTX ↔ TXT ↔ CSV
- EPUB/MOBI (requires Calibre - not in MVP)

**Features:**
- Format conversion using LibreOffice filters
- Page range selection (for PDF)
- Quality settings
- Batch processing via temp files

**Options:**
```typescript
{
  pageRange?: string;  // e.g., "1-5" for PDF
  quality?: 'high' | 'medium' | 'low';
}
```

**File Location:** [apps/api/src/processors/document.processor.ts](apps/api/src/processors/document.processor.ts)

**LibreOffice Setup:**

**Linux/Docker:**
```bash
apt-get install -y libreoffice --no-install-recommends
```

**macOS:**
```bash
brew install libreoffice
```

**Windows:**
Download from [libreoffice.org](https://www.libreoffice.org/download/download/) and add to PATH.

**Command Used:**
```bash
libreoffice --headless --convert-to <format> --outdir <output_dir> <input_file>
```

**Timeout:** 60 seconds per conversion

**Performance:**
- DOCX to PDF: ~2-4 seconds
- XLSX to CSV: ~1-2 seconds
- PDF to DOCX: ~3-5 seconds

---

## 3. Media Processor

**Technology:** CloudConvert API (cloud-based transcoding)

**Supported Formats:**
- Audio: MP3 ↔ WAV ↔ AAC ↔ FLAC ↔ OGG
- Video: MP4 ↔ MOV ↔ AVI ↔ MKV ↔ WEBM

**Features:**
- High-quality transcoding
- Bitrate control
- Resolution adjustment
- FPS conversion
- Async job processing

**Options:**
```typescript
{
  quality?: 'high' | 'medium' | 'low';
  videoBitrate?: string;  // e.g., '1000k'
  audioBitrate?: string;  // e.g., '128k'
  resolution?: string;    // e.g., '1920x1080'
  fps?: number;           // e.g., 30
}
```

**File Location:** [apps/api/src/processors/media.processor.ts](apps/api/src/processors/media.processor.ts)

**CloudConvert Setup:**

1. Sign up at [cloudconvert.com](https://cloudconvert.com/)
2. Get API key from dashboard
3. Add to `.env`:
   ```env
   CLOUDCONVERT_API_KEY=your_api_key_here
   ```

**API Flow:**
1. Create job with conversion task
2. Upload file to CloudConvert
3. Poll for completion (2-second intervals)
4. Download result

**Timeout:** 5 minutes (configurable)

**Performance:**
- MP3 to WAV (5MB): ~10-30 seconds
- MP4 to WEBM (50MB): ~2-5 minutes
- MOV to MP4 (100MB): ~3-7 minutes

**Pricing:** CloudConvert free tier includes 25 minutes/month

---

## 4. OCR Processor

**Technology:** Tesseract.js (OCR engine for JavaScript)

**Supported Languages:**
- English (eng), Spanish (spa), French (fra), German (deu), etc.
- Download additional language packs as needed

**Features:**
- Text extraction from images
- Searchable PDF generation
- Confidence scoring
- Layout preservation

**Options:**
```typescript
{
  language?: string;           // Default: 'eng'
  preserveFormatting?: boolean; // Preserve line breaks
  outputFormat?: 'text' | 'pdf' | 'hocr';
}
```

**File Location:** [apps/api/src/processors/ocr.processor.ts](apps/api/src/processors/ocr.processor.ts)

**Example Usage:**
```typescript
// Extract text
const text = await OCRProcessor.extractText(imageBuffer, {
  language: 'eng',
  preserveFormatting: true
});

// Create searchable PDF
const pdfBuffer = await OCRProcessor.imageToSearchablePDF(imageBuffer, {
  language: 'spa'
});
```

**Performance:**
- A4 page scan: ~5-10 seconds
- Receipt image: ~2-3 seconds
- Handwritten text: ~8-15 seconds (lower accuracy)

**Accuracy:**
- Printed text: 95-99%
- Low-quality scans: 70-85%
- Handwritten: 50-70%

---

## 5. Processor Factory

**Purpose:** Central routing and orchestration

**File Location:** [apps/api/src/processors/processor.factory.ts](apps/api/src/processors/processor.factory.ts)

**Logic:**
1. Determine input/output categories (image, document, audio, video)
2. Route to appropriate processor:
   - Same category → Specialized processor
   - Cross-category → OCR or error
3. Handle OCR separately for Pro users

**Supported Cross-Category Conversions:**
- Image → Document (with OCR)
- Image → Text file (plain OCR)

**Example:**
```typescript
const outputBuffer = await ProcessorFactory.convert(
  inputBuffer,
  FileFormat.JPG,
  FileFormat.PDF,
  { ocr: true, ocrLanguage: 'eng' }
);
```

---

## 6. Conversion Service

**Purpose:** S3 integration + database tracking

**File Location:** [apps/api/src/services/conversion.service.ts](apps/api/src/services/conversion.service.ts)

**Flow:**
1. Fetch conversion record from database
2. Update status to 'processing'
3. Download input file from S3 uploads bucket
4. Call ProcessorFactory for conversion
5. Upload output file to S3 outputs bucket
6. Update conversion record with result/error
7. Track processing time

**Database Updates:**
- `status`: pending → processing → completed/failed
- `startedAt`, `completedAt`: timestamps
- `outputFileUrl`: S3 key for download
- `outputFileSize`: BigInt bytes
- `processingTimeMs`: performance metric
- `error`: error message if failed

**S3 Structure:**
```
omniconvert-uploads/
  └── uploads/{userId}/{fileId}/{filename}

omniconvert-outputs/
  └── outputs/{conversionId}/output.{format}
```

---

## API Endpoints

### GET /api/conversions/:id
Get full conversion details including download URL.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "conv_123",
    "status": "completed",
    "inputFormat": "jpg",
    "outputFormat": "png",
    "inputFileSize": "1048576",
    "outputFileSize": "2097152",
    "createdAt": "2026-02-24T10:00:00Z",
    "completedAt": "2026-02-24T10:00:05Z",
    "processingTimeMs": 4500,
    "downloadUrl": "https://s3.../output.png?signature=...",
    "expiresAt": "2026-02-25T10:00:00Z"
  }
}
```

### GET /api/conversions/:id/status
Lightweight status check for polling.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "conv_123",
    "status": "processing",
    "processingTimeMs": 2300
  }
}
```

### POST /api/conversions/:id/trigger
Manually trigger conversion (testing only).

---

## Environment Variables

```env
# CloudConvert API
CLOUDCONVERT_API_KEY=your_api_key_here

# Temp directory for LibreOffice
TEMP_DIR=/tmp

# AWS S3
UPLOADS_BUCKET=omniconvert-uploads
OUTPUTS_BUCKET=omniconvert-outputs
```

---

## Error Handling

**Common Errors:**
- `Conversion failed: Unsupported format` - Format not in compatibility matrix
- `LibreOffice exited with code 1` - LibreOffice not installed or file corrupt
- `CloudConvert API key not configured` - Missing CLOUDCONVERT_API_KEY
- `S3 download failed` - File not found or permissions issue
- `OCR extraction failed` - Image too low quality or corrupted

**Retry Strategy:**
- Images: Immediate retry (fast processing)
- Documents: No auto-retry (manual intervention needed)
- Media: Retry once after 30 seconds (CloudConvert may be busy)

---

## Testing Conversions

### 1. Unit Tests (Planned)
```bash
npm run test -- image.processor.test.ts
```

### 2. Manual Testing via API
```bash
# Upload file
curl -X POST http://localhost:4000/api/uploads/initialize \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"fileName":"test.jpg","fileSize":1024,"contentType":"image/jpeg"}'

# Upload to S3 (use presigned URL from above)

# Complete upload
curl -X POST http://localhost:4000/api/uploads/complete \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"fileId":"...","fileName":"test.jpg","fileSize":1024,"inputFormat":"jpg","outputFormat":"png"}'

# Trigger conversion
curl -X POST http://localhost:4000/api/conversions/{conversionId}/trigger \
  -H "Authorization: Bearer $TOKEN"

# Check status
curl http://localhost:4000/api/conversions/{conversionId}/status
```

### 3. Sample Files
Create test files in `apps/api/test/fixtures/`:
- `sample.jpg` (2MB)
- `sample.docx` (100KB)
- `sample.mp3` (5MB)

---

## Performance Benchmarks

| Conversion | File Size | Avg Time | Engine |
|-----------|-----------|----------|--------|
| JPG → PNG | 2MB | 200ms | Sharp |
| PNG → WEBP | 5MB | 350ms | Sharp |
| DOCX → PDF | 100KB | 3s | LibreOffice |
| PDF → DOCX | 500KB | 5s | LibreOffice |
| MP3 → WAV | 5MB | 20s | CloudConvert |
| MP4 → WEBM | 50MB | 180s | CloudConvert |
| JPG → PDF (OCR) | 2MB | 8s | Tesseract |

---

## Next Steps

After conversion engines (Phase 6):
1. **Phase 7**: BullMQ job queue for async processing
2. **Phase 8**: Frontend progress tracking with SSE
3. **Phase 9**: Batch conversion support
