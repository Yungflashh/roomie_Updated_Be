// src/routes/studyBuddy.routes.ts
import { Router } from 'express';
import studyBuddyController from '../controllers/studyBuddy.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/study-buddy
 * @desc    Get all study categories
 * @access  Private
 */
router.get('/', studyBuddyController.getCategories);

/**
 * @route   GET /api/v1/study-buddy/buddies
 * @desc    Find study buddies by category
 * @access  Private
 * @query   category
 */
router.get('/buddies', studyBuddyController.findBuddies);

/**
 * @route   POST /api/v1/study-buddy/sessions/solo
 * @desc    Create a solo study session
 * @access  Private
 * @body    { category: string }
 */
router.post('/sessions/solo', studyBuddyController.createSoloSession);

/**
 * @route   POST /api/v1/study-buddy/sessions/challenge
 * @desc    Create a challenge session
 * @access  Private
 * @body    { opponentId: string, category: string }
 */
router.post('/sessions/challenge', studyBuddyController.createChallengeSession);

/**
 * @route   POST /api/v1/study-buddy/sessions/:sessionId/respond
 * @desc    Respond to a challenge invitation
 * @access  Private
 * @body    { accept: boolean }
 */
router.post('/sessions/:sessionId/respond', studyBuddyController.respondToChallenge);

/**
 * @route   POST /api/v1/study-buddy/sessions/:sessionId/submit
 * @desc    Submit answers for a session
 * @access  Private
 * @body    { answers: Array<{ questionIndex, answer, timeSpent }> }
 */
router.post('/sessions/:sessionId/submit', studyBuddyController.submitAnswers);

/**
 * @route   GET /api/v1/study-buddy/sessions/:sessionId
 * @desc    Get a session by ID
 * @access  Private
 */
router.get('/sessions/:sessionId', studyBuddyController.getSession);

/**
 * @route   GET /api/v1/study-buddy/history
 * @desc    Get user's session history
 * @access  Private
 * @query   page, limit
 */
router.get('/history', studyBuddyController.getUserHistory);

/**
 * @route   GET /api/v1/study-buddy/leaderboard
 * @desc    Get leaderboard
 * @access  Private
 * @query   category, limit
 */
router.get('/leaderboard', studyBuddyController.getLeaderboard);

export default router;
