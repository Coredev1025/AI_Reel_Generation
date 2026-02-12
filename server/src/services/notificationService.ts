import { getSupabaseAdmin } from '../config/database';
import { NotFoundError } from '../utils/errors';
import { generateId } from '../utils/helpers';
import { logger } from '../utils/logger';

export class NotificationService {
  private db = getSupabaseAdmin();

  async getNotifications(userId: string): Promise<any[]> {
    const { data: notifications, error } = await this.db
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      throw new Error('Failed to fetch notifications');
    }

    return notifications || [];
  }

  async markAsRead(notificationId: string, userId: string): Promise<any> {
    const { data: notification, error } = await this.db
      .from('notifications')
      .update({
        read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error || !notification) {
      throw new NotFoundError('Notification');
    }

    return notification;
  }

  async createNotification(
    userId: string,
    type: string,
    title: string,
    message?: string,
    metadata?: Record<string, any>
  ): Promise<any> {
    const { data: notification, error } = await this.db
      .from('notifications')
      .insert({
        id: generateId(),
        user_id: userId,
        type,
        title,
        message: message || null,
        read: false,
        metadata: metadata || {},
      })
      .select('*')
      .single();

    if (error) {
      logger.error('Failed to create notification', { error: error.message });
      return null;
    }

    return notification;
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.db
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('read', false);
  }
}

export const notificationService = new NotificationService();
