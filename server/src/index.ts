import http from 'http';
import app from './app';
import { config } from './config';
import { testDatabaseConnection } from './config/database';
import { testRedisConnection } from './config/redis';
import { ensureStorageBuckets } from './config/storage';
import { initializeQueues, closeQueues } from './queue';
import { initializeSocket } from './socket';
import { logger } from './utils/logger';

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
initializeSocket(server);

async function startServer(): Promise<void> {
  logger.info('Starting AI Reel Generation Server...', {
    environment: config.env,
    port: config.port,
  });

  // Test database connection
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    logger.warn('Database connection failed - some features may not work');
  }

  // Test Redis connection and initialize queues
  const redisConnected = await testRedisConnection();
  if (redisConnected) {
    await initializeQueues();
    logger.info('Queue system initialized');
  } else {
    logger.warn('Redis not available - queue features disabled');
  }

  // Ensure storage buckets exist
  try {
    await ensureStorageBuckets();
  } catch (err) {
    logger.warn('Failed to ensure storage buckets', { error: err });
  }

  // Start the server
  server.listen(config.port, () => {
    logger.info(`Server running on port ${config.port}`, {
      url: `http://localhost:${config.port}`,
      api: `http://localhost:${config.port}/api`,
      health: `http://localhost:${config.port}/api/health`,
    });
  });
}

// ─── Graceful Shutdown ────────────────────────────────────
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}. Shutting down gracefully...`);

  // Close the HTTP server
  server.close(async () => {
    logger.info('HTTP server closed');

    // Close queues
    try {
      await closeQueues();
      logger.info('Queues closed');
    } catch (err) {
      logger.error('Error closing queues', { error: err });
    }

    // Close Redis
    try {
      const { closeRedis } = await import('./config/redis');
      await closeRedis();
      logger.info('Redis connection closed');
    } catch (err) {
      logger.error('Error closing Redis', { error: err });
    }

    logger.info('Server shut down successfully');
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled errors
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise: String(promise) });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

// Start the server
startServer().catch((err) => {
  logger.error('Failed to start server', { error: err });
  process.exit(1);
});

export { server };
