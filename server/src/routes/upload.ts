import { Router, Response, NextFunction } from 'express';
import { imageService } from '../services/imageService';
import { logoService } from '../services/logoService';
import { authenticate } from '../middleware/auth';
import { uploadImages, uploadLogo } from '../middleware/upload';
import { uploadLimiter } from '../middleware/rateLimiter';
import { AuthRequest } from '../types';

const router = Router();

router.use(authenticate);

// POST /api/upload/:projectId - Upload images
router.post('/:projectId', uploadLimiter, (req: AuthRequest, res: Response, next: NextFunction) => {
  uploadImages(req, res, async (err) => {
    if (err) {
      return next(err);
    }

    try {
      const files = req.files as Express.Multer.File[];
      const images = await imageService.uploadImages(files, req.params.projectId, req.user!.id);
      res.json({
        message: 'Images uploaded successfully',
        images,
        count: images.length,
      });
    } catch (error) {
      next(error);
    }
  });
});

// POST /api/upload-logo/:projectId - Upload logo
router.post('/logo/:projectId', (req: AuthRequest, res: Response, next: NextFunction) => {
  // This route doesn't exist in the frontend client; the upload-logo route does
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
