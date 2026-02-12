import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { getSupabaseAdmin } from '../config/database';
import { AuthRequest, AuthUser } from '../types';
import { UnauthorizedError } from '../utils/errors';
import { logger } from '../utils/logger';

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new UnauthorizedError('No token provided'));
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as AuthUser & { iat: number; exp: number };
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };
    next();
  } catch (err) {
    logger.debug('Token verification failed', { error: (err as Error).message });
    next(new UnauthorizedError('Invalid or expired token'));
  }
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as AuthUser & { iat: number; exp: number };
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };
  } catch {
    // Token is invalid, but we don't require auth
  }
  next();
}

export async function refreshUserData(req: AuthRequest, _res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    next();
    return;
  }

  try {
    const db = getSupabaseAdmin();
    const { data: user, error } = await db
      .from('users')
      .select('id, email, name, role, status')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      next(new UnauthorizedError('User not found'));
      return;
    }

    if (user.status === 'blocked') {
      next(new UnauthorizedError('Account has been blocked'));
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    next();
  } catch (err) {
    next(err);
  }
}
