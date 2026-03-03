import { Router } from 'express';
import { optionalAuth } from '../middleware/auth.middleware';
import { streamProgress } from '../controllers/progress.controller';

const router = Router();

// SSE endpoint for real-time progress updates
router.get('/:id', optionalAuth, streamProgress);

export default router;
