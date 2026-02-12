import os from 'os';
import { getSupabaseAdmin } from '../config/database';
import { logger } from '../utils/logger';

export class AdminService {
  private db = getSupabaseAdmin();

  async getSystemHealth(): Promise<any> {
    const memoryUsage = process.memoryUsage();
    let redisConnected = false;

    try {
      const { testRedisConnection } = await import('../config/redis');
      redisConnected = await testRedisConnection();
    } catch {
      redisConnected = false;
    }

    let queueStats: any = { available: false, message: 'Queue not available' };
    try {
      const { getVideoQueue } = await import('../queue');
      const queue = getVideoQueue();
      if (queue) {
        const counts = await queue.getJobCounts() as any;
        const isPaused = await queue.isPaused();
        queueStats = {
          available: true,
          paused: isPaused,
          counts: {
            waiting: counts.waiting || 0,
            active: counts.active || 0,
            completed: counts.completed || 0,
            failed: counts.failed || 0,
            delayed: counts.delayed || 0,
            paused: counts.paused || 0,
          },
        };
      }
    } catch {
      // Queue not available
    }

    return {
      uptime: process.uptime(),
      memoryUsage: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        rss: memoryUsage.rss,
      },
      cpuUsage: os.loadavg(),
      platform: os.platform(),
      nodeVersion: process.version,
      redisConnected,
      queueStats,
    };
  }

  async getRunwayQuota(): Promise<any> {
    const today = new Date().toISOString().split('T')[0];

    const { data: todayStats } = await this.db
      .from('usage_stats')
      .select('runway_api_calls, runway_cost')
      .eq('date', today);

    const totalCalls = (todayStats || []).reduce((s: number, st: any) => s + (st.runway_api_calls || 0), 0);
    const totalCost = (todayStats || []).reduce((s: number, st: any) => s + (st.runway_cost || 0), 0);

    return {
      dailyLimit: 8000,
      usedToday: totalCalls,
      remaining: 8000 - totalCalls,
      costToday: Math.round(totalCost * 100) / 100,
      perSecondLimit: 5,
    };
  }

  async getErrorLogs(page: number = 1, limit: number = 20): Promise<any> {
    const offset = (page - 1) * limit;

    const { data: logs, count, error } = await this.db
      .from('system_logs')
      .select('*', { count: 'exact' })
      .in('log_level', ['error', 'critical'])
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error('Failed to fetch error logs');
    }

    return {
      logs: logs || [],
      pagination: {
        currentPage: page,
        totalPages: Math.ceil((count || 0) / limit),
        totalItems: count || 0,
        itemsPerPage: limit,
      },
    };
  }

  async getUsageReport(startDate?: string, endDate?: string): Promise<any> {
    let query = this.db
      .from('usage_stats')
      .select('*')
      .order('date', { ascending: false });

    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data: stats } = await query;

    const totals = (stats || []).reduce(
      (acc: any, s: any) => ({
        videosGenerated: acc.videosGenerated + (s.videos_generated || 0),
        storageUsed: acc.storageUsed + (s.storage_used_bytes || 0),
        apiCalls: acc.apiCalls + (s.runway_api_calls || 0),
        cost: acc.cost + (s.runway_cost || 0),
        processingTime: acc.processingTime + (s.processing_time_seconds || 0),
        successful: acc.successful + (s.successful_videos || 0),
        failed: acc.failed + (s.failed_videos || 0),
      }),
      { videosGenerated: 0, storageUsed: 0, apiCalls: 0, cost: 0, processingTime: 0, successful: 0, failed: 0 }
    );

    return {
      dailyStats: stats || [],
      totals,
    };
  }

  async getRateLimitStats(): Promise<any> {
    const { data: limits } = await this.db
      .from('api_rate_limits')
      .select('*')
      .order('updated_at', { ascending: false });

    return {
      limits: limits || [],
      runway: {
        perSecond: { limit: 5, current: 0 },
        perDay: { limit: 8000, current: 0 },
      },
    };
  }

  async getQueueStats(): Promise<any> {
    try {
      const { getVideoQueue } = await import('../queue');
      const queue = getVideoQueue();
      if (!queue) {
        return { available: false, message: 'Queue not initialized' };
      }

      const counts = await queue.getJobCounts() as any;
      const isPaused = await queue.isPaused();

      return {
        available: true,
        paused: isPaused,
        counts: {
          waiting: counts.waiting || 0,
          active: counts.active || 0,
          completed: counts.completed || 0,
          failed: counts.failed || 0,
          delayed: counts.delayed || 0,
          paused: counts.paused || 0,
        },
      };
    } catch {
      return { available: false, message: 'Queue service not available' };
    }
  }

  async getQueueJobs(status: string, start: number, end: number): Promise<any> {
    try {
      const { getVideoQueue } = await import('../queue');
      const queue = getVideoQueue();
      if (!queue) {
        return { jobs: [], message: 'Queue not available' };
      }

      let jobs: any[] = [];
      switch (status) {
        case 'waiting':
          jobs = await queue.getWaiting(start, end);
          break;
        case 'active':
          jobs = await queue.getActive(start, end);
          break;
        case 'completed':
          jobs = await queue.getCompleted(start, end);
          break;
        case 'failed':
          jobs = await queue.getFailed(start, end);
          break;
        case 'delayed':
          jobs = await queue.getDelayed(start, end);
          break;
        default:
          jobs = await queue.getWaiting(start, end);
      }

      return {
        jobs: jobs.map(j => ({
          id: j.id,
          name: j.name,
          data: j.data,
          progress: j.progress,
          attemptsMade: j.attemptsMade,
          timestamp: j.timestamp,
          finishedOn: j.finishedOn,
          processedOn: j.processedOn,
          failedReason: j.failedReason,
        })),
      };
    } catch {
      return { jobs: [], message: 'Queue service not available' };
    }
  }

  async pauseQueue(): Promise<void> {
    const { getVideoQueue } = await import('../queue');
    const queue = getVideoQueue();
    if (queue) {
      await queue.pause();
      logger.info('Queue paused');
    }
  }

  async resumeQueue(): Promise<void> {
    const { getVideoQueue } = await import('../queue');
    const queue = getVideoQueue();
    if (queue) {
      await queue.resume();
      logger.info('Queue resumed');
    }
  }
}

export const adminService = new AdminService();
