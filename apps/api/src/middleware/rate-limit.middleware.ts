import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import redis from '../config/redis';

// Create rate limiter with Redis store
export const createRateLimiter = (options: {
  windowMs: number;
  max: number;
  message?: string;
  keyPrefix: string;
}) => {
  const { windowMs, max, message, keyPrefix } = options;

  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: message || 'Too many requests, please try again later',
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      return `${keyPrefix}:${ip}`;
    },
    // Use Redis for distributed rate limiting
    store: {
      async increment(key: string): Promise<any> {
        const current = await redis.incr(key);
        if (current === 1) {
          await redis.expire(key, Math.ceil(windowMs / 1000));
        }
        return {
          totalHits: current,
          resetTime: new Date(Date.now() + windowMs),
        };
      },
      async decrement(key: string): Promise<void> {
        await redis.decr(key);
      },
      async resetKey(key: string): Promise<void> {
        await redis.del(key);
      },
    },
  });
};

// Rate limiters for different routes
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per 15 minutes
  message: 'Too many authentication attempts, please try again later',
  keyPrefix: 'rl:auth',
});

export const apiLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  keyPrefix: 'rl:api',
});

export const uploadLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 uploads per minute
  keyPrefix: 'rl:upload',
});

// Tier-based rate limiting middleware
export const quotaLimiter = async (req: Request, res: Response, next: Function) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      // Anonymous users - very strict limits
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const key = `quota:anon:${ip}`;
      const count = await redis.incr(key);

      if (count === 1) {
        await redis.expire(key, 24 * 60 * 60); // 24 hours
      }

      if (count > 1) {
        return res.status(429).json({
          success: false,
          error: {
            code: 'QUOTA_EXCEEDED',
            message: 'Anonymous users are limited to 1 conversion per day. Please sign up for more.',
          },
        });
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};
