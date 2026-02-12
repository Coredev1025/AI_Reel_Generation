import { Router, Response, NextFunction } from 'express';
import { projectService } from '../services/projectService';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

router.use(authenticate);

// GET /api/projects/check-name  (must be before /:id)
router.get('/check-name', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const name = req.query.name as string;
    const exists = await projectService.checkNameExists(req.user!.id, name);
    res.json({ exists });
  } catch (err) {
    next(err);
  }
});

// POST /api/projects/bulk-delete
router.post('/bulk-delete', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await projectService.bulkDelete(req.user!.id, req.body.projectIds);
    res.json({ message: 'Projects deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// POST /api/projects/bulk-archive
router.post('/bulk-archive', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await projectService.bulkArchive(req.user!.id, req.body.projectIds);
    res.json({ message: 'Projects archived successfully' });
  } catch (err) {
    next(err);
  }
});

// GET /api/projects
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await projectService.getProjects(req.user!.id, req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/projects
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const project = await projectService.createProject(req.user!.id, req.body);
    res.status(201).json({ project });
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:id
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const project = await projectService.getProject(req.params.id, req.user!.id);
    res.json({ project });
  } catch (err) {
    next(err);
  }
});

// PUT /api/projects/:id
router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const project = await projectService.updateProject(req.params.id, req.user!.id, req.body);
    res.json({ project });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/projects/:id
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await projectService.deleteProject(req.params.id, req.user!.id);
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:id/status
router.get('/:id/status', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const status = await projectService.getProjectStatus(req.params.id, req.user!.id);
    res.json(status);
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:id/stats
router.get('/:id/stats', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await projectService.getProjectStats(req.params.id, req.user!.id);
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

// PUT /api/projects/:id/settings
router.put('/:id/settings', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const project = await projectService.updateProjectSettings(
      req.params.id, req.user!.id, req.body.settings
    );
    res.json({ project });
  } catch (err) {
    next(err);
  }
});

// POST /api/projects/:id/generate-prompts
router.post('/:id/generate-prompts', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { processingService } = await import('../services/processingService');
    const prompts = await processingService.generateDefaultPrompts(req.params.id, req.user!.id);
    res.json(prompts);
  } catch (err) {
    next(err);
  }
});

// PUT /api/projects/:id/archive
router.put('/:id/archive', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const project = await projectService.archiveProject(req.params.id, req.user!.id);
    res.json({ project });
  } catch (err) {
    next(err);
  }
});

// PUT /api/projects/:id/restore
router.put('/:id/restore', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const project = await projectService.restoreProject(req.params.id, req.user!.id);
    res.json({ project });
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:id/videos
router.get('/:id/videos', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const videos = await projectService.getProjectVideos(req.params.id, req.user!.id);
    res.json({ videos });
  } catch (err) {
    next(err);
  }
});

// PUT /api/projects/:id/images/order
router.put('/:id/images/order', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { imageService } = await import('../services/imageService');
    await imageService.updateImageOrders(req.params.id, req.user!.id, req.body.imageOrders);
    res.json({ message: 'Image order updated' });
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:id/music
router.get('/:id/music', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const music = await projectService.getProjectMusic(req.params.id, req.user!.id);
    res.json({ music });
  } catch (err) {
    next(err);
  }
});

export default router;
