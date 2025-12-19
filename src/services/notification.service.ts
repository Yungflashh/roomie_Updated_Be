// src/services/notification.service.ts
import { Notification, INotificationDocument, User } from '../models';
import { emitNotification, emitUnreadUpdate } from '../config/socket.config';
import logger from '../utils/logger';

interface CreateNotificationData {
  user: string;
  type: INotificationDocument['type'];
  title: string;
  body: string;
  data?: INotificationDocument['data'];
  image?: string;
}

class NotificationService {
  /**
   * Create a notification and emit via WebSocket
   */
  async createNotification(data: CreateNotificationData): Promise<INotificationDocument> {
    const notification = await Notification.create(data);
    
    logger.info(`Notification created for user ${data.user}: ${data.type}`);

    // Emit real-time notification via WebSocket
    try {
      emitNotification(data.user, notification.toObject());

      // Emit updated unread counts
      const unreadCount = await this.getUnreadCount(data.user);
      emitUnreadUpdate(data.user, {
        messages: 0,
        notifications: unreadCount,
        requests: 0,
      });
    } catch (socketError) {
      logger.warn('Socket emit failed (user may be offline):', socketError);
    }

    return notification;
  }

  /**
   * Get user's notifications
   */
  async getNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false
  ): Promise<{
    notifications: INotificationDocument[];
    pagination: any;
    unreadCount: number;
  }> {
    const skip = (page - 1) * limit;
    
    const query: any = { user: userId };
    if (unreadOnly) {
      query.read = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ user: userId, read: false }),
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      unreadCount,
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { read: true, readAt: new Date() }
    );

    // Emit updated unread count
    try {
      const unreadCount = await this.getUnreadCount(userId);
      emitUnreadUpdate(userId, {
        messages: 0,
        notifications: unreadCount,
        requests: 0,
      });
    } catch (socketError) {
      logger.warn('Socket emit failed:', socketError);
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    await Notification.updateMany(
      { user: userId, read: false },
      { read: true, readAt: new Date() }
    );

    try {
      emitUnreadUpdate(userId, {
        messages: 0,
        notifications: 0,
        requests: 0,
      });
    } catch (socketError) {
      logger.warn('Socket emit failed:', socketError);
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    await Notification.findOneAndDelete({ _id: notificationId, user: userId });
  }

  /**
   * Delete all notifications
   */
  async deleteAllNotifications(userId: string): Promise<void> {
    await Notification.deleteMany({ user: userId });
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return Notification.countDocuments({ user: userId, read: false });
  }

  // =====================
  // NOTIFICATION CREATORS
  // =====================

  async notifyMatchRequest(fromUserId: string, toUserId: string): Promise<void> {
    const fromUser = await User.findById(fromUserId).select('firstName profilePhoto');
    if (!fromUser) return;

    await this.createNotification({
      user: toUserId,
      type: 'request',
      title: 'New Match Request',
      body: `${fromUser.firstName} wants to be your roommate!`,
      data: { userId: fromUserId },
      image: fromUser.profilePhoto,
    });
  }

  async notifyMatchAccepted(fromUserId: string, toUserId: string, matchId: string): Promise<void> {
    const fromUser = await User.findById(fromUserId).select('firstName profilePhoto');
    if (!fromUser) return;

    await this.createNotification({
      user: toUserId,
      type: 'match',
      title: "It's a Match! 🎉",
      body: `You and ${fromUser.firstName} are now connected!`,
      data: { userId: fromUserId, matchId },
      image: fromUser.profilePhoto,
    });
  }

  async notifyNewMessage(fromUserId: string, toUserId: string, messagePreview: string): Promise<void> {
    const fromUser = await User.findById(fromUserId).select('firstName profilePhoto');
    if (!fromUser) return;

    await this.createNotification({
      user: toUserId,
      type: 'message',
      title: `Message from ${fromUser.firstName}`,
      body: messagePreview.length > 50 ? messagePreview.substring(0, 50) + '...' : messagePreview,
      data: { userId: fromUserId },
      image: fromUser.profilePhoto,
    });
  }

  async notifyListingLike(fromUserId: string, landlordId: string, listingId: string, listingTitle: string): Promise<void> {
    const fromUser = await User.findById(fromUserId).select('firstName profilePhoto');
    if (!fromUser) return;

    await this.createNotification({
      user: landlordId,
      type: 'listing_like',
      title: 'Someone liked your listing!',
      body: `${fromUser.firstName} liked "${listingTitle}"`,
      data: { userId: fromUserId, listingId },
      image: fromUser.profilePhoto,
    });
  }

  async notifyLike(fromUserId: string, toUserId: string): Promise<void> {
    const fromUser = await User.findById(fromUserId).select('firstName profilePhoto');
    if (!fromUser) return;

    await this.createNotification({
      user: toUserId,
      type: 'like',
      title: 'Someone likes you!',
      body: `${fromUser.firstName} is interested in being your roommate`,
      data: { userId: fromUserId },
      image: fromUser.profilePhoto,
    });
  }

  async sendSystemNotification(userId: string, title: string, body: string, data?: any): Promise<void> {
    await this.createNotification({
      user: userId,
      type: 'system',
      title,
      body,
      data,
    });
  }

  async sendReminder(userId: string, title: string, body: string, data?: any): Promise<void> {
    await this.createNotification({
      user: userId,
      type: 'reminder',
      title,
      body,
      data,
    });
  }
}

export default new NotificationService();