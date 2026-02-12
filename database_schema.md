# Database Schema Design

## Tables Overview

### 1. users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  role VARCHAR(50) DEFAULT 'viewer', -- admin, editor, viewer
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

### 2. projects
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'draft', -- draft, processing, completed, failed, archived
  aspect_ratios JSONB DEFAULT '{"horizontal": true, "vertical": false}', -- which formats to generate
  settings JSONB DEFAULT '{}', -- video customization settings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[]
);

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX idx_projects_tags ON projects USING GIN(tags);
```

### 3. images
```sql
CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL, -- path in Supabase Storage
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER, -- in bytes
  mime_type VARCHAR(100),
  width INTEGER,
  height INTEGER,
  thumbnail_path TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  caption TEXT,
  motion_settings JSONB DEFAULT '{"type": "zoom_in", "duration": 5}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_images_project_id ON images(project_id);
CREATE INDEX idx_images_user_id ON images(user_id);
CREATE INDEX idx_images_order ON images(project_id, order_index);
```

### 4. videos
```sql
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  aspect_ratio VARCHAR(20) NOT NULL, -- '16:9' or '9:16'
  file_path TEXT, -- path in Supabase Storage
  file_name VARCHAR(255),
  file_size INTEGER,
  duration DECIMAL(10,2), -- in seconds
  thumbnail_path TEXT,
  resolution VARCHAR(50), -- '1920x1080' or '1080x1920'
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
  runway_job_id VARCHAR(255), -- Runway API job ID
  download_url TEXT, -- signed URL
  shareable_link VARCHAR(255) UNIQUE,
  link_expires_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

CREATE INDEX idx_videos_project_id ON videos(project_id);
CREATE INDEX idx_videos_user_id ON videos(user_id);
CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_videos_shareable_link ON videos(shareable_link);
```

### 5. jobs
```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  job_type VARCHAR(50) NOT NULL, -- 'video_generation', 'image_processing', etc.
  status VARCHAR(50) DEFAULT 'queued', -- queued, processing, completed, failed, cancelled
  priority INTEGER DEFAULT 0,
  progress INTEGER DEFAULT 0, -- 0-100
  current_stage VARCHAR(100), -- 'uploading_images', 'processing_video', 'finalizing', etc.
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  data JSONB, -- job-specific data
  result JSONB, -- job result data
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_jobs_project_id ON jobs(project_id);
CREATE INDEX idx_jobs_video_id ON jobs(video_id);
CREATE INDEX idx_jobs_user_id ON jobs(user_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_priority ON jobs(priority DESC);
CREATE INDEX idx_jobs_created_at ON jobs(created_at);
```

### 6. music
```sql
CREATE TABLE music (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  duration DECIMAL(10,2),
  genre VARCHAR(100),
  mood VARCHAR(100),
  is_public BOOLEAN DEFAULT false, -- system music available to all
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_music_user_id ON music(user_id);
CREATE INDEX idx_music_public ON music(is_public);
```

### 7. analytics_events
```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
  event_type VARCHAR(100) NOT NULL, -- 'video_generated', 'video_downloaded', 'link_shared', etc.
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_analytics_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_created_at ON analytics_events(created_at DESC);
```

### 8. usage_stats
```sql
CREATE TABLE usage_stats (
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

CREATE INDEX idx_usage_stats_user_date ON usage_stats(user_id, date DESC);
CREATE INDEX idx_usage_stats_date ON usage_stats(date DESC);
```

### 9. system_logs
```sql
CREATE TABLE system_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  log_level VARCHAR(20) NOT NULL, -- 'info', 'warning', 'error', 'critical'
  category VARCHAR(100), -- 'api', 'queue', 'auth', 'video_processing', etc.
  message TEXT NOT NULL,
  stack_trace TEXT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_system_logs_level ON system_logs(log_level);
CREATE INDEX idx_system_logs_category ON system_logs(category);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX idx_system_logs_user_id ON system_logs(user_id);
```

### 10. notifications
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'video_completed', 'video_failed', 'system_alert', etc.
  title VARCHAR(255) NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

### 11. api_rate_limits
```sql
CREATE TABLE api_rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_name VARCHAR(100) NOT NULL, -- 'runway'
  limit_type VARCHAR(50) NOT NULL, -- 'per_second', 'per_day'
  limit_value INTEGER NOT NULL,
  current_usage INTEGER DEFAULT 0,
  reset_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_rate_limits_api_reset ON api_rate_limits(api_name, reset_at);
```

---

## Row Level Security (RLS) Policies

### Users Table
```sql
-- Users can view their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Projects Table
```sql
-- Users can view their own projects
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create projects
CREATE POLICY "Users can create projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own projects
CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own projects
CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- Admins can view all projects
CREATE POLICY "Admins can view all projects" ON projects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Images Table
```sql
-- Users can manage images in their projects
CREATE POLICY "Users can manage own images" ON images
  FOR ALL USING (auth.uid() = user_id);
```

### Videos Table
```sql
-- Users can view their own videos
CREATE POLICY "Users can view own videos" ON videos
  FOR SELECT USING (auth.uid() = user_id);

-- Anyone can view videos with shareable links (for sharing)
CREATE POLICY "Public can view shared videos" ON videos
  FOR SELECT USING (
    shareable_link IS NOT NULL 
    AND link_expires_at > NOW()
  );
```

---

## Database Functions

### Update Updated_At Timestamp
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Increment View Count
```sql
CREATE OR REPLACE FUNCTION increment_video_views(video_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE videos 
  SET view_count = view_count + 1 
  WHERE id = video_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Update Usage Stats
```sql
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
    user_id, 
    date, 
    videos_generated, 
    storage_used_bytes,
    runway_api_calls,
    runway_cost,
    processing_time_seconds,
    successful_videos,
    failed_videos
  )
  VALUES (
    p_user_id,
    CURRENT_DATE,
    p_videos_generated,
    p_storage_used,
    p_api_calls,
    p_api_cost,
    p_processing_time,
    p_successful,
    p_failed
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
```

---

## Storage Buckets Configuration

### 1. images Bucket
```javascript
{
  "public": false,
  "fileSizeLimit": 10485760, // 10MB
  "allowedMimeTypes": ["image/jpeg", "image/png", "image/webp", "image/gif"]
}
```

### 2. videos Bucket
```javascript
{
  "public": false,
  "fileSizeLimit": 524288000, // 500MB
  "allowedMimeTypes": ["video/mp4", "video/quicktime", "video/x-msvideo"]
}
```

### 3. music Bucket
```javascript
{
  "public": false,
  "fileSizeLimit": 20971520, // 20MB
  "allowedMimeTypes": ["audio/mpeg", "audio/mp3", "audio/wav", "audio/aac"]
}
```

### Storage Policies
```sql
-- Images: Users can upload to their own folder
CREATE POLICY "Users can upload images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Images: Users can read their own images
CREATE POLICY "Users can read own images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Videos: Users can read their own videos
CREATE POLICY "Users can read own videos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'videos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Videos: Anyone with link can view (for sharing)
CREATE POLICY "Public can view shared videos" ON storage.objects
  FOR SELECT USING (bucket_id = 'videos');
```

---

## Indexes Strategy

### Performance Optimization
- Primary keys are automatically indexed
- Foreign keys should be indexed for join performance
- Add composite indexes for common query patterns
- Use partial indexes for filtered queries
- Monitor and add indexes based on slow query logs

### Maintenance
```sql
-- Rebuild indexes periodically
REINDEX TABLE projects;

-- Analyze tables for query optimization
ANALYZE projects;
ANALYZE videos;
ANALYZE jobs;
```

