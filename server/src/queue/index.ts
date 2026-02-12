import Bull, { Queue } from 'bull';
import { config } from '../config';
import { logger } from '../utils/logger';

let videoQueue: Queue | null = null;
let cleanupQueue: Queue | null = null;

export function getVideoQueue(): Queue | null {
  return videoQueue;
}

export function getCleanupQueue(): Queue | null {
  return cleanupQueue;
}

export async function initializeQueues(): Promise<void> {
  try {
    const redisOpts = {
      redis: config.redis.url,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    };

    videoQueue = new Bull('video-generation', config.redis.url, {
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        timeout: 600000, // 10 minutes
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });

    cleanupQueue = new Bull('cleanup', config.redis.url, {
      defaultJobOptions: {
        attempts: 2,
        timeout: 60000,
        removeOnComplete: 50,
        removeOnFail: 20,
      },
    });

    // Set up event listeners
    videoQueue.on('error', (err) => {
      logger.error('Video queue error', { error: err.message });
    });

    videoQueue.on('failed', (job, err) => {
      logger.error('Video job failed', {
        jobId: job.id,
        error: err.message,
        attempts: job.attemptsMade,
      });
    });

    videoQueue.on('completed', (job) => {
      logger.info('Video job completed', { jobId: job.id });
    });

    videoQueue.on('stalled', (job) => {
      logger.warn('Video job stalled', { jobId: job.id });
    });

    cleanupQueue.on('error', (err) => {
      logger.error('Cleanup queue error', { error: err.message });
    });

    // Initialize workers
    await initializeWorkers();

    logger.info('Bull queues initialized successfully');
  } catch (err) {
    logger.warn('Failed to initialize Bull queues (Redis may not be available)', {
      error: (err as Error).message,
    });
  }
}

async function initializeWorkers(): Promise<void> {
  if (!videoQueue) return;

  // Video generation worker
  videoQueue.process('video-generation', async (job) => {
    const { processVideoJob } = await import('./workers/videoWorker');
    return processVideoJob(job);
  });

  // Cleanup worker
  if (cleanupQueue) {
    cleanupQueue.process('cleanup-temp-files', async (job) => {
      const { processCleanupJob } = await import('./workers/cleanupWorker');
      return processCleanupJob(job);
    });
  }

  logger.info('Queue workers initialized');
}

export async function closeQueues(): Promise<void> {
  const queues = [videoQueue, cleanupQueue].filter(Boolean) as Queue[];
  await Promise.all(queues.map(q => q.close()));
  videoQueue = null;
  cleanupQueue = null;
  logger.info('Queues closed');
}
