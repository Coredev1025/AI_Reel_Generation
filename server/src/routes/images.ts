import { Router, Response, NextFunction } from 'express';
import { imageService } from '../services/imageService';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

router.use(authenticate);

// POST /api/images/bulk-delete
router.post('/bulk-delete', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { imageIds, projectId } = req.body;
    await imageService.bulkDeleteImages(imageIds, req.user!.id, projectId);
    res.json({ message: 'Images deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// PUT /api/images/:id
router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const image = await imageService.updateImage(req.params.id, req.user!.id, req.body);
    res.json({ image });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/images/:id
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const projectId = req.query.projectId as string | undefined;
    await imageService.deleteImage(req.params.id, req.user!.id, projectId);
    res.json({ message: 'Image deleted successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
