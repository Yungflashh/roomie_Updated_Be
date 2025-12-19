import { Response } from 'express';
import { AuthRequest } from '../types';
declare class NotificationController {
    /**
     * Get user's notifications
     */
    getNotifications(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get unread count
     */
    getUnreadCount(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Mark notification as read
     */
    markAsRead(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Mark all notifications as read
     */
    markAllAsRead(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Delete a notification
     */
    deleteNotification(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Delete all notifications
     */
    deleteAllNotifications(req: AuthRequest, res: Response): Promise<void>;
}
declare const _default: NotificationController;
export default _default;
//# sourceMappingURL=notification.controller.d.ts.map