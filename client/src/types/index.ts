/**
 * Shared type definitions for the application.
 */

export type UserRole = 'user' | 'admin' | 'viewer';

export type UserStatus = 'allowed' | 'pending' | 'blocked';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
}

export interface ManagedUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string | null;
  type: string;
  title: string;
  message: string | null;
  read: boolean;
  metadata: Record<string, any>;
  created_at: string;
}

export interface VideoShare {
  id: string;
  video_id: string;
  token: string;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
}

export interface QueueStats {
  available: boolean;
  paused?: boolean;
  counts?: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: number;
  };
  message?: string;
}

export interface AnalyticsOverview {
  totalVideos: number;
  totalProjects: number;
  totalImages: number;
  totalUsers: number;
  completedJobs: number;
  failedJobs: number;
  successRate: number;
  avgProcessingTime: number;
}

export interface StorageUsage {
  images: { count: number; totalBytes: number };
  music: { count: number; totalBytes: number };
  videos: { count: number; totalBytes: number };
  totalBytes: number;
}

export interface Project {
  id: string;
  name: string;
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
  settings?: Record<string, any>;
  images?: ProjectImage[];
  videos?: Video[];
  music?: MusicFile[];
}

export interface ProjectImage {
  id: string;
  project_name: string;
  filename: string;
  original_name: string;
  file_path: string;
  file_size: number;
  description?: string;
  tags?: string[];
  created_at: string;
}

export interface Video {
  id: string;
  project_name: string;
  filename: string;
  file_path: string;
  file_size: number;
  duration: number;
  status: string;
  settings?: Record<string, any>;
  thumbnail_path?: string;
  created_at: string;
}

export interface MusicFile {
  id: string;
  project_name: string;
  filename: string;
  original_name: string;
  file_path: string;
  file_size: number;
  is_default: boolean;
  created_at: string;
}

export interface ProcessingJob {
  id: string;
  project_name: string;
  video_id?: string;
  status: 'queued' | 'processing' | 'completed' | 'error' | 'failed';
  progress: number;
  stage: string;
  priority: number;
  batch_id?: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  settings?: Record<string, any>;
}

export interface ProcessingLog {
  id: string;
  job_id: string;
  event_type: string;
  message: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface SystemHealth {
  uptime: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
  };
  redisConnected: boolean;
  queueStats: QueueStats;
}

export type AspectRatio = '16:9' | '9:16' | 'both';
export type TransitionType = 'none' | 'crossfade' | 'dissolve';

export interface VideoSettings {
  videoDuration: number;
  musicVolume: number;
  imagePrompts?: { [imageId: string]: string };
  aspectRatio?: AspectRatio;
  transition?: TransitionType;
  transitionDuration?: number;
  introText?: string;
  outroText?: string;
  logo?: {
    path: string;
    filename: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    opacity: number;
  };
  videoName?: string;
  imageOrder?: string[];
}
