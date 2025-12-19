// src/routes/game.routes.ts
import { Router } from 'express';
import gameController from '../controllers/game.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/games
 * @desc    Get all available games
 * @access  Private
 */
router.get('/', gameController.getAllGames);

/**
 * @route   GET /api/v1/games/history/me
 * @desc    Get user's game history
 * @access  Private
 */
router.get('/history/me', gameController.getGameHistory);

/**
 * @route   GET /api/v1/games/:gameId
 * @desc    Get game details
 * @access  Private
 */
router.get('/:gameId', gameController.getGame);

/**
 * @route   GET /api/v1/games/:gameId/leaderboard
 * @desc    Get game leaderboard
 * @access  Private
 */
router.get('/:gameId/leaderboard', gameController.getLeaderboard);

/**
 * @route   POST /api/v1/games/invite
 * @desc    Send game invitation
 * @access  Private
 */
router.post('/invite', gameController.sendInvitation);

/**
 * @route   POST /api/v1/games/session/:sessionId/respond
 * @desc    Respond to game invitation (accept/decline)
 * @access  Private
 */
router.post('/session/:sessionId/respond', gameController.respondToInvitation);

/**
 * @route   DELETE /api/v1/games/session/:sessionId/cancel
 * @desc    Cancel game invitation
 * @access  Private
 */
router.delete('/session/:sessionId/cancel', gameController.cancelInvitation);

/**
 * @route   GET /api/v1/games/session/:sessionId
 * @desc    Get game session details
 * @access  Private
 */
router.get('/session/:sessionId', gameController.getSession);

/**
 * @route   GET /api/v1/games/match/:matchId/active
 * @desc    Get active game session for a match
 * @access  Private
 */
router.get('/match/:matchId/active', gameController.getActiveSession);

/**
 * @route   PUT /api/v1/games/session/:sessionId/start
 * @desc    Start game session
 * @access  Private
 */
router.put('/session/:sessionId/start', gameController.startSession);

/**
 * @route   POST /api/v1/games/session/:sessionId/answer
 * @desc    Submit single game answer (legacy)
 * @access  Private
 */
router.post('/session/:sessionId/answer', gameController.submitAnswer);

/**
 * @route   POST /api/v1/games/session/:sessionId/submit
 * @desc    Submit all answers at once when player completes
 * @access  Private
 */
router.post('/session/:sessionId/submit', gameController.submitAllAnswers);

/**
 * @route   PUT /api/v1/games/session/:sessionId/complete
 * @desc    Complete game session
 * @access  Private
 */
router.put('/session/:sessionId/complete', gameController.completeSession);

export default router;