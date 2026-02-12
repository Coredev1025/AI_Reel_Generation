import { Router, Response, NextFunction } from 'express';
import { adminService } from '../services/adminService';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import { AuthRequest } from '../types';

const router = Router();

router.use(authenticate, requireAdmin);

// GET /api/admin/system-health
router.get('/system-health', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const health = await adminService.getSystemHealth();
    res.json(health);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/runway-quota
router.get('/runway-quota', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const quota = await adminService.getRunwayQuota();
    res.json(quota);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/error-logs
router.get('/error-logs', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const logs = await adminService.getErrorLogs(page, limit);
    res.json(logs);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/usage-report
router.get('/usage-report', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
    const report = await adminService.getUsageReport(startDate, endDate);
    res.json(report);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/rate-limit
router.get('/rate-limit', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await adminService.getRateLimitStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

// ─── Queue management ─────────────────────────────────
// GET /api/admin/queue/stats
router.get('/queue/stats', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await adminService.getQueueStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/queue/jobs
router.get('/queue/jobs', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const status = (req.query.status as string) || 'waiting';
    const start = parseInt(req.query.start as string) || 0;
    const end = parseInt(req.query.end as string) || 19;
    const jobs = await adminService.getQueueJobs(status, start, end);
    res.json(jobs);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/queue/pause
router.post('/queue/pause', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await adminService.pauseQueue();
    res.json({ message: 'Queue paused' });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/queue/resume
router.post('/queue/resume', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await adminService.resumeQueue();
    res.json({ message: 'Queue resumed' });
  } catch (err) {
    next(err);
  }
});

export default router;
