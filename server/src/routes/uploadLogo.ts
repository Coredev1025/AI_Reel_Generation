import { Router, Response, NextFunction } from 'express';
import { logoService } from '../services/logoService';
import { authenticate } from '../middleware/auth';
import { uploadLogo } from '../middleware/upload';
import { AuthRequest } from '../types';

const router = Router();

router.use(authenticate);

// POST /api/upload-logo/:projectId
router.post('/:projectId', (req: AuthRequest, res: Response, next: NextFunction) => {
  uploadLogo(req, res, async (err) => {
    if (err) {
      return next(err);
    }

    try {
      const file = req.file as Express.Multer.File;
      const logo = await logoService.uploadLogo(file, req.params.projectId, req.user!.id);
      res.json({ logo });
    } catch (error) {
      next(error);
    }
  });
});

export default router;
