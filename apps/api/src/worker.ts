import dotenv from 'dotenv';

// Load environment variables FIRST before any other imports
dotenv.config();

console.log('Worker environment check:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- USE_LOCALSTACK:', process.env.USE_LOCALSTACK);
console.log('- S3_ENDPOINT:', process.env.S3_ENDPOINT);

import { logger } from './config/logger';
import { conversionWorker } from './workers/conversion.worker';

logger.info('Starting OmniConvert Worker...');
logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
logger.info(`Redis URL: ${process.env.REDIS_URL}`);

// Worker will start processing jobs automatically
logger.info('Worker is running and waiting for jobs...');
logger.info(`Worker name: ${conversionWorker.name}, concurrency: ${conversionWorker.opts.concurrency}`);

// Keep the process alive with periodic heartbeat
setInterval(() => {
  logger.debug('Worker heartbeat - still alive');
}, 30000); // Log heartbeat every 30 seconds

// Keep the process alive
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
