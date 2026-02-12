import { getSupabaseAdmin } from '../config/database';
import { logger } from '../utils/logger';

export class AnalyticsService {
  private db = getSupabaseAdmin();

  async getOverview(userId?: string): Promise<any> {
    const db = this.db;

    let videoQuery = db.from('videos').select('id, status, file_size', { count: 'exact' });
    let projectQuery = db.from('projects').select('id', { count: 'exact' });
    let imageQuery = db.from('images').select('id', { count: 'exact' });
    let userQuery = db.from('users').select('id', { count: 'exact' });
    let jobQuery = db.from('processing_jobs').select('id, status', { count: 'exact' });

    if (userId) {
      videoQuery = videoQuery.eq('user_id', userId);
      projectQuery = projectQuery.eq('user_id', userId);
      imageQuery = imageQuery.eq('user_id', userId);
      jobQuery = jobQuery.eq('user_id', userId);
    }

    const [videos, projects, images, users, jobs] = await Promise.all([
      videoQuery, projectQuery, imageQuery, userQuery, jobQuery,
    ]);

    const completedJobs = (jobs.data || []).filter((j: any) => j.status === 'completed').length;
    const failedJobs = (jobs.data || []).filter((j: any) => j.status === 'failed').length;
    const totalJobs = completedJobs + failedJobs;
    const successRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;

    return {
      totalVideos: videos.count || 0,
      totalProjects: projects.count || 0,
      totalImages: images.count || 0,
      totalUsers: users.count || 0,
      completedJobs,
      failedJobs,
      successRate: Math.round(successRate * 100) / 100,
      avgProcessingTime: 0, // Computed from job data
    };
  }

  async getProcessingAnalytics(userId?: string): Promise<any> {
    let query = this.db
      .from('processing_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: jobs } = await query;

    const processing = {
      total: (jobs || []).length,
      queued: (jobs || []).filter((j: any) => j.status === 'queued').length,
      processing: (jobs || []).filter((j: any) => j.status === 'processing').length,
      completed: (jobs || []).filter((j: any) => j.status === 'completed').length,
      failed: (jobs || []).filter((j: any) => j.status === 'failed').length,
      recentJobs: (jobs || []).slice(0, 20),
    };

    return processing;
  }

  async getStorageAnalytics(userId?: string): Promise<any> {
    let imageQuery = this.db.from('images').select('id, file_size');
    let videoQuery = this.db.from('videos').select('id, file_size');
    let musicQuery = this.db.from('music').select('id, file_size');

    if (userId) {
      imageQuery = imageQuery.eq('user_id', userId);
      videoQuery = videoQuery.eq('user_id', userId);
      musicQuery = musicQuery.eq('user_id', userId);
    }

    const [images, videos, music] = await Promise.all([
      imageQuery, videoQuery, musicQuery,
    ]);

    const imageTotalBytes = (images.data || []).reduce((s: number, i: any) => s + (i.file_size || 0), 0);
    const videoTotalBytes = (videos.data || []).reduce((s: number, v: any) => s + (v.file_size || 0), 0);
    const musicTotalBytes = (music.data || []).reduce((s: number, m: any) => s + (m.file_size || 0), 0);

    return {
      images: { count: (images.data || []).length, totalBytes: imageTotalBytes },
      videos: { count: (videos.data || []).length, totalBytes: videoTotalBytes },
      music: { count: (music.data || []).length, totalBytes: musicTotalBytes },
      totalBytes: imageTotalBytes + videoTotalBytes + musicTotalBytes,
    };
  }

  async getRunwayAnalytics(): Promise<any> {
    const { data: stats } = await this.db
      .from('usage_stats')
      .select('*')
      .order('date', { ascending: false })
      .limit(30);

    const totalCalls = (stats || []).reduce((s: number, st: any) => s + (st.runway_api_calls || 0), 0);
    const totalCost = (stats || []).reduce((s: number, st: any) => s + (st.runway_cost || 0), 0);

    return {
      totalApiCalls: totalCalls,
      totalCost: Math.round(totalCost * 100) / 100,
      dailyStats: stats || [],
      dailyLimit: 8000,
      remainingToday: 8000 - ((stats || [])[0]?.runway_api_calls || 0),
    };
  }

  async trackEvent(
    userId: string | null,
    eventType: string,
    eventData: Record<string, any> = {},
    projectId?: string,
    videoId?: string
  ): Promise<void> {
    try {
      await this.db.from('analytics_events').insert({
        user_id: userId,
        project_id: projectId || null,
        video_id: videoId || null,
        event_type: eventType,
        event_data: eventData,
      });
    } catch (err) {
      logger.error('Failed to track analytics event', { error: err, eventType });
    }
  }
}

export const analyticsService = new AnalyticsService();
