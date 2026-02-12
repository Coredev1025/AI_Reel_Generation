import bcrypt from 'bcryptjs';
import { getSupabaseAdmin } from '../config/database';
import { ManagedUser, UserRole, UserStatus } from '../types';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';
import { logger } from '../utils/logger';

const SALT_ROUNDS = 12;

export class UserService {
  private db = getSupabaseAdmin();

  async getUsers(): Promise<ManagedUser[]> {
    const { data: users, error } = await this.db
      .from('users')
      .select('id, email, name, role, status, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('Failed to fetch users');
    }

    return (users || []) as ManagedUser[];
  }

  async getUser(userId: string): Promise<ManagedUser> {
    const { data: user, error } = await this.db
      .from('users')
      .select('id, email, name, role, status, created_at, updated_at')
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw new NotFoundError('User');
    }

    return user as ManagedUser;
  }

  async updateUserStatus(userId: string, status: UserStatus): Promise<ManagedUser> {
    const validStatuses: UserStatus[] = ['allowed', 'pending', 'blocked'];
    if (!validStatuses.includes(status)) {
      throw new ValidationError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const { data: user, error } = await this.db
      .from('users')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select('id, email, name, role, status, created_at, updated_at')
      .single();

    if (error || !user) {
      throw new NotFoundError('User');
    }

    logger.info('User status updated', { userId, status });
    return user as ManagedUser;
  }

  async updateUserRole(userId: string, role: UserRole): Promise<ManagedUser> {
    const validRoles: UserRole[] = ['user', 'admin', 'viewer'];
    if (!validRoles.includes(role)) {
      throw new ValidationError(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }

    const { data: user, error } = await this.db
      .from('users')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select('id, email, name, role, status, created_at, updated_at')
      .single();

    if (error || !user) {
      throw new NotFoundError('User');
    }

    logger.info('User role updated', { userId, role });
    return user as ManagedUser;
  }

  async resetUserPassword(userId: string, newPassword: string): Promise<void> {
    if (!newPassword || newPassword.length < 6) {
      throw new ValidationError('Password must be at least 6 characters');
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const { error } = await this.db
      .from('users')
      .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      throw new NotFoundError('User');
    }

    logger.info('User password reset by admin', { userId });
  }

  async deleteUser(userId: string, adminId: string): Promise<void> {
    if (userId === adminId) {
      throw new ForbiddenError('Cannot delete your own account');
    }

    const { error } = await this.db
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      throw new NotFoundError('User');
    }

    logger.info('User deleted', { userId, deletedBy: adminId });
  }
}

export const userService = new UserService();
