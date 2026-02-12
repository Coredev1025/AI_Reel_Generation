import { Router, Response, NextFunction } from 'express';
import { promptService } from '../services/promptService';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

router.use(authenticate);

// GET /api/prompts
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await promptService.getPrompts(req.user!.id, req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/prompts/:id
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prompt = await promptService.getPrompt(req.params.id, req.user!.id);
    res.json({ prompt });
  } catch (err) {
    next(err);
  }
});

// POST /api/prompts
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prompt = await promptService.createPrompt(req.user!.id, req.body);
    res.status(201).json({ prompt });
  } catch (err) {
    next(err);
  }
});

// PUT /api/prompts/:id
router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prompt = await promptService.updatePrompt(req.params.id, req.user!.id, req.body);
    res.json({ prompt });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/prompts/:id
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await promptService.deletePrompt(req.params.id, req.user!.id);
    res.json({ message: 'Prompt deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// POST /api/prompts/:id/use
router.post('/:id/use', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await promptService.usePrompt(req.params.id, req.user!.id);
    res.json({ message: 'Prompt usage recorded' });
  } catch (err) {
    next(err);
  }
});

export default router;
