import { Router, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analyticsService';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

router.use(authenticate);

// GET /api/analytics/overview
router.get('/overview', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const isAdmin = req.user!.role === 'admin';
    const overview = await analyticsService.getOverview(isAdmin ? undefined : req.user!.id);
    res.json(overview);
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/processing
router.get('/processing', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const isAdmin = req.user!.role === 'admin';
    const processing = await analyticsService.getProcessingAnalytics(isAdmin ? undefined : req.user!.id);
    res.json(processing);
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/storage
router.get('/storage', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const isAdmin = req.user!.role === 'admin';
    const storage = await analyticsService.getStorageAnalytics(isAdmin ? undefined : req.user!.id);
    res.json(storage);
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/runway
router.get('/runway', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const runway = await analyticsService.getRunwayAnalytics();
    res.json(runway);
  } catch (err) {
    next(err);
  }
});

export default router;
