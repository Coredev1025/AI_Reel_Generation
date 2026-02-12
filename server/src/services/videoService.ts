import { getSupabaseAdmin } from '../config/database';
import { BUCKETS } from '../config/storage';
import { NotFoundError, ValidationError } from '../utils/errors';
import { generateId, generateShareToken } from '../utils/helpers';
import { logger } from '../utils/logger';

export class VideoService {
  private db = getSupabaseAdmin();

  async getVideo(videoId: string, userId: string): Promise<any> {
    const { data: video, error } = await this.db
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .eq('user_id', userId)
      .single();

    if (error || !video) {
      throw new NotFoundError('Video');
    }

    // Generate signed URL for download
    if (video.file_path) {
      const { data: signedUrl } = await this.db.storage
        .from(BUCKETS.VIDEOS)
        .createSignedUrl(video.file_path, 3600); // 1 hour

      video.download_url = signedUrl?.signedUrl || null;
    }

    return video;
  }

  async deleteVideo(videoId: string, userId: string): Promise<void> {
    const { data: video } = await this.db
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .eq('user_id', userId)
      .single();

    if (!video) {
      throw new NotFoundError('Video');
    }

    // Delete from storage
    if (video.file_path) {
      await this.db.storage.from(BUCKETS.VIDEOS).remove([video.file_path]);
    }

    // Delete share records
    await this.db.from('video_shares').delete().eq('video_id', videoId);

    // Delete from database
    await this.db.from('videos').delete().eq('id', videoId);

    logger.info('Video deleted', { videoId });
  }

  async createShareLink(videoId: string, userId: string, expiresIn?: number): Promise<any> {
    const { data: video } = await this.db
      .from('videos')
      .select('id, file_path')
      .eq('id', videoId)
      .eq('user_id', userId)
      .single();

    if (!video) {
      throw new NotFoundError('Video');
    }

    const token = generateShareToken();
    const expiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : null;

    const { data: share, error } = await this.db
      .from('video_shares')
      .insert({
        id: generateId(),
        video_id: videoId,
        token,
        expires_at: expiresAt,
        created_by: userId,
      })
      .select('*')
      .single();

    if (error) {
      throw new Error('Failed to create share link');
    }

    logger.info('Share link created', { videoId, token });
    return share;
  }

  async getSharedVideo(token: string): Promise<any> {
    const { data: share, error } = await this.db
      .from('video_shares')
      .select('*, videos(*)')
      .eq('token', token)
      .single();

    if (error || !share) {
      throw new NotFoundError('Shared video');
    }

    // Check expiration
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      throw new ValidationError('Share link has expired');
    }

    const video = (share as any).videos;
    if (!video) {
      throw new NotFoundError('Video');
    }

    // Generate signed URL
    let downloadUrl = null;
    if (video.file_path) {
      const { data: signedUrl } = await this.db.storage
        .from(BUCKETS.VIDEOS)
        .createSignedUrl(video.file_path, 3600);
      downloadUrl = signedUrl?.signedUrl || null;
    }

    // Increment view count
    await this.db
      .from('videos')
      .update({ view_count: (video.view_count || 0) + 1 })
      .eq('id', video.id);

    return {
      id: video.id,
      filename: video.filename,
      duration: video.duration,
      thumbnail_path: video.thumbnail_path,
      download_url: downloadUrl,
      created_at: video.created_at,
      share: {
        token: share.token,
        expires_at: share.expires_at,
      },
    };
  }

  async revokeShareLink(videoId: string, userId: string): Promise<void> {
    // Verify ownership
    const { data: video } = await this.db
      .from('videos')
      .select('id')
      .eq('id', videoId)
      .eq('user_id', userId)
      .single();

    if (!video) {
      throw new NotFoundError('Video');
    }

    await this.db.from('video_shares').delete().eq('video_id', videoId);
    logger.info('Share links revoked', { videoId });
  }

  async getDownloadStream(videoId: string, userId: string): Promise<any> {
    const { data: video } = await this.db
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .eq('user_id', userId)
      .single();

    if (!video || !video.file_path) {
      throw new NotFoundError('Video');
    }

    // Generate signed URL for download
    const { data: signedUrl } = await this.db.storage
      .from(BUCKETS.VIDEOS)
      .createSignedUrl(video.file_path, 3600);

    return {
      url: signedUrl?.signedUrl,
      filename: video.filename || `${videoId}.mp4`,
      contentType: 'video/mp4',
    };
  }

  async cleanupFailedVideo(videoId: string, userId: string): Promise<void> {
    const { data: video } = await this.db
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .eq('user_id', userId)
      .single();

    if (!video) {
      throw new NotFoundError('Video');
    }

    // Remove from storage if exists
    if (video.file_path) {
      await this.db.storage.from(BUCKETS.VIDEOS).remove([video.file_path]);
    }

    // Delete the video record
    await this.db.from('videos').delete().eq('id', videoId);

    logger.info('Failed video cleaned up', { videoId });
  }
}

export const videoService = new VideoService();
