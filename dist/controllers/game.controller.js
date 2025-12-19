"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const game_service_1 = __importDefault(require("../services/game.service"));
const logger_1 = __importDefault(require("../utils/logger"));
class GameController {
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
    async createSession(req, res) {
        try {
            const userId = req.user?.userId;
            const { gameId } = req.body;
            const session = await game_service_1.default.createGameSession(gameId, userId);
            res.status(201).json({
                success: true,
                message: 'Game session created',
                data: { session },
            });
        }
        catch (error) {
            logger_1.default.error('Create session error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to create session',
            });
        }
    }
    async joinSession(req, res) {
        try {
            const userId = req.user?.userId;
            const { sessionId } = req.params;
            const session = await game_service_1.default.joinGameSession(sessionId, userId);
            res.status(200).json({
                success: true,
                message: 'Joined game session',
                data: { session },
            });
        }
        catch (error) {
            logger_1.default.error('Join session error:', error);
            const statusCode = error.message.includes('not found') ? 404 : 400;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Failed to join session',
            });
        }
    }
    async startSession(req, res) {
        try {
            const { sessionId } = req.params;
            const session = await game_service_1.default.startGameSession(sessionId);
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
    async submitScore(req, res) {
        try {
            const userId = req.user?.userId;
            const { sessionId } = req.params;
            const { score } = req.body;
            const session = await game_service_1.default.submitScore(sessionId, userId, score);
            res.status(200).json({
                success: true,
                message: 'Score submitted',
                data: { session },
            });
        }
        catch (error) {
            logger_1.default.error('Submit score error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to submit score',
            });
        }
    }
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