# System Architecture Document

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
├─────────────────────────────────────────────────────────────┤
│  React SPA (Vite/CRA)                                       │
│  - Redux/Zustand (State Management)                         │
│  - React Router (Navigation)                                │
│  - TailwindCSS (Styling)                                    │
│  - Axios (HTTP Client)                                      │
│  - Socket.io Client (WebSocket)                             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ HTTPS/WSS
                 │
┌────────────────▼────────────────────────────────────────────┐
│                     API GATEWAY / LOAD BALANCER             │
│                     (Nginx / AWS ALB)                       │
└────────────────┬────────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
┌───────▼──────┐   ┌─────▼──────────┐
│  REST API    │   │  WebSocket     │
│  (Express.js)│   │  Server        │
│              │   │  (Socket.io)   │
└───────┬──────┘   └─────┬──────────┘
        │                │
        │    ┌───────────┴──────────────┐
        │    │                          │
┌───────▼────▼─────────────────────────────────────────────┐
│              APPLICATION LAYER (Node.js)                  │
├───────────────────────────────────────────────────────────┤
│                                                            │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │   Auth      │  │   Project    │  │   Video Gen     │ │
│  │   Service   │  │   Service    │  │   Service       │ │
│  └─────────────┘  └──────────────┘  └─────────────────┘ │
│                                                            │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │   Image     │  │   Analytics  │  │   Notification  │ │
│  │   Service   │  │   Service    │  │   Service       │ │
│  └─────────────┘  └──────────────┘  └─────────────────┘ │
│                                                            │
└────────────────┬─────────────┬─────────────┬─────────────┘
                 │             │             │
        ┌────────┴────┐  ┌─────▼──────┐  ┌──▼──────────┐
        │             │  │            │  │             │
┌───────▼──────┐ ┌────▼────┐  ┌───────▼────┐ ┌──────────▼──────┐
│   Supabase   │ │  Redis  │  │  Bull      │ │   Runway API    │
│  (Postgres)  │ │  Cache  │  │  Queue     │ │                 │
│              │ │         │  │            │ │                 │
│  + Storage   │ └─────────┘  └────┬───────┘ └─────────────────┘
│  + Auth      │                   │
│  + Realtime  │              ┌────▼──────┐
└──────────────┘              │   Queue   │
                              │  Workers  │
                              │           │
                              │  - Video  │
                              │  - Image  │
                              │  - Cleanup│
                              └───────────┘
```

---

## Technology Stack

### Frontend
- **Framework**: React 18+
- **Build Tool**: Vite
- **State Management**: Zustand or Redux Toolkit
- **Routing**: React Router v6
- **UI Components**: 
  - Headless UI / Radix UI (base components)
  - TailwindCSS (styling)
  - Framer Motion (animations)
- **Forms**: React Hook Form + Zod validation
- **Data Fetching**: React Query + Axios
- **WebSocket**: Socket.io Client
- **File Upload**: react-dropzone
- **Charts**: Recharts or Chart.js
- **Date**: date-fns
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js 18+ (LTS)
- **Framework**: Express.js
- **Language**: TypeScript
- **API Documentation**: Swagger/OpenAPI
- **Authentication**: Supabase Auth + JWT
- **Validation**: Joi or Zod
- **Queue**: Bull + Redis
- **WebSocket**: Socket.io
- **File Processing**: Sharp (image), FFmpeg (video)
- **Logging**: Winston or Pino
- **Monitoring**: Sentry

### Database & Storage
- **Primary Database**: Supabase (PostgreSQL)
- **Cache**: Redis
- **Object Storage**: Supabase Storage
- **Realtime**: Supabase Realtime

### External Services
- **Video Generation**: Runway API
- **Email**: SendGrid / AWS SES
- **Monitoring**: Sentry, LogRocket
- **CDN**: Cloudflare / AWS CloudFront

### DevOps
- **Version Control**: Git + GitHub
- **CI/CD**: GitHub Actions
- **Hosting**: 
  - Frontend: Vercel / Netlify
  - Backend: Railway / Render / AWS EC2
  - Database: Supabase Cloud
- **Containerization**: Docker (optional)
- **Environment**: dotenv

---

## API Architecture

### REST API Endpoints

#### Authentication
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
POST   /api/auth/verify-email
GET    /api/auth/me
```

#### Users
```
GET    /api/users/profile
PUT    /api/users/profile
PUT    /api/users/password
DELETE /api/users/account
POST   /api/users/avatar

# Admin only
GET    /api/users
GET    /api/users/:id
PUT    /api/users/:id/role
DELETE /api/users/:id
```

#### Projects
```
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PUT    /api/projects/:id
DELETE /api/projects/:id
POST   /api/projects/bulk-delete
POST   /api/projects/:id/archive
POST   /api/projects/:id/restore
```

#### Images
```
POST   /api/projects/:projectId/images (multipart/form-data)
GET    /api/projects/:projectId/images
PUT    /api/projects/:projectId/images/:id
DELETE /api/projects/:projectId/images/:id
PUT    /api/projects/:projectId/images/reorder
```

#### Videos
```
POST   /api/projects/:projectId/generate
GET    /api/videos/:id
GET    /api/videos/:id/download
POST   /api/videos/:id/share
GET    /api/share/:shareableLink
DELETE /api/videos/:id
```

#### Queue & Jobs
```
GET    /api/jobs
GET    /api/jobs/:id
DELETE /api/jobs/:id (cancel)
POST   /api/jobs/:id/retry
GET    /api/queue/stats
GET    /api/queue/health
```

#### Analytics
```
GET    /api/analytics/overview
GET    /api/analytics/videos
GET    /api/analytics/users
GET    /api/analytics/costs
GET    /api/analytics/export
```

#### Admin
```
GET    /api/admin/dashboard
GET    /api/admin/users
GET    /api/admin/system-health
GET    /api/admin/runway-quota
GET    /api/admin/logs
GET    /api/admin/reports
```

#### Music Library
```
GET    /api/music
POST   /api/music
DELETE /api/music/:id
```

---

## WebSocket Events

### Client → Server
```javascript
// Connection
socket.emit('authenticate', { token })

// Subscribe to job updates
socket.emit('subscribe:job', { jobId })
socket.emit('unsubscribe:job', { jobId })

// Subscribe to project updates
socket.emit('subscribe:project', { projectId })
```

### Server → Client
```javascript
// Job progress
socket.on('job:progress', { jobId, progress, stage, eta })
socket.on('job:completed', { jobId, videoId, downloadUrl })
socket.on('job:failed', { jobId, error })

// Project updates
socket.on('project:updated', { projectId, status })

// Notifications
socket.on('notification:new', { notification })

// Queue updates (admin)
socket.on('queue:stats', { waiting, active, completed, failed })
```

---

## Queue System Architecture

### Queue Types
1. **Video Generation Queue** (high priority)
2. **Image Processing Queue** (medium priority)
3. **Cleanup Queue** (low priority)
4. **Analytics Queue** (low priority)

### Job Structure
```javascript
{
  id: 'job-uuid',
  type: 'video_generation',
  data: {
    projectId: 'project-uuid',
    userId: 'user-uuid',
    aspectRatio: '16:9',
    images: [...],
    settings: {...}
  },
  opts: {
    priority: 1,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    timeout: 600000 // 10 minutes
  }
}
```

### Queue Worker Flow
```
1. Job Added to Queue
   ↓
2. Worker Picks Job
   ↓
3. Update Job Status → 'processing'
   ↓
4. Emit WebSocket Progress (0%)
   ↓
5. Process Images
   - Upload to Supabase Storage
   - Generate thumbnails
   - Apply motion settings
   ↓
6. Emit Progress (30%)
   ↓
7. Call Runway API
   - Check rate limits
   - Submit generation request
   - Poll for completion
   ↓
8. Emit Progress (60%)
   ↓
9. Download Generated Video
   ↓
10. Upload to Supabase Storage
    ↓
11. Generate Thumbnail
    ↓
12. Create Signed URL
    ↓
13. Update Database
    ↓
14. Emit Progress (100%)
    ↓
15. Send Notification
    ↓
16. Update Analytics
    ↓
17. Cleanup Temp Files
    ↓
18. Job Complete
```

---

## Data Flow Diagrams

### Video Generation Flow
```
User Uploads Images
    ↓
Frontend validates & shows previews
    ↓
User configures settings (motion, music, text)
    ↓
User clicks "Generate"
    ↓
API creates Project & Job records
    ↓
Job added to Bull Queue
    ↓
Frontend subscribes to WebSocket updates
    ↓
Queue Worker picks job
    ↓
Worker processes images
    ↓
Worker calls Runway API (respecting rate limits)
    ↓
Worker polls Runway for completion
    ↓
Worker downloads video from Runway
    ↓
Worker uploads video to Supabase Storage
    ↓
Worker generates thumbnail
    ↓
Worker creates signed download URL
    ↓
Worker updates Video & Project records
    ↓
Worker emits 'job:completed' via WebSocket
    ↓
Frontend shows download button
    ↓
Worker sends email notification
    ↓
Worker updates usage analytics
    ↓
Cleanup worker removes temp files
```

### Real-time Progress Update Flow
```
Queue Worker
    ↓
Updates job progress in Database
    ↓
Emits WebSocket event 'job:progress'
    ↓
WebSocket Server broadcasts to subscribed clients
    ↓
Frontend updates progress bar
    ↓
Supabase Realtime (fallback)
    ↓
Frontend polls job status (ultimate fallback)
```

---

## File Storage Structure

### Supabase Storage Organization

#### Images Bucket
```
/images
  /{userId}
    /{projectId}
      /originals
        - image1.jpg
        - image2.png
      /thumbnails
        - image1_thumb.jpg
        - image2_thumb.jpg
      /processed
        - image1_processed.jpg
```

#### Videos Bucket
```
/videos
  /{userId}
    /{projectId}
      /16-9
        - video_16-9.mp4
        - video_16-9_thumb.jpg
      /9-16
        - video_9-16.mp4
        - video_9-16_thumb.jpg
```

#### Music Bucket
```
/music
  /system
    - default1.mp3
    - default2.mp3
  /{userId}
    - custom1.mp3
    - custom2.mp3
```

---

## Security Architecture

### Authentication Flow
```
1. User submits credentials
2. Backend validates against Supabase Auth
3. Generate JWT token (30min expiry)
4. Generate refresh token (7 days expiry)
5. Return both tokens to client
6. Client stores in httpOnly cookies (production) or localStorage (dev)
7. Client includes JWT in Authorization header
8. Backend validates JWT on each request
9. Token expires → Client uses refresh token
10. Refresh token expires → User must login again
```

### Authorization Levels
- **Public**: Shareable video links
- **Authenticated**: Own projects, videos, images
- **Editor**: Create/edit projects (default for new users)
- **Admin**: User management, system settings, all data access

### Rate Limiting
- **API Endpoints**: 100 requests/minute per user
- **Upload Endpoints**: 10 requests/minute per user
- **Runway API**: 5 requests/second, 8000/day globally
- **Login Attempts**: 5 attempts/15 minutes per IP

### Data Protection
- All data encrypted at rest (Supabase default)
- All data encrypted in transit (HTTPS/WSS)
- Row Level Security (RLS) on all tables
- Signed URLs for file access (expires in 1 hour)
- CORS configured for frontend domain only
- Input validation on all endpoints
- SQL injection prevention (parameterized queries)
- XSS prevention (input sanitization)

---

## Error Handling Strategy

### Error Levels
1. **Client Errors (4xx)**: User input issues
2. **Server Errors (5xx)**: Internal failures
3. **External Service Errors**: Runway API, Supabase issues
4. **Queue Job Failures**: Retryable vs non-retryable

### Error Response Format
```javascript
{
  success: false,
  error: {
    code: 'VIDEO_GENERATION_FAILED',
    message: 'Failed to generate video',
    details: 'Runway API timeout after 3 retries',
    timestamp: '2026-02-12T10:30:00Z',
    requestId: 'req-123-456'
  }
}
```

### Retry Strategy
```javascript
// Exponential backoff
Attempt 1: Immediate
Attempt 2: 2 seconds
Attempt 3: 4 seconds
Attempt 4: 8 seconds
Attempt 5: 16 seconds (max)

// Retryable errors
- Network timeouts
- 429 Rate Limit
- 500 Internal Server Error
- 503 Service Unavailable

// Non-retryable errors
- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- Invalid file format
- Insufficient credits
```

---

## Monitoring & Observability

### Metrics to Track
- API response times
- Error rates by endpoint
- Queue lengths (waiting, active, completed, failed)
- Runway API usage (calls/day, cost)
- Storage usage per user
- Active WebSocket connections
- Database query performance
- Memory and CPU usage

### Logging Strategy
```javascript
// Log Levels
ERROR   - System failures, exceptions
WARN    - Recoverable issues, degraded performance
INFO    - Important events (user signup, video completed)
DEBUG   - Detailed diagnostic information
TRACE   - Very detailed execution flow

// Log Structure
{
  timestamp: '2026-02-12T10:30:00Z',
  level: 'ERROR',
  service: 'video-generation',
  userId: 'user-123',
  jobId: 'job-456',
  message: 'Runway API timeout',
  stack: '...',
  metadata: {...}
}
```

### Alerts
- Queue depth > 100 jobs
- Failed jobs > 10% in last hour
- Runway API quota > 90%
- API error rate > 5%
- Response time > 2 seconds (p95)
- Database connection pool exhausted
- Disk space < 10%

---

## Performance Optimization

### Frontend
- Code splitting (lazy load routes)
- Image lazy loading
- Virtual scrolling for long lists
- Debounce search inputs
- Memoize expensive calculations
- Service Worker for offline support
- CDN for static assets
- Gzip/Brotli compression

### Backend
- Database connection pooling
- Query optimization (indexes)
- Redis caching for frequent queries
- Response compression
- Pagination for large datasets
- Bulk operations where possible
- Async processing (queue)
- Rate limiting to prevent abuse

### Database
- Proper indexing strategy
- Query optimization
- Materialized views for analytics
- Partitioning large tables (logs)
- Regular VACUUM and ANALYZE
- Connection pooling (PgBouncer)

---

## Scalability Considerations

### Horizontal Scaling
- Stateless API servers (scale with load balancer)
- Multiple queue workers (scale based on queue depth)
- Redis cluster for distributed caching
- Database read replicas

### Vertical Scaling
- Increase database resources as needed
- Upgrade Redis memory
- Larger worker instances for video processing

### Cost Optimization
- Archive old videos to cold storage
- Compress videos before storage
- Clean up temp files immediately
- Use CDN for video delivery
- Monitor Runway API usage closely
- Implement user quotas/limits

---

## Deployment Architecture

### Production Environment
```
┌─────────────────────────────────────────┐
│  Cloudflare CDN                         │
│  - Static assets                        │
│  - DDoS protection                      │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│  Vercel (Frontend)                      │
│  - React SPA                            │
│  - Auto SSL                             │
│  - Edge caching                         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Railway/Render (Backend)               │
│  - Express API                          │
│  - WebSocket Server                     │
│  - Queue Workers (3 instances)          │
│  - Auto-scaling                         │
└────────────┬────────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
┌───▼──────────┐ ┌────▼────────┐
│  Supabase    │ │  Redis      │
│  Cloud       │ │  Cloud      │
│              │ │  (Upstash)  │
└──────────────┘ └─────────────┘
```

### Environment Variables
```bash
# App
NODE_ENV=production
PORT=3000
API_URL=https://api.yourapp.com
FRONTEND_URL=https://yourapp.com

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_KEY=xxx

# Redis
REDIS_URL=redis://xxx

# Runway
RUNWAY_API_KEY=xxx
RUNWAY_API_URL=https://api.runwayml.com

# Email
SENDGRID_API_KEY=xxx
FROM_EMAIL=noreply@yourapp.com

# Monitoring
SENTRY_DSN=xxx
LOGROCKET_ID=xxx

# JWT
JWT_SECRET=xxx
JWT_EXPIRES_IN=30m
REFRESH_TOKEN_EXPIRES_IN=7d
```

---

## Disaster Recovery

### Backup Strategy
- **Database**: Daily automated backups (Supabase)
- **Files**: Replicated across regions (Supabase Storage)
- **Code**: Git repository
- **Configuration**: Documented in repository

### Recovery Procedures
1. Database corruption → Restore from latest backup
2. Storage failure → Supabase handles automatically
3. API server failure → Auto-restart + deploy new instance
4. Complete system failure → Deploy from scratch using IaC

### Business Continuity
- RTO (Recovery Time Objective): 1 hour
- RPO (Recovery Point Objective): 24 hours
- Maintain documentation for manual procedures
- Regular disaster recovery drills

