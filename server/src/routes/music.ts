import { Router, Response, NextFunction } from 'express';
import { musicService } from '../services/musicService';
import { authenticate } from '../middleware/auth';
import { uploadMusic as uploadMusicMiddleware } from '../middleware/upload';
import { AuthRequest } from '../types';

const router = Router();

router.use(authenticate);

// POST /api/music/upload/:projectId
router.post('/upload/:projectId', (req: AuthRequest, res: Response, next: NextFunction) => {
  uploadMusicMiddleware(req, res, async (err) => {
    if (err) {
      return next(err);
    }

    try {
      const file = req.file as Express.Multer.File;
      const music = await musicService.uploadMusic(file, req.params.projectId, req.user!.id);
      res.json({ music });
    } catch (error) {
      next(error);
    }
  });
});

// PUT /api/music/:id/default
router.put('/:id/default', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const music = await musicService.setDefault(req.params.id, req.user!.id, req.body.projectId);
    res.json({ music });
  } catch (err) {
    next(err);
  }
});

// PUT /api/music/:id
router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const music = await musicService.updateMusic(req.params.id, req.user!.id, req.body);
    res.json({ music });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/music/:id
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await musicService.deleteMusic(req.params.id, req.user!.id);
    res.json({ message: 'Music deleted successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
