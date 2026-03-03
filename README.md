# OmniConvert - Universal File Conversion Platform

A powerful SaaS platform for converting documents, images, audio, and video files with automatic format detection and intelligent conversion.

## ✨ Current Status

**Version**: 1.0.0 (Development Ready)  
**Last Updated**: March 3, 2026

### ✅ Implemented Features

- ✅ **PDF to DOCX Conversion**: Full text extraction with OCR fallback support
- ✅ **Real-time Progress Tracking**: Server-Sent Events (SSE) for live conversion updates
- ✅ **Background Job Processing**: BullMQ + Redis queue system with worker
- ✅ **S3 Storage**: LocalStack integration for local development
- ✅ **File Upload**: Direct browser upload with progress tracking
- ✅ **Database**: PostgreSQL with Prisma ORM migrations
- ✅ **Modern UI**: Next.js 14 with Tailwind CSS

### 🎯 Key Capabilities

- **Document Processing**: PDF text extraction using pdf-parse v1.1.1
- **OCR Support**: Tesseract.js for scanned PDF processing
- **Queue Management**: Automatic retry and error handling
- **Progress Monitoring**: Real-time conversion status updates
- **Secure Storage**: Automatic file cleanup and presigned URLs

## 🚀 Features

- **Universal Format Support**: Documents (PDF, DOCX, XLSX, PPTX, TXT, CSV, EPUB, MOBI), Images (JPG, PNG, WEBP, GIF, SVG, HEIC, TIFF), Audio (MP3, WAV, AAC, FLAC, OGG), Video (MP4, MOV, AVI, MKV, WEBM)
- **Intelligent Detection**: Automatic file type recognition via magic numbers/MIME types
- **Batch Processing**: Convert multiple files simultaneously
- **OCR Support**: Extract text from scanned PDFs and images with Tesseract.js
- **Secure & Private**: Automatic 24-hour file deletion, end-to-end encryption
- **Freemium Model**: Free tier (50MB, 5 conversions/day) + Pro tier (2GB, unlimited)

## 📦 Monorepo Structure

```
omniconvert/
├── apps/
│   ├── web/          # Next.js 14 frontend (App Router)
│   ├── api/          # Express.js backend API
│   └── worker/       # Conversion job worker
├── packages/
│   ├── types/        # Shared TypeScript types
│   ├── api-client/   # Type-safe API client
│   ├── ui/           # React component library
│   └── utils/        # Shared utilities
└── turbo.json        # Turborepo configuration
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL 16 with Prisma ORM
- **Queue**: BullMQ + Redis 7
- **Storage**: AWS S3 (LocalStack for local development)
- **Auth**: NextAuth.js (Email/Password, Google OAuth)
- **Payments**: Paddle (optional)
- **PDF Processing**: pdf-parse v1.1.1, pdf-to-img v5.0.0
- **OCR**: Tesseract.js v5.0.4
- **Document Generation**: docx v9.6.0
- **Deployment**: Docker Compose (local), Vercel (web), Railway (API + worker)

## 🚦 Getting Started

### Prerequisites

- **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- **npm** >= 9.0.0 (included with Node.js)
- **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop/))
- **Git** ([Download](https://git-scm.com/downloads))

### Quick Start (Windows/Mac/Linux)

```bash
# 1. Clone the repository
git clone https://github.com/DiegoAM99/App-VSCode.git
cd APP

# 2. Install all dependencies
npm install

# 3. Start Docker services (PostgreSQL, Redis, LocalStack S3)
docker-compose up -d

# 4. Initialize S3 buckets in LocalStack
node init-s3.js

# 5. Configure environment variables (already configured for local dev)
# Files created: apps/api/.env and apps/web/.env

# 6. Run database migrations
cd apps/api
npm run prisma:generate
npm run prisma:migrate
cd ../..

# 7. Start all services
npm run dev

# 8. In a separate terminal, start the worker
cd apps/api
npm run dev:worker
```

### Services URLs

After running `npm run dev`, the following services will be available:

- 🌐 **Web Application**: http://localhost:3000
- 🔧 **API Server**: http://localhost:4000
- 🗄️ **PostgreSQL**: localhost:5432 (user: postgres, password: postgres, db: omniconvert)
- 📦 **Redis**: localhost:6379
- ☁️ **LocalStack S3**: http://localhost:4566
- 👷 **Worker**: Background process (check terminal for logs)

### Environment Variables

The application comes pre-configured with development environment variables:

**apps/api/.env**:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/omniconvert?schema=public"
REDIS_URL="redis://localhost:6379"
AWS_ENDPOINT_URL="http://localhost:4566"
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="test"
AWS_SECRET_ACCESS_KEY="test"
S3_UPLOADS_BUCKET="omniconvert-uploads"
S3_OUTPUTS_BUCKET="omniconvert-outputs"
JWT_SECRET="dev-jwt-secret-key-change-in-production-256bit"
PORT="4000"
NODE_ENV="development"
```

**apps/web/.env**:
```env
NEXTAUTH_SECRET="dev-nextauth-secret-a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

## 📝 Development

### Running the Application

```bash
# Terminal 1: Start all apps (web + api)
npm run dev

# Terminal 2: Start the worker
cd apps/api
npm run dev:worker
```

### Available Scripts

```bash
# Development
npm run dev                 # Start all apps in watch mode
npm run build              # Build all apps for production
npm run lint               # Lint all code
npm run format             # Format code with Prettier
npm run clean              # Clean build artifacts

# Database (from apps/api)
npm run prisma:generate    # Generate Prisma Client
npm run prisma:migrate     # Run database migrations
npm run prisma:studio      # Open Prisma Studio GUI

# Worker
npm run dev:worker         # Start worker in development mode
npm run start:worker       # Start worker in production mode
```

### Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart a specific service
docker-compose restart postgres
docker-compose restart redis
docker-compose restart localstack

# View running containers
docker-compose ps
```

### Project Structure

```
APP/
├── apps/
│   ├── api/                      # Backend API
│   │   ├── src/
│   │   │   ├── config/          # Configuration (DB, Redis, S3, Logger)
│   │   │   ├── controllers/     # Request handlers
│   │   │   ├── middleware/      # Auth, error handling, rate limiting
│   │   │   ├── processors/      # File conversion processors
│   │   │   │   ├── document.processor.ts
│   │   │   │   ├── mock-document.processor.js  # PDF-DOCX converter
│   │   │   │   ├── image.processor.ts
│   │   │   │   └── processor.factory.ts
│   │   │   ├── queues/         # BullMQ queue configuration
│   │   │   ├── routes/         # API routes
│   │   │   ├── services/       # Business logic
│   │   │   ├── workers/        # Background job workers
│   │   │   ├── index.ts        # API server entry
│   │   │   └── worker.ts       # Worker entry
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Database schema
│   │   │   └── migrations/     # Database migrations
│   │   └── .env               # API environment variables
│   └── web/                    # Frontend Next.js app
│       ├── src/
│       │   ├── app/           # Next.js App Router
│       │   ├── components/    # React components
│       │   │   ├── UploadZone.tsx
│       │   │   ├── ConversionProgress.tsx
│       │   │   └── ConversionHistory.tsx
│       │   ├── hooks/         # Custom React hooks
│       │   ├── lib/           # Utilities and API client
│       │   └── types/         # TypeScript types
│       └── .env              # Web environment variables
├── packages/
│   ├── types/                # Shared TypeScript types
│   └── utils/                # Shared utilities
├── docker-compose.yml        # Docker services configuration
├── init-s3.js               # S3 bucket initialization script
├── package.json             # Root package.json
└── turbo.json              # Turborepo configuration
```

## 🧪 Testing

### Manual Testing

1. Open http://localhost:3000
2. Upload a PDF file
3. Select "DOCX" as output format
4. Click "Convert to DOCX"
5. Watch real-time progress
6. Download the converted file

### Testing PDF Conversion

```bash
cd apps/api

# Test pdf-parse import
node test-pdf-parse.js

# Test PDF class
node test-pdf-class.js
```

### Verifying Services

```bash
# Check Docker services
docker-compose ps

# Check if buckets are created
node init-s3.js

# View worker logs
# (Worker terminal will show processing logs)

# Check database
cd apps/api
npm run prisma:studio
```

## 🐛 Troubleshooting

### Worker not processing conversions

**Problem**: Files upload but conversion never completes  
**Solution**: Make sure the worker is running
```bash
cd apps/api
npm run dev:worker
```

### S3 bucket errors

**Problem**: "Bucket not found" or "Failed to download from S3"  
**Solution**: Initialize S3 buckets
```bash
node init-s3.js
```

### pdf-parse errors

**Problem**: "pdfParse is not a function"  
**Solution**: Ensure pdf-parse version 1.1.1 is installed
```bash
cd apps/api
npm install pdf-parse@1.1.1 --save
```

### Docker not running

**Problem**: "Cannot connect to Docker daemon"  
**Solution**: Start Docker Desktop and wait for it to fully initialize

### Port already in use

**Problem**: "Port 3000/4000 already in use"  
**Solution**: Kill the process using the port
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

### Database connection errors

**Problem**: "Can't reach database server"  
**Solution**: Ensure PostgreSQL is running
```bash
docker-compose restart postgres
```

## 🔧 Configuration Notes

### Critical Dependencies

- **pdf-parse**: Must use version **1.1.1** (v2.x has breaking API changes)
- **Node.js**: Requires v18 or higher for ES modules support
- **Docker**: Required for PostgreSQL, Redis, and LocalStack S3

### LocalStack S3 Setup

LocalStack provides a local AWS S3 environment for development:
- Endpoint: `http://localhost:4566`
- Credentials: `test` / `test` (any value works)
- Buckets auto-created by `init-s3.js`
- CORS configured for browser uploads

### Worker Configuration

The worker processes conversion jobs from the BullMQ queue:
- Concurrency: 3 simultaneous jobs
- Rate limit: 10 jobs per minute
- Retry: Up to 3 attempts with exponential backoff
- Auto-cleanup: Completed jobs kept for 24h, failed jobs for 7 days

## 🚀 Deployment

### Local Development (Current Setup)

✅ **Fully configured and ready to use**

All services run locally via Docker Compose:
- PostgreSQL database
- Redis cache/queue
- LocalStack S3 storage
- API server (port 4000)
- Web application (port 3000)
- Background worker

### Production Deployment (Future)

#### Web (Vercel)
```bash
# Deploy to Vercel
vercel --prod

# Environment variables to set:
# - NEXTAUTH_SECRET
# - NEXTAUTH_URL
# - NEXT_PUBLIC_API_URL
```

#### API & Worker (Railway/Render/AWS)
```bash
# Build Docker image
docker build -t omniconvert-api -f apps/api/Dockerfile .

# Deploy with production environment variables
# - DATABASE_URL (PostgreSQL)
# - REDIS_URL
# - AWS_ACCESS_KEY_ID (real S3)
# - AWS_SECRET_ACCESS_KEY
# - AWS_REGION
# - S3_UPLOADS_BUCKET
# - S3_OUTPUTS_BUCKET
```

#### Database Migration
```bash
# In production environment
cd apps/api
npx prisma migrate deploy
```

## 📚 Additional Resources

- **Setup Guide**: [SETUP.md](./SETUP.md) - Detailed setup instructions
- **Project Status**: [PROJECT_STATUS.md](./PROJECT_STATUS.md) - Current implementation status
- **MVP Summary**: [MVP_SUMMARY.md](./MVP_SUMMARY.md) - MVP feature overview
- **API Docs**: [apps/api/README.md](./apps/api/README.md) - API documentation
- **Conversion Engines**: [docs/CONVERSION_ENGINES.md](./docs/CONVERSION_ENGINES.md)
- **Job Queue System**: [docs/JOB_QUEUE_SYSTEM.md](./docs/JOB_QUEUE_SYSTEM.md)

## 📊 Recent Changes

### March 3, 2026 - Production Ready Setup

- ✅ Fixed pdf-parse dependency (downgraded to v1.1.1 for compatibility)
- ✅ Configured LocalStack S3 with bucket initialization script
- ✅ Set up environment variables for local development
- ✅ Configured and tested worker for background job processing
- ✅ Implemented real-time conversion progress tracking
- ✅ Tested PDF to DOCX conversion with OCR fallback
- ✅ Verified complete end-to-end conversion workflow

## 📖 Documentation

Full documentation available in the `/docs` folder:
- API endpoints and usage
- Conversion engine details
- Job queue architecture
- Upload infrastructure
- Deployment guides

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details

## 👥 Contributors

- **Diego Álvarez** - Initial development and configuration

## 🤝 Support

For issues and questions:
- Open an issue on [GitHub](https://github.com/DiegoAM99/App-VSCode/issues)
- Check the [Troubleshooting](#-troubleshooting) section above

---

**Repository**: https://github.com/DiegoAM99/App-VSCode.git  
**Last Updated**: March 3, 2026  
**Status**: ✅ Development Ready
