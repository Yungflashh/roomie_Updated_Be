"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const logger_1 = __importDefault(require("../utils/logger"));
class GameService {
    /**
     * Get all available games
     */
    async getAllGames() {
        const games = await models_1.Game.find({ isActive: true }).sort({ name: 1 });
        return games;
    }
    /**
     * Get game by ID
     */
    async getGameById(gameId) {
        const game = await models_1.Game.findOne({ _id: gameId, isActive: true });
        if (!game) {
            throw new Error('Game not found');
        }
        return game;
    }
    /**
     * Create game session
     */
    async createGameSession(gameId, userId) {
        const game = await this.getGameById(gameId);
        const session = await models_1.GameSession.create({
            game: gameId,
            players: [{
                    user: userId,
                    score: 0,
                    rank: 0,
                }],
            status: 'waiting',
            startedAt: new Date(),
        });
        logger_1.default.info(`Game session created: ${session._id} for game ${game.name}`);
        return session;
    }
    /**
     * Join game session
     */
    async joinGameSession(sessionId, userId) {
        const session = await models_1.GameSession.findById(sessionId).populate('game');
        if (!session) {
            throw new Error('Game session not found');
        }
        if (session.status !== 'waiting') {
            throw new Error('Game session already started or completed');
        }
        const game = session.game;
        // Check if already joined
        const alreadyJoined = session.players.some((p) => p.user.toString() === userId);
        if (alreadyJoined) {
            throw new Error('Already joined this session');
        }
        // Check max players
        if (session.players.length >= game.maxPlayers) {
            throw new Error('Game session is full');
        }
        session.players.push({
            user: userId,
            score: 0,
            rank: 0,
        });
        await session.save();
        logger_1.default.info(`User ${userId} joined game session ${sessionId}`);
        return session;
    }
    /**
     * Start game session
     */
    async startGameSession(sessionId) {
        const session = await models_1.GameSession.findById(sessionId).populate('game');
        if (!session) {
            throw new Error('Game session not found');
        }
        const game = session.game;
        if (session.players.length < game.minPlayers) {
            throw new Error(`Minimum ${game.minPlayers} players required`);
        }
        session.status = 'active';
        await session.save();
        logger_1.default.info(`Game session started: ${sessionId}`);
        return session;
    }
    /**
     * Submit game score
     */
    async submitScore(sessionId, userId, score) {
        const session = await models_1.GameSession.findById(sessionId).populate('game');
        if (!session) {
            throw new Error('Game session not found');
        }
        if (session.status !== 'active') {
            throw new Error('Game session not active');
        }
        // Update player score
        const player = session.players.find((p) => p.user.toString() === userId);
        if (!player) {
            throw new Error('Player not in this session');
        }
        player.score = score;
        // Calculate ranks
        const sortedPlayers = [...session.players].sort((a, b) => b.score - a.score);
        sortedPlayers.forEach((p, index) => {
            const playerInSession = session.players.find((sp) => sp.user.toString() === p.user.toString());
            if (playerInSession) {
                playerInSession.rank = index + 1;
            }
        });
        await session.save();
        // Award points to user
        const game = session.game;
        const user = await models_1.User.findById(userId);
        if (user && player.rank === 1) {
            user.gamification.points += game.pointsReward;
            // Level up logic
            const newLevel = Math.floor(user.gamification.points / 1000) + 1;
            if (newLevel > user.gamification.level) {
                user.gamification.level = newLevel;
                logger_1.default.info(`User ${userId} leveled up to ${newLevel}`);
            }
            await user.save();
        }
        logger_1.default.info(`Score submitted for session ${sessionId}: ${score}`);
        return session;
    }
    /**
     * Complete game session
     */
    async completeGameSession(sessionId) {
        const session = await models_1.GameSession.findById(sessionId);
        if (!session) {
            throw new Error('Game session not found');
        }
        // Determine winner
        const winner = session.players.reduce((prev, current) => prev.score > current.score ? prev : current);
        session.winner = winner.user;
        session.status = 'completed';
        session.endedAt = new Date();
        await session.save();
        logger_1.default.info(`Game session completed: ${sessionId}, winner: ${winner.user}`);
        return session;
    }
    /**
     * Get user game history
     */
    async getUserGameHistory(userId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const sessions = await models_1.GameSession.find({
            'players.user': userId,
            status: 'completed',
        })
            .populate('game')
            .populate('players.user', 'firstName lastName profilePhoto')
            .sort({ endedAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await models_1.GameSession.countDocuments({
            'players.user': userId,
            status: 'completed',
        });
        return {
            sessions,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }
    /**
     * Get game leaderboard
     */
    async getGameLeaderboard(gameId, limit = 10) {
        const sessions = await models_1.GameSession.find({
            game: gameId,
            status: 'completed',
        })
            .populate('players.user', 'firstName lastName profilePhoto')
            .sort({ 'players.score': -1 })
            .limit(100);
        // Aggregate scores by user
        const userScores = new Map();
        sessions.forEach((session) => {
            session.players.forEach((player) => {
                const userId = player.user._id.toString();
                const existing = userScores.get(userId);
                if (existing) {
                    existing.totalScore += player.score;
                    existing.gamesPlayed += 1;
                    existing.wins += player.rank === 1 ? 1 : 0;
                }
                else {
                    userScores.set(userId, {
                        user: player.user,
                        totalScore: player.score,
                        gamesPlayed: 1,
                        wins: player.rank === 1 ? 1 : 0,
                    });
                }
            });
        });
        // Convert to array and sort
        const leaderboard = Array.from(userScores.values())
            .sort((a, b) => b.totalScore - a.totalScore)
            .slice(0, limit)
            .map((entry, index) => ({
            rank: index + 1,
            user: entry.user,
            totalScore: entry.totalScore,
            gamesPlayed: entry.gamesPlayed,
            wins: entry.wins,
            winRate: ((entry.wins / entry.gamesPlayed) * 100).toFixed(1),
        }));
        return leaderboard;
    }
}
exports.default = new GameService();
//# sourceMappingURL=game.service.js.map