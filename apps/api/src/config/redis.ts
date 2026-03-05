import Redis from 'ioredis';
import { logger } from './logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const isAzure = redisUrl.includes('azure') || process.env.REDIS_TLS === 'true';

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: true,
  lazyConnect: false,
  tls: isAzure ? {
    rejectUnauthorized: false, // Azure Redis requires this
  } : undefined,
});

// Export connection config for BullMQ
export const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  tls: isAzure ? {
    rejectUnauthorized: false,
  } : undefined,
};

redis.on('connect', () => {
  logger.info('✅ Redis connected');
});

redis.on('error', (error) => {
  logger.error('❌ Redis connection error:', error);
});

export default redis;
