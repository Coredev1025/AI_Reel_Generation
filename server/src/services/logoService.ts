import fs from 'fs';
import { getSupabaseAdmin } from '../config/database';
import { BUCKETS } from '../config/storage';
import { NotFoundError, ValidationError } from '../utils/errors';
import { getStoragePath } from '../utils/helpers';
import { cleanupTempFile } from '../middleware/upload';
import { logger } from '../utils/logger';

export class LogoService {
  private db = getSupabaseAdmin();

  async uploadLogo(
    file: Express.Multer.File,
    projectId: string,
    userId: string
  ): Promise<any> {
    if (!file) {
      throw new ValidationError('No logo file provided');
    }

    // Verify project ownership
    const { data: project } = await this.db
      .from('projects')
      .select('id, name, settings')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (!project) {
      throw new NotFoundError('Project');
    }

    try {
      const fileBuffer = fs.readFileSync(file.path);
      const storagePath = getStoragePath(userId, projectId, 'logos', file.filename);

      // Upload to storage
      const { error: uploadError } = await this.db.storage
        .from(BUCKETS.LOGOS)
        .upload(storagePath, fileBuffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = this.db.storage
        .from(BUCKETS.LOGOS)
        .getPublicUrl(storagePath);

      // Update project settings with logo info
      const settings = project.settings || {};
      settings.logo = {
        path: storagePath,
        filename: file.originalname,
        url: urlData?.publicUrl,
      };

      await this.db
        .from('projects')
        .update({ settings, updated_at: new Date().toISOString() })
        .eq('id', projectId);

      cleanupTempFile(file.path);

      logger.info('Logo uploaded', { projectId });
      return {
        path: storagePath,
        filename: file.originalname,
        url: urlData?.publicUrl,
      };
    } catch (err) {
      cleanupTempFile(file.path);
      throw err;
    }
  }
}

export const logoService = new LogoService();
