import { Router } from 'express';

const router = Router();

// Placeholder routes
router.post('/paddle', (req, res) => {
  res.status(501).json({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Coming soon' } });
});

router.post('/cloudconvert', (req, res) => {
  res.status(501).json({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Coming soon' } });
});

export default router;
