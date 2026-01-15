"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const match_service_1 = __importDefault(require("../services/match.service"));
const logger_1 = __importDefault(require("../utils/logger"));
class MatchController {
    /**
     * Get potential matches (with distance sorting support)
     */
    async getPotentialMatches(req, res) {
        try {
            const userId = req.user?.userId;
            const { limit = 20, minCompatibility = 50, sort = 'compatibility' // NEW: Add sort parameter
             } = req.query;
            const matches = await match_service_1.default.getPotentialMatches(userId, parseInt(limit), parseInt(minCompatibility), sort // NEW: Pass sort type to service
            );
            res.status(200).json({
                success: true,
                data: {
                    matches,
                    total: matches.length,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Get potential matches error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch potential matches',
            });
        }
    }
    /**
     * Get sent likes (users I have liked)
     */
    async getSentLikes(req, res) {
        try {
            const userId = req.user?.userId;
            const likes = await match_service_1.default.getSentLikes(userId);
            res.status(200).json({
                success: true,
                data: {
                    likes,
                    total: likes.length,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Get sent likes error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch sent likes',
            });
        }
    }
    /**
     * Like a user
     */
    async likeUser(req, res) {
        try {
            const userId = req.user?.userId;
            const { targetUserId } = req.params;
            const result = await match_service_1.default.likeUser(userId, targetUserId);
            if (result.isMatch) {
                res.status(200).json({
                    success: true,
                    message: "It's a match!",
                    data: result,
                });
            }
            else {
                res.status(200).json({
                    success: true,
                    message: 'User liked',
                    data: result,
                });
            }
        }
        catch (error) {
            logger_1.default.error('Like user error:', error);
            const statusCode = error.message.includes('Cannot') ? 400 :
                error.message.includes('not found') ? 404 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Failed to like user',
            });
        }
    }
    /**
     * Pass a user
     */
    async passUser(req, res) {
        try {
            const userId = req.user?.userId;
            const { targetUserId } = req.params;
            await match_service_1.default.passUser(userId, targetUserId);
            res.status(200).json({
                success: true,
                message: 'User passed',
            });
        }
        catch (error) {
            logger_1.default.error('Pass user error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to pass user',
            });
        }
    }
    /**
     * Get user's matches
     */
    async getMatches(req, res) {
        try {
            const userId = req.user?.userId;
            const { page = 1, limit = 20 } = req.query;
            const result = await match_service_1.default.getMatches(userId, parseInt(page), parseInt(limit));
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            logger_1.default.error('Get matches error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch matches',
            });
        }
    }
    /**
     * Get match details
     */
    async getMatchDetails(req, res) {
        try {
            const userId = req.user?.userId;
            const { matchId } = req.params;
            const match = await match_service_1.default.getMatchDetails(userId, matchId);
            res.status(200).json({
                success: true,
                data: { match },
            });
        }
        catch (error) {
            logger_1.default.error('Get match details error:', error);
            const statusCode = error.message.includes('not found') ? 404 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Failed to fetch match details',
            });
        }
    }
    /**
     * Unmatch a user
     */
    async unmatch(req, res) {
        try {
            const userId = req.user?.userId;
            const { matchId } = req.params;
            await match_service_1.default.unmatch(userId, matchId);
            res.status(200).json({
                success: true,
                message: 'Unmatched successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Unmatch error:', error);
            const statusCode = error.message.includes('not found') ? 404 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Failed to unmatch',
            });
        }
    }
    /**
     * Get likes (users who liked current user)
     */
    async getLikes(req, res) {
        try {
            const userId = req.user?.userId;
            const likes = await match_service_1.default.getLikes(userId);
            res.status(200).json({
                success: true,
                data: {
                    likes,
                    total: likes.length,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Get likes error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch likes',
            });
        }
    }
}
exports.default = new MatchController();
//# sourceMappingURL=match.controller.js.map