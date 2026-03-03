import { Queue, QueueEvents } from 'bullmq';
import { redisConnection } from '../config/redis';
import { logger } from '../config/logger';

export interface ConversionJobData {
  conversionId: string;
  userId: string | null;
  inputFormat: string;
  outputFormat: string;
  options?: any;
}

export interface ConversionProgress {
  stage: 'downloading' | 'processing' | 'uploading' | 'completed';
  percentage: number;
  message?: string;
}

// Create conversion queue with priority support
export const conversionQueue = new Queue<ConversionJobData>('conversion', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3, // Retry up to 3 times
    backoff: {
      type: 'exponential',
      delay: 5000, // Start with 5 second delay
    },
    removeOnComplete: {
      age: 86400, // Keep completed jobs for 24 hours
      count: 1000, // Keep max 1000 completed jobs
    },
    removeOnFail: {
      age: 604800, // Keep failed jobs for 7 days
      count: 500, // Keep max 500 failed jobs
    },
  },
});

// Queue events for monitoring
export const conversionQueueEvents = new QueueEvents('conversion', {
  connection: redisConnection,
});

// Event listeners for logging
conversionQueueEvents.on('completed', ({ jobId }) => {
  logger.info(`Job ${jobId} completed`);
});

conversionQueueEvents.on('failed', ({ jobId, failedReason }) => {
  logger.error(`Job ${jobId} failed: ${failedReason}`);
});

conversionQueueEvents.on('progress', ({ jobId, data }) => {
  logger.debug(`Job ${jobId} progress: ${JSON.stringify(data)}`);
});

// Add job to queue with priority
export const addConversionJob = async (
  data: ConversionJobData,
  priority: number = 5
): Promise<string> => {
  const job = await conversionQueue.add('convert', data, {
    priority, // Pro users: 10, Free users: 5, Anonymous: 1
    jobId: data.conversionId, // Use conversion ID as job ID for deduplication
  });

  logger.info(`Added conversion job ${job.id} to queue (priority: ${priority})`);
  return job.id!;
};

// Get job status and progress
export const getJobProgress = async (jobId: string): Promise<{
  status: string;
  progress?: ConversionProgress;
  result?: any;
  error?: string;
}> => {
  const job = await conversionQueue.getJob(jobId);

  if (!job) {
    return { status: 'not_found' };
  }

  const state = await job.getState();
  const progress = job.progress as ConversionProgress | undefined;
  const failedReason = job.failedReason;
  const returnValue = job.returnvalue;

  return {
    status: state,
    progress,
    result: returnValue,
    error: failedReason,
  };
};

// Cancel/remove a job
export const cancelJob = async (jobId: string): Promise<boolean> => {
  const job = await conversionQueue.getJob(jobId);
  
  if (!job) {
    return false;
  }

  await job.remove();
  logger.info(`Cancelled job ${jobId}`);
  return true;
};

// Clean old jobs
export const cleanJobs = async () => {
  await conversionQueue.clean(86400000, 1000, 'completed'); // 24 hours
  await conversionQueue.clean(604800000, 500, 'failed'); // 7 days
  logger.info('Cleaned old jobs from queue');
};

// Graceful shutdown
export const closeQueue = async () => {
  await conversionQueue.close();
  await conversionQueueEvents.close();
  logger.info('Conversion queue closed');
};
