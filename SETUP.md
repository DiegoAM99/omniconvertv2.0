# Setup Instructions for OmniConvert

This guide will help you set up the OmniConvert development environment on Windows.

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** (v18 or higher): [Download here](https://nodejs.org/)
- **npm** (v9 or higher): Comes with Node.js
- **Docker Desktop**: [Download here](https://www.docker.com/products/docker-desktop/)
- **Git**: [Download here](https://git-scm.com/downloads)

## Step 1: Install Dependencies

Open PowerShell in the project root directory and run:

```powershell
npm install
```

This will install all dependencies for all workspaces (apps and packages).

## Step 2: Start Local Services

Start PostgreSQL, Redis, and LocalStack S3 using Docker Compose:

```powershell
docker-compose up -d
```

Wait a few seconds for services to start. Verify they're running:

```powershell
docker-compose ps
```

You should see three containers running:
- `omniconvert-postgres` (port 5432)
- `omniconvert-redis` (port 6379)
- `omniconvert-s3` (port 4566)

## Step 3: Configure Environment Variables

### API Environment

```powershell
cd apps/api
cp .env.example .env
```

Edit `apps/api/.env` with your preferred text editor. For local development, the defaults should work, but you need to add:

```env
# Use LocalStack S3 for local development
AWS_ENDPOINT_URL=http://localhost:4566
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
```

### Web Environment

```powershell
cd ../web
cp .env.example .env
```

Edit `apps/web/.env` and set:

```env
NEXTAUTH_SECRET=your-random-secret-here
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Generate a secure `NEXTAUTH_SECRET`:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 4: Set Up Database

Navigate to the API directory and run Prisma migrations:

```powershell
cd ../../apps/api
npm run prisma:generate
npm run prisma:migrate
```

This will create all database tables.

## Step 5: Start Development Servers

From the **project root**, start all applications:

```powershell
cd ../..
npm run dev
```

This will start:
- **Web app** on http://localhost:3000
- **API server** on http://localhost:4000
- **Worker** (conversion processor)

## Step 6: Verify Setup

Open your browser and navigate to:
- http://localhost:3000 - Web application
- http://localhost:4000/health - API health check (should return JSON)

You should see the OmniConvert homepage!

## Troubleshooting

### Docker services won't start

```powershell
# Stop all containers
docker-compose down

# Remove volumes and restart
docker-compose down -v
docker-compose up -d
```

### Port already in use

If ports 3000, 4000, 5432, 6379, or 4566 are in use:

1. Find and stop the conflicting process:
```powershell
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

2. Or change the port in environment variables

### Dependencies installation fails

Clear npm cache and reinstall:

```powershell
npm cache clean --force
Remove-Item -Recurse -Force node_modules
npm install
```

### Prisma migrations fail

Reset the database:

```powershell
cd apps/api
npx prisma migrate reset
npm run prisma:migrate
```

## Next Steps

Now that your development environment is set up:

1. **Explore the codebase**:
   - `apps/web/src/app/page.tsx` - Homepage
   - `apps/api/src/index.ts` - API server entry
   - `packages/types/src/index.ts` - Shared TypeScript types

2. **Make your first change**:
   - Edit the homepage text in `apps/web/src/app/page.tsx`
   - Save and see hot-reload in action!

3. **View the database**:
   ```powershell
   cd apps/api
   npm run prisma:studio
   ```
   Opens Prisma Studio at http://localhost:5555

4. **Check API routes**:
   - Try http://localhost:4000/api/auth/signup (should return 501 Not Implemented)

## Development Workflow

```powershell
# Start all services
npm run dev

# In separate terminals if needed:
cd apps/web && npm run dev      # Just web app
cd apps/api && npm run dev      # Just API server

# Run tests
npm run test

# Lint code
npm run lint

# Format code
npm run format
```

## Stopping Services

```powershell
# Stop development servers: Ctrl+C in terminal

# Stop Docker services
docker-compose down

# Stop and remove all data
docker-compose down -v
```

## Additional Configuration

### Enable OAuth (Optional)

1. Create Google OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 credentials
   - Add callback URL: `http://localhost:3000/api/auth/callback/google`

2. Add to `apps/web/.env`:
   ```env
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

### CloudConvert API (For Video/Audio)

1. Sign up at [CloudConvert](https://cloudconvert.com/)
2. Get API key
3. Add to `apps/api/.env`:
   ```env
   CLOUDCONVERT_API_KEY=your-api-key
   ```

## Need Help?

- Review the main [README.md](./README.md)
- Check individual app READMEs in `apps/*/README.md`
- Review error logs in terminal output

Happy coding! 🚀
