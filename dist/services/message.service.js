"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const logger_1 = __importDefault(require("../utils/logger"));
const fs_1 = __importDefault(require("fs"));
class MessageService {
    /**
     * Send a message
     */
    async sendMessage(data) {
        const { matchId, senderId, receiverId, type, content, mediaUrl, mediaHash, thumbnailUrl, metadata } = data;
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
            mediaHash,
            thumbnailUrl,
            metadata,
            read: false,
        });
        // Update match last message time and unread count
        const isUser1 = match.user1.toString() === senderId;
        const unreadField = isUser1 ? 'unreadCount.user2' : 'unreadCount.user1';
        await models_1.Match.findByIdAndUpdate(matchId, {
            lastMessageAt: new Date(),
            $inc: { [unreadField]: 1 },
        });
        logger_1.default.info(`Message sent: ${senderId} -> ${receiverId}`);
        return message;
    }
    /**
     * Get messages for a match
     */
    async getMessages(matchId, userId, page = 1, limit = 50) {
        // Verify user is part of match
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
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('sender receiver', 'firstName lastName profilePhoto');
        const total = await models_1.Message.countDocuments({
            match: matchId,
            deleted: false,
        });
        return {
            messages: messages.reverse(), // Oldest first
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }
    /**
     * Mark messages as read
     */
    async markAsRead(matchId, userId) {
        await models_1.Message.updateMany({
            match: matchId,
            receiver: userId,
            read: false,
        }, {
            read: true,
            readAt: new Date(),
        });
        // Reset unread count
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
        message.deleted = true;
        await message.save();
        // Delete media file if exists
        if (message.mediaUrl) {
            const filePath = `./public${message.mediaUrl}`;
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
            }
        }
        logger_1.default.info(`Message deleted: ${messageId}`);
    }
    /**
     * Add reaction to message
     */
    async addReaction(messageId, userId, emoji) {
        await models_1.Message.findByIdAndUpdate(messageId, {
            $pull: { reactions: { user: userId } }, // Remove existing reaction
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
        // Verify user is part of match
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
            content: { $regex: query, $options: 'i' },
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