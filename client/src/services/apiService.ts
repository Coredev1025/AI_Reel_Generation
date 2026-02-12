import axios from 'axios';
import type { AuthUser, ManagedUser, UserRole, UserStatus } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const AUTH_TOKEN_KEY = 'reelbuilder_auth_token';

export type { AuthUser, ManagedUser, UserRole, UserStatus };

interface SavedPrompt {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  usage_count: number;
}

class ApiService {
  private api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 300000, // 5 minutes timeout
  });

  constructor() {
    const token = this.getStoredToken();
    if (token) {
      this.setAuthToken(token);
    }
    this.api.interceptors.request.use((config) => {
      const token = this.getStoredToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  getStoredToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }

  setAuthToken(token: string): void {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }

  clearAuthToken(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }

  // Health check
  async healthCheck() {
    const response = await this.api.get('/health');
    return response.data;
  }

  // Auth
  async signin(email: string, password: string): Promise<{ user: AuthUser; token: string }> {
    const response = await this.api.post('/auth/signin', { email, password });
    const { user, token } = response.data;
    this.setAuthToken(token);
    return { user, token };
  }

  async signup(data: { email: string; password: string; name?: string }): Promise<{ user: AuthUser; token?: string; message?: string }> {
    const response = await this.api.post('/auth/signup', data);
    const data_ = response.data;
    if (data_.token) {
      this.setAuthToken(data_.token);
    }
    return data_;
  }

  async getMe(): Promise<{ user: AuthUser }> {
    const response = await this.api.get('/auth/me');
    return response.data;
  }

  logout(): void {
    this.clearAuthToken();
  }

  // User management (admin only)
  async getUsers(): Promise<{ users: ManagedUser[] }> {
    const response = await this.api.get('/users');
    return response.data;
  }

  async updateUserStatus(userId: string, status: UserStatus): Promise<{ user: ManagedUser }> {
    const response = await this.api.put(`/users/${userId}/status`, { status });
    return response.data;
  }

  async resetUserPassword(userId: string, password: string): Promise<{ message: string }> {
    const response = await this.api.put(`/users/${userId}/password`, { password });
    return response.data;
  }

  // Upload photos with project ID
  async uploadPhotos(formData: FormData, projectId: string, onProgress?: (progress: number) => void) {
    const response = await this.api.post(`/upload/${projectId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response.data;
  }

  // Start video processing
  async startProcessing(projectId: string, settings: any) {
    const response = await this.api.post('/process', {
      projectId,
      settings,
    });
    return response.data;
  }

  // Get project status
  async getProjectStatus(projectId: string) {
    const response = await this.api.get(`/projects/${projectId}/status`);
    return response.data;
  }

  // Download video
  async downloadVideo(videoId: string) {
    try {
      const response = await this.api.get(`/download/${videoId}`, {
        responseType: 'blob',
      });

      // Get filename from response headers or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `${videoId}.mp4`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return response.data;
    } catch (error) {
      console.error('Download error:', error);
      throw new Error('Failed to download video. Please try again.');
    }
  }

  // HomeJab API integration (for future use)
  async fetchHomeJabPhotos(propertyId: string) {
    // Placeholder for HomeJab API integration
    throw new Error('HomeJab integration not yet implemented');
  }

  // Upload to Vimeo (for future use)
  async uploadToVimeo(projectId: string, vimeoSettings: any) {
    // Placeholder for Vimeo integration
    throw new Error('Vimeo integration not yet implemented');
  }

  // Get all projects with pagination
  async getProjects(page = 1, limit = 10) {
    const response = await this.api.get(`/projects?page=${page}&limit=${limit}`);
    return response.data;
  }

  // Get project by ID or name
  async getProject(projectId: string) {
    const response = await this.api.get(`/projects/${projectId}`);
    return response.data;
  }

  // Create new project
  async createProject(projectData: { name: string; description?: string }) {
    const response = await this.api.post('/projects', projectData);
    return response.data;
  }

  // Update project
  async updateProject(projectId: string, projectData: Partial<{ name: string; description?: string }>) {
    const response = await this.api.put(`/projects/${projectId}`, projectData);
    return response.data;
  }

  // Delete project (accepts project ID or project name)
  async deleteProject(projectId: string) {
    const response = await this.api.delete(`/projects/${projectId}`);
    return response.data;
  }

  // Get video by ID
  async getVideo(videoId: string) {
    const response = await this.api.get(`/videos/${videoId}`);
    return response.data;
  }

  // Get videos for a project
  async getProjectVideos(projectId: string) {
    const response = await this.api.get(`/projects/${projectId}/videos`);
    return response.data;
  }

  // Delete video
  async deleteVideo(videoId: string) {
    const response = await this.api.delete(`/videos/${videoId}`);
    return response.data;
  }

  // Delete image
  async deleteImage(imageId: string, projectId: string) {
    const response = await this.api.delete(`/images/${imageId}?projectId=${projectId}`);
    return response.data;
  }

  // Update image orders
  async updateImageOrders(projectId: string, imageOrders: Array<{ id: string; order: number }>) {
    const response = await this.api.put(`/projects/${projectId}/images/order`, { imageOrders });
    return response.data;
  }

  // Check if project name exists
  async checkProjectNameExists(projectName: string) {
    const response = await this.api.get(`/projects/check-name?name=${encodeURIComponent(projectName)}`);
    return response.data;
  }

  // Upload music
  async uploadMusic(formData: FormData, projectId: string, onProgress?: (progress: number) => void) {
    const response = await this.api.post(`/music/upload/${projectId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response.data;
  }

  // Get project music
  async getProjectMusic(projectId: string) {
    const response = await this.api.get(`/projects/${projectId}/music`);
    return response.data;
  }

  // Set default music
  async setDefaultMusic(musicId: string, projectId: string) {
    const response = await this.api.put(`/music/${musicId}/default`, { projectId });
    return response.data;
  }

  // Delete music
  async deleteMusic(musicId: string) {
    const response = await this.api.delete(`/music/${musicId}`);
    return response.data;
  }

  // Update music
  async updateMusic(musicId: string, updateData: { description?: string }) {
    const response = await this.api.put(`/music/${musicId}`, updateData);
    return response.data;
  }

  // Add new method to get processing status by processing ID
  async getProcessingStatus(processingId: string) {
    const response = await this.api.get(`/processing/${processingId}/status`);
    return response.data;
  }

  // Clean up failed video processing
  async cleanupFailedProcessing(processingId: string) {
    const response = await this.api.delete(`/processing/${processingId}/cleanup`);
    return response.data;
  }

  // Clean up individual failed video
  async cleanupFailedVideo(videoId: string) {
    const response = await this.api.delete(`/videos/${videoId}/cleanup`);
    return response.data;
  }

  // Restart video processing with the same settings
  async restartProcessing(processingId: string) {
    const response = await this.api.post(`/processing/${processingId}/restart`);
    return response.data;
  }

  // Get project statistics
  async getProjectStats(projectId: string) {
    const response = await this.api.get(`/projects/${projectId}/stats`);
    return response.data;
  }

  // Update project settings
  async updateProjectSettings(projectId: string, settings: any) {
    const response = await this.api.put(`/projects/${projectId}/settings`, { settings });
    return response.data;
  }

  // Generate default prompts for project images
  async generateDefaultPrompts(projectId: string) {
    const response = await this.api.post(`/projects/${projectId}/generate-prompts`);
    return response.data;
  }

  // Saved Prompts API methods
  async getSavedPrompts(options?: { 
    searchTerm?: string; 
    page?: number; 
    limit?: number; 
  }): Promise<{
    prompts: SavedPrompt[];
    pagination?: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    try {
      const params = new URLSearchParams();
      
      if (options?.searchTerm) {
        params.append('search', options.searchTerm);
      }
      if (options?.page !== undefined) {
        params.append('page', options.page.toString());
      }
      if (options?.limit !== undefined) {
        params.append('limit', options.limit.toString());
      }
      
      const url = `/prompts${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('API Service: Making request to:', url);
      console.log('API Service: Base URL:', this.api.defaults.baseURL);
      const response = await this.api.get(url);
      console.log('API Service: Response received:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching saved prompts:', error);
      console.error('Error details:', error.response?.data);
      throw new Error(error.response?.data?.error || 'Failed to fetch saved prompts');
    }
  }

  async getSavedPrompt(promptId: string): Promise<{ prompt: SavedPrompt }> {
    try {
      const response = await this.api.get(`/prompts/${promptId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching saved prompt:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch saved prompt');
    }
  }

  async createSavedPrompt(promptData: { name: string; description: string }): Promise<{ prompt: SavedPrompt }> {
    try {
      const response = await this.api.post('/prompts', promptData);
      return response.data;
    } catch (error: any) {
      console.error('Error creating saved prompt:', error);
      throw new Error(error.response?.data?.error || 'Failed to create saved prompt');
    }
  }

  async updateSavedPrompt(promptId: string, updateData: { name?: string; description?: string }): Promise<{ prompt: SavedPrompt }> {
    try {
      const response = await this.api.put(`/prompts/${promptId}`, updateData);
      return response.data;
    } catch (error: any) {
      console.error('Error updating saved prompt:', error);
      throw new Error(error.response?.data?.error || 'Failed to update saved prompt');
    }
  }

  async deleteSavedPrompt(promptId: string): Promise<{ message: string }> {
    try {
      const response = await this.api.delete(`/prompts/${promptId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error deleting saved prompt:', error);
      throw new Error(error.response?.data?.error || 'Failed to delete saved prompt');
    }
  }

  async useSavedPrompt(promptId: string): Promise<{ message: string }> {
    try {
      const response = await this.api.post(`/prompts/${promptId}/use`);
      return response.data;
    } catch (error: any) {
      console.error('Error using saved prompt:', error);
      throw new Error(error.response?.data?.error || 'Failed to use saved prompt');
    }
  }

  // ─── Queue admin routes ──────────────────────────────────
  async getQueueStats(): Promise<any> {
    const response = await this.api.get('/admin/queue/stats');
    return response.data;
  }

  async getQueueJobs(status: string = 'waiting', start = 0, end = 19): Promise<any> {
    const response = await this.api.get(`/admin/queue/jobs?status=${status}&start=${start}&end=${end}`);
    return response.data;
  }

  async pauseQueue(): Promise<{ message: string }> {
    const response = await this.api.post('/admin/queue/pause');
    return response.data;
  }

  async resumeQueue(): Promise<{ message: string }> {
    const response = await this.api.post('/admin/queue/resume');
    return response.data;
  }

  async getRateLimitStats(): Promise<any> {
    const response = await this.api.get('/admin/rate-limit');
    return response.data;
  }

  // ─── Profile routes ──────────────────────────────────────
  async updateProfile(data: { name?: string; email?: string }): Promise<any> {
    const response = await this.api.put('/auth/profile', data);
    return response.data;
  }

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<any> {
    const response = await this.api.put('/auth/password', data);
    return response.data;
  }

  async forgotPassword(email: string): Promise<any> {
    const response = await this.api.post('/auth/forgot-password', { email });
    return response.data;
  }

  async resetPassword(token: string, newPassword: string): Promise<any> {
    const response = await this.api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  }

  // ─── User role management (admin) ────────────────────────
  async updateUserRole(userId: string, role: string): Promise<any> {
    const response = await this.api.put(`/users/${userId}/role`, { role });
    return response.data;
  }

  async deleteUser(userId: string): Promise<any> {
    const response = await this.api.delete(`/users/${userId}`);
    return response.data;
  }

  // ─── Project management (bulk, archive, search) ──────────
  async getProjectsAdvanced(params: {
    page?: number; limit?: number; search?: string;
    status?: string; sort?: string; order?: string;
  } = {}): Promise<any> {
    const qs = new URLSearchParams();
    if (params.page) qs.append('page', String(params.page));
    if (params.limit) qs.append('limit', String(params.limit));
    if (params.search) qs.append('search', params.search);
    if (params.status) qs.append('status', params.status);
    if (params.sort) qs.append('sort', params.sort);
    if (params.order) qs.append('order', params.order);
    const response = await this.api.get(`/projects?${qs.toString()}`);
    return response.data;
  }

  async archiveProject(projectId: string): Promise<any> {
    const response = await this.api.put(`/projects/${projectId}/archive`);
    return response.data;
  }

  async restoreProject(projectId: string): Promise<any> {
    const response = await this.api.put(`/projects/${projectId}/restore`);
    return response.data;
  }

  async bulkDeleteProjects(projectIds: string[]): Promise<any> {
    const response = await this.api.post('/projects/bulk-delete', { projectIds });
    return response.data;
  }

  async bulkArchiveProjects(projectIds: string[]): Promise<any> {
    const response = await this.api.post('/projects/bulk-archive', { projectIds });
    return response.data;
  }

  // ─── Image management ────────────────────────────────────
  async updateImage(imageId: string, data: { description?: string; tags?: string[] }): Promise<any> {
    const response = await this.api.put(`/images/${imageId}`, data);
    return response.data;
  }

  async bulkDeleteImages(imageIds: string[], projectId: string): Promise<any> {
    const response = await this.api.post('/images/bulk-delete', { imageIds, projectId });
    return response.data;
  }

  // ─── Logo upload ────────────────────────────────────────
  async uploadLogo(projectId: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await this.api.post(`/upload-logo/${projectId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  // ─── Video sharing ───────────────────────────────────────
  async createShareLink(videoId: string, expiresIn?: number): Promise<any> {
    const response = await this.api.post(`/videos/${videoId}/share`, { expiresIn });
    return response.data;
  }

  async getSharedVideo(token: string): Promise<any> {
    const response = await this.api.get(`/share/${token}`);
    return response.data;
  }

  async revokeShareLink(videoId: string): Promise<any> {
    const response = await this.api.delete(`/videos/${videoId}/share`);
    return response.data;
  }

  // ─── Analytics ───────────────────────────────────────────
  async getAnalyticsOverview(): Promise<any> {
    const response = await this.api.get('/analytics/overview');
    return response.data;
  }

  async getAnalyticsProcessing(): Promise<any> {
    const response = await this.api.get('/analytics/processing');
    return response.data;
  }

  async getAnalyticsStorage(): Promise<any> {
    const response = await this.api.get('/analytics/storage');
    return response.data;
  }

  async getAnalyticsRunway(): Promise<any> {
    const response = await this.api.get('/analytics/runway');
    return response.data;
  }

  // ─── Admin panel ─────────────────────────────────────────
  async getSystemHealth(): Promise<any> {
    const response = await this.api.get('/admin/system-health');
    return response.data;
  }

  async getRunwayQuota(): Promise<any> {
    const response = await this.api.get('/admin/runway-quota');
    return response.data;
  }

  async getErrorLogs(params?: { page?: number; limit?: number }): Promise<any> {
    const qs = new URLSearchParams();
    if (params?.page) qs.append('page', String(params.page));
    if (params?.limit) qs.append('limit', String(params.limit));
    const response = await this.api.get(`/admin/error-logs?${qs.toString()}`);
    return response.data;
  }

  async getUsageReport(params?: { startDate?: string; endDate?: string }): Promise<any> {
    const qs = new URLSearchParams();
    if (params?.startDate) qs.append('startDate', params.startDate);
    if (params?.endDate) qs.append('endDate', params.endDate);
    const response = await this.api.get(`/admin/usage-report?${qs.toString()}`);
    return response.data;
  }

  // ─── Notifications ───────────────────────────────────────
  async getNotifications(): Promise<any> {
    const response = await this.api.get('/notifications');
    return response.data;
  }

  async markNotificationRead(notificationId: string): Promise<any> {
    const response = await this.api.put(`/notifications/${notificationId}/read`);
    return response.data;
  }
}

export const apiService = new ApiService(); 