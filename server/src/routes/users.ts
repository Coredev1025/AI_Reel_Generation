import { Router, Response, NextFunction } from 'express';
import { userService } from '../services/userService';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import { AuthRequest } from '../types';

const router = Router();

// All routes require authentication + admin
router.use(authenticate, requireAdmin);

// GET /api/users
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const users = await userService.getUsers();
    res.json({ users });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/:id
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await userService.getUser(req.params.id);
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/:id/status
router.put('/:id/status', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await userService.updateUserStatus(req.params.id, req.body.status);
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/:id/role
router.put('/:id/role', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await userService.updateUserRole(req.params.id, req.body.role);
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/:id/password
router.put('/:id/password', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await userService.resetUserPassword(req.params.id, req.body.password);
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/users/:id
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await userService.deleteUser(req.params.id, req.user!.id);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
