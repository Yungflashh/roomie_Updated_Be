"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
            await this.emitFullUnreadCounts(data.user);
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
        await this.emitFullUnreadCounts(userId);
    }
    /**
     * Mark all notifications as read
     */
    async markAllAsRead(userId) {
        await models_1.Notification.updateMany({ user: userId, read: false }, { read: true, readAt: new Date() });
        await this.emitFullUnreadCounts(userId);
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
    /**
     * Get unread match request count
     */
    async getUnreadRequestCount(userId) {
        return models_1.Notification.countDocuments({ user: userId, read: false, type: { $in: ['request', 'like'] } });
    }
    /**
     * Count pending match requests (users who liked this user but aren't matched yet)
     */
    async getPendingRequestCount(userId) {
        try {
            const matchService = (await Promise.resolve().then(() => __importStar(require('./match.service')))).default;
            const likes = await matchService.getLikes(userId);
            return likes?.length || 0;
        }
        catch {
            return 0;
        }
    }
    /**
     * Build and emit full unread counts for a user
     */
    async emitFullUnreadCounts(userId) {
        try {
            const [notifications, requests] = await Promise.all([
                this.getUnreadCount(userId),
                this.getPendingRequestCount(userId),
            ]);
            (0, socket_config_1.emitUnreadUpdate)(userId, {
                messages: 0,
                notifications,
                requests,
            });
        }
        catch (e) {
            logger_1.default.warn('emitFullUnreadCounts failed:', e);
        }
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