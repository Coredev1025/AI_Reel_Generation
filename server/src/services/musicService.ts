import fs from 'fs';
import { getSupabaseAdmin } from '../config/database';
import { BUCKETS } from '../config/storage';
import { NotFoundError, ValidationError } from '../utils/errors';
import { generateId, getStoragePath } from '../utils/helpers';
import { cleanupTempFile } from '../middleware/upload';
import { logger } from '../utils/logger';

export class MusicService {
  private db = getSupabaseAdmin();

  async uploadMusic(
    file: Express.Multer.File,
    projectId: string,
    userId: string
  ): Promise<any> {
    if (!file) {
      throw new ValidationError('No music file provided');
    }

    // Verify project ownership
    const { data: project } = await this.db
      .from('projects')
      .select('id, name')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (!project) {
      throw new NotFoundError('Project');
    }

    try {
      const fileBuffer = fs.readFileSync(file.path);
      const storagePath = getStoragePath(userId, projectId, 'music', file.filename);

      // Upload to Supabase Storage
      const { error: uploadError } = await this.db.storage
        .from(BUCKETS.MUSIC)
        .upload(storagePath, fileBuffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      // Check if it's the first music file for this project
      const { count } = await this.db
        .from('music')
        .select('id', { count: 'exact' })
        .eq('project_id', projectId);

      const isDefault = (count || 0) === 0;

      const musicId = generateId();
      const { data: music, error: dbError } = await this.db
        .from('music')
        .insert({
          id: musicId,
          project_id: projectId,
          user_id: userId,
          project_name: project.name,
          filename: file.filename,
          original_name: file.originalname,
          file_path: storagePath,
          file_size: file.size,
          is_default: isDefault,
        })
        .select('*')
        .single();

      if (dbError) {
        throw new Error(`Database insert failed: ${dbError.message}`);
      }

      cleanupTempFile(file.path);
      logger.info('Music uploaded', { musicId, projectId });
      return music;
    } catch (err) {
      cleanupTempFile(file.path);
      throw err;
    }
  }

  async setDefault(musicId: string, userId: string, projectId: string): Promise<any> {
    // Verify ownership
    const { data: music } = await this.db
      .from('music')
      .select('*')
      .eq('id', musicId)
      .eq('user_id', userId)
      .single();

    if (!music) {
      throw new NotFoundError('Music');
    }

    // Unset all defaults for this project
    await this.db
      .from('music')
      .update({ is_default: false })
      .eq('project_id', projectId)
      .eq('user_id', userId);

    // Set this as default
    const { data: updated, error } = await this.db
      .from('music')
      .update({ is_default: true })
      .eq('id', musicId)
      .select('*')
      .single();

    if (error || !updated) {
      throw new Error('Failed to update default music');
    }

    return updated;
  }

  async deleteMusic(musicId: string, userId: string): Promise<void> {
    const { data: music } = await this.db
      .from('music')
      .select('*')
      .eq('id', musicId)
      .eq('user_id', userId)
      .single();

    if (!music) {
      throw new NotFoundError('Music');
    }

    // Delete from storage
    if (music.file_path) {
      await this.db.storage.from(BUCKETS.MUSIC).remove([music.file_path]);
    }

    // Delete from database
    await this.db.from('music').delete().eq('id', musicId);

    // If this was the default, set first remaining as default
    if (music.is_default) {
      const { data: remaining } = await this.db
        .from('music')
        .select('id')
        .eq('project_id', music.project_id)
        .limit(1)
        .single();

      if (remaining) {
        await this.db.from('music').update({ is_default: true }).eq('id', remaining.id);
      }
    }

    logger.info('Music deleted', { musicId });
  }

  async updateMusic(musicId: string, userId: string, data: { description?: string }): Promise<any> {
    const { data: music, error } = await this.db
      .from('music')
      .update(data)
      .eq('id', musicId)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error || !music) {
      throw new NotFoundError('Music');
    }

    return music;
  }
}

export const musicService = new MusicService();
