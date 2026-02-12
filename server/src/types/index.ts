import { Request } from 'express';

// ─── User Types ───────────────────────────────────────────
export type UserRole = 'user' | 'admin' | 'viewer';
export type UserStatus = 'allowed' | 'pending' | 'blocked';

export interface User {
  id: string;
  email: string;
  name: string | null;
  password_hash: string;
  role: UserRole;
  status: UserStatus;
  avatar_url: string | null;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login: string | null;
  is_active: boolean;
}

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

// ─── Request Types ────────────────────────────────────────
export interface AuthRequest extends Request {
  user?: AuthUser;
}

// ─── Project Types ────────────────────────────────────────
export type ProjectStatus = 'active' | 'processing' | 'completed' | 'failed' | 'archived';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  tags: string[];
}

// ─── Image Types ──────────────────────────────────────────
export interface ProjectImage {
  id: string;
  project_id: string;
  user_id: string;
  project_name: string;
  filename: string;
  original_name: string;
  file_path: string;
  file_size: number;
  mime_type: string | null;
  width: number | null;
  height: number | null;
  thumbnail_path: string | null;
  order_index: number;
  description: string | null;
  tags: string[];
  motion_settings: Record<string, any>;
  created_at: string;
}

// ─── Video Types ──────────────────────────────────────────
export type VideoStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Video {
  id: string;
  project_id: string;
  user_id: string;
  project_name: string;
  filename: string;
  file_path: string;
  file_size: number;
  duration: number;
  aspect_ratio: string;
  resolution: string | null;
  status: VideoStatus;
  settings: Record<string, any>;
  thumbnail_path: string | null;
  runway_job_id: string | null;
  download_url: string | null;
  shareable_link: string | null;
  link_expires_at: string | null;
  view_count: number;
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
}

// ─── Music Types ──────────────────────────────────────────
export interface MusicFile {
  id: string;
  project_id: string;
  user_id: string;
  project_name: string;
  filename: string;
  original_name: string;
  file_path: string;
  file_size: number;
  duration: number | null;
  is_default: boolean;
  is_public: boolean;
  description: string | null;
  created_at: string;
}

// ─── Processing Types ─────────────────────────────────────
export type ProcessingStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'error';

export interface ProcessingJob {
  id: string;
  project_id: string;
  user_id: string;
  project_name: string;
  video_id: string | null;
  status: ProcessingStatus;
  progress: number;
  stage: string;
  priority: number;
  batch_id: string | null;
  retry_count: number;
  max_retries: number;
  data: Record<string, any>;
  result: Record<string, any> | null;
  error_message: string | null;
  settings: Record<string, any>;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Notification Types ───────────────────────────────────
export interface Notification {
  id: string;
  user_id: string | null;
  type: string;
  title: string;
  message: string | null;
  read: boolean;
  action_url: string | null;
  metadata: Record<string, any>;
  created_at: string;
  read_at: string | null;
}

// ─── Prompt Types ─────────────────────────────────────────
export interface SavedPrompt {
  id: string;
  user_id: string;
  name: string;
  description: string;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

// ─── Analytics Types ──────────────────────────────────────
export interface AnalyticsEvent {
  id: string;
  user_id: string | null;
  project_id: string | null;
  video_id: string | null;
  event_type: string;
  event_data: Record<string, any>;
  created_at: string;
}

export interface UsageStats {
  id: string;
  user_id: string;
  date: string;
  videos_generated: number;
  storage_used_bytes: number;
  runway_api_calls: number;
  runway_cost: number;
  processing_time_seconds: number;
  successful_videos: number;
  failed_videos: number;
}

// ─── Share Types ──────────────────────────────────────────
export interface VideoShare {
  id: string;
  video_id: string;
  token: string;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
}

// ─── System Types ─────────────────────────────────────────
export interface SystemLog {
  id: string;
  log_level: string;
  category: string;
  message: string;
  stack_trace: string | null;
  user_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

// ─── Queue Types ──────────────────────────────────────────
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

// ─── API Response Types ───────────────────────────────────
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
