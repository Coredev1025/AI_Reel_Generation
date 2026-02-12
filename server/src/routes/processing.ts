import { Router, Response, NextFunction } from 'express';
import { processingService } from '../services/processingService';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

router.use(authenticate);

// POST /api/process
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { projectId, settings } = req.body;
    const result = await processingService.startProcessing(projectId, req.user!.id, settings);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/processing/:id/status
router.get('/:id/status', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const status = await processingService.getProcessingStatus(req.params.id, req.user!.id);
    res.json(status);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/processing/:id/cleanup
router.delete('/:id/cleanup', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await processingService.cleanupFailedProcessing(req.params.id, req.user!.id);
    res.json({ message: 'Processing cleaned up' });
  } catch (err) {
    next(err);
  }
});

// POST /api/processing/:id/restart
router.post('/:id/restart', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const job = await processingService.restartProcessing(req.params.id, req.user!.id);
    res.json({ job });
  } catch (err) {
    next(err);
  }
});

export default router;
