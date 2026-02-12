import { getSupabaseAdmin } from '../config/database';
import { Project } from '../types';
import { NotFoundError, ValidationError, ConflictError } from '../utils/errors';
import { generateId, parsePagination, buildPagination } from '../utils/helpers';
import { logger } from '../utils/logger';

export class ProjectService {
  private db = getSupabaseAdmin();

  async getProjects(userId: string, query: any): Promise<any> {
    const { page, limit, offset } = parsePagination(query);
    const { search, status, sort, order } = query;

    let dbQuery = this.db
      .from('projects')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    // Filter by status
    if (status && status !== 'all') {
      dbQuery = dbQuery.eq('status', status);
    }

    // Search by name
    if (search) {
      dbQuery = dbQuery.ilike('name', `%${search}%`);
    }

    // Sort
    const sortField = sort || 'created_at';
    const sortOrder = order === 'asc';
    dbQuery = dbQuery.order(sortField, { ascending: sortOrder });

    // Pagination
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data: projects, error, count } = await dbQuery;

    if (error) {
      logger.error('Failed to fetch projects', { error: error.message });
      throw new Error('Failed to fetch projects');
    }

    // Fetch images and videos counts for each project
    const enrichedProjects = await Promise.all(
      (projects || []).map(async (project: any) => {
        const [imagesResult, videosResult] = await Promise.all([
          this.db.from('images').select('id', { count: 'exact' }).eq('project_id', project.id),
          this.db.from('videos').select('id', { count: 'exact' }).eq('project_id', project.id),
        ]);
        return {
          ...project,
          image_count: imagesResult.count || 0,
          video_count: videosResult.count || 0,
        };
      })
    );

    const pagination = buildPagination(page, limit, count || 0);
    return { projects: enrichedProjects, pagination };
  }

  async getProject(projectId: string, userId: string): Promise<any> {
    // Try to find by ID first, then by name
    let query = this.db
      .from('projects')
      .select('*')
      .eq('user_id', userId);

    // Check if projectId is a UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId);
    
    if (isUuid) {
      query = query.eq('id', projectId);
    } else {
      query = query.eq('name', projectId);
    }

    const { data: project, error } = await query.single();

    if (error || !project) {
      throw new NotFoundError('Project');
    }

    // Fetch related data
    const [imagesResult, videosResult, musicResult] = await Promise.all([
      this.db.from('images').select('*').eq('project_id', project.id).order('order_index'),
      this.db.from('videos').select('*').eq('project_id', project.id).order('created_at', { ascending: false }),
      this.db.from('music').select('*').eq('project_id', project.id),
    ]);

    return {
      ...project,
      images: imagesResult.data || [],
      videos: videosResult.data || [],
      music: musicResult.data || [],
    };
  }

  async createProject(userId: string, data: { name: string; description?: string }): Promise<Project> {
    if (!data.name || data.name.trim().length === 0) {
      throw new ValidationError('Project name is required');
    }

    // Check for duplicate name
    const { data: existing } = await this.db
      .from('projects')
      .select('id')
      .eq('user_id', userId)
      .eq('name', data.name.trim())
      .single();

    if (existing) {
      throw new ConflictError('Project with this name already exists');
    }

    const projectId = generateId();
    const { data: project, error } = await this.db
      .from('projects')
      .insert({
        id: projectId,
        user_id: userId,
        name: data.name.trim(),
        description: data.description || null,
        status: 'active',
        settings: {},
      })
      .select('*')
      .single();

    if (error) {
      logger.error('Failed to create project', { error: error.message });
      throw new Error('Failed to create project');
    }

    logger.info('Project created', { projectId, userId });
    return project as Project;
  }

  async updateProject(projectId: string, userId: string, data: any): Promise<Project> {
    const updates: Record<string, any> = {};

    if (data.name !== undefined) updates.name = data.name.trim();
    if (data.description !== undefined) updates.description = data.description;
    if (data.status !== undefined) updates.status = data.status;
    if (data.settings !== undefined) updates.settings = data.settings;

    updates.updated_at = new Date().toISOString();

    const { data: project, error } = await this.db
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error || !project) {
      throw new NotFoundError('Project');
    }

    return project as Project;
  }

  async deleteProject(projectId: string, userId: string): Promise<void> {
    // Support deletion by name or ID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId);

    let query = this.db.from('projects').delete().eq('user_id', userId);
    if (isUuid) {
      query = query.eq('id', projectId);
    } else {
      query = query.eq('name', projectId);
    }

    const { error } = await query;

    if (error) {
      throw new NotFoundError('Project');
    }

    logger.info('Project deleted', { projectId, userId });
  }

  async getProjectStatus(projectId: string, userId: string): Promise<any> {
    const { data: project, error } = await this.db
      .from('projects')
      .select('id, name, status')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (error || !project) {
      throw new NotFoundError('Project');
    }

    // Get active jobs
    const { data: jobs } = await this.db
      .from('processing_jobs')
      .select('*')
      .eq('project_id', projectId)
      .in('status', ['queued', 'processing'])
      .order('created_at', { ascending: false });

    return {
      ...project,
      jobs: jobs || [],
    };
  }

  async getProjectStats(projectId: string, userId: string): Promise<any> {
    const { data: project } = await this.db
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (!project) {
      throw new NotFoundError('Project');
    }

    const [images, videos, jobs] = await Promise.all([
      this.db.from('images').select('id, file_size', { count: 'exact' }).eq('project_id', projectId),
      this.db.from('videos').select('id, file_size, status', { count: 'exact' }).eq('project_id', projectId),
      this.db.from('processing_jobs').select('id, status', { count: 'exact' }).eq('project_id', projectId),
    ]);

    const totalImageSize = (images.data || []).reduce((sum: number, img: any) => sum + (img.file_size || 0), 0);
    const totalVideoSize = (videos.data || []).reduce((sum: number, vid: any) => sum + (vid.file_size || 0), 0);

    return {
      imageCount: images.count || 0,
      videoCount: videos.count || 0,
      jobCount: jobs.count || 0,
      totalImageSize,
      totalVideoSize,
      completedVideos: (videos.data || []).filter((v: any) => v.status === 'completed').length,
      failedVideos: (videos.data || []).filter((v: any) => v.status === 'failed').length,
    };
  }

  async updateProjectSettings(projectId: string, userId: string, settings: any): Promise<Project> {
    const { data: project, error } = await this.db
      .from('projects')
      .update({ settings, updated_at: new Date().toISOString() })
      .eq('id', projectId)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error || !project) {
      throw new NotFoundError('Project');
    }

    return project as Project;
  }

  async archiveProject(projectId: string, userId: string): Promise<Project> {
    const { data: project, error } = await this.db
      .from('projects')
      .update({
        status: 'archived',
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error || !project) {
      throw new NotFoundError('Project');
    }

    return project as Project;
  }

  async restoreProject(projectId: string, userId: string): Promise<Project> {
    const { data: project, error } = await this.db
      .from('projects')
      .update({
        status: 'active',
        archived_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error || !project) {
      throw new NotFoundError('Project');
    }

    return project as Project;
  }

  async bulkDelete(userId: string, projectIds: string[]): Promise<void> {
    const { error } = await this.db
      .from('projects')
      .delete()
      .eq('user_id', userId)
      .in('id', projectIds);

    if (error) {
      throw new Error('Failed to delete projects');
    }

    logger.info('Bulk delete projects', { userId, count: projectIds.length });
  }

  async bulkArchive(userId: string, projectIds: string[]): Promise<void> {
    const { error } = await this.db
      .from('projects')
      .update({
        status: 'archived',
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .in('id', projectIds);

    if (error) {
      throw new Error('Failed to archive projects');
    }

    logger.info('Bulk archive projects', { userId, count: projectIds.length });
  }

  async checkNameExists(userId: string, name: string): Promise<boolean> {
    const { data } = await this.db
      .from('projects')
      .select('id')
      .eq('user_id', userId)
      .eq('name', name)
      .single();

    return !!data;
  }

  async getProjectVideos(projectId: string, userId: string): Promise<any[]> {
    const { data: videos, error } = await this.db
      .from('videos')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('Failed to fetch videos');
    }

    return videos || [];
  }

  async getProjectMusic(projectId: string, userId: string): Promise<any[]> {
    const { data: music, error } = await this.db
      .from('music')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', userId);

    if (error) {
      throw new Error('Failed to fetch music');
    }

    return music || [];
  }
}

export const projectService = new ProjectService();
