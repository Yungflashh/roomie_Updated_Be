"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/services/notification.service.ts
const models_1 = require("../models");
const socket_config_1 = require("../config/socket.config");
const logger_1 = __importDefault(require("../utils/logger"));
class NotificationService {
    /**
     * Create a notification and emit via WebSocket
     */
    async createNotification(data) {
        const notification = await models_1.Notification.create(data);
        logger_1.default.info(`Notification created for user ${data.user}: ${data.type}`);
        // Emit real-time notification via WebSocket
        try {
            (0, socket_config_1.emitNotification)(data.user, notification.toObject());
            // Emit updated unread counts
            const unreadCount = await this.getUnreadCount(data.user);
            (0, socket_config_1.emitUnreadUpdate)(data.user, {
                messages: 0,
                notifications: unreadCount,
                requests: 0,
            });
        }
        catch (socketError) {
            logger_1.default.warn('Socket emit failed (user may be offline):', socketError);
        }
        return notification;
    }
    /**
     * Get user's notifications
     */
    async getNotifications(userId, page = 1, limit = 20, unreadOnly = false) {
        const skip = (page - 1) * limit;
        const query = { user: userId };
        if (unreadOnly) {
            query.read = false;
        }
        const [notifications, total, unreadCount] = await Promise.all([
            models_1.Notification.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            models_1.Notification.countDocuments(query),
            models_1.Notification.countDocuments({ user: userId, read: false }),
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
    async markAsRead(notificationId, userId) {
        await models_1.Notification.findOneAndUpdate({ _id: notificationId, user: userId }, { read: true, readAt: new Date() });
        // Emit updated unread count
        try {
            const unreadCount = await this.getUnreadCount(userId);
            (0, socket_config_1.emitUnreadUpdate)(userId, {
                messages: 0,
                notifications: unreadCount,
                requests: 0,
            });
        }
        catch (socketError) {
            logger_1.default.warn('Socket emit failed:', socketError);
        }
    }
    /**
     * Mark all notifications as read
     */
    async markAllAsRead(userId) {
        await models_1.Notification.updateMany({ user: userId, read: false }, { read: true, readAt: new Date() });
        try {
            (0, socket_config_1.emitUnreadUpdate)(userId, {
                messages: 0,
                notifications: 0,
                requests: 0,
            });
        }
        catch (socketError) {
            logger_1.default.warn('Socket emit failed:', socketError);
        }
    }
    /**
     * Delete a notification
     */
    async deleteNotification(notificationId, userId) {
        await models_1.Notification.findOneAndDelete({ _id: notificationId, user: userId });
    }
    /**
     * Delete all notifications
     */
    async deleteAllNotifications(userId) {
        await models_1.Notification.deleteMany({ user: userId });
    }
    /**
     * Get unread count
     */
    async getUnreadCount(userId) {
        return models_1.Notification.countDocuments({ user: userId, read: false });
    }
    // =====================
    // NOTIFICATION CREATORS
    // =====================
    async notifyMatchRequest(fromUserId, toUserId) {
        const fromUser = await models_1.User.findById(fromUserId).select('firstName profilePhoto');
        if (!fromUser)
            return;
        await this.createNotification({
            user: toUserId,
            type: 'request',
            title: 'New Match Request',
            body: `${fromUser.firstName} wants to be your roommate!`,
            data: { userId: fromUserId },
            image: fromUser.profilePhoto,
        });
    }
    async notifyMatchAccepted(fromUserId, toUserId, matchId) {
        const fromUser = await models_1.User.findById(fromUserId).select('firstName profilePhoto');
        if (!fromUser)
            return;
        await this.createNotification({
            user: toUserId,
            type: 'match',
            title: "It's a Match! 🎉",
            body: `You and ${fromUser.firstName} are now connected!`,
            data: { userId: fromUserId, matchId },
            image: fromUser.profilePhoto,
        });
    }
    async notifyNewMessage(fromUserId, toUserId, messagePreview) {
        const fromUser = await models_1.User.findById(fromUserId).select('firstName profilePhoto');
        if (!fromUser)
            return;
        await this.createNotification({
            user: toUserId,
            type: 'message',
            title: `Message from ${fromUser.firstName}`,
            body: messagePreview.length > 50 ? messagePreview.substring(0, 50) + '...' : messagePreview,
            data: { userId: fromUserId },
            image: fromUser.profilePhoto,
        });
    }
    async notifyListingLike(fromUserId, landlordId, listingId, listingTitle) {
        const fromUser = await models_1.User.findById(fromUserId).select('firstName profilePhoto');
        if (!fromUser)
            return;
        await this.createNotification({
            user: landlordId,
            type: 'listing_like',
            title: 'Someone liked your listing!',
            body: `${fromUser.firstName} liked "${listingTitle}"`,
            data: { userId: fromUserId, listingId },
            image: fromUser.profilePhoto,
        });
    }
    async notifyLike(fromUserId, toUserId) {
        const fromUser = await models_1.User.findById(fromUserId).select('firstName profilePhoto');
        if (!fromUser)
            return;
        await this.createNotification({
            user: toUserId,
            type: 'like',
            title: 'Someone likes you!',
            body: `${fromUser.firstName} is interested in being your roommate`,
            data: { userId: fromUserId },
            image: fromUser.profilePhoto,
        });
    }
    async sendSystemNotification(userId, title, body, data) {
        await this.createNotification({
            user: userId,
            type: 'system',
            title,
            body,
            data,
        });
    }
    async sendReminder(userId, title, body, data) {
        await this.createNotification({
            user: userId,
            type: 'reminder',
            title,
            body,
            data,
        });
    }
}
exports.default = new NotificationService();
//# sourceMappingURL=notification.service.js.map