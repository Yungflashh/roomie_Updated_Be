"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const notification_service_1 = __importDefault(require("../services/notification.service"));
const logger_1 = __importDefault(require("../utils/logger"));
class NotificationController {
    /**
     * Get user's notifications
     */
    async getNotifications(req, res) {
        try {
            const userId = req.user?.userId;
            const { page = 1, limit = 20, unreadOnly = false } = req.query;
            const result = await notification_service_1.default.getNotifications(userId, parseInt(page), parseInt(limit), unreadOnly === 'true');
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            logger_1.default.error('Get notifications error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch notifications',
            });
        }
    }
    /**
     * Get unread count
     */
    async getUnreadCount(req, res) {
        try {
            const userId = req.user?.userId;
            const count = await notification_service_1.default.getUnreadCount(userId);
            res.status(200).json({
                success: true,
                data: { count },
            });
        }
        catch (error) {
            logger_1.default.error('Get unread count error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch unread count',
            });
        }
    }
    /**
     * Mark notification as read
     */
    async markAsRead(req, res) {
        try {
            const userId = req.user?.userId;
            const { notificationId } = req.params;
            await notification_service_1.default.markAsRead(notificationId, userId);
            res.status(200).json({
                success: true,
                message: 'Notification marked as read',
            });
        }
        catch (error) {
            logger_1.default.error('Mark as read error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to mark notification as read',
            });
        }
    }
    /**
     * Mark all notifications as read
     */
    async markAllAsRead(req, res) {
        try {
            const userId = req.user?.userId;
            await notification_service_1.default.markAllAsRead(userId);
            res.status(200).json({
                success: true,
                message: 'All notifications marked as read',
            });
        }
        catch (error) {
            logger_1.default.error('Mark all as read error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to mark all as read',
            });
        }
    }
    /**
     * Delete a notification
     */
    async deleteNotification(req, res) {
        try {
            const userId = req.user?.userId;
            const { notificationId } = req.params;
            await notification_service_1.default.deleteNotification(notificationId, userId);
            res.status(200).json({
                success: true,
                message: 'Notification deleted',
            });
        }
        catch (error) {
            logger_1.default.error('Delete notification error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to delete notification',
            });
        }
    }
    /**
     * Delete all notifications
     */
    async deleteAllNotifications(req, res) {
        try {
            const userId = req.user?.userId;
            await notification_service_1.default.deleteAllNotifications(userId);
            res.status(200).json({
                success: true,
                message: 'All notifications deleted',
            });
        }
        catch (error) {
            logger_1.default.error('Delete all notifications error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to delete all notifications',
            });
        }
    }
}
exports.default = new NotificationController();
//# sourceMappingURL=notification.controller.js.map