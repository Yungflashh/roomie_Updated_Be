"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const message_service_1 = __importDefault(require("../services/message.service"));
const media_service_1 = require("../services/media.service");
const cloudinary_config_1 = require("../config/cloudinary.config");
const logger_1 = __importDefault(require("../utils/logger"));
const fs_1 = __importDefault(require("fs"));
// Pending media uploads: pendingId -> { filePath, userId, matchId, receiverId, type, timer, cancelled }
const pendingMediaUploads = new Map();
class MessageController {
    /**
     * Send message
     */
    async sendMessage(req, res) {
        try {
            const userId = req.user?.userId;
            const { matchId, receiverId, type, content, replyTo } = req.body;
            // For media messages (image/audio/video): defer processing with cancel window
            if (req.file && (type === 'image' || type === 'audio' || type === 'video')) {
                const pendingId = `pending_${Date.now()}_${Math.random().toString(36).substring(7)}`;
                const filePath = req.file.path;
                logger_1.default.info(`Media upload received, deferring processing. pendingId: ${pendingId}`);
                // Set a 4-second timer before processing
                const timer = setTimeout(async () => {
                    const pending = pendingMediaUploads.get(pendingId);
                    if (!pending || pending.cancelled) {
                        logger_1.default.info(`Pending upload ${pendingId} was cancelled, skipping.`);
                        pendingMediaUploads.delete(pendingId);
                        // Clean up temp file
                        if (fs_1.default.existsSync(filePath))
                            fs_1.default.unlinkSync(filePath);
                        return;
                    }
                    pendingMediaUploads.delete(pendingId);
                    try {
                        // Upload to Cloudinary
                        const isAudio = type === 'audio';
                        const isVideo = type === 'video';
                        const folder = `roomie/users/${userId}${isAudio ? '/audio' : isVideo ? '/video' : ''}`;
                        let mediaUrl;
                        if (isAudio || isVideo) {
                            const result = await cloudinary_config_1.cloudinary.uploader.upload(filePath, {
                                folder,
                                resource_type: isVideo ? 'video' : 'raw',
                                public_id: `${Date.now()}_media`,
                            });
                            mediaUrl = result.secure_url;
                        }
                        else {
                            const result = await media_service_1.mediaService.uploadFromPath(filePath, folder, `${Date.now()}_media`);
                            mediaUrl = result.url;
                        }
                        // Clean up temp file
                        if (fs_1.default.existsSync(filePath))
                            fs_1.default.unlinkSync(filePath);
                        // Now create and send the message
                        const metadata = { fileSize: req.file.size, fileName: req.file.filename };
                        const message = await message_service_1.default.sendMessage({
                            matchId,
                            senderId: userId,
                            receiverId,
                            type,
                            content,
                            replyTo,
                            mediaUrl,
                            metadata,
                        });
                        logger_1.default.info(`Deferred media message sent: ${message._id}`);
                    }
                    catch (err) {
                        logger_1.default.error(`Failed to process deferred upload ${pendingId}:`, err);
                        if (fs_1.default.existsSync(filePath))
                            fs_1.default.unlinkSync(filePath);
                    }
                }, 4000);
                pendingMediaUploads.set(pendingId, {
                    filePath,
                    userId,
                    matchId,
                    receiverId,
                    type,
                    content,
                    timer,
                    cancelled: false,
                });
                // Return immediately with pendingId — client shows preview
                res.status(202).json({
                    success: true,
                    message: 'Media upload queued',
                    data: { pendingId },
                });
                return;
            }
            // Text messages: send immediately (no delay)
            const message = await message_service_1.default.sendMessage({
                matchId,
                senderId: userId,
                receiverId,
                type,
                content,
                replyTo,
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
     * Cancel a pending media upload (within the 4s window)
     */
    async cancelPendingUpload(req, res) {
        try {
            const { pendingId } = req.params;
            const userId = req.user?.userId;
            const pending = pendingMediaUploads.get(pendingId);
            if (!pending) {
                res.status(404).json({ success: false, message: 'Pending upload not found or already processed' });
                return;
            }
            if (pending.userId !== userId) {
                res.status(403).json({ success: false, message: 'Unauthorized' });
                return;
            }
            // Mark as cancelled and clear the timer
            pending.cancelled = true;
            clearTimeout(pending.timer);
            pendingMediaUploads.delete(pendingId);
            // Clean up temp file
            if (fs_1.default.existsSync(pending.filePath)) {
                fs_1.default.unlinkSync(pending.filePath);
            }
            logger_1.default.info(`Pending upload cancelled: ${pendingId}`);
            res.status(200).json({
                success: true,
                message: 'Upload cancelled',
            });
        }
        catch (error) {
            logger_1.default.error('Cancel pending upload error:', error);
            res.status(500).json({ success: false, message: 'Failed to cancel upload' });
        }
    }
    /**
     * Clear chat (soft delete all messages for the requesting user)
     */
    async clearChat(req, res) {
        try {
            const userId = req.user?.userId;
            const { matchId } = req.params;
            const count = await message_service_1.default.clearChat(matchId, userId);
            res.status(200).json({
                success: true,
                message: `Cleared ${count} messages`,
            });
        }
        catch (error) {
            logger_1.default.error('Clear chat error:', error);
            const statusCode = error.message.includes('not found') ? 404 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Failed to clear chat',
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