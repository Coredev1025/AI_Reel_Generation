import { Job } from 'bull';
import { getSupabaseAdmin } from '../../config/database';
import { logger } from '../../utils/logger';
import { processVideo } from '../../services/videoProcessor';

interface VideoJobData {
  jobId: string;
  projectId: string;
  userId: string;
  settings: Record<string, any>;
}

export async function processVideoJob(job: Job<VideoJobData>): Promise<any> {
  const { jobId, projectId, userId, settings } = job.data;
  const db = getSupabaseAdmin();

  logger.info('Processing video job', { jobId, projectId });

  try {
    // Update job status to processing
    await db
      .from('processing_jobs')
      .update({
        status: 'processing',
        stage: 'initializing',
        progress: 0,
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    await job.progress(5);

    // Get project name for the processor
    const { data: project } = await db
      .from('projects')
      .select('name')
      .eq('id', projectId)
      .single();

    if (!project) {
      throw new Error('Project not found');
    }

    // Use the real VideoProcessor with OpenAI + Runway ML + FFmpeg
    await processVideo(projectId, project.name, userId, settings, jobId);

    await job.progress(100);

    // Track analytics
    try {
      const { analyticsService } = await import('../../services/analyticsService');
      await analyticsService.trackEvent(userId, 'video_generated', { projectId, jobId });
    } catch {
      // Analytics tracking failure is non-critical
    }

    logger.info('Video job completed successfully', { jobId, projectId });
    return { success: true, jobId };
  } catch (err) {
    const errorMessage = (err as Error).message;
    logger.error('Video job failed', { jobId, error: errorMessage });

    // Update job status
    await db
      .from('processing_jobs')
      .update({
        status: 'failed',
        stage: 'failed',
        error_message: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    // Update video status
    const { data: pJob } = await db
      .from('processing_jobs')
      .select('video_id')
      .eq('id', jobId)
      .single();

    if (pJob?.video_id) {
      await db
        .from('videos')
        .update({ status: 'failed', error_message: errorMessage })
        .eq('id', pJob.video_id);
    }

    // Emit socket event
    try {
      const { getSocketIO } = await import('../../socket');
      const io = getSocketIO();
      if (io) {
        io.to(`project:${projectId}`).emit('processing-failed', {
          jobId,
          projectId,
          error: errorMessage,
        });
      }
    } catch {
      // Socket not available
    }

    // Update project status
    await checkAndUpdateProjectStatus(db, projectId);
    throw err;
  }
}

async function checkAndUpdateProjectStatus(db: any, projectId: string): Promise<void> {
  const { data: jobs } = await db
    .from('processing_jobs')
    .select('status')
    .eq('project_id', projectId);

  if (!jobs || jobs.length === 0) return;

  const hasProcessing = jobs.some((j: any) => j.status === 'processing' || j.status === 'queued');
  const allCompleted = jobs.every((j: any) => j.status === 'completed');
  const hasFailed = jobs.some((j: any) => j.status === 'failed');

  let projectStatus = 'active';
  if (hasProcessing) {
    projectStatus = 'processing';
  } else if (allCompleted) {
    projectStatus = 'completed';
  } else if (hasFailed) {
    projectStatus = 'failed';
  }

  await db
    .from('projects')
    .update({ status: projectStatus, updated_at: new Date().toISOString() })
    .eq('id', projectId);
}
