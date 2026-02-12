import { getSupabaseAdmin } from '../config/database';
import { NotFoundError } from '../utils/errors';
import { generateId } from '../utils/helpers';
import { logger } from '../utils/logger';

export class ProcessingService {
  private db = getSupabaseAdmin();

  async startProcessing(
    projectId: string,
    userId: string,
    settings: Record<string, any>
  ): Promise<any> {
    // Verify project ownership and get images
    const { data: project } = await this.db
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (!project) {
      throw new NotFoundError('Project');
    }

    const { data: images } = await this.db
      .from('images')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index');

    if (!images || images.length === 0) {
      throw new Error('No images found for this project');
    }

    // Create processing job
    const batchId = generateId();
    const aspectRatio = settings.aspectRatio || '16:9';
    const aspectRatios = aspectRatio === 'both' ? ['16:9', '9:16'] : [aspectRatio];

    const jobs: any[] = [];

    for (const ar of aspectRatios) {
      // Create video record
      const videoId = generateId();
      const { data: video } = await this.db
        .from('videos')
        .insert({
          id: videoId,
          project_id: projectId,
          user_id: userId,
          project_name: project.name,
          filename: `${project.name}_${ar.replace(':', '-')}.mp4`,
          file_path: '',
          file_size: 0,
          duration: 0,
          aspect_ratio: ar,
          status: 'pending',
          settings,
        })
        .select('*')
        .single();

      // Create processing job
      const jobId = generateId();
      const { data: job } = await this.db
        .from('processing_jobs')
        .insert({
          id: jobId,
          project_id: projectId,
          user_id: userId,
          project_name: project.name,
          video_id: videoId,
          status: 'queued',
          progress: 0,
          stage: 'queued',
          priority: 0,
          batch_id: batchId,
          retry_count: 0,
          max_retries: 3,
          data: { images: images.map((img: any) => img.id), aspectRatio: ar },
          settings,
        })
        .select('*')
        .single();

      jobs.push({ job, video });
    }

    // Update project status
    await this.db
      .from('projects')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', projectId);

    // Try to add to Bull queue if available
    try {
      const { getVideoQueue } = await import('../queue');
      const queue = getVideoQueue();
      if (queue) {
        for (const { job } of jobs) {
          await queue.add('video-generation', {
            jobId: job.id,
            projectId,
            userId,
            settings,
          }, {
            priority: job.priority,
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
            timeout: 600000,
          });
        }
        logger.info('Jobs added to Bull queue', { batchId, count: jobs.length });
      }
    } catch (err) {
      logger.warn('Bull queue not available, jobs stored in database only', { error: err });
    }

    logger.info('Processing started', { projectId, batchId, jobCount: jobs.length });
    return {
      batchId,
      jobs: jobs.map(j => j.job),
      videos: jobs.map(j => j.video),
    };
  }

  async getProcessingStatus(processingId: string, userId: string): Promise<any> {
    // Could be a batch ID or job ID
    const { data: job } = await this.db
      .from('processing_jobs')
      .select('*')
      .eq('user_id', userId)
      .or(`id.eq.${processingId},batch_id.eq.${processingId}`)
      .order('created_at', { ascending: false });

    if (!job || job.length === 0) {
      throw new NotFoundError('Processing job');
    }

    // Get related videos
    const videoIds = job.map((j: any) => j.video_id).filter(Boolean);
    const { data: videos } = await this.db
      .from('videos')
      .select('*')
      .in('id', videoIds);

    return {
      jobs: job,
      videos: videos || [],
    };
  }

  async cleanupFailedProcessing(processingId: string, userId: string): Promise<void> {
    const { data: jobs } = await this.db
      .from('processing_jobs')
      .select('*')
      .eq('user_id', userId)
      .or(`id.eq.${processingId},batch_id.eq.${processingId}`);

    if (!jobs || jobs.length === 0) {
      throw new NotFoundError('Processing job');
    }

    for (const job of jobs) {
      if (job.video_id) {
        await this.db.from('videos').delete().eq('id', job.video_id);
      }
      await this.db.from('processing_jobs').delete().eq('id', job.id);
    }

    // Reset project status
    if (jobs[0]?.project_id) {
      await this.db
        .from('projects')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', jobs[0].project_id);
    }

    logger.info('Failed processing cleaned up', { processingId });
  }

  async restartProcessing(processingId: string, userId: string): Promise<any> {
    const { data: originalJob } = await this.db
      .from('processing_jobs')
      .select('*')
      .eq('id', processingId)
      .eq('user_id', userId)
      .single();

    if (!originalJob) {
      throw new NotFoundError('Processing job');
    }

    // Reset the job
    const { data: job } = await this.db
      .from('processing_jobs')
      .update({
        status: 'queued',
        progress: 0,
        stage: 'queued',
        error_message: null,
        retry_count: 0,
        started_at: null,
        completed_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', processingId)
      .select('*')
      .single();

    // Reset video status
    if (originalJob.video_id) {
      await this.db
        .from('videos')
        .update({ status: 'pending', error_message: null })
        .eq('id', originalJob.video_id);
    }

    // Update project status
    await this.db
      .from('projects')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', originalJob.project_id);

    // Try to add to queue
    try {
      const { getVideoQueue } = await import('../queue');
      const queue = getVideoQueue();
      if (queue) {
        await queue.add('video-generation', {
          jobId: processingId,
          projectId: originalJob.project_id,
          userId,
          settings: originalJob.settings,
        }, {
          priority: originalJob.priority,
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          timeout: 600000,
        });
      }
    } catch (err) {
      logger.warn('Queue not available for restart');
    }

    logger.info('Processing restarted', { processingId });
    return job;
  }

  async generateDefaultPrompts(projectId: string, userId: string): Promise<any> {
    const { data: images } = await this.db
      .from('images')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .order('order_index');

    if (!images || images.length === 0) {
      throw new NotFoundError('No images found');
    }

    // Generate default prompts for each image
    const prompts: Record<string, string> = {};
    images.forEach((img: any, index: number) => {
      prompts[img.id] = `Smooth cinematic camera movement for image ${index + 1}`;
    });

    return { prompts };
  }
}

export const processingService = new ProcessingService();
