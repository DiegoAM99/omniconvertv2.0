import dotenv from 'dotenv';
import { Worker, Job } from 'bullmq';
import { redisConnection } from './config/redis';

dotenv.config();

console.log('🚀 Test Worker Starting...');
console.log('Redis URL:' + process.env.REDIS_URL);

// Simple test worker
const testWorker = new Worker(
  'conversion',
  async (job: Job) => {
    console.log(`📦 Processing job ${job.id}:`, job.data);
    // Simulate work
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log(`✅ Job ${job.id} completed!`);
    return { success: true };
  },
  {
    connection: redisConnection,
    concurrency: 1,
  }
);

testWorker.on('completed', (job) => {
  console.log(`✅ Worker completed job ${job.id}`);
});

testWorker.on('failed', (job, err) => {
  console.error(`❌ Worker failed job ${job?.id}:`, err.message);
});

testWorker.on('error', (err) => {
  console.error('❌ Worker error:', err.message);
});

testWorker.on('ready', () => {
  console.log('🎯 Worker is READY and listening for jobs!');
});

console.log('⏳ Worker waiting for jobs...');

// Keep alive
setInterval(() => {
  console.log('💓 Heartbeat - Worker still alive');
}, 15000);
