import path from 'path';
import fs from 'fs';
import { getSupabaseAdmin } from '../config/database';
import { BUCKETS } from '../config/storage';
import { NotFoundError, ValidationError } from '../utils/errors';
import { generateId, getStoragePath } from '../utils/helpers';
import { cleanupTempFile } from '../middleware/upload';
import { logger } from '../utils/logger';

export class ImageService {
  private db = getSupabaseAdmin();

  async uploadImages(
    files: Express.Multer.File[],
    projectId: string,
    userId: string
  ): Promise<any[]> {
    if (!files || files.length === 0) {
      throw new ValidationError('No files provided');
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

    // Get current max order index
    const { data: maxOrderRow } = await this.db
      .from('images')
      .select('order_index')
      .eq('project_id', projectId)
      .order('order_index', { ascending: false })
      .limit(1)
      .single();

    let currentOrder = maxOrderRow?.order_index ?? -1;

    const uploadedImages: any[] = [];

    for (const file of files) {
      try {
        const fileBuffer = fs.readFileSync(file.path);
        const storagePath = getStoragePath(userId, projectId, 'originals', file.filename);

        // Upload to Supabase Storage
        const { error: uploadError } = await this.db.storage
          .from(BUCKETS.IMAGES)
          .upload(storagePath, fileBuffer, {
            contentType: file.mimetype,
            upsert: false,
          });

        if (uploadError) {
          logger.error('Failed to upload to storage', { error: uploadError.message, file: file.filename });
          cleanupTempFile(file.path);
          continue;
        }

        // Get public URL
        const { data: urlData } = this.db.storage
          .from(BUCKETS.IMAGES)
          .getPublicUrl(storagePath);

        currentOrder++;
        const imageId = generateId();

        // Save to database
        const { data: image, error: dbError } = await this.db
          .from('images')
          .insert({
            id: imageId,
            project_id: projectId,
            user_id: userId,
            project_name: project.name,
            filename: file.filename,
            original_name: file.originalname,
            file_path: storagePath,
            file_size: file.size,
            mime_type: file.mimetype,
            order_index: currentOrder,
          })
          .select('*')
          .single();

        if (dbError) {
          logger.error('Failed to save image record', { error: dbError.message });
        } else {
          uploadedImages.push({
            ...image,
            url: urlData?.publicUrl,
          });
        }

        // Cleanup temp file
        cleanupTempFile(file.path);
      } catch (err) {
        logger.error('Error uploading image', { error: err, file: file.filename });
        cleanupTempFile(file.path);
      }
    }

    logger.info('Images uploaded', { projectId, count: uploadedImages.length });
    return uploadedImages;
  }

  async deleteImage(imageId: string, userId: string, projectId?: string): Promise<void> {
    let query = this.db
      .from('images')
      .select('*')
      .eq('id', imageId)
      .eq('user_id', userId);
    
    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data: image } = await query.single();

    if (!image) {
      throw new NotFoundError('Image');
    }

    // Delete from storage
    if (image.file_path) {
      await this.db.storage.from(BUCKETS.IMAGES).remove([image.file_path]);
    }

    // Delete from database
    await this.db.from('images').delete().eq('id', imageId);

    logger.info('Image deleted', { imageId, projectId: image.project_id });
  }

  async updateImage(imageId: string, userId: string, data: { description?: string; tags?: string[] }): Promise<any> {
    const updates: Record<string, any> = {};
    if (data.description !== undefined) updates.description = data.description;
    if (data.tags !== undefined) updates.tags = data.tags;

    const { data: image, error } = await this.db
      .from('images')
      .update(updates)
      .eq('id', imageId)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error || !image) {
      throw new NotFoundError('Image');
    }

    return image;
  }

  async updateImageOrders(
    projectId: string,
    userId: string,
    imageOrders: Array<{ id: string; order: number }>
  ): Promise<void> {
    // Verify project ownership
    const { data: project } = await this.db
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (!project) {
      throw new NotFoundError('Project');
    }

    // Update each image order
    for (const item of imageOrders) {
      await this.db
        .from('images')
        .update({ order_index: item.order })
        .eq('id', item.id)
        .eq('project_id', projectId);
    }

    logger.info('Image orders updated', { projectId, count: imageOrders.length });
  }

  async bulkDeleteImages(imageIds: string[], userId: string, projectId: string): Promise<void> {
    // Get images to delete
    const { data: images } = await this.db
      .from('images')
      .select('id, file_path')
      .eq('user_id', userId)
      .eq('project_id', projectId)
      .in('id', imageIds);

    if (!images || images.length === 0) return;

    // Delete from storage
    const paths = images.map((img: any) => img.file_path).filter(Boolean);
    if (paths.length > 0) {
      await this.db.storage.from(BUCKETS.IMAGES).remove(paths);
    }

    // Delete from database
    await this.db
      .from('images')
      .delete()
      .eq('user_id', userId)
      .eq('project_id', projectId)
      .in('id', imageIds);

    logger.info('Bulk images deleted', { projectId, count: imageIds.length });
  }
}

export const imageService = new ImageService();
