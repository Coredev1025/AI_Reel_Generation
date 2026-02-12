-- ═══════════════════════════════════════════════════════════
-- AI Reel Generation Platform - Database Schema
-- ═══════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Users Table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  role VARCHAR(50) DEFAULT 'user', -- admin, user, viewer
  status VARCHAR(50) DEFAULT 'allowed', -- allowed, pending, blocked
  email_verified BOOLEAN DEFAULT false,
  reset_token TEXT,
  reset_token_expires TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- ─── Projects Table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active', -- active, processing, completed, failed, archived
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[]
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(user_id, name);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- ─── Images Table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  project_name VARCHAR(255),
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  width INTEGER,
  height INTEGER,
  thumbnail_path TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  motion_settings JSONB DEFAULT '{"type": "zoom_in", "duration": 5}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_images_project_id ON images(project_id);
CREATE INDEX IF NOT EXISTS idx_images_user_id ON images(user_id);
CREATE INDEX IF NOT EXISTS idx_images_order ON images(project_id, order_index);

-- ─── Videos Table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  project_name VARCHAR(255),
  filename VARCHAR(255),
  file_path TEXT,
  file_size INTEGER DEFAULT 0,
  duration DECIMAL(10,2) DEFAULT 0,
  aspect_ratio VARCHAR(20),
  resolution VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
  settings JSONB DEFAULT '{}',
  thumbnail_path TEXT,
  runway_job_id VARCHAR(255),
  download_url TEXT,
  shareable_link VARCHAR(255),
  link_expires_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_videos_project_id ON videos(project_id);
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);

-- ─── Music Table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS music (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  project_name VARCHAR(255),
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  duration DECIMAL(10,2),
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_music_project_id ON music(project_id);
CREATE INDEX IF NOT EXISTS idx_music_user_id ON music(user_id);

-- ─── Processing Jobs Table ────────────────────────────────
CREATE TABLE IF NOT EXISTS processing_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  project_name VARCHAR(255),
  video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'queued', -- queued, processing, completed, failed, cancelled
  progress INTEGER DEFAULT 0,
  stage VARCHAR(100) DEFAULT 'queued',
  priority INTEGER DEFAULT 0,
  batch_id UUID,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  data JSONB,
  result JSONB,
  settings JSONB DEFAULT '{}',
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_processing_jobs_project_id ON processing_jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_user_id ON processing_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_video_id ON processing_jobs(video_id);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_status ON processing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_batch_id ON processing_jobs(batch_id);

-- ─── Saved Prompts Table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_prompts_user_id ON saved_prompts(user_id);

-- ─── Video Shares Table ───────────────────────────────────
CREATE TABLE IF NOT EXISTS video_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_video_shares_token ON video_shares(token);
CREATE INDEX IF NOT EXISTS idx_video_shares_video_id ON video_shares(video_id);

-- ─── Notifications Table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT false,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ─── Analytics Events Table ───────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at DESC);

-- ─── Usage Stats Table ────────────────────────────────────
CREATE TABLE IF NOT EXISTS usage_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  videos_generated INTEGER DEFAULT 0,
  storage_used_bytes BIGINT DEFAULT 0,
  runway_api_calls INTEGER DEFAULT 0,
  runway_cost DECIMAL(10,4) DEFAULT 0,
  processing_time_seconds INTEGER DEFAULT 0,
  successful_videos INTEGER DEFAULT 0,
  failed_videos INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_usage_stats_user_date ON usage_stats(user_id, date DESC);

-- ─── System Logs Table ────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  log_level VARCHAR(20) NOT NULL,
  category VARCHAR(100),
  message TEXT NOT NULL,
  stack_trace TEXT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(log_level);
CREATE INDEX IF NOT EXISTS idx_system_logs_category ON system_logs(category);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);

-- ─── API Rate Limits Table ────────────────────────────────
CREATE TABLE IF NOT EXISTS api_rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_name VARCHAR(100) NOT NULL,
  limit_type VARCHAR(50) NOT NULL,
  limit_value INTEGER NOT NULL,
  current_usage INTEGER DEFAULT 0,
  reset_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_api_reset ON api_rate_limits(api_name, reset_at);

-- ═══════════════════════════════════════════════════════════
-- Functions & Triggers
-- ═══════════════════════════════════════════════════════════

-- Update updated_at automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_processing_jobs_updated_at ON processing_jobs;
CREATE TRIGGER update_processing_jobs_updated_at
  BEFORE UPDATE ON processing_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_saved_prompts_updated_at ON saved_prompts;
CREATE TRIGGER update_saved_prompts_updated_at
  BEFORE UPDATE ON saved_prompts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_usage_stats_updated_at ON usage_stats;
CREATE TRIGGER update_usage_stats_updated_at
  BEFORE UPDATE ON usage_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Increment video view count function
CREATE OR REPLACE FUNCTION increment_video_views(video_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE videos
  SET view_count = view_count + 1
  WHERE id = video_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update usage stats function
CREATE OR REPLACE FUNCTION update_usage_stats(
  p_user_id UUID,
  p_videos_generated INTEGER DEFAULT 0,
  p_storage_used BIGINT DEFAULT 0,
  p_api_calls INTEGER DEFAULT 0,
  p_api_cost DECIMAL DEFAULT 0,
  p_processing_time INTEGER DEFAULT 0,
  p_successful INTEGER DEFAULT 0,
  p_failed INTEGER DEFAULT 0
)
RETURNS void AS $$
BEGIN
  INSERT INTO usage_stats (
    user_id, date, videos_generated, storage_used_bytes,
    runway_api_calls, runway_cost, processing_time_seconds,
    successful_videos, failed_videos
  )
  VALUES (
    p_user_id, CURRENT_DATE, p_videos_generated, p_storage_used,
    p_api_calls, p_api_cost, p_processing_time, p_successful, p_failed
  )
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    videos_generated = usage_stats.videos_generated + p_videos_generated,
    storage_used_bytes = usage_stats.storage_used_bytes + p_storage_used,
    runway_api_calls = usage_stats.runway_api_calls + p_api_calls,
    runway_cost = usage_stats.runway_cost + p_api_cost,
    processing_time_seconds = usage_stats.processing_time_seconds + p_processing_time,
    successful_videos = usage_stats.successful_videos + p_successful,
    failed_videos = usage_stats.failed_videos + p_failed,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════
-- Row Level Security (RLS) Policies
-- ═══════════════════════════════════════════════════════════

-- Note: RLS is applied when using Supabase anon key.
-- The service_role key bypasses RLS (used by the backend).
-- These policies are for additional security if using anon key.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE music ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_shares ENABLE ROW LEVEL SECURITY;

-- Service role has full access (backend server uses this)
-- Individual RLS policies for anon/authenticated access:

-- Users can read their own data
CREATE POLICY "Users read own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Projects: users manage their own
CREATE POLICY "Users manage own projects" ON projects
  FOR ALL USING (auth.uid() = user_id);

-- Images: users manage their own
CREATE POLICY "Users manage own images" ON images
  FOR ALL USING (auth.uid() = user_id);

-- Videos: users view their own
CREATE POLICY "Users manage own videos" ON videos
  FOR ALL USING (auth.uid() = user_id);

-- Music: users manage their own
CREATE POLICY "Users manage own music" ON music
  FOR ALL USING (auth.uid() = user_id);

-- Processing jobs: users view their own
CREATE POLICY "Users view own jobs" ON processing_jobs
  FOR SELECT USING (auth.uid() = user_id);

-- Saved prompts: users manage their own
CREATE POLICY "Users manage own prompts" ON saved_prompts
  FOR ALL USING (auth.uid() = user_id);

-- Notifications: users view their own
CREATE POLICY "Users manage own notifications" ON notifications
  FOR ALL USING (auth.uid() = user_id);

-- Video shares: public read via token
CREATE POLICY "Public read shares" ON video_shares
  FOR SELECT USING (true);

-- ═══════════════════════════════════════════════════════════
-- Seed Data (Optional)
-- ═══════════════════════════════════════════════════════════

-- Insert default rate limits
INSERT INTO api_rate_limits (api_name, limit_type, limit_value, reset_at)
VALUES
  ('runway', 'per_second', 5, NOW() + INTERVAL '1 second'),
  ('runway', 'per_day', 8000, NOW() + INTERVAL '1 day')
ON CONFLICT DO NOTHING;
