"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const confession_service_1 = __importDefault(require("../services/confession.service"));
const logger_1 = __importDefault(require("../utils/logger"));
class ConfessionController {
    /**
     * Create an anonymous confession
     * POST /api/v1/confessions
     */
    async createConfession(req, res) {
        try {
            const userId = req.user?.userId;
            const { groupId, content, category } = req.body;
            if (!groupId || !content) {
                res.status(400).json({
                    success: false,
                    message: 'Group ID and content are required',
                });
                return;
            }
            const confession = await confession_service_1.default.createConfession(groupId, userId, content, category);
            res.status(201).json({
                success: true,
                data: { confession },
            });
        }
        catch (error) {
            logger_1.default.error('Create confession error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to create confession',
            });
        }
    }
    /**
     * Get confessions for a group
     * GET /api/v1/confessions/group/:groupId?page=1&limit=20&category=funny
     */
    async getGroupConfessions(req, res) {
        try {
            const userId = req.user?.userId;
            const { groupId } = req.params;
            const { page = 1, limit = 20, category } = req.query;
            const result = await confession_service_1.default.getGroupConfessions(groupId, userId, parseInt(page), parseInt(limit), category);
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            logger_1.default.error('Get group confessions error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get confessions',
            });
        }
    }
    /**
     * Add a reaction to a confession
     * POST /api/v1/confessions/:confessionId/react
     */
    async addReaction(req, res) {
        try {
            const userId = req.user?.userId;
            const { confessionId } = req.params;
            const { emoji } = req.body;
            if (!emoji) {
                res.status(400).json({
                    success: false,
                    message: 'Emoji is required',
                });
                return;
            }
            const confession = await confession_service_1.default.addReaction(confessionId, userId, emoji);
            res.status(200).json({
                success: true,
                data: { confession },
            });
        }
        catch (error) {
            logger_1.default.error('Add reaction error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to add reaction',
            });
        }
    }
    /**
     * Add an anonymous reply to a confession
     * POST /api/v1/confessions/:confessionId/reply
     */
    async addReply(req, res) {
        try {
            const userId = req.user?.userId;
            const { confessionId } = req.params;
            const { content } = req.body;
            if (!content) {
                res.status(400).json({
                    success: false,
                    message: 'Content is required',
                });
                return;
            }
            const confession = await confession_service_1.default.addReply(confessionId, userId, content);
            res.status(200).json({
                success: true,
                data: { confession },
            });
        }
        catch (error) {
            logger_1.default.error('Add reply error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to add reply',
            });
        }
    }
    /**
     * Add a reaction to a reply
     * POST /api/v1/confessions/:confessionId/replies/:replyIndex/react
     */
    async addReplyReaction(req, res) {
        try {
            const userId = req.user?.userId;
            const { confessionId, replyIndex } = req.params;
            const { emoji } = req.body;
            if (!emoji) {
                res.status(400).json({
                    success: false,
                    message: 'Emoji is required',
                });
                return;
            }
            const confession = await confession_service_1.default.addReplyReaction(confessionId, parseInt(replyIndex), userId, emoji);
            res.status(200).json({
                success: true,
                data: { confession },
            });
        }
        catch (error) {
            logger_1.default.error('Add reply reaction error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to add reaction to reply',
            });
        }
    }
    /**
     * Report a confession
     * POST /api/v1/confessions/:confessionId/report
     */
    async reportConfession(req, res) {
        try {
            const userId = req.user?.userId;
            const { confessionId } = req.params;
            const confession = await confession_service_1.default.reportConfession(confessionId, userId);
            res.status(200).json({
                success: true,
                message: 'Confession reported',
                data: { confession },
            });
        }
        catch (error) {
            logger_1.default.error('Report confession error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to report confession',
            });
        }
    }
    /**
     * Delete a confession (admin only)
     * DELETE /api/v1/confessions/:confessionId
     */
    async deleteConfession(req, res) {
        try {
            const userId = req.user?.userId;
            const { confessionId } = req.params;
            await confession_service_1.default.deleteConfession(confessionId, userId);
            res.status(200).json({
                success: true,
                message: 'Confession deleted successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Delete confession error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to delete confession',
            });
        }
    }
}
exports.default = new ConfessionController();
//# sourceMappingURL=confession.controller.js.map