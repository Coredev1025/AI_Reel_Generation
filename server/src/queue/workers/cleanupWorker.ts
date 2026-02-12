import { Job } from 'bull';
import fs from 'fs';
import path from 'path';
import { config } from '../../config';
import { logger } from '../../utils/logger';

interface CleanupJobData {
  type: 'temp_files' | 'old_jobs' | 'expired_shares';
  maxAge?: number; // in milliseconds
}

export async function processCleanupJob(job: Job<CleanupJobData>): Promise<any> {
  const { type, maxAge } = job.data;

  logger.info('Processing cleanup job', { type });

  switch (type) {
    case 'temp_files':
      return cleanupTempFiles(maxAge || 3600000); // Default: 1 hour
    case 'old_jobs':
      return cleanupOldJobs();
    case 'expired_shares':
      return cleanupExpiredShares();
    default:
      logger.warn('Unknown cleanup type', { type });
  }
}

async function cleanupTempFiles(maxAge: number): Promise<{ cleaned: number }> {
  const tempDir = path.join(config.upload.dir, 'temp');
  let cleaned = 0;

  if (!fs.existsSync(tempDir)) {
    return { cleaned: 0 };
  }

  try {
    const files = fs.readdirSync(tempDir);
    const now = Date.now();

    for (const file of files) {
      const filePath = path.join(tempDir, file);
      try {
        const stats = fs.statSync(filePath);
        if (now - stats.mtimeMs > maxAge) {
          fs.unlinkSync(filePath);
          cleaned++;
        }
      } catch {
        // Skip files that can't be accessed
      }
    }
  } catch (err) {
    logger.error('Error cleaning temp files', { error: err });
  }

  logger.info('Temp file cleanup complete', { cleaned });
  return { cleaned };
}

async function cleanupOldJobs(): Promise<void> {
  try {
    const { getSupabaseAdmin } = await import('../../config/database');
    const db = getSupabaseAdmin();

    // Delete completed jobs older than 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    await db
      .from('processing_jobs')
      .delete()
      .in('status', ['completed', 'failed', 'cancelled'])
      .lt('completed_at', thirtyDaysAgo);

    logger.info('Old jobs cleanup complete');
  } catch (err) {
    logger.error('Error cleaning old jobs', { error: err });
  }
}

async function cleanupExpiredShares(): Promise<void> {
  try {
    const { getSupabaseAdmin } = await import('../../config/database');
    const db = getSupabaseAdmin();

    await db
      .from('video_shares')
      .delete()
      .not('expires_at', 'is', null)
      .lt('expires_at', new Date().toISOString());

    logger.info('Expired shares cleanup complete');
  } catch (err) {
    logger.error('Error cleaning expired shares', { error: err });
  }
}
