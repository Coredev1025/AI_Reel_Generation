import { Router, Response, NextFunction } from 'express';
import { notificationService } from '../services/notificationService';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

router.use(authenticate);

// GET /api/notifications
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const notifications = await notificationService.getNotifications(req.user!.id);
    res.json({ notifications });
  } catch (err) {
    next(err);
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user!.id);
    res.json({ notification });
  } catch (err) {
    next(err);
  }
});

export default router;
