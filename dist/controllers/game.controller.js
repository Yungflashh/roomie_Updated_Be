"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const game_service_1 = __importDefault(require("../services/game.service"));
const logger_1 = __importDefault(require("../utils/logger"));
class GameController {
    /**
     * Get all available games
     */
    async getAllGames(req, res) {
        try {
            const games = await game_service_1.default.getAllGames();
            res.status(200).json({
                success: true,
                data: { games },
            });
        }
        catch (error) {
            logger_1.default.error('Get all games error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch games',
            });
        }
    }
    /**
     * Get game details
     */
    async getGame(req, res) {
        try {
            const { gameId } = req.params;
            const game = await game_service_1.default.getGameById(gameId);
            res.status(200).json({
                success: true,
                data: { game },
            });
        }
        catch (error) {
            logger_1.default.error('Get game error:', error);
            const statusCode = error.message.includes('not found') ? 404 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Failed to fetch game',
            });
        }
    }
    /**
     * Send game invitation
     */
    async sendInvitation(req, res) {
        try {
            const userId = req.user?.userId;
            const { gameId, invitedUserId, matchId } = req.body;
            if (!gameId || !invitedUserId || !matchId) {
                res.status(400).json({
                    success: false,
                    message: 'gameId, invitedUserId, and matchId are required',
                });
                return;
            }
            const session = await game_service_1.default.sendGameInvitation(gameId, userId, invitedUserId, matchId);
            res.status(201).json({
                success: true,
                message: 'Game invitation sent',
                data: { session },
            });
        }
        catch (error) {
            logger_1.default.error('Send invitation error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to send invitation',
            });
        }
    }
    /**
     * Respond to game invitation
     */
    async respondToInvitation(req, res) {
        try {
            const userId = req.user?.userId;
            const { sessionId } = req.params;
            const { accept } = req.body;
            if (typeof accept !== 'boolean') {
                res.status(400).json({
                    success: false,
                    message: 'accept must be a boolean',
                });
                return;
            }
            const session = await game_service_1.default.respondToInvitation(sessionId, userId, accept);
            res.status(200).json({
                success: true,
                message: accept ? 'Invitation accepted' : 'Invitation declined',
                data: { session },
            });
        }
        catch (error) {
            logger_1.default.error('Respond to invitation error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to respond to invitation',
            });
        }
    }
    /**
     * Cancel game invitation
     */
    async cancelInvitation(req, res) {
        try {
            const userId = req.user?.userId;
            const { sessionId } = req.params;
            await game_service_1.default.cancelInvitation(sessionId, userId);
            res.status(200).json({
                success: true,
                message: 'Invitation cancelled',
            });
        }
        catch (error) {
            logger_1.default.error('Cancel invitation error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to cancel invitation',
            });
        }
    }
    /**
     * Get game session
     */
    async getSession(req, res) {
        try {
            const { sessionId } = req.params;
            const session = await game_service_1.default.getGameSession(sessionId);
            res.status(200).json({
                success: true,
                data: { session },
            });
        }
        catch (error) {
            logger_1.default.error('Get session error:', error);
            const statusCode = error.message.includes('not found') ? 404 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Failed to fetch session',
            });
        }
    }
    /**
     * Get active game session for a match
     */
    async getActiveSession(req, res) {
        try {
            const { matchId } = req.params;
            const session = await game_service_1.default.getActiveGameSession(matchId);
            res.status(200).json({
                success: true,
                data: { session },
            });
        }
        catch (error) {
            logger_1.default.error('Get active session error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch active session',
            });
        }
    }
    /**
     * Start game session
     */
    async startSession(req, res) {
        try {
            const userId = req.user?.userId;
            const { sessionId } = req.params;
            const session = await game_service_1.default.startGameSession(sessionId, userId);
            res.status(200).json({
                success: true,
                message: 'Game session started',
                data: { session },
            });
        }
        catch (error) {
            logger_1.default.error('Start session error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to start session',
            });
        }
    }
    /**
     * Submit answer (legacy - single answer)
     */
    async submitAnswer(req, res) {
        try {
            const userId = req.user?.userId;
            const { sessionId } = req.params;
            const { questionIndex, answer, timeSpent } = req.body;
            const result = await game_service_1.default.submitAnswer(sessionId, userId, questionIndex, answer, timeSpent);
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            logger_1.default.error('Submit answer error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to submit answer',
            });
        }
    }
    /**
     * Submit all answers at once when player completes game
     */
    async submitAllAnswers(req, res) {
        try {
            const userId = req.user?.userId;
            const { sessionId } = req.params;
            const { answers } = req.body;
            if (!answers || !Array.isArray(answers)) {
                res.status(400).json({
                    success: false,
                    message: 'Answers array is required',
                });
                return;
            }
            const result = await game_service_1.default.submitAllAnswers(sessionId, userId, answers);
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            logger_1.default.error('Submit all answers error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to submit answers',
            });
        }
    }
    /**
     * Complete game session
     */
    async completeSession(req, res) {
        try {
            const { sessionId } = req.params;
            const session = await game_service_1.default.completeGameSession(sessionId);
            res.status(200).json({
                success: true,
                message: 'Game session completed',
                data: { session },
            });
        }
        catch (error) {
            logger_1.default.error('Complete session error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to complete session',
            });
        }
    }
    /**
     * Get user's game history
     */
    async getGameHistory(req, res) {
        try {
            const userId = req.user?.userId;
            const { page = 1, limit = 20 } = req.query;
            const result = await game_service_1.default.getUserGameHistory(userId, parseInt(page), parseInt(limit));
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            logger_1.default.error('Get game history error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch game history',
            });
        }
    }
    /**
     * Get game leaderboard
     */
    async getLeaderboard(req, res) {
        try {
            const { gameId } = req.params;
            const { limit = 10 } = req.query;
            const leaderboard = await game_service_1.default.getGameLeaderboard(gameId, parseInt(limit));
            res.status(200).json({
                success: true,
                data: { leaderboard },
            });
        }
        catch (error) {
            logger_1.default.error('Get leaderboard error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch leaderboard',
            });
        }
    }
}
exports.default = new GameController();
//# sourceMappingURL=game.controller.js.map