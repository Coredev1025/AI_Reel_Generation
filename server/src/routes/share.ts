import { Router, Response, NextFunction, Request } from 'express';
import { videoService } from '../services/videoService';

const router = Router();

// GET /api/share/:token - Public route (no auth required)
router.get('/:token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const video = await videoService.getSharedVideo(req.params.token);
    res.json(video);
  } catch (err) {
    next(err);
  }
});

export default router;
