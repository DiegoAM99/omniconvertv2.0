import { Router } from 'express';
import multer from 'multer';
import { optionalAuth } from '../middleware/auth.middleware';
import { uploadLimiter } from '../middleware/rate-limit.middleware';
import { initializeUpload, completeUpload, directUpload } from '../controllers/upload.controller';

const router = Router();

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB max
});

// Initialize upload - get presigned S3 URL
router.post('/initialize', optionalAuth, uploadLimiter, initializeUpload);

// Direct upload - upload file through API (avoids CORS issues)
router.post('/direct', optionalAuth, uploadLimiter, upload.single('file'), directUpload);

// Complete upload - create conversion record
router.post('/complete', optionalAuth, uploadLimiter, completeUpload);

export default router;
