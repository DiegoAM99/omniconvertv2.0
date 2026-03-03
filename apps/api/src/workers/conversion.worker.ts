import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { logger } from '../config/logger';
import { ConversionService } from '../services/conversion.service';
import { ConversionJobData, ConversionProgress } from '../queues/conversion.queue';

// Create worker to process conversion jobs
export const conversionWorker = new Worker<ConversionJobData>(
  'conversion',
  async (job: Job<ConversionJobData>) => {
    const { conversionId } = job.data;
    
    logger.info(`Worker processing job ${job.id} for conversion ${conversionId}`);

    try {
      // Update progress: Downloading
      await job.updateProgress({
        stage: 'downloading',
        percentage: 10,
        message: 'Downloading input file from S3',
      } as ConversionProgress);

      // Process the conversion
      await ConversionService.processConversion(
        conversionId,
        async (stage: string, percentage: number) => {
          // Progress callback
          await job.updateProgress({
            stage,
            percentage,
            message: `Processing: ${stage}`,
          } as ConversionProgress);
        }
      );

      // Update progress: Completed
      await job.updateProgress({
        stage: 'completed',
        percentage: 100,
        message: 'Conversion completed successfully',
      } as ConversionProgress);

      logger.info(`Job ${job.id} completed successfully`);
      
      return {
        success: true,
        conversionId,
      };
    } catch (error: any) {
      logger.error(`Job ${job.id} failed:`, error);
      throw error; // BullMQ will handle retry logic
    }
  },
  {
    connection: redisConnection,
    concurrency: 3, // Process up to 3 jobs simultaneously
    limiter: {
      max: 10, // Max 10 jobs
      duration: 60000, // Per minute
    },
  }
);

// Worker event listeners
conversionWorker.on('completed', (job) => {
  logger.info(`Worker completed job ${job.id}`);
});

conversionWorker.on('failed', (job, err) => {
  logger.error(`Worker failed job ${job?.id}:`, err);
});

conversionWorker.on('error', (err) => {
  logger.error('Worker error:', err);
});

// Graceful shutdown
export const closeWorker = async () => {
  await conversionWorker.close();
  logger.info('Conversion worker closed');
};

// Handle process signals for graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing worker...');
  await closeWorker();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing worker...');
  await closeWorker();
  process.exit(0);
});
