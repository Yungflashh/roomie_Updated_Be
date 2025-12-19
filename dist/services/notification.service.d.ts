import { INotificationDocument } from '../models';
interface CreateNotificationData {
    user: string;
    type: INotificationDocument['type'];
    title: string;
    body: string;
    data?: INotificationDocument['data'];
    image?: string;
}
declare class NotificationService {
    /**
     * Create a notification and emit via WebSocket
     */
    createNotification(data: CreateNotificationData): Promise<INotificationDocument>;
    /**
     * Get user's notifications
     */
    getNotifications(userId: string, page?: number, limit?: number, unreadOnly?: boolean): Promise<{
        notifications: INotificationDocument[];
        pagination: any;
        unreadCount: number;
    }>;
    /**
     * Mark notification as read
     */
    markAsRead(notificationId: string, userId: string): Promise<void>;
    /**
     * Mark all notifications as read
     */
    markAllAsRead(userId: string): Promise<void>;
    /**
     * Delete a notification
     */
    deleteNotification(notificationId: string, userId: string): Promise<void>;
    /**
     * Delete all notifications
     */
    deleteAllNotifications(userId: string): Promise<void>;
    /**
     * Get unread count
     */
    getUnreadCount(userId: string): Promise<number>;
    notifyMatchRequest(fromUserId: string, toUserId: string): Promise<void>;
    notifyMatchAccepted(fromUserId: string, toUserId: string, matchId: string): Promise<void>;
    notifyNewMessage(fromUserId: string, toUserId: string, messagePreview: string): Promise<void>;
    notifyListingLike(fromUserId: string, landlordId: string, listingId: string, listingTitle: string): Promise<void>;
    notifyLike(fromUserId: string, toUserId: string): Promise<void>;
    sendSystemNotification(userId: string, title: string, body: string, data?: any): Promise<void>;
    sendReminder(userId: string, title: string, body: string, data?: any): Promise<void>;
}
declare const _default: NotificationService;
export default _default;
//# sourceMappingURL=notification.service.d.ts.map