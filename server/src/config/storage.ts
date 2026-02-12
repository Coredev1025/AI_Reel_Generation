import { getSupabaseAdmin } from './database';
import { logger } from '../utils/logger';

export const BUCKETS = {
  IMAGES: 'images',
  VIDEOS: 'videos',
  MUSIC: 'music',
  LOGOS: 'logos',
} as const;

export async function ensureStorageBuckets(): Promise<void> {
  const db = getSupabaseAdmin();

  const bucketConfigs = [
    {
      id: BUCKETS.IMAGES,
      public: false,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    },
    {
      id: BUCKETS.VIDEOS,
      public: false,
      fileSizeLimit: 524288000, // 500MB
      allowedMimeTypes: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
    },
    {
      id: BUCKETS.MUSIC,
      public: false,
      fileSizeLimit: 20971520, // 20MB
      allowedMimeTypes: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/aac'],
    },
    {
      id: BUCKETS.LOGOS,
      public: false,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
    },
  ];

  for (const bucketConfig of bucketConfigs) {
    try {
      const { data: existingBucket } = await db.storage.getBucket(bucketConfig.id);
      if (!existingBucket) {
        const { error } = await db.storage.createBucket(bucketConfig.id, {
          public: bucketConfig.public,
          fileSizeLimit: bucketConfig.fileSizeLimit,
          allowedMimeTypes: bucketConfig.allowedMimeTypes,
        });
        if (error) {
          logger.warn(`Failed to create bucket ${bucketConfig.id}`, { error: error.message });
        } else {
          logger.info(`Created storage bucket: ${bucketConfig.id}`);
        }
      }
    } catch (err) {
      logger.warn(`Error checking bucket ${bucketConfig.id}`, { error: err });
    }
  }
}
