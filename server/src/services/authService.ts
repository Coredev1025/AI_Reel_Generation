import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { getSupabaseAdmin } from '../config/database';
import { AuthUser, User } from '../types';
import { ConflictError, UnauthorizedError, ValidationError, NotFoundError } from '../utils/errors';
import { generateId, isValidEmail } from '../utils/helpers';
import { logger } from '../utils/logger';

const SALT_ROUNDS = 12;

export class AuthService {
  private db = getSupabaseAdmin();

  generateToken(user: AuthUser): string {
    return jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
    );
  }

  async signup(email: string, password: string, name?: string): Promise<{ user: AuthUser; token: string }> {
    if (!isValidEmail(email)) {
      throw new ValidationError('Invalid email address');
    }
    if (!password || password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters');
    }

    // Check if user exists
    const { data: existing } = await this.db
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      throw new ConflictError('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const userId = generateId();

    const { data: newUser, error } = await this.db
      .from('users')
      .insert({
        id: userId,
        email: email.toLowerCase(),
        password_hash: passwordHash,
        name: name || null,
        role: 'user',
        status: 'allowed',
        is_active: true,
        email_verified: false,
      })
      .select('id, email, name, role')
      .single();

    if (error) {
      logger.error('Failed to create user', { error: error.message });
      throw new Error('Failed to create user');
    }

    const authUser: AuthUser = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    };

    const token = this.generateToken(authUser);

    logger.info('User registered', { userId: newUser.id, email: newUser.email });
    return { user: authUser, token };
  }

  async signin(email: string, password: string): Promise<{ user: AuthUser; token: string }> {
    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    const { data: user, error } = await this.db
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.is_active) {
      throw new UnauthorizedError('Account has been deactivated');
    }

    if (user.status === 'blocked') {
      throw new UnauthorizedError('Account has been blocked');
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Update last login
    await this.db
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const token = this.generateToken(authUser);

    logger.info('User signed in', { userId: user.id });
    return { user: authUser, token };
  }

  async getMe(userId: string): Promise<AuthUser> {
    const { data: user, error } = await this.db
      .from('users')
      .select('id, email, name, role')
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw new NotFoundError('User');
    }

    return user as AuthUser;
  }

  async updateProfile(userId: string, data: { name?: string; email?: string }): Promise<AuthUser> {
    const updates: Record<string, any> = {};

    if (data.name !== undefined) {
      updates.name = data.name;
    }

    if (data.email) {
      if (!isValidEmail(data.email)) {
        throw new ValidationError('Invalid email address');
      }
      // Check if email is already used
      const { data: existing } = await this.db
        .from('users')
        .select('id')
        .eq('email', data.email.toLowerCase())
        .neq('id', userId)
        .single();

      if (existing) {
        throw new ConflictError('Email already in use');
      }
      updates.email = data.email.toLowerCase();
    }

    if (Object.keys(updates).length === 0) {
      throw new ValidationError('No fields to update');
    }

    updates.updated_at = new Date().toISOString();

    const { data: user, error } = await this.db
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select('id, email, name, role')
      .single();

    if (error || !user) {
      throw new Error('Failed to update profile');
    }

    return user as AuthUser;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    if (!newPassword || newPassword.length < 6) {
      throw new ValidationError('New password must be at least 6 characters');
    }

    const { data: user, error } = await this.db
      .from('users')
      .select('password_hash')
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw new NotFoundError('User');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.db
      .from('users')
      .update({ password_hash: newHash, updated_at: new Date().toISOString() })
      .eq('id', userId);

    logger.info('Password changed', { userId });
  }

  async forgotPassword(email: string): Promise<void> {
    const { data: user } = await this.db
      .from('users')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .single();

    // Always return success to prevent email enumeration
    if (!user) {
      logger.info('Password reset requested for non-existent email', { email });
      return;
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user.id, type: 'password_reset' },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    // Store the reset token
    await this.db
      .from('users')
      .update({ 
        reset_token: resetToken,
        reset_token_expires: new Date(Date.now() + 3600000).toISOString()
      })
      .eq('id', user.id);

    // TODO: Send email with reset link
    logger.info('Password reset token generated', { userId: user.id, token: resetToken });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    if (!newPassword || newPassword.length < 6) {
      throw new ValidationError('Password must be at least 6 characters');
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as { userId: string; type: string };
      if (decoded.type !== 'password_reset') {
        throw new ValidationError('Invalid reset token');
      }

      const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
      const { error } = await this.db
        .from('users')
        .update({
          password_hash: newHash,
          reset_token: null,
          reset_token_expires: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', decoded.userId);

      if (error) {
        throw new Error('Failed to reset password');
      }

      logger.info('Password reset successful', { userId: decoded.userId });
    } catch {
      throw new ValidationError('Invalid or expired reset token');
    }
  }
}

export const authService = new AuthService();
