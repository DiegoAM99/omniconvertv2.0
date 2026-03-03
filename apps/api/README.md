# OmniConvert API

Backend API server for OmniConvert file conversion platform.

## Architecture

- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache & Queue**: Redis + BullMQ
- **Storage**: AWS S3 (LocalStack for development)
- **Authentication**: JWT tokens
- **Logging**: Pino

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - Login and get JWT tokens
- `POST /api/auth/logout` - Logout user

### File Uploads
- `POST /api/uploads/initialize` - Get presigned S3 URL for upload
- `POST /api/uploads/complete` - Mark upload complete and start conversion

### Conversions
- `POST /api/conversions` - Initiate new conversion
- `GET /api/conversions/:id` - Get conversion details
- `GET /api/conversions/:id/status` - Get conversion status
- `GET /api/conversions/:id/progress` - SSE endpoint for real-time progress

### User
- `GET /api/user/me` - Get user profile and quota
- `GET /api/user/me/conversions` - Get user's conversion history

### Webhooks
- `POST /api/webhooks/paddle` - Paddle payment webhooks
- `POST /api/webhooks/cloudconvert` - CloudConvert completion webhooks

## Development

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your configuration

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Start development server
npm run dev
```

The API will be available at http://localhost:4000

## Database Migrations

```bash
# Create new migration
npx prisma migrate dev --name your_migration_name

# Apply migrations in production
npx prisma migrate deploy

# View database in Prisma Studio
npm run prisma:studio
```

## Environment Variables

See `.env.example` for all required environment variables.

## Testing

```bash
# Run unit tests
npm run test

# Run with coverage
npm run test -- --coverage
```

## Production Deployment

Deploy to Railway:

```bash
# Build
npm run build

# Start production server
npm run start
```

Environment variables should be configured in Railway dashboard.
