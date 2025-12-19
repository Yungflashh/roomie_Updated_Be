// src/controllers/notification.controller.ts
import { Response } from 'express';
import { AuthRequest } from '../types';
import notificationService from '../services/notification.service';
import logger from '../utils/logger';

class NotificationController {
  /**
   * Get user's notifications
   */
  async getNotifications(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { page = 1, limit = 20, unreadOnly = false } = req.query;

      const result = await notificationService.getNotifications(
        userId,
        parseInt(page as string),
        parseInt(limit as string),
        unreadOnly === 'true'
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Get notifications error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch notifications',
      });
    }
  }

  /**
   * Get unread count
   */
  async getUnreadCount(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const count = await notificationService.getUnreadCount(userId);

      res.status(200).json({
        success: true,
        data: { count },
      });
    } catch (error: any) {
      logger.error('Get unread count error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch unread count',
      });
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { notificationId } = req.params;

      await notificationService.markAsRead(notificationId, userId);

      res.status(200).json({
        success: true,
        message: 'Notification marked as read',
      });
    } catch (error: any) {
      logger.error('Mark as read error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to mark notification as read',
      });
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;

      await notificationService.markAllAsRead(userId);

      res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
      });
    } catch (error: any) {
      logger.error('Mark all as read error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to mark all as read',
      });
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { notificationId } = req.params;

      await notificationService.deleteNotification(notificationId, userId);

      res.status(200).json({
        success: true,
        message: 'Notification deleted',
      });
    } catch (error: any) {
      logger.error('Delete notification error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete notification',
      });
    }
  }

  /**
   * Delete all notifications
   */
  async deleteAllNotifications(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;

      await notificationService.deleteAllNotifications(userId);

      res.status(200).json({
        success: true,
        message: 'All notifications deleted',
      });
    } catch (error: any) {
      logger.error('Delete all notifications error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete all notifications',
      });
    }
  }
}

export default new NotificationController();