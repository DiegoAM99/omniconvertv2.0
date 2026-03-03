import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { prisma } from '../config/database';
import { QUOTA_LIMITS } from '@omniconvert/utils';

const router = Router();

// Get user profile with quota usage
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      });
    }

    // Get today's usage
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayUsage = await prisma.usageQuota.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    });

    const quotaLimits = QUOTA_LIMITS[user.subscription?.tier as 'free' | 'pro'] || QUOTA_LIMITS.free;

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        subscription: user.subscription,
        todayUsage: {
          conversionsCount: todayUsage?.conversionsCount || 0,
          bytesProcessed: Number(todayUsage?.bytesProcessed || 0),
        },
        quotaLimits,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get user's conversion history
router.get('/me/conversions', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const conversions = await prisma.conversion.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.conversion.count({
      where: { userId },
    });

    res.json({
      success: true,
      data: {
        conversions,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
