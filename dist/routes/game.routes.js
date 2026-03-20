"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/game.routes.ts - UPDATED WITH NEW ROUTES
const express_1 = require("express");
const game_controller_1 = __importDefault(require("../controllers/game.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
/**
 * @route   GET /api/v1/games
 * @desc    Get all available games
 * @access  Private
 */
router.get('/', game_controller_1.default.getAllGames);
/**
 * @route   GET /api/v1/games/available
 * @desc    Get games available for user (filtered by level)
 * @access  Private
 * IMPORTANT: Must be BEFORE /:gameId route
 */
router.get('/available', game_controller_1.default.getAvailableGames);
/**
 * @route   GET /api/v1/games/history/me
 * @desc    Get user's game history
 * @access  Private
 */
router.get('/history/me', game_controller_1.default.getGameHistory);
/**
 * @route   GET /api/v1/games/can-play/:gameId
 * @desc    Check if user can play specific game
 * @access  Private
 * IMPORTANT: Must be BEFORE /:gameId route
 */
router.get('/can-play/:gameId', game_controller_1.default.canPlayGame);
/**
 * @route   GET /api/v1/games/:gameId
 * @desc    Get game details
 * @access  Private
 */
router.get('/:gameId', game_controller_1.default.getGame);
/**
 * @route   GET /api/v1/games/:gameId/leaderboard
 * @desc    Get game leaderboard
 * @access  Private
 */
router.get('/:gameId/leaderboard', game_controller_1.default.getLeaderboard);
/**
 * @route   POST /api/v1/games/invite
 * @desc    Send game invitation
 * @access  Private
 */
router.post('/invite', game_controller_1.default.sendInvitation);
/**
 * @route   POST /api/v1/games/invite/multiplayer
 * @desc    Send multiplayer game invitation to multiple users
 * @access  Private
 */
router.post('/invite/multiplayer', game_controller_1.default.sendMultiplayerInvitation);
/**
 * @route   POST /api/v1/games/session/:sessionId/respond
 * @desc    Respond to game invitation (accept/decline)
 * @access  Private
 */
router.post('/session/:sessionId/respond', game_controller_1.default.respondToInvitation);
/**
 * @route   DELETE /api/v1/games/session/:sessionId/cancel
 * @desc    Cancel game invitation
 * @access  Private
 */
router.delete('/session/:sessionId/cancel', game_controller_1.default.cancelInvitation);
/**
 * @route   GET /api/v1/games/session/:sessionId
 * @desc    Get game session details
 * @access  Private
 */
router.get('/session/:sessionId', game_controller_1.default.getSession);
/**
 * @route   GET /api/v1/games/match/:matchId/active
 * @desc    Get active game session for a match
 * @access  Private
 */
router.get('/match/:matchId/active', game_controller_1.default.getActiveSession);
/**
 * @route   PUT /api/v1/games/session/:sessionId/start
 * @desc    Start game session
 * @access  Private
 */
router.put('/session/:sessionId/start', game_controller_1.default.startSession);
/**
 * @route   POST /api/v1/games/session/:sessionId/answer
 * @desc    Submit single game answer (legacy)
 * @access  Private
 */
router.post('/session/:sessionId/answer', game_controller_1.default.submitAnswer);
/**
 * @route   POST /api/v1/games/session/:sessionId/submit
 * @desc    Submit all answers at once when player completes
 * @access  Private
 */
router.post('/session/:sessionId/submit', game_controller_1.default.submitAllAnswers);
/**
 * @route   PUT /api/v1/games/session/:sessionId/complete
 * @desc    Complete game session
 * @access  Private
 */
router.put('/session/:sessionId/complete', game_controller_1.default.completeSession);
exports.default = router;
//# sourceMappingURL=game.routes.js.map