# OmniConvert - MVP Deployment Guide

## Overview

OmniConvert MVP is now complete and ready for deployment. This guide covers local development, testing, and production deployment.

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Next.js 14 App (Vercel)                               │ │
│  │  - Upload UI with progress tracking                    │ │
│  │  - Real-time SSE progress updates                      │ │
│  │  - Conversion history with downloads                   │ │
│  │  - Protected dashboard with authentication             │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Express API (Railway/Render)                          │ │
│  │  - Authentication endpoints                            │ │
│  │  - File upload (presigned URLs)                        │ │
│  │  - Conversion management                               │ │
│  │  - SSE progress streaming                              │ │
│  │  - User/subscription management                        │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
           ↓ Job Enqueue         ↓ DB Access        ↓ S3
┌──────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Redis (Queue)   │  │  PostgreSQL     │  │  AWS S3         │
│  - BullMQ        │  │  - User data    │  │  - File storage │
│  - Job state     │  │  - Conversions  │  │  - Presigned    │
│  - Progress      │  │  - Quotas       │  │    URLs         │
└──────────────────┘  └─────────────────┘  └─────────────────┘
           ↑
           │ Job Processing
┌──────────────────────────────────────────────────────────────┐
│                      Worker Process (Railway)                 │
│  - Consumes BullMQ jobs (concurrency: 3)                      │
│  - Processes conversions (Sharp, LibreOffice, CloudConvert)   │
│  - Updates progress via callbacks                             │
│  - Uploads results to S3                                      │
└──────────────────────────────────────────────────────────────┘
```

## Local Development

### Prerequisites

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Docker**: 20.x or higher (for PostgreSQL, Redis, S3)
- **LibreOffice**: 7.x or higher (for document conversion)

### 1. Clone and Install

```bash
# Clone repository
git clone <repository-url>
cd APP

# Install dependencies
npm install
```

### 2. Start Infrastructure

```bash
# Start PostgreSQL, Redis, and LocalStack (S3)
docker-compose up -d

# Wait for containers to be healthy
docker-compose ps
```

### 3. Environment Setup

**Backend API (.env):**
```env
# Database
DATABASE_URL=postgresql://omniconvert:omniconvert123@localhost:5432/omniconvert

# Redis
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_S3_ENDPOINT=http://localhost:4566
S3_BUCKET_UPLOADS=omniconvert-uploads
S3_BUCKET_OUTPUTS=omniconvert-outputs

# Authentication
JWT_ACCESS_SECRET=your-super-secret-access-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
NEXTAUTH_SECRET=your-nextauth-secret-key-change-in-production

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-secret

# CloudConvert (for audio/video)
CLOUDCONVERT_API_KEY=your-cloudconvert-api-key

# Paddle (for payments)
PADDLE_VENDOR_ID=your-paddle-vendor-id
PADDLE_API_KEY=your-paddle-api-key
PADDLE_PUBLIC_KEY=your-paddle-public-key
PADDLE_WEBHOOK_SECRET=your-paddle-webhook-secret

# Server
PORT=4000
NODE_ENV=development
```

**Frontend Web (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-change-in-production

GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-secret
```

### 4. Database Setup

```bash
cd apps/api

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Seed database
npx prisma db seed
```

### 5. Start Development Servers

**Terminal 1 - API Server:**
```bash
cd apps/api
npm run dev
# Runs on http://localhost:4000
```

**Terminal 2 - Worker Process:**
```bash
cd apps/api
npm run dev:worker
# Processes jobs from BullMQ queue
```

**Terminal 3 - Web Frontend:**
```bash
cd apps/web
npm run dev
# Runs on http://localhost:3000
```

### 6. Verify Setup

**Check Services:**
- API: http://localhost:4000/health → {"status": "ok"}
- Web: http://localhost:3000 → Homepage
- PostgreSQL: `docker exec -it omniconvert-db psql -U omniconvert -d omniconvert`
- Redis: `docker exec -it omniconvert-redis redis-cli PING` → PONG

**Test Workflow:**
1. Navigate to http://localhost:3000/auth/signup
2. Create account
3. Login at http://localhost:3000/auth/login
4. Go to http://localhost:3000/dashboard
5. Upload a file (e.g., DOCX → PDF)
6. Watch real-time progress
7. Download converted file

## Production Deployment

### Option 1: Vercel + Railway (Recommended)

#### Frontend (Vercel)

1. **Connect Repository:**
   - Go to vercel.com
   - Import Git repository
   - Select root directory: `apps/web`

2. **Configure Build:**
   ```
   Framework Preset: Next.js
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   Root Directory: apps/web
   ```

3. **Environment Variables:**
   ```env
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com
   NEXTAUTH_URL=https://yourdomain.com
   NEXTAUTH_SECRET=<generate-new-secret>
   GOOGLE_CLIENT_ID=<your-google-client-id>
   GOOGLE_CLIENT_SECRET=<your-google-secret>
   ```

4. **Deploy:**
   - Vercel auto-deploys on git push
   - Custom domain: Add in Vercel settings

#### Backend API (Railway)

1. **Create New Project:**
   - Go to railway.app
   - New Project → Deploy from GitHub repo

2. **Add PostgreSQL:**
   - New → Database → PostgreSQL
   - Railway auto-generates DATABASE_URL

3. **Add Redis:**
   - New → Database → Redis
   - Railway auto-generates REDIS_URL

4. **Deploy API Service:**
   - New → GitHub Repo
   - Root Directory: `apps/api`
   - Build Command: `npm run build`
   - Start Command: `npm start`

5. **Environment Variables:**
   ```env
   # Auto-generated by Railway
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   REDIS_URL=${{Redis.REDIS_URL}}
   REDIS_HOST=${{Redis.REDIS_HOST}}
   REDIS_PORT=${{Redis.REDIS_PORT}}

   # AWS S3 (production)
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=<your-aws-key>
   AWS_SECRET_ACCESS_KEY=<your-aws-secret>
   S3_BUCKET_UPLOADS=omniconvert-prod-uploads
   S3_BUCKET_OUTPUTS=omniconvert-prod-outputs

   # Secrets (generate new)
   JWT_ACCESS_SECRET=<generate-256-bit-secret>
   JWT_REFRESH_SECRET=<generate-256-bit-secret>
   NEXTAUTH_SECRET=<generate-256-bit-secret>

   # OAuth
   GOOGLE_CLIENT_ID=<your-google-client-id>
   GOOGLE_CLIENT_SECRET=<your-google-secret>

   # CloudConvert
   CLOUDCONVERT_API_KEY=<your-cloudconvert-key>

   # Paddle
   PADDLE_VENDOR_ID=<your-paddle-vendor>
   PADDLE_API_KEY=<your-paddle-key>
   PADDLE_PUBLIC_KEY=<your-paddle-public-key>
   PADDLE_WEBHOOK_SECRET=<your-webhook-secret>

   # Server
   PORT=4000
   NODE_ENV=production
   ```

6. **Deploy Worker Service:**
   - New → GitHub Repo (same repo)
   - Root Directory: `apps/api`
   - Build Command: `npm run build`
   - Start Command: `npm run start:worker`
   - **Same environment variables as API**

7. **Run Migrations:**
   ```bash
   railway run npx prisma migrate deploy
   ```

#### AWS S3 Setup

1. **Create Buckets:**
   ```bash
   aws s3 mb s3://omniconvert-prod-uploads
   aws s3 mb s3://omniconvert-prod-outputs
   ```

2. **Configure CORS (uploads bucket):**
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["PUT", "POST"],
       "AllowedOrigins": ["https://yourdomain.com"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```

3. **Lifecycle Policies (auto-delete after 24h):**
   ```json
   {
     "Rules": [
       {
         "Id": "DeleteOldFiles",
         "Status": "Enabled",
         "Expiration": {
           "Days": 1
         }
       }
     ]
   }
   ```

4. **IAM Policy:**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:GetObject",
           "s3:DeleteObject"
         ],
         "Resource": [
           "arn:aws:s3:::omniconvert-prod-uploads/*",
           "arn:aws:s3:::omniconvert-prod-outputs/*"
         ]
       }
     ]
   }
   ```

### Option 2: Render (Alternative)

Similar to Railway but uses Render's infrastructure:

1. **Web Service (API):**
   - New → Web Service
   - Build Command: `cd apps/api && npm install && npm run build`
   - Start Command: `cd apps/api && npm start`

2. **Background Worker:**
   - New → Background Worker
   - Build Command: `cd apps/api && npm install && npm run build`
   - Start Command: `cd apps/api && npm run start:worker`

3. **PostgreSQL:**
   - New → PostgreSQL
   - Copy DATABASE_URL to environment

4. **Redis:**
   - New → Redis
   - Copy REDIS_URL to environment

## Post-Deployment Checklist

### Security

- [ ] Update all JWT secrets (use 256-bit random strings)
- [ ] Configure CORS to only allow your domain
- [ ] Enable HTTPS (Vercel/Railway do this automatically)
- [ ] Set up rate limiting in production
- [ ] Configure S3 bucket policies (block public access)
- [ ] Enable CloudFlare (optional CDN + DDoS protection)

### Monitoring

- [ ] Set up Sentry error tracking
- [ ] Configure log aggregation (Railway Logs, Datadog, etc.)
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
- [ ] Create health check endpoints alerts
- [ ] Monitor Redis memory usage
- [ ] Monitor S3 storage costs

### Database

- [ ] Run production migrations: `npx prisma migrate deploy`
- [ ] Set up automated backups (Railway does this automatically)
- [ ] Configure connection pooling (Prisma default: 10)
- [ ] Create database indexes for performance

### Testing

- [ ] Test file upload flow
- [ ] Test all conversion types
- [ ] Test progress tracking
- [ ] Test download functionality
- [ ] Test authentication flow
- [ ] Load test with 100 concurrent users
- [ ] Test worker scaling (add more workers if needed)

### DNS & Domains

- [ ] Point yourdomain.com to Vercel
- [ ] Point api.yourdomain.com to Railway API
- [ ] Configure SSL certificates (auto with Vercel/Railway)
- [ ] Set up email domain for transactional emails

## Scaling Strategy

### Initial MVP (< 1000 users)

- **Web**: Vercel Hobby Plan (free)
- **API**: Railway Starter ($5/month)
- **Worker**: Railway Starter ($5/month)
- **Database**: Railway PostgreSQL ($5/month)
- **Redis**: Railway Redis ($5/month)
- **S3**: AWS Free Tier (5GB storage, 15GB transfer)
- **Total**: ~$20/month

### Growth Phase (1k - 10k users)

- **Web**: Vercel Pro ($20/month)
- **API**: Railway Pro + autoscaling (2-5 instances)
- **Worker**: Railway Pro + autoscaling (2-10 workers)
- **Database**: Railway PostgreSQL with read replicas
- **Redis**: Railway Redis with increased memory
- **S3**: AWS Standard (pay per use)
- **CDN**: CloudFlare Pro ($20/month)
- **Total**: $100-500/month (depending on usage)

### Scale Phase (10k+ users)

- **Web**: Vercel Enterprise
- **API**: Kubernetes cluster (AWS EKS, GCP GKE)
- **Worker**: Auto-scaling worker pool (10-100 workers)
- **Database**: AWS RDS PostgreSQL Multi-AZ
- **Redis**: AWS ElastiCache Redis Cluster
- **S3**: AWS S3 with CloudFront CDN
- **Monitoring**: Datadog, Sentry, PagerDuty
- **Total**: $1000+/month

## Worker Scaling

### Horizontal Scaling

Add more worker instances to process jobs faster:

**Railway:**
1. Duplicate worker service
2. Same environment variables
3. BullMQ automatically distributes jobs

**Kubernetes:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: omniconvert-worker
spec:
  replicas: 5  # Start with 5 workers
  template:
    spec:
      containers:
      - name: worker
        image: omniconvert/worker:latest
        env:
          - name: REDIS_URL
            valueFrom:
              secretKeyRef:
                name: redis-secret
                key: url
```

### Concurrency Tuning

Adjust `conversion.worker.ts` concurrency:

```typescript
const worker = new Worker('conversion', processJob, {
  connection: redisConnection,
  concurrency: 10,  // Process 10 jobs per worker
  limiter: {
    max: 50,         // Max 50 jobs per minute
    duration: 60000,
  },
});
```

**Recommendations:**
- **CPU-intensive** (image processing): concurrency = CPU cores
- **I/O-intensive** (API calls): concurrency = 2-3x CPU cores
- **Mixed workload**: concurrency = 1.5x CPU cores

## Troubleshooting

### Worker Not Processing Jobs

**Symptoms:** Jobs stuck in "queued" status

**Solutions:**
1. Check worker is running: `railway logs --service worker`
2. Verify Redis connection: `redis-cli -u $REDIS_URL PING`
3. Check BullMQ dashboard: Install `@bull-board/express`
4. Verify concurrency settings in worker.ts

### SSE Not Working

**Symptoms:** Progress not updating in UI

**Solutions:**
1. Check SSE endpoint: `curl http://localhost:4000/api/progress/:id`
2. Verify conversionId is correct
3. Check browser Network tab for SSE connection
4. Verify worker is updating progress
5. Check CORS settings allow SSE

### S3 Upload Failing

**Symptoms:** Upload fails at presigned URL step

**Solutions:**
1. Verify AWS credentials are correct
2. Check S3 bucket CORS policy
3. Verify presigned URL expiry (1 hour default)
4. Check file size limits (2GB max)
5. Verify S3_BUCKET_UPLOADS environment variable

### Database Connection Pool Exhausted

**Symptoms:** "No more connections available" error

**Solutions:**
1. Increase Prisma connection pool: `connection_limit=20`
2. Check for connection leaks in API code
3. Enable connection pooling: PgBouncer
4. Scale database (vertical scaling)

### LibreOffice Conversion Timeout

**Symptoms:** Document conversions fail after 60s

**Solutions:**
1. Increase timeout in `document.processor.ts`
2. Optimize LibreOffice with `--norestore --nofirststartwizard`
3. Use Docker container with LibreOffice preloaded
4. Split large documents into chunks

## Cost Optimization

### S3 Storage

- **Lifecycle Policies**: Auto-delete files after 24 hours
- **Intelligent Tiering**: Move old files to cheaper storage
- **Transfer Optimization**: Use CloudFront CDN

### CloudConvert API

- **Hybrid Approach**: Use CloudConvert only for audio/video
- **Format Restrictions**: Limit expensive formats to Pro users
- **Caching**: Cache conversion results for duplicate files

### Database

- **Query Optimization**: Add indexes on userId, status, createdAt
- **Archiving**: Move old conversions to cold storage
- **Read Replicas**: Use for analytics queries

### Worker Optimization

- **Auto-scaling**: Scale down during off-peak hours
- **Priority Queue**: Process Pro users first
- **Batch Processing**: Combine small conversions

## Security Best Practices

### API Security

- ✅ Rate limiting (60 req/min global, 10 req/min uploads)
- ✅ JWT with short expiry (15 min access, 7 day refresh)
- ✅ Helmet.js security headers
- ✅ CORS restricted to frontend domain
- ⚠️ TODO: Request signing for webhooks
- ⚠️ TODO: File virus scanning (ClamAV)

### Database Security

- ✅ Connection pooling with Prisma
- ✅ Parameterized queries (SQL injection prevention)
- ✅ TLS/SSL for database connections
- ⚠️ TODO: Encryption at rest
- ⚠️ TODO: Read-only replicas for analytics

### File Security

- ✅ Presigned URLs with short expiry
- ✅ UUID-based file paths (unpredictable)
- ✅ S3 bucket policies (no public access)
- ⚠️ TODO: Virus scanning before processing
- ⚠️ TODO: File type validation (magic numbers)

## Maintenance

### Daily Tasks

- Monitor error logs (Sentry, Railway)
- Check queue health (BullMQ dashboard)
- Verify S3 lifecycle policies working

### Weekly Tasks

- Review API usage patterns
- Check database size growth
- Monitor CloudConvert API costs
- Review failed conversions

### Monthly Tasks

- Update dependencies: `npm audit fix`
- Review and archive old conversions
- Optimize slow database queries
- Update documentation

## Support & Resources

- **Documentation**: `/docs` folder in repository
- **API Reference**: `/docs/API.md`
- **Troubleshooting**: `/docs/TROUBLESHOOTING.md`
- **Changelog**: `/CHANGELOG.md`

## Next Steps After Deployment

1. **Analytics**: Add Posthog or Mixpanel
2. **Email**: Set up Resend for transactional emails
3. **Payments**: Activate Paddle sandbox → production
4. **Mobile**: Build React Native app (optional)
5. **Marketing**: SEO optimization, content marketing

---

**Deployment Status**: ✅ MVP Ready for Production

The OmniConvert MVP is complete with:
- ✅ Full authentication system
- ✅ File upload with progress tracking
- ✅ 25+ file format conversions
- ✅ Real-time job queue processing
- ✅ SSE progress updates
- ✅ Conversion history and downloads
- ✅ Responsive web interface

**Time to deploy and launch!** 🚀
