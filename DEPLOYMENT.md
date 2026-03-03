# 🚀 Deployment Guide - OmniConvert

Complete guide to deploy OmniConvert to production using Vercel (Frontend) and Railway/Render (Backend).

**Last Updated**: March 3, 2026  
**Version**: 1.0.0

---

## 📋 Deployment Architecture

```
┌─────────────────────────────────────────────────┐
│  VERCEL (Frontend)                              │
│  apps/web - Next.js Application                 │
│  URL: https://omniconvert.vercel.app           │
└────────────────┬────────────────────────────────┘
                 │ HTTPS
                 ▼
┌─────────────────────────────────────────────────┐
│  RAILWAY/RENDER (Backend)                       │
│  apps/api - Express.js API + Worker             │
│  URL: https://api.omniconvert.app              │
└────┬──────────┬──────────┬──────────────────────┘
     │          │          │
     ▼          ▼          ▼
┌─────────┐ ┌────────┐ ┌────────┐
│PostgreSQL Redis    │ AWS S3  │
│(Railway)│(Railway) │ (Real)  │
└─────────┘ └────────┘ └────────┘
```

---

## 🌐 Part 1: Deploy Frontend to Vercel

### Prerequisites
- GitHub account
- Vercel account (free tier works)
- Repository pushed to GitHub

### Step 1: Import Project to Vercel

1. Go to https://vercel.com/new
2. Click "Import Project"
3. Select your GitHub repository: `DiegoAM99/App-VSCode`
4. Click "Import"

### Step 2: Configure Project

**Framework Preset**: Next.js  
**Root Directory**: `apps/web`  
**Build Command**: 
```bash
cd ../.. && npm install && cd apps/web && npm run build
```

**Output Directory**: `apps/web/.next`

**Install Command**:
```bash
npm install
```

### Step 3: Set Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

```env
# Production (Required)
NEXTAUTH_SECRET=your-production-nextauth-secret-min-32-chars
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXT_PUBLIC_API_URL=https://your-api-backend.railway.app

# Optional OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Generate NEXTAUTH_SECRET**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4: Deploy

1. Click "Deploy"
2. Wait for build to complete (~2-3 minutes)
3. Visit your deployed site: `https://your-app-name.vercel.app`

---

## 🔧 Part 2: Deploy Backend to Railway

### Prerequisites
- Railway account (free tier: $5 credit/month)
- GitHub repository

### Step 1: Create New Railway Project

1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Select `DiegoAM99/App-VSCode`
4. Click "Deploy Now"

### Step 2: Configure Services

Railway will need **3 services**:

#### Service 1: PostgreSQL Database

1. Click "New" → "Database" → "PostgreSQL"
2. Railway auto-configures connection
3. Copy `DATABASE_URL` from Variables tab

#### Service 2: Redis

1. Click "New" → "Database" → "Redis"
2. Copy `REDIS_URL` from Variables tab

#### Service 3: API + Worker

1. Click on your repository service
2. Settings → **Root Directory**: `apps/api`
3. Settings → **Build Command**:
```bash
npm install && npm run build
```

4. Settings → **Start Command**:
```bash
npm run start
```

5. Settings → **Watch Paths**: `apps/api/**`

### Step 3: Set Environment Variables for API

In Railway → API Service → Variables:

```env
# Database (from Railway PostgreSQL)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (from Railway Redis)
REDIS_URL=${{Redis.REDIS_URL}}

# AWS S3 (Real AWS - Required)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
S3_UPLOADS_BUCKET=omniconvert-uploads
S3_OUTPUTS_BUCKET=omniconvert-outputs

# JWT
JWT_SECRET=your-production-jwt-secret-256bit
JWT_REFRESH_SECRET=your-production-refresh-secret-256bit

# App
NODE_ENV=production
PORT=4000
FRONTEND_URL=https://your-app-name.vercel.app

# File retention
FILE_RETENTION_HOURS=24
```

### Step 4: Deploy Worker (Separate Service)

1. Click "New" → "GitHub Repo" → Select same repository
2. Settings → **Root Directory**: `apps/api`
3. Settings → **Build Command**: `npm install && npm run build`
4. Settings → **Start Command**: `npm run start:worker`
5. Add same environment variables as API service

### Step 5: Run Database Migrations

In Railway → API Service → Terminal:
```bash
cd apps/api
npx prisma migrate deploy
```

---

## ☁️ Part 3: Configure AWS S3 (Production Storage)

### Create S3 Buckets

1. Go to AWS Console → S3
2. Create two buckets:
   - `omniconvert-uploads` (for input files)
   - `omniconvert-outputs` (for converted files)

### Configure Bucket Settings

For **both buckets**:

**1. Block Public Access**: OFF (for presigned URLs)

**2. CORS Configuration**:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": [
      "https://your-app-name.vercel.app"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

**3. Lifecycle Rules** (auto-delete after 24h):
```json
{
  "Rules": [
    {
      "Id": "DeleteAfter24Hours",
      "Status": "Enabled",
      "Expiration": {
        "Days": 1
      }
    }
  ]
}
```

### Create IAM User

1. Go to IAM → Users → Create User
2. Attach policy: `AmazonS3FullAccess`
3. Create Access Key
4. Copy **Access Key ID** and **Secret Access Key**
5. Add to Railway environment variables

---

## 🔗 Part 4: Connect Frontend and Backend

### Update Vercel Environment

Go back to Vercel → Settings → Environment Variables:

Update `NEXT_PUBLIC_API_URL` with your Railway API URL:
```
NEXT_PUBLIC_API_URL=https://omniconvert-api.up.railway.app
```

Redeploy:
```bash
# In Vercel Dashboard
Deployments → ... → Redeploy
```

### Update Railway CORS

In Railway → API Service → Variables, add:
```env
CORS_ORIGIN=https://your-app-name.vercel.app
```

---

## ✅ Part 5: Verification

### Test Frontend
1. Visit `https://your-app-name.vercel.app`
2. Upload a PDF file
3. Select DOCX format
4. Click Convert

### Test API Health
```bash
curl https://your-api-backend.railway.app/health
```

### Test Complete Flow
1. Upload file on Vercel frontend
2. Check Railway API logs for upload
3. Check Railway Worker logs for processing
4. Verify download button appears
5. Download converted file

### Monitor Logs

**Vercel Logs**:
- Dashboard → Deployments → Your deployment → Runtime Logs

**Railway Logs**:
- Dashboard → Service → Logs tab
- Watch for conversion jobs being processed

**S3 Logs**:
- AWS Console → S3 → Bucket → Properties → Server access logging

---

## 🔧 Troubleshooting

### Issue: "Cannot connect to API"

**Solution**: Check CORS configuration in Railway
```env
CORS_ORIGIN=https://your-app-name.vercel.app
```

### Issue: "S3 upload failed"

**Solution**: Verify AWS credentials and bucket names
```bash
# Test AWS credentials
aws s3 ls s3://omniconvert-uploads
```

### Issue: "Worker not processing jobs"

**Solution**: Check Redis connection in Railway Worker logs
```bash
# In Railway Worker terminal
redis-cli -u $REDIS_URL PING
```

### Issue: "Database connection error"

**Solution**: Run migrations
```bash
# In Railway API terminal
npx prisma migrate deploy
```

### Issue: Build fails on Vercel

**Solution**: Check build logs, ensure all dependencies are in package.json
```bash
# Locally test build
cd apps/web
npm run build
```

---

## 💰 Estimated Monthly Costs

### Free Tier (Development/Testing)
- **Vercel**: Free (100 GB bandwidth, unlimited projects)
- **Railway**: $5 credit/month (enough for low traffic)
- **AWS S3**: ~$1-5/month (depends on storage/transfers)
- **Total**: ~$1-10/month

### Production Tier (1000 users/month)
- **Vercel Pro**: $20/month
- **Railway Pro**: $20/month (or AWS EC2)
- **AWS S3**: ~$10-20/month
- **PostgreSQL**: Included in Railway
- **Redis**: Included in Railway
- **Total**: ~$50-60/month

---

## 🚀 Alternative Deployment Options

### Option 1: All-in-One (Railway)
Deploy everything on Railway:
- Frontend (Next.js as static site)
- Backend API
- Worker
- PostgreSQL
- Redis

**Pros**: Simpler, single dashboard  
**Cons**: Less optimized for Next.js than Vercel

### Option 2: AWS Complete
- Frontend: AWS Amplify
- Backend: AWS Elastic Beanstalk
- Database: RDS PostgreSQL
- Cache: ElastiCache Redis
- Storage: S3

**Pros**: Full AWS integration  
**Cons**: More complex, higher cost

### Option 3: Docker Compose (VPS)
Deploy to DigitalOcean/Linode VPS:
- Use existing `docker-compose.yml`
- Add Nginx reverse proxy
- Add SSL with Let's Encrypt

**Pros**: Full control, predictable pricing  
**Cons**: Manual maintenance required

---

## 📊 Post-Deployment Checklist

- [ ] Frontend deployed to Vercel
- [ ] API deployed to Railway
- [ ] Worker deployed to Railway
- [ ] PostgreSQL provisioned
- [ ] Redis provisioned
- [ ] S3 buckets created and configured
- [ ] Environment variables set in all services
- [ ] Database migrations applied
- [ ] CORS configured correctly
- [ ] Test file upload
- [ ] Test conversion
- [ ] Test download
- [ ] Monitor logs for errors
- [ ] Set up monitoring (optional: Sentry, LogRocket)
- [ ] Configure custom domain (optional)
- [ ] Enable HTTPS (automatic on Vercel/Railway)

---

## 📚 Additional Resources

- **Vercel Docs**: https://vercel.com/docs
- **Railway Docs**: https://docs.railway.app
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Prisma Production**: https://www.prisma.io/docs/guides/deployment
- **AWS S3 Guide**: https://docs.aws.amazon.com/s3/

---

## 🆘 Support

If you encounter issues:
1. Check service logs (Vercel, Railway)
2. Verify environment variables
3. Test API endpoints directly
4. Check database connections
5. Verify S3 permissions

**Repository**: https://github.com/DiegoAM99/App-VSCode.git  
**Backup Tag**: v1.0.0-pre-vercel (for rollback)

---

**Created**: March 3, 2026  
**Status**: Ready for Production Deployment  
**Version**: 1.0.0
