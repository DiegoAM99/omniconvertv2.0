import { Router } from 'express';
import { optionalAuth } from '../middleware/auth.middleware';
import { getConversion, getConversionStatus, triggerConversion, downloadConversion } from '../controllers/conversion.controller';

const router = Router();

// Get full conversion details with download URL
router.get('/:id', optionalAuth, getConversion);

// Get conversion status only (lightweight polling)
router.get('/:id/status', optionalAuth, getConversionStatus);

// Download converted file
router.get('/:id/download', optionalAuth, downloadConversion);

// Trigger conversion manually (for testing/development)
router.post('/:id/trigger', optionalAuth, triggerConversion);

export default router;
