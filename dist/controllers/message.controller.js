"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const message_service_1 = __importDefault(require("../services/message.service"));
const logger_1 = __importDefault(require("../utils/logger"));
class MessageController {
    /**
     * Send message
     */
    async sendMessage(req, res) {
        try {
            const userId = req.user?.userId;
            const { matchId, receiverId, type, content } = req.body;
            let mediaUrl;
            let thumbnail;
            let metadata;
            if (req.file) {
                mediaUrl = `/uploads/chat/${req.file.filename}`;
                if (type === 'image' || type === 'video') {
                    metadata = {
                        fileSize: req.file.size,
                        fileName: req.file.filename,
                    };
                }
                if (type === 'video' || type === 'audio') {
                    metadata = {
                        ...metadata,
                        duration: req.duration,
                    };
                }
            }
            const message = await message_service_1.default.sendMessage({
                matchId,
                senderId: userId,
                receiverId,
                type,
                content,
                mediaUrl,
                thumbnail,
                metadata,
            });
            res.status(201).json({
                success: true,
                message: 'Message sent successfully',
                data: { message },
            });
        }
        catch (error) {
            logger_1.default.error('Send message error:', error);
            const statusCode = error.message.includes('not found') ? 404 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Failed to send message',
            });
        }
    }
    /**
     * Get messages
     */
    async getMessages(req, res) {
        try {
            const userId = req.user?.userId;
            const { matchId } = req.params;
            const { page = 1, limit = 50 } = req.query;
            const result = await message_service_1.default.getMessages(matchId, userId, parseInt(page), parseInt(limit));
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            logger_1.default.error('Get messages error:', error);
            const statusCode = error.message.includes('not found') ? 404 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Failed to fetch messages',
            });
        }
    }
    /**
     * Mark messages as read
     */
    async markAsRead(req, res) {
        try {
            const userId = req.user?.userId;
            const { matchId } = req.params;
            await message_service_1.default.markAsRead(matchId, userId);
            res.status(200).json({
                success: true,
                message: 'Messages marked as read',
            });
        }
        catch (error) {
            logger_1.default.error('Mark as read error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to mark messages as read',
            });
        }
    }
    /**
     * Delete message
     */
    async deleteMessage(req, res) {
        try {
            const userId = req.user?.userId;
            const { messageId } = req.params;
            await message_service_1.default.deleteMessage(messageId, userId);
            res.status(200).json({
                success: true,
                message: 'Message deleted successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Delete message error:', error);
            const statusCode = error.message.includes('not found') ||
                error.message.includes('unauthorized') ? 404 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Failed to delete message',
            });
        }
    }
    /**
     * Add reaction
     */
    async addReaction(req, res) {
        try {
            const userId = req.user?.userId;
            const { messageId } = req.params;
            const { emoji } = req.body;
            await message_service_1.default.addReaction(messageId, userId, emoji);
            res.status(200).json({
                success: true,
                message: 'Reaction added',
            });
        }
        catch (error) {
            logger_1.default.error('Add reaction error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to add reaction',
            });
        }
    }
    /**
     * Remove reaction
     */
    async removeReaction(req, res) {
        try {
            const userId = req.user?.userId;
            const { messageId } = req.params;
            await message_service_1.default.removeReaction(messageId, userId);
            res.status(200).json({
                success: true,
                message: 'Reaction removed',
            });
        }
        catch (error) {
            logger_1.default.error('Remove reaction error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to remove reaction',
            });
        }
    }
    /**
     * Get unread count
     */
    async getUnreadCount(req, res) {
        try {
            const userId = req.user?.userId;
            const count = await message_service_1.default.getUnreadCount(userId);
            res.status(200).json({
                success: true,
                data: { unreadCount: count },
            });
        }
        catch (error) {
            logger_1.default.error('Get unread count error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch unread count',
            });
        }
    }
    /**
     * Search messages
     */
    async searchMessages(req, res) {
        try {
            const userId = req.user?.userId;
            const { matchId } = req.params;
            const { query } = req.query;
            if (!query) {
                res.status(400).json({
                    success: false,
                    message: 'Search query is required',
                });
                return;
            }
            const messages = await message_service_1.default.searchMessages(matchId, userId, query);
            res.status(200).json({
                success: true,
                data: { messages },
            });
        }
        catch (error) {
            logger_1.default.error('Search messages error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to search messages',
            });
        }
    }
}
exports.default = new MessageController();
//# sourceMappingURL=message.controller.js.map