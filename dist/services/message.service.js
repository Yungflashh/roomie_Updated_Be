"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/services/message.service.ts
const models_1 = require("../models");
const socket_config_1 = require("../config/socket.config");
const notification_service_1 = __importDefault(require("./notification.service"));
const weeklyChallenge_service_1 = __importDefault(require("./weeklyChallenge.service"));
const logger_1 = __importDefault(require("../utils/logger"));
const fs_1 = __importDefault(require("fs"));
class MessageService {
    /**
     * Send a message
     */
    async sendMessage(data) {
        const { matchId, senderId, receiverId, type, content, mediaUrl, thumbnail, metadata, replyTo } = data;
        // Verify match exists and user is part of it
        const match = await models_1.Match.findOne({
            _id: matchId,
            $or: [
                { user1: senderId, user2: receiverId },
                { user1: receiverId, user2: senderId },
            ],
            status: 'active',
        });
        if (!match) {
            throw new Error('Match not found or inactive');
        }
        // Create message
        const message = await models_1.Message.create({
            match: matchId,
            sender: senderId,
            receiver: receiverId,
            type,
            content,
            mediaUrl,
            thumbnail,
            replyTo: replyTo || undefined,
            duration: metadata?.duration,
            fileSize: metadata?.fileSize,
            fileName: metadata?.fileName,
            read: false,
        });
        // Populate sender info and reply message
        await message.populate('sender', 'firstName lastName profilePhoto');
        if (replyTo) {
            await message.populate({
                path: 'replyTo',
                select: 'content type sender mediaUrl',
                populate: { path: 'sender', select: 'firstName lastName' },
            });
        }
        // Update match last message time and unread count
        const isUser1 = match.user1.toString() === senderId;
        const unreadField = isUser1 ? 'unreadCount.user2' : 'unreadCount.user1';
        await models_1.Match.findByIdAndUpdate(matchId, {
            lastMessageAt: new Date(),
            $inc: { [unreadField]: 1 },
        });
        // Emit real-time message via WebSocket
        try {
            (0, socket_config_1.emitNewMessage)(matchId, message.toObject(), senderId, receiverId);
            // Get updated unread counts
            const totalUnreadMessages = await this.getUnreadCount(receiverId);
            const unreadNotifications = await notification_service_1.default.getUnreadCount(receiverId);
            (0, socket_config_1.emitUnreadUpdate)(receiverId, {
                messages: totalUnreadMessages,
                notifications: unreadNotifications,
                requests: 0,
            });
        }
        catch (socketError) {
            logger_1.default.warn('Socket emit failed (user may be offline):', socketError);
        }
        // Create notification
        await notification_service_1.default.notifyNewMessage(senderId, receiverId, content || `Sent a ${type}`);
        logger_1.default.info(`Message sent: ${senderId} -> ${receiverId}`);
        // Track challenge progress
        try {
            await weeklyChallenge_service_1.default.trackAction(senderId, 'message');
        }
        catch (e) {
            logger_1.default.warn('Challenge tracking (message) error:', e);
        }
        return message;
    }
    /**
     * Get messages for a match
     */
    async getMessages(matchId, userId, page = 1, limit = 50) {
        const match = await models_1.Match.findOne({
            _id: matchId,
            $or: [{ user1: userId }, { user2: userId }],
        });
        if (!match) {
            throw new Error('Match not found');
        }
        const skip = (page - 1) * limit;
        const messages = await models_1.Message.find({
            match: matchId,
            deleted: false,
            deletedFor: { $ne: userId },
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('sender receiver', 'firstName lastName profilePhoto')
            .populate({
            path: 'replyTo',
            select: 'content type sender mediaUrl',
            populate: { path: 'sender', select: 'firstName lastName' },
        });
        const total = await models_1.Message.countDocuments({
            match: matchId,
            deleted: false,
            deletedFor: { $ne: userId },
        });
        return {
            messages: messages.reverse(),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }
    /**
     * Mark messages as read (respects readReceipts privacy setting)
     */
    async markAsRead(matchId, userId) {
        // Check if user has read receipts enabled
        const user = await models_1.User.findById(userId).select('privacySettings').lean();
        const readReceiptsEnabled = user?.privacySettings?.readReceipts !== false;
        if (!readReceiptsEnabled) {
            // Still clear unread count locally so the user's UI is clean,
            // but don't mark messages as "read" (sender won't see read status)
            const match = await models_1.Match.findById(matchId);
            if (match) {
                const isUser1 = match.user1.toString() === userId;
                const unreadField = isUser1 ? 'unreadCount.user1' : 'unreadCount.user2';
                await models_1.Match.findByIdAndUpdate(matchId, { [unreadField]: 0 });
            }
            logger_1.default.info(`Read receipts disabled for user ${userId}, skipping read marks for match ${matchId}`);
            return;
        }
        await models_1.Message.updateMany({
            match: matchId,
            receiver: userId,
            read: false,
        }, {
            read: true,
            readAt: new Date(),
        });
        const match = await models_1.Match.findById(matchId);
        if (match) {
            const isUser1 = match.user1.toString() === userId;
            const unreadField = isUser1 ? 'unreadCount.user1' : 'unreadCount.user2';
            await models_1.Match.findByIdAndUpdate(matchId, {
                [unreadField]: 0,
            });
        }
        logger_1.default.info(`Messages marked as read for match ${matchId} by user ${userId}`);
    }
    /**
     * Clear all messages in a match for the requesting user (soft delete)
     */
    async clearChat(matchId, userId) {
        const match = await models_1.Match.findOne({
            _id: matchId,
            $or: [{ user1: userId }, { user2: userId }],
        });
        if (!match) {
            throw new Error('Match not found');
        }
        const result = await models_1.Message.updateMany({ match: matchId, deleted: false }, { $addToSet: { deletedFor: userId } });
        logger_1.default.info(`Chat cleared for user ${userId} in match ${matchId}: ${result.modifiedCount} messages`);
        return result.modifiedCount;
    }
    /**
     * Delete a message
     */
    async deleteMessage(messageId, userId) {
        const message = await models_1.Message.findOne({
            _id: messageId,
            sender: userId,
        });
        if (!message) {
            throw new Error('Message not found or unauthorized');
        }
        const receiverId = message.receiver?.toString();
        const matchId = message.match?.toString();
        message.deleted = true;
        await message.save();
        if (message.mediaUrl) {
            const filePath = `./public${message.mediaUrl}`;
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
            }
        }
        // Notify the receiver so the message is removed from their screen
        if (receiverId) {
            (0, socket_config_1.emitToUser)(receiverId, 'message:deleted', {
                messageId,
                matchId,
            });
            logger_1.default.info(`Message:deleted emitted to receiver ${receiverId}`);
        }
        logger_1.default.info(`Message deleted: ${messageId}`);
    }
    /**
     * Add reaction to message
     */
    async addReaction(messageId, userId, emoji) {
        await models_1.Message.findByIdAndUpdate(messageId, {
            $pull: { reactions: { user: userId } },
        });
        await models_1.Message.findByIdAndUpdate(messageId, {
            $push: {
                reactions: {
                    user: userId,
                    emoji,
                },
            },
        });
    }
    /**
     * Remove reaction from message
     */
    async removeReaction(messageId, userId) {
        await models_1.Message.findByIdAndUpdate(messageId, {
            $pull: { reactions: { user: userId } },
        });
    }
    /**
     * Get unread message count
     */
    async getUnreadCount(userId) {
        const count = await models_1.Message.countDocuments({
            receiver: userId,
            read: false,
            deleted: false,
        });
        return count;
    }
    /**
     * Search messages
     */
    async searchMessages(matchId, userId, query) {
        const match = await models_1.Match.findOne({
            _id: matchId,
            $or: [{ user1: userId }, { user2: userId }],
        });
        if (!match) {
            throw new Error('Match not found');
        }
        const messages = await models_1.Message.find({
            match: matchId,
            type: 'text',
            content: { $regex: query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' },
            deleted: false,
        })
            .sort({ createdAt: -1 })
            .limit(20)
            .populate('sender receiver', 'firstName lastName profilePhoto');
        return messages;
    }
}
exports.default = new MessageService();
//# sourceMappingURL=message.service.js.map