import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import ffmpeg from 'fluent-ffmpeg';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { getSupabaseAdmin } from '../config/database';
import { BUCKETS } from '../config/storage';
import { config } from '../config';
import { logger } from '../utils/logger';
import { getStoragePath } from '../utils/helpers';

interface VideoProcessorSettings {
  videoDuration?: number;
  musicVolume?: number;
  imagePrompts?: Record<string, string>;
  aspectRatio?: string;
  ratio?: string;
  transition?: string;
  transitionDuration?: number;
  introText?: string;
  outroText?: string;
  logo?: {
    path: string;
    filename: string;
    position: string;
    opacity: number;
  };
  videoName?: string;
  imageOrder?: string[];
  seed?: number;
}

interface PhotoItem {
  id: string;
  filename: string;
  originalname: string;
  path: string;
  size: number;
}

export class VideoProcessor {
  private openai: OpenAI | null = null;
  private projectId: string;
  private projectName: string;
  private userId: string;
  private settings: VideoProcessorSettings;
  private workingDir: string;
  private videosDir: string;
  private jobId: string;
  private db = getSupabaseAdmin();
  private isProcessing = false;
  private timeoutId: NodeJS.Timeout | null = null;

  constructor(
    projectId: string,
    projectName: string,
    userId: string,
    settings: VideoProcessorSettings,
    jobId: string
  ) {
    this.projectId = projectId;
    this.projectName = projectName;
    this.userId = userId;
    this.settings = settings;
    this.jobId = jobId;

    const uploadsBase = path.resolve(config.upload.dir);
    this.workingDir = path.join(uploadsBase, projectName, 'processing');
    this.videosDir = path.join(this.workingDir, 'videos');

    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }

    logger.info(`[VideoProcessor] Initialized for project: ${projectName}, Job ID: ${jobId}`);
  }

  private async updateStatus(
    stage: string,
    progress: number,
    currentStep: string = '',
    errorMsg: string | null = null
  ): Promise<void> {
    try {
      const status = errorMsg ? 'error' : progress >= 100 ? 'completed' : 'processing';

      const updateData: Record<string, any> = {
        status,
        progress,
        stage,
        error_message: errorMsg,
        updated_at: new Date().toISOString(),
      };

      if (stage === 'preparing' && progress <= 5) {
        updateData.started_at = new Date().toISOString();
      }
      if (progress >= 100) {
        updateData.completed_at = new Date().toISOString();
      }

      await this.db
        .from('processing_jobs')
        .update(updateData)
        .eq('id', this.jobId);

      // Emit progress via WebSocket
      try {
        const { emitToProject } = await import('../socket');
        emitToProject(this.projectId, 'progress-update', {
          jobId: this.jobId,
          projectId: this.projectId,
          progress,
          stage,
          currentStep,
        });
      } catch {
        // Socket not available
      }
    } catch (err) {
      logger.error(`[VideoProcessor:${this.jobId}] Status update error:`, { error: err });
    }
  }

  private async cleanup(): Promise<void> {
    try {
      if (await fs.pathExists(this.workingDir)) {
        await fs.remove(this.workingDir);
        logger.info(`[VideoProcessor:${this.jobId}] Cleaned up: ${this.workingDir}`);
      }
    } catch (err) {
      logger.error(`[VideoProcessor:${this.jobId}] Cleanup error:`, { error: err });
    }
  }

  private getVideoDuration(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err: any, metadata: any) => {
        if (err) return reject(err);
        resolve(metadata.format.duration || 0);
      });
    });
  }

  async processVideo(): Promise<string> {
    logger.info(`[VideoProcessor:${this.jobId}] Starting video processing`);

    try {
      await this.updateStatus('preparing', 5, 'Setting up workspace');
      await fs.ensureDir(this.workingDir);
      await fs.ensureDir(this.videosDir);

      // Get images from database
      const { data: images } = await this.db
        .from('images')
        .select('*')
        .eq('project_id', this.projectId)
        .order('order_index');

      if (!images || images.length === 0) {
        throw new Error('No images found for processing');
      }

      // Sort by custom order if provided
      let sortedImages = images;
      if (this.settings.imageOrder && Array.isArray(this.settings.imageOrder)) {
        const orderMap = new Map<string, number>();
        this.settings.imageOrder.forEach((id, idx) => orderMap.set(id, idx));
        sortedImages = [...images].sort((a, b) => {
          const orderA = orderMap.get(a.id) ?? 999999;
          const orderB = orderMap.get(b.id) ?? 999999;
          return orderA - orderB;
        });
      }

      // Download images from Supabase Storage to local working dir
      const photos: PhotoItem[] = [];
      for (const img of sortedImages) {
        const localPath = path.join(this.workingDir, img.filename);
        try {
          const { data: fileData, error } = await this.db.storage
            .from(BUCKETS.IMAGES)
            .download(img.file_path);
          if (error || !fileData) {
            logger.warn(`[VideoProcessor] Failed to download image: ${img.filename}`);
            continue;
          }
          const buffer = Buffer.from(await fileData.arrayBuffer());
          await fs.writeFile(localPath, buffer);
          photos.push({
            id: img.id,
            filename: img.filename,
            originalname: img.original_name,
            path: localPath,
            size: img.file_size || 0,
          });
        } catch (err) {
          logger.warn(`[VideoProcessor] Error downloading image ${img.filename}:`, { error: err });
        }
      }

      if (photos.length === 0) {
        throw new Error('No images could be downloaded for processing');
      }

      await this.updateStatus('animating', 5, 'Starting photo animation');

      // Step 1: Animate photos
      const animatedVideos = await this.animatePhotos(photos);

      if (animatedVideos.length === 0) {
        throw new Error('No videos were generated from photos');
      }

      await this.updateStatus('stitching', 90, 'Stitching videos together');

      // Step 2: Stitch videos
      const stitchedVideo = await this.stitchVideos(animatedVideos);

      await this.updateStatus('adding-music', 95, 'Adding background music');

      // Step 3: Add background music
      const finalVideo = await this.addBackgroundMusic(stitchedVideo);

      const duration = await this.getVideoDuration(finalVideo);
      const stats = await fs.stat(finalVideo);

      // Generate unique filename
      const videoName = this.settings.videoName || `video_${Date.now()}`;
      const sanitizedName = videoName.replace(/[^a-zA-Z0-9\s\-_]/g, '_').replace(/\s+/g, '_');
      const uniqueFilename = `${sanitizedName}_${Date.now()}.mp4`;

      // Upload final video to Supabase Storage
      const videoBuffer = await fs.readFile(finalVideo);
      const storagePath = getStoragePath(
        this.userId,
        this.projectId,
        'completed',
        uniqueFilename
      );

      const { error: uploadError } = await this.db.storage
        .from(BUCKETS.VIDEOS)
        .upload(storagePath, videoBuffer, {
          contentType: 'video/mp4',
          upsert: true,
        });

      if (uploadError) {
        logger.error('Failed to upload video to storage', { error: uploadError.message });
      }

      // Update video record in database
      const { data: processingJob } = await this.db
        .from('processing_jobs')
        .select('video_id')
        .eq('id', this.jobId)
        .single();

      if (processingJob?.video_id) {
        await this.db
          .from('videos')
          .update({
            filename: uniqueFilename,
            file_path: storagePath,
            file_size: stats.size,
            duration,
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', processingJob.video_id);
      }

      // Update project status
      await this.db
        .from('projects')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', this.projectId);

      await this.updateStatus('completed', 100, 'Video processing complete');

      // Emit completion event
      try {
        const { emitToProject } = await import('../socket');
        emitToProject(this.projectId, 'processing-complete', {
          jobId: this.jobId,
          projectId: this.projectId,
          videoId: processingJob?.video_id,
          status: 'completed',
        });
      } catch {
        // Socket not available
      }

      // Cleanup working directory
      await this.cleanup();

      logger.info(`[VideoProcessor:${this.jobId}] Processing completed successfully`);
      return finalVideo;
    } catch (error: any) {
      logger.error(`[VideoProcessor:${this.jobId}] Processing error:`, { error: error.message });
      await this.updateStatus('error', 0, 'Error occurred', error.message);

      // Update video status to failed
      const { data: pJob } = await this.db
        .from('processing_jobs')
        .select('video_id')
        .eq('id', this.jobId)
        .single();

      if (pJob?.video_id) {
        await this.db
          .from('videos')
          .update({ status: 'failed', error_message: error.message })
          .eq('id', pJob.video_id);
      }

      // Update project status
      await this.db
        .from('projects')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', this.projectId);

      // Emit failure event
      try {
        const { emitToProject } = await import('../socket');
        emitToProject(this.projectId, 'processing-failed', {
          jobId: this.jobId,
          projectId: this.projectId,
          error: error.message,
        });
      } catch {
        // Socket not available
      }

      await this.cleanup();
      throw error;
    }
  }

  private async animatePhotos(photos: PhotoItem[]): Promise<string[]> {
    const animatedVideos: string[] = [];
    const totalPhotos = photos.length;

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const progressPerPhoto = 80 / totalPhotos;
      const currentProgress = 5 + i * progressPerPhoto;

      await this.updateStatus(
        'animating',
        Math.round(currentProgress),
        `Animating photo ${i + 1} of ${totalPhotos}`
      );

      try {
        const videoPath = await this.animatePhoto(photo, i);
        if (videoPath) {
          animatedVideos.push(videoPath);
        }
      } catch (error) {
        logger.error(`[VideoProcessor:${this.jobId}] Failed to animate ${photo.filename}`, { error });
        try {
          const fallback = await this.createStaticVideo(photo, i);
          animatedVideos.push(fallback);
        } catch (fbErr) {
          logger.error(`[VideoProcessor:${this.jobId}] Fallback also failed for ${photo.filename}`, { error: fbErr });
        }
      }
    }

    return animatedVideos;
  }

  private async animatePhoto(photo: PhotoItem, index: number): Promise<string | null> {
    if (config.runway.apiKey && process.env.OPENAI_API_KEY) {
      let attempts = 3;
      let videoPath: string | null = null;

      while (attempts > 0) {
        try {
          let prompt = this.settings.imagePrompts?.[photo.id];
          if (!prompt || prompt.trim() === '') {
            prompt = await this.analyzePhotoWithOpenAI(photo) || undefined;
          }
          videoPath = await this.callRunwayML(photo, index, prompt || 'Smooth cinematic camera movement');
          if (videoPath) break;
          attempts--;
        } catch (error) {
          logger.error(`[VideoProcessor:${this.jobId}] Runway attempt failed`, { error });
          attempts--;
        }
      }
      return videoPath;
    } else {
      return await this.createZoomVideo(photo, index);
    }
  }

  private async analyzePhotoWithOpenAI(photo: PhotoItem): Promise<string | null> {
    if (!this.openai) return null;

    try {
      const imageBuffer = await fs.readFile(photo.path);
      const base64Image = imageBuffer.toString('base64');
      const ext = photo.filename.split('.').pop() || 'jpeg';
      const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
      const imageUrl = `data:${mimeType};base64,${base64Image}`;

      const systemPrompt = `You are an expert in vision-based motion design and cinematic prompt generation. Your task is to analyze user input prompts (generating video from real estate images) and generate natural language camera motion prompts suitable for Runway ML Gen-4 Turbo.

Apply these rules:

1. The camera should walk forward while smoothly rotating (clockwise or counterclockwise based on composition) to simulate a confident walkthrough at moderate to fast pace.

2. If the main element is a staircase (not small), rotate to face it naturally, simulate ascending with forward and upward motion plus slight rotation, ending at the top or transition point.

3. If the main element is a door (not small), set it as final target, guide forward motion to the door, rotate to face it, ending just before or at the door.

4. Avoid unnatural tilt down or right, keep all motion within image boundaries.

5. Maintain an elegant, cinematic, smooth tone suitable for real estate tours.

Output only the refined, concise (under 450 characters) natural language camera motion prompt based on the user's input. No notes or system messages.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: systemPrompt },
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          },
        ],
      });

      return response.choices[0]?.message?.content || null;
    } catch (error) {
      logger.error(`[VideoProcessor:${this.jobId}] OpenAI analysis error`, { error });
      return null;
    }
  }

  private async callRunwayML(
    photo: PhotoItem,
    index: number,
    prompt: string
  ): Promise<string | null> {
    try {
      let promptText = prompt;
      if (promptText.length > 450) {
        promptText = promptText.substring(0, 448) + '.';
      }

      // Generate a signed URL for the image so Runway can access it
      const { data: imageData } = await this.db
        .from('images')
        .select('file_path')
        .eq('id', photo.id)
        .single();

      let imageUrl: string;
      if (imageData?.file_path) {
        const { data: signedUrl } = await this.db.storage
          .from(BUCKETS.IMAGES)
          .createSignedUrl(imageData.file_path, 3600);
        imageUrl = signedUrl?.signedUrl || '';
      } else {
        // Fallback: use domain-based URL
        imageUrl = `${config.apiUrl}/uploads/${this.projectName}/${photo.filename}`;
      }

      const ratio = this.settings.ratio || this.settings.aspectRatio || '1280:768';

      const payload = {
        promptImage: imageUrl,
        seed: this.settings.seed || 4294967295,
        model: 'gen4_turbo',
        promptText:
          promptText +
          ' Use only the visible content from the input image. Treat input as a fixed environment. Only adjust camera position, angle, zoom, pan, roll. No edits to scene content allowed. Do not generate or imagine any new elements beyond image borders. Maintain exact geometry, object positions, and spatial relationships. Do not move, stretch, warp, or reposition any elements. Preserve all original colors, textures, and lighting conditions, this is very important — no move, filters, enhancements, or hue shifts. Motion should be fluid and natural.',
        duration: this.settings.videoDuration || 5,
        ratio,
        contentModeration: {
          publicFigureThreshold: 'auto',
        },
      };

      logger.info(`[VideoProcessor:${this.jobId}] Calling Runway ML for photo ${index}`, {
        prompt: promptText.substring(0, 100),
      });

      const response = await axios.post(
        `${config.runway.apiUrl}/image_to_video`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${config.runway.apiKey}`,
            'Content-Type': 'application/json',
            'X-Runway-Version': '2024-11-06',
          },
          timeout: 60000,
        }
      );

      const taskId = response.data.id;
      return await this.pollRunwayTask(taskId, index);
    } catch (error: any) {
      logger.error(`[VideoProcessor:${this.jobId}] Runway ML API error`, {
        error: error.message,
      });
      throw new Error(`Failed to animate photo with Runway ML: ${error.message}`);
    }
  }

  private async pollRunwayTask(taskId: string, index: number): Promise<string | null> {
    const maxAttempts = 30; // ~5 minutes max
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const statusResponse = await axios.get(
          `${config.runway.apiUrl}/tasks/${taskId}`,
          {
            headers: {
              Authorization: `Bearer ${config.runway.apiKey}`,
              'X-Runway-Version': '2024-11-06',
            },
          }
        );

        const status = statusResponse.data.status;

        if (status === 'SUCCEEDED') {
          const videoUrl = statusResponse.data.output[0];
          return await this.downloadVideo(videoUrl, index);
        } else if (status === 'FAILED') {
          throw new Error('Runway ML task failed');
        }

        // Wait 10 seconds before next poll
        await new Promise((resolve) => setTimeout(resolve, 10000));
        attempts++;
      } catch (error: any) {
        logger.error(`[VideoProcessor:${this.jobId}] Polling error`, { error: error.message });
        attempts++;
        if (attempts >= maxAttempts) throw new Error('Runway ML task timeout');
      }
    }

    throw new Error('Runway ML task timeout');
  }

  private async downloadVideo(videoUrl: string, index: number): Promise<string> {
    const videoPath = path.join(
      this.videosDir,
      `video_${index.toString().padStart(3, '0')}.mp4`
    );

    const response = await axios({
      method: 'GET',
      url: videoUrl,
      responseType: 'stream',
    });

    const writer = fs.createWriteStream(videoPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(videoPath));
      writer.on('error', (error: Error) => reject(error));
    });
  }

  private createZoomVideo(photo: PhotoItem, index: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const outputPath = path.join(
        this.videosDir,
        `video_${index.toString().padStart(3, '0')}.mp4`
      );
      const duration = this.settings.videoDuration || 5;
      const ratio = this.settings.ratio || '1920:1080';

      ffmpeg(photo.path)
        .inputOptions(['-loop 1'])
        .outputOptions([
          `-t ${duration}`,
          `-vf scale=${ratio}:force_original_aspect_ratio=increase,crop=${ratio},zoompan=z=1.1:d=125:x=iw/2-(iw/zoom/2):y=ih/2-(ih/zoom/2)`,
          '-r 24',
          '-pix_fmt yuv420p',
        ])
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', (error: Error) => reject(error))
        .run();
    });
  }

  private createStaticVideo(photo: PhotoItem, index: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const outputPath = path.join(
        this.videosDir,
        `video_${index.toString().padStart(3, '0')}.mp4`
      );
      const duration = this.settings.videoDuration || 5;
      const ratio = this.settings.ratio || '1920:1080';

      ffmpeg(photo.path)
        .inputOptions(['-loop 1'])
        .outputOptions([
          `-t ${duration}`,
          `-vf scale=${ratio}:force_original_aspect_ratio=decrease,pad=${ratio}:(ow-iw)/2:(oh-ih)/2`,
          '-r 24',
          '-pix_fmt yuv420p',
        ])
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', (error: Error) => reject(error))
        .run();
    });
  }

  private stitchVideos(videoPaths: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const outputPath = path.join(this.workingDir, 'stitched_video.mp4');
      const concatFile = path.join(this.workingDir, 'concat_list.txt');

      const concatContent = videoPaths
        .map((videoPath) => `file '${videoPath}'`)
        .join('\n');
      fs.writeFileSync(concatFile, concatContent);

      ffmpeg()
        .input(concatFile)
        .inputOptions(['-f concat', '-safe 0'])
        .outputOptions(['-c copy'])
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', (error: Error) => reject(error))
        .run();
    });
  }

  private async addBackgroundMusic(videoPath: string): Promise<string> {
    const outputPath = path.join(this.workingDir, 'final_video.mp4');

    // Get music for this project
    let musicPath: string | null = null;
    try {
      const { data: musicFiles } = await this.db
        .from('music')
        .select('*')
        .eq('project_id', this.projectId)
        .order('is_default', { ascending: false });

      if (musicFiles && musicFiles.length > 0) {
        const musicFile = musicFiles[0];
        // Download music from storage
        const localMusicPath = path.join(this.workingDir, 'music_' + musicFile.filename);
        const { data: musicData } = await this.db.storage
          .from(BUCKETS.MUSIC)
          .download(musicFile.file_path);

        if (musicData) {
          const buffer = Buffer.from(await musicData.arrayBuffer());
          await fs.writeFile(localMusicPath, buffer);
          musicPath = localMusicPath;
        }
      }
    } catch (err) {
      logger.warn(`[VideoProcessor:${this.jobId}] Could not get music`, { error: err });
    }

    return new Promise(async (resolve, reject) => {
      const command = ffmpeg(videoPath);

      if (musicPath && fs.existsSync(musicPath)) {
        const musicVolume = this.settings.musicVolume || 0.3;
        const videoDuration = await this.getVideoDuration(videoPath);
        const fadeStart = Math.max(0, videoDuration - 4);

        const volumeExpr = `if(gte(t,${fadeStart}),(1-(t-${fadeStart})/4)*${musicVolume},${musicVolume})`;

        command
          .input(musicPath)
          .inputOptions(['-stream_loop -1'])
          .outputOptions([
            '-c:v copy',
            '-c:a aac',
            `-filter_complex [1:a]volume='${volumeExpr}':eval=frame[a]`,
            '-map 0:v:0',
            '-map [a]',
            `-t ${videoDuration}`,
          ]);
      } else {
        command.outputOptions(['-c copy']);
      }

      command
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', (error: Error) => reject(error))
        .run();
    });
  }

  async cleanupFailedProcessing(): Promise<void> {
    logger.info(`[VideoProcessor:${this.jobId}] Starting cleanup for failed processing`);

    try {
      if (await fs.pathExists(this.workingDir)) {
        await fs.remove(this.workingDir);
      }

      const { data: job } = await this.db
        .from('processing_jobs')
        .select('video_id')
        .eq('id', this.jobId)
        .single();

      if (job?.video_id) {
        const { data: video } = await this.db
          .from('videos')
          .select('file_path')
          .eq('id', job.video_id)
          .single();

        if (video?.file_path) {
          await this.db.storage.from(BUCKETS.VIDEOS).remove([video.file_path]);
        }

        await this.db.from('videos').delete().eq('id', job.video_id);
      }

      await this.db.from('processing_jobs').delete().eq('id', this.jobId);
      logger.info(`[VideoProcessor:${this.jobId}] Cleanup completed`);
    } catch (error) {
      logger.error(`[VideoProcessor:${this.jobId}] Cleanup error`, { error });
      throw error;
    }
  }
}

/**
 * Main entry point for processing a video.
 * Called by the queue worker or directly.
 */
export async function processVideo(
  projectId: string,
  projectName: string,
  userId: string,
  settings: VideoProcessorSettings,
  jobId: string
): Promise<void> {
  logger.info(`[processVideo] Starting for project: ${projectName}`);

  const processor = new VideoProcessor(projectId, projectName, userId, settings, jobId);

  try {
    await processor.processVideo();
    logger.info(`[processVideo] Completed for project: ${projectName}`);
  } catch (error) {
    logger.error(`[processVideo] Failed for project ${projectName}:`, { error });
  }
}
