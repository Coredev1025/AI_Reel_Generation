import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

export function requireAdmin(req: AuthRequest, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next(new UnauthorizedError('Authentication required'));
    return;
  }

  if (req.user.role !== 'admin') {
    next(new ForbiddenError('Admin access required'));
    return;
  }

  next();
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError(`Required role: ${roles.join(' or ')}`));
      return;
    }

    next();
  };
}
