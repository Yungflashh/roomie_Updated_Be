"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const game_controller_1 = __importDefault(require("../controllers/game.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const schemas_1 = require("../validation/schemas");
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
 * @route   GET /api/v1/games/:gameId
 * @desc    Get game details
 * @access  Private
 */
router.get('/:gameId', game_controller_1.default.getGame);
/**
 * @route   POST /api/v1/games/session
 * @desc    Create game session
 * @access  Private
 */
router.post('/session', game_controller_1.default.createSession);
/**
 * @route   POST /api/v1/games/session/:sessionId/join
 * @desc    Join game session
 * @access  Private
 */
router.post('/session/:sessionId/join', game_controller_1.default.joinSession);
/**
 * @route   PUT /api/v1/games/session/:sessionId/start
 * @desc    Start game session
 * @access  Private
 */
router.put('/session/:sessionId/start', game_controller_1.default.startSession);
/**
 * @route   POST /api/v1/games/session/:sessionId/score
 * @desc    Submit game score
 * @access  Private
 */
router.post('/session/:sessionId/score', (0, validation_middleware_1.validate)(schemas_1.submitGameScoreValidation), game_controller_1.default.submitScore);
/**
 * @route   PUT /api/v1/games/session/:sessionId/complete
 * @desc    Complete game session
 * @access  Private
 */
router.put('/session/:sessionId/complete', game_controller_1.default.completeSession);
/**
 * @route   GET /api/v1/games/history/me
 * @desc    Get user's game history
 * @access  Private
 */
router.get('/history/me', (0, validation_middleware_1.validate)(schemas_1.paginationValidation), game_controller_1.default.getGameHistory);
/**
 * @route   GET /api/v1/games/:gameId/leaderboard
 * @desc    Get game leaderboard
 * @access  Private
 */
router.get('/:gameId/leaderboard', game_controller_1.default.getLeaderboard);
exports.default = router;
//# sourceMappingURL=game.routes.js.map