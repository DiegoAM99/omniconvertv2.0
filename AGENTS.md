# OmniConvert - Agents & System Architecture

## 📋 Overview

This document describes the different agents and processes that compose the OmniConvert application, their roles, responsibilities, and interactions.

**Last Updated**: March 3, 2026  
**Version**: 1.0.0

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│                   (http://localhost:3000)                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      WEB AGENT (Next.js)                         │
│  - Upload Interface                                              │
│  - Progress Tracking (SSE)                                       │
│  - File Download                                                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP/REST
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API AGENT (Express)                          │
│  - File Upload Handler                                           │
│  - Queue Manager                                                 │
│  - Progress Stream (SSE)                                         │
│  - Download Handler                                              │
└─────────┬───────────────┬─────────────────┬─────────────────────┘
          │               │                 │
          ▼               ▼                 ▼
    ┌─────────┐   ┌──────────────┐   ┌──────────┐
    │PostgreSQL│   │ Redis/BullMQ │   │LocalStack│
    │Database  │   │    Queue     │   │   S3     │
    └─────────┘   └──────┬───────┘   └──────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  WORKER AGENT        │
              │  - Job Processing    │
              │  - File Conversion   │
              │  - Progress Updates  │
              └──────────────────────┘
```

---

## 🌐 Agent 1: Web Application (Frontend)

### Purpose
User-facing interface for file upload, conversion tracking, and download.

### Technology Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript, React
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **API Client**: Custom fetch wrapper

### Location
```
apps/web/
├── src/
│   ├── app/              # Next.js pages
│   ├── components/       # React components
│   ├── hooks/            # Custom hooks
│   └── lib/              # API client
```

### Key Components

#### 1. **UploadZone Component** (`components/UploadZone.tsx`)
**Responsibilities**:
- Drag & drop file upload
- File format selection
- Upload progress tracking
- Conversion initiation

**Key Features**:
- `react-dropzone` for file handling
- Direct upload to API with progress callbacks
- Format auto-detection
- Error handling and display

**State Management**:
```typescript
const [selectedFile, setSelectedFile] = useState<File | null>(null);
const [selectedFormat, setSelectedFormat] = useState<string>('');
const [currentConversion, setCurrentConversion] = useState<string | null>(null);
const [uploading, setUploading] = useState(false);
const [uploadProgress, setUploadProgress] = useState(0);
```

#### 2. **ConversionProgress Component** (`components/ConversionProgress.tsx`)
**Responsibilities**:
- Real-time conversion status display
- Progress bar visualization
- Download button when complete
- Error state handling

**Communication**:
- Uses `useConversionProgress` hook
- Server-Sent Events (SSE) for real-time updates
- Polls API endpoint: `/api/progress/{conversionId}`

#### 3. **useConversionProgress Hook** (`hooks/useConversionProgress.ts`)
**Responsibilities**:
- Establish SSE connection to API
- Parse progress updates
- Manage connection lifecycle

**Data Flow**:
```typescript
EventSource → Parse JSON → Update State → UI Re-render
```

**Events Handled**:
- `connected`: Connection established
- `progress`: Conversion progress update
- `done`: Conversion completed
- `error`: Conversion failed

### API Communication

```typescript
// Upload file
POST /api/uploads/direct
Body: FormData with file, inputFormat, outputFormat

// Track progress
GET /api/progress/{conversionId} (SSE)

// Download result
GET /api/conversions/{conversionId}/download
```

### Environment Variables
```env
NEXTAUTH_SECRET=dev-nextauth-secret-...
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Running the Agent
```bash
cd apps/web
npm run dev
```

**Port**: 3000  
**URL**: http://localhost:3000

---

## 🔧 Agent 2: API Server (Backend)

### Purpose
Central orchestrator for file uploads, queue management, and conversion coordination.

### Technology Stack
- **Framework**: Express.js
- **Language**: TypeScript
- **Database ORM**: Prisma
- **Queue**: BullMQ
- **Storage**: AWS SDK (S3)
- **Logger**: Pino

### Location
```
apps/api/
├── src/
│   ├── config/           # Configuration modules
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Auth, errors, rate limiting
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── queues/           # Queue management
│   └── index.ts          # Server entry point
```

### Key Modules

#### 1. **Upload Controller** (`controllers/upload.controller.ts`)
**Responsibilities**:
- Handle multipart file uploads
- Validate file types and sizes
- Upload to S3 (LocalStack)
- Create conversion record in database
- Add job to BullMQ queue

**Flow**:
```
1. Receive file from client
2. Detect MIME type and validate
3. Upload to S3 (omniconvert-uploads bucket)
4. Create Conversion record in PostgreSQL
5. Add job to BullMQ queue
6. Return conversionId to client
```

#### 2. **Progress Controller** (`controllers/progress.controller.ts`)
**Responsibilities**:
- Establish Server-Sent Events (SSE) connection
- Poll BullMQ for job progress
- Stream updates to client

**SSE Event Types**:
```typescript
{ type: 'connected', conversionId: string }
{ type: 'progress', status: string, progress: { stage, percentage } }
{ type: 'done', status: 'completed' | 'failed' }
{ type: 'error', message: string }
```

**Polling Interval**: 1 second

#### 3. **Conversion Controller** (`controllers/conversion.controller.ts`)
**Responsibilities**:
- Fetch conversion details
- Generate presigned S3 download URLs
- Handle file downloads (redirect to S3)

#### 4. **S3 Service** (`services/s3.service.ts`)
**Responsibilities**:
- Upload files to S3/LocalStack
- Download files from S3
- Generate presigned URLs
- Configure S3 client for LocalStack

**Configuration**:
```typescript
endpoint: process.env.AWS_ENDPOINT_URL || 'http://localhost:4566'
region: 'us-east-1'
credentials: { accessKeyId: 'test', secretAccessKey: 'test' }
forcePathStyle: true  // Required for LocalStack
```

#### 5. **Conversion Queue** (`queues/conversion.queue.ts`)
**Responsibilities**:
- Create and manage BullMQ queue
- Add conversion jobs with priority
- Track job progress
- Handle job lifecycle events

**Queue Configuration**:
```typescript
attempts: 3                    // Retry failed jobs 3 times
backoff: exponential (5s)      // Exponential backoff between retries
removeOnComplete: 24h, 1000    // Keep completed jobs
removeOnFail: 7d, 500         // Keep failed jobs
```

**Job Priority**:
- Pro users: 10
- Free users: 5
- Anonymous: 1

### Database Schema (Prisma)

**Conversion Model**:
```prisma
model Conversion {
  id              String    @id @default(uuid())
  userId          String?
  status          String    // pending, processing, completed, failed
  inputFormat     String
  outputFormat    String
  inputFileUrl    String
  outputFileUrl   String?
  inputFileSize   BigInt
  outputFileSize  BigInt?
  error           String?
  errorMessage    String?
  processingTimeMs Int?
  options         Json?
  startedAt       DateTime?
  completedAt     DateTime?
  expiresAt       DateTime
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

### Environment Variables
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/omniconvert"
REDIS_URL="redis://localhost:6379"
AWS_ENDPOINT_URL="http://localhost:4566"
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="test"
AWS_SECRET_ACCESS_KEY="test"
S3_UPLOADS_BUCKET="omniconvert-uploads"
S3_OUTPUTS_BUCKET="omniconvert-outputs"
JWT_SECRET="dev-jwt-secret-..."
PORT="4000"
NODE_ENV="development"
```

### Running the Agent
```bash
cd apps/api
npm run dev
```

**Port**: 4000  
**URL**: http://localhost:4000

---

## 👷 Agent 3: Worker (Background Processor)

### Purpose
Process conversion jobs from the queue, convert files, and update job status.

### Technology Stack
- **Queue Client**: BullMQ Worker
- **Language**: TypeScript
- **PDF Processing**: pdf-parse v1.1.1
- **OCR**: Tesseract.js v5.0.4
- **Document Generation**: docx v9.6.0
- **PDF to Image**: pdf-to-img v5.0.0

### Location
```
apps/api/
├── src/
│   ├── workers/
│   │   └── conversion.worker.ts
│   ├── processors/
│   │   ├── document.processor.ts
│   │   ├── mock-document.processor.js
│   │   ├── image.processor.ts
│   │   ├── media.processor.ts
│   │   ├── ocr.processor.ts
│   │   └── processor.factory.ts
│   └── worker.ts (entry point)
```

### Conversion Worker (`workers/conversion.worker.ts`)

**Responsibilities**:
- Listen to BullMQ queue
- Process conversion jobs
- Update job progress
- Handle errors and retries

**Job Processing Flow**:
```
1. Receive job from queue
2. Download input file from S3
3. Process conversion (via processor factory)
4. Upload output file to S3
5. Update database record
6. Mark job as complete
```

**Progress Stages**:
```typescript
downloading   // 10%  - Downloading input from S3
processing    // 50%  - Converting file
uploading     // 90%  - Uploading result to S3
completed     // 100% - Done
```

**Configuration**:
```typescript
concurrency: 3           // Process 3 jobs simultaneously
limiter: {
  max: 10,              // Max 10 jobs
  duration: 60000       // Per minute
}
```

### Processor Factory (`processors/processor.factory.ts`)

**Purpose**: Route conversion jobs to appropriate processor based on file type.

**Processor Types**:
1. **DocumentProcessor**: PDF, DOCX, XLSX, PPTX, TXT, CSV
2. **ImageProcessor**: JPG, PNG, WEBP, GIF, SVG
3. **MediaProcessor**: MP3, MP4, MOV, AVI
4. **OCRProcessor**: Scanned PDFs

### Mock Document Processor (`processors/mock-document.processor.js`)

**Current Implementation**: PDF to DOCX conversion

**Features**:
1. **Text Extraction**:
   ```javascript
   const pdfData = await pdfParse(pdfBuffer);
   const text = pdfData.text;
   ```

2. **OCR Fallback** (when no text found):
   ```javascript
   // Convert PDF to images
   const images = await pdf(pdfBuffer, { scale: 2.0 });
   
   // OCR each page
   const worker = await Tesseract.createWorker('spa');
   const { data } = await worker.recognize(imageBuffer);
   ```

3. **DOCX Generation**:
   ```javascript
   const doc = new Document({
     sections: [{
       children: paragraphs  // Text split into paragraphs
     }]
   });
   return await Packer.toBuffer(doc);
   ```

**OCR Configuration**:
- **Language**: Spanish ('spa')
- **Scale**: 2.0 (higher quality)
- **Engine**: Tesseract.js v5

### Error Handling

**Retry Strategy**:
```typescript
attempts: 3
backoff: {
  type: 'exponential',
  delay: 5000  // 5s, 10s, 20s
}
```

**Error Types Handled**:
- S3 download failures
- Conversion processing errors
- S3 upload failures
- Database update errors

### Running the Agent
```bash
cd apps/api
npm run dev:worker
```

**Logs**:
- Job processing start/end
- Download/upload progress
- Conversion errors
- OCR progress

---

## 🗄️ Agent 4: Database (PostgreSQL)

### Purpose
Persistent storage for conversion records, user data, and application state.

### Technology
- **Database**: PostgreSQL 16 Alpine
- **ORM**: Prisma
- **Container**: Docker

### Configuration
```yaml
postgres:
  image: postgres:16-alpine
  container_name: omniconvert-postgres
  environment:
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: postgres
    POSTGRES_DB: omniconvert
  ports:
    - '5432:5432'
  volumes:
    - postgres_data:/var/lib/postgresql/data
```

### Schema Management

**Migrations**:
```
apps/api/prisma/migrations/
├── 20260224174129_init/
└── 20260224195003_add_conversion_timestamps/
```

**Commands**:
```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Open Prisma Studio
npm run prisma:studio
```

### Running the Agent
```bash
docker-compose up -d postgres
```

**URL**: postgresql://postgres:postgres@localhost:5432/omniconvert

---

## 📦 Agent 5: Redis & Queue (BullMQ)

### Purpose
Job queue management, caching, and real-time progress tracking.

### Technology
- **Database**: Redis 7 Alpine
- **Queue Library**: BullMQ
- **Container**: Docker

### Configuration
```yaml
redis:
  image: redis:7-alpine
  container_name: omniconvert-redis
  ports:
    - '6379:6379'
  volumes:
    - redis_data:/data
```

### Queue Structure

**Queue Name**: `conversion`

**Job Data**:
```typescript
{
  conversionId: string;
  userId: string | null;
  inputFormat: string;
  outputFormat: string;
  options?: any;
}
```

**Job Progress**:
```typescript
{
  stage: 'downloading' | 'processing' | 'uploading' | 'completed';
  percentage: number;
  message?: string;
}
```

### Event Monitoring

**Events Tracked**:
- `completed`: Job finished successfully
- `failed`: Job failed after retries
- `progress`: Job progress updated

### Running the Agent
```bash
docker-compose up -d redis
```

**URL**: redis://localhost:6379

---

## ☁️ Agent 6: Storage (LocalStack S3)

### Purpose
Local S3-compatible object storage for file uploads and outputs.

### Technology
- **Service**: LocalStack
- **AWS Service**: S3
- **Container**: Docker

### Configuration
```yaml
localstack:
  image: localstack/localstack:latest
  container_name: omniconvert-s3
  environment:
    SERVICES: s3
    DEBUG: 0
    AWS_DEFAULT_REGION: us-east-1
  ports:
    - '4566:4566'
```

### Buckets

**Initialized by** `init-s3.js`:

1. **omniconvert-uploads**
   - Stores uploaded input files
   - Path: `uploads/{userId or 'anonymous'}/{uuid}/{filename}`

2. **omniconvert-outputs**
   - Stores converted output files
   - Path: `outputs/{conversionId}/output.{format}`

**CORS Configuration**:
```javascript
{
  AllowedHeaders: ['*'],
  AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
  AllowedOrigins: ['*'],
  ExposeHeaders: ['ETag'],
  MaxAgeSeconds: 3000
}
```

### Initialization Script (`init-s3.js`)

**Purpose**: Create and configure S3 buckets on LocalStack

**Run**:
```bash
node init-s3.js
```

**Output**:
```
✓ Created bucket: omniconvert-uploads
✓ CORS configured for omniconvert-uploads
✓ Created bucket: omniconvert-outputs
✓ CORS configured for omniconvert-outputs
✅ S3 initialization complete!
```

### Running the Agent
```bash
docker-compose up -d localstack
node init-s3.js  # Initialize buckets
```

**URL**: http://localhost:4566

---

## 🔄 Agent Communication Flow

### Complete Conversion Lifecycle

```
1. USER uploads file via Web Agent
   ↓
2. Web Agent sends file to API Agent (POST /api/uploads/direct)
   ↓
3. API Agent:
   - Uploads file to S3 Agent
   - Creates record in Database Agent
   - Adds job to Queue Agent
   - Returns conversionId
   ↓
4. Web Agent connects to Progress stream (SSE)
   ↓
5. Worker Agent:
   - Picks job from Queue Agent
   - Downloads file from S3 Agent
   - Processes conversion
   - Uploads result to S3 Agent
   - Updates Database Agent
   - Updates progress in Queue Agent
   ↓
6. API Agent streams progress to Web Agent via SSE
   ↓
7. Web Agent displays download button
   ↓
8. USER downloads file
   ↓
9. API Agent generates presigned URL from S3 Agent
   ↓
10. Browser downloads directly from S3 Agent
```

---

## 🚀 Starting All Agents

### Development Mode

**Terminal 1** - Infrastructure:
```bash
# Start Docker services
docker-compose up -d

# Initialize S3 buckets
node init-s3.js
```

**Terminal 2** - API + Web:
```bash
# Start API and Web (Turborepo)
npm run dev
```

**Terminal 3** - Worker:
```bash
cd apps/api
npm run dev:worker
```

### Verification

Check all agents are running:

```bash
# Web Agent
curl http://localhost:3000

# API Agent
curl http://localhost:4000/health

# Database Agent
docker-compose ps postgres

# Redis Agent
docker-compose ps redis

# S3 Agent
docker-compose ps localstack

# Worker Agent
# Check Terminal 3 for worker logs
```

---

## 📊 Agent Monitoring

### Logs

**API Agent**:
```bash
# Pino JSON logs in console
{"level":30,"time":...,"msg":"✅ Redis connected"}
{"level":30,"time":...,"msg":"✅ Database connected"}
```

**Worker Agent**:
```bash
{"level":30,"time":...,"msg":"Worker processing job ..."}
{"level":30,"time":...,"msg":"Starting conversion ..."}
{"level":30,"time":...,"msg":"Conversion completed in 130ms"}
```

**Docker Services**:
```bash
docker-compose logs -f postgres
docker-compose logs -f redis
docker-compose logs -f localstack
```

### Health Checks

**API Health**:
```bash
curl http://localhost:4000/health
```

**Database Connection**:
```bash
docker exec omniconvert-postgres psql -U postgres -d omniconvert -c "SELECT COUNT(*) FROM \"Conversion\";"
```

**Redis Connection**:
```bash
docker exec omniconvert-redis redis-cli PING
```

**S3 Buckets**:
```bash
node -e "const {S3Client,ListBucketsCommand}=require('@aws-sdk/client-s3');const s3=new S3Client({endpoint:'http://localhost:4566',region:'us-east-1',credentials:{accessKeyId:'test',secretAccessKey:'test'},forcePathStyle:true});s3.send(new ListBucketsCommand({})).then(r=>console.log(r.Buckets))"
```

---

## 🔧 Agent Configuration Summary

| Agent | Port | Technology | Purpose |
|-------|------|------------|---------|
| Web | 3000 | Next.js 14 | User Interface |
| API | 4000 | Express.js | Backend Server |
| Worker | - | BullMQ Worker | Job Processing |
| PostgreSQL | 5432 | PostgreSQL 16 | Database |
| Redis | 6379 | Redis 7 | Queue & Cache |
| LocalStack | 4566 | LocalStack S3 | Object Storage |

---

## 📚 Additional Resources

- **Main README**: [README.md](./README.md)
- **Setup Guide**: [SETUP.md](./SETUP.md)
- **Project Status**: [PROJECT_STATUS.md](./PROJECT_STATUS.md)
- **Conversion Engines**: [docs/CONVERSION_ENGINES.md](./docs/CONVERSION_ENGINES.md)

---

**Last Updated**: March 3, 2026  
**Repository**: https://github.com/DiegoAM99/App-VSCode.git  
**Status**: ✅ All Agents Operational
