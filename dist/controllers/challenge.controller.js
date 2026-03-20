"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const challenge_service_1 = __importDefault(require("../services/challenge.service"));
const logger_1 = __importDefault(require("../utils/logger"));
class ChallengeController {
    async getActiveChallenges(req, res) {
        try {
            const { type } = req.query;
            const userId = req.user?.userId;
            const challenges = await challenge_service_1.default.getActiveChallenges(type, userId);
            res.status(200).json({
                success: true,
                data: { challenges },
            });
        }
        catch (error) {
            logger_1.default.error('Get active challenges error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch challenges',
            });
        }
    }
    async getChallenge(req, res) {
        try {
            const { challengeId } = req.params;
            const challenge = await challenge_service_1.default.getChallengeById(challengeId);
            res.status(200).json({
                success: true,
                data: { challenge },
            });
        }
        catch (error) {
            logger_1.default.error('Get challenge error:', error);
            const statusCode = error.message.includes('not found') ? 404 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Failed to fetch challenge',
            });
        }
    }
    async joinChallenge(req, res) {
        try {
            const userId = req.user?.userId;
            const { challengeId } = req.params;
            const challenge = await challenge_service_1.default.joinChallenge(challengeId, userId);
            res.status(200).json({
                success: true,
                message: 'Joined challenge successfully',
                data: { challenge },
            });
        }
        catch (error) {
            logger_1.default.error('Join challenge error:', error);
            const statusCode = error.message.includes('not found') ? 404 : 400;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Failed to join challenge',
            });
        }
    }
    async updateProgress(req, res) {
        try {
            const userId = req.user?.userId;
            const { challengeId } = req.params;
            const { progress } = req.body;
            const challenge = await challenge_service_1.default.updateProgress(challengeId, userId, progress);
            res.status(200).json({
                success: true,
                message: 'Progress updated',
                data: { challenge },
            });
        }
        catch (error) {
            logger_1.default.error('Update progress error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to update progress',
            });
        }
    }
    async getUserChallenges(req, res) {
        try {
            const userId = req.user?.userId;
            const challenges = await challenge_service_1.default.getUserChallenges(userId);
            res.status(200).json({
                success: true,
                data: { challenges },
            });
        }
        catch (error) {
            logger_1.default.error('Get user challenges error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch user challenges',
            });
        }
    }
    async getGlobalLeaderboard(req, res) {
        try {
            const { limit = 10, type } = req.query;
            const leaderboard = await challenge_service_1.default.getGlobalLeaderboard(parseInt(limit), type);
            res.status(200).json({
                success: true,
                data: leaderboard,
            });
        }
        catch (error) {
            logger_1.default.error('Get global leaderboard error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch leaderboard',
            });
        }
    }
    async getChallengeLeaderboard(req, res) {
        try {
            const { challengeId } = req.params;
            const { limit = 10 } = req.query;
            const leaderboard = await challenge_service_1.default.getChallengeLeaderboard(challengeId, parseInt(limit));
            res.status(200).json({
                success: true,
                data: { leaderboard },
            });
        }
        catch (error) {
            logger_1.default.error('Get challenge leaderboard error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch leaderboard',
            });
        }
    }
}
exports.default = new ChallengeController();
//# sourceMappingURL=challenge.controller.js.map