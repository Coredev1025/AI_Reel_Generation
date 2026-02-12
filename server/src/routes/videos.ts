import { Router, Response, NextFunction } from 'express';
import { videoService } from '../services/videoService';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

router.use(authenticate);

// GET /api/videos/:id
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const video = await videoService.getVideo(req.params.id, req.user!.id);
    res.json({ video });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/videos/:id
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await videoService.deleteVideo(req.params.id, req.user!.id);
    res.json({ message: 'Video deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// POST /api/videos/:id/share
router.post('/:id/share', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const share = await videoService.createShareLink(req.params.id, req.user!.id, req.body.expiresIn);
    res.json({ share });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/videos/:id/share
router.delete('/:id/share', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await videoService.revokeShareLink(req.params.id, req.user!.id);
    res.json({ message: 'Share link revoked' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/videos/:id/cleanup
router.delete('/:id/cleanup', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await videoService.cleanupFailedVideo(req.params.id, req.user!.id);
    res.json({ message: 'Video cleaned up' });
  } catch (err) {
    next(err);
  }
});

export default router;
