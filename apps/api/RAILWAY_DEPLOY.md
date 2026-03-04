# Railway Deployment Instructions

## Quick Deploy to Railway

### 1. Prerequisites
- GitHub account
- Railway account (sign up at https://railway.app)
- This repository pushed to GitHub

### 2. Deploy Backend

1. Go to [Railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose this repository: `omniconvertv2.0`
5. Railway will auto-detect the configuration

### 3. Add PostgreSQL Database

1. In your Railway project, click "+ New"
2. Select "Database" → "PostgreSQL"
3. Railway will automatically add `DATABASE_URL` to your service

### 4. Configure Environment Variables

Add these variables in Railway dashboard:

```env
# Port (automatically set by Railway)
PORT=4000

# Node environment
NODE_ENV=production

# Frontend URL (your Vercel deployment)
FRONTEND_URL=https://your-app.vercel.app

# JWT Secret (generate a random 64-char string)
JWT_SECRET=your-random-secret-here

# Redis (from Upstash - configure in step 5)
REDIS_URL=redis://default:xxxxx@xxxxx.upstash.io:6379

# S3/R2 Storage (from Cloudflare - configure in step 6)
AWS_ENDPOINT_URL=https://xxxxx.r2.cloudflarestorage.com
AWS_REGION=auto
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
S3_UPLOADS_BUCKET=omniconvert-uploads
S3_OUTPUTS_BUCKET=omniconvert-outputs
```

### 5. Setup Redis (Upstash)

1. Go to [Upstash Console](https://console.upstash.com)
2. Create a new Redis database
3. Copy the Redis URL
4. Add to Railway environment variables

### 6. Setup Storage (Cloudflare R2)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to R2 Object Storage
3. Create two buckets: `omniconvert-uploads` and `omniconvert-outputs`
4. Generate API token with Read & Write permissions
5. Add credentials to Railway environment variables

### 7. Run Database Migrations

In your local terminal:

```bash
# Set the DATABASE_URL from Railway
$env:DATABASE_URL="postgresql://postgres:xxxxx@xxxxx.railway.app:5432/railway"

# Navigate to API directory
cd apps/api

# Run migrations
npx prisma migrate deploy
npx prisma generate
```

### 8. Deploy Worker (Optional - Run in Same Service)

The worker can run as a separate process or in the same container. Railway will use the Procfile to start both web and worker processes.

### 9. Get Your API URL

After deployment, Railway will provide a URL like:
```
https://omniconvert-api-production.up.railway.app
```

### 10. Update Vercel Frontend

In Vercel dashboard, add environment variable:
```env
NEXT_PUBLIC_API_URL=https://your-railway-app.up.railway.app
```

## Monitoring

- View logs: Railway Dashboard → Your Service → Logs
- Metrics: Railway Dashboard → Your Service → Metrics
- Database: Railway Dashboard → PostgreSQL → Data

## Troubleshooting

### Build fails
- Check that all dependencies are in package.json
- Verify Prisma schema is valid
- Check build logs in Railway dashboard

### Database connection fails
- Verify DATABASE_URL is set correctly
- Check PostgreSQL service is running
- Run migrations locally first

### Redis connection fails
- Verify REDIS_URL format
- Check Upstash database is active
- Test connection with redis-cli

## Cost

- Railway: $5 free credit/month (sufficient for hobby projects)
- Upstash: Free tier with 10,000 requests/day
- Cloudflare R2: Free tier with 10GB storage

Total: **$0/month** for most use cases
