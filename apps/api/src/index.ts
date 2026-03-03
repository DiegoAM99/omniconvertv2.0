import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import dotenv from 'dotenv';
import { logger } from './config/logger';
import { errorHandler } from './middleware/error-handler';
import { apiLimiter, authLimiter } from './middleware/rate-limit.middleware';

// Import routes
import authRoutes from './routes/auth.routes';
import uploadsRoutes from './routes/uploads.routes';
import conversionsRoutes from './routes/conversions.routes';
import userRoutes from './routes/user.routes';
import webhooksRoutes from './routes/webhooks.routes';
import progressRoutes from './routes/progress.routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware for parsing form data (required for file uploads)
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(pinoHttp({ logger }));

// Global rate limiting
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/conversions', conversionsRoutes);
app.use('/api/user', userRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/progress', progressRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Resource not found',
    },
  });
});

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 API server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;
