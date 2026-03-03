import { Request, Response, NextFunction } from 'express';
import { getJobProgress } from '../queues/conversion.queue';
import { AppError } from '../middleware/error-handler';

// Get conversion progress via SSE
export const streamProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected', conversionId: id })}\n\n`);

    // Poll for progress every 1 second
    const interval = setInterval(async () => {
      try {
        const progress = await getJobProgress(id);

        // Send progress update
        res.write(`data: ${JSON.stringify({ type: 'progress', ...progress })}\n\n`);

        // Stop polling if job is done
        if (progress.status === 'completed' || progress.status === 'failed') {
          clearInterval(interval);
          res.write(`data: ${JSON.stringify({ type: 'done', status: progress.status })}\n\n`);
          res.end();
        }
      } catch (error) {
        clearInterval(interval);
        res.write(`data: ${JSON.stringify({ type: 'error', message: 'Failed to get progress' })}\n\n`);
        res.end();
      }
    }, 1000);

    // Clean up on client disconnect
    req.on('close', () => {
      clearInterval(interval);
    });
  } catch (error) {
    next(error);
  }
};
