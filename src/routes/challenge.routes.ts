import { Router } from 'express';
import challengeController from '../controllers/challenge.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/challenges
 * @desc    Get active challenges
 * @access  Private
 */
router.get('/', challengeController.getActiveChallenges);

/**
 * @route   GET /api/v1/challenges/active
 * @desc    Get active challenges (alias)
 * @access  Private
 */
router.get('/active', challengeController.getActiveChallenges);

/**
 * @route   GET /api/v1/challenges/leaderboard
 * @desc    Get global leaderboard
 * @access  Private
 */
router.get('/leaderboard', challengeController.getGlobalLeaderboard);

/**
 * @route   GET /api/v1/challenges/my-challenges
 * @desc    Get user's challenges
 * @access  Private
 */
router.get('/my-challenges', challengeController.getUserChallenges);

/**
 * @route   GET /api/v1/challenges/:challengeId
 * @desc    Get challenge details
 * @access  Private
 */
router.get('/:challengeId', challengeController.getChallenge);

/**
 * @route   POST /api/v1/challenges/:challengeId/join
 * @desc    Join a challenge
 * @access  Private
 */
router.post('/:challengeId/join', challengeController.joinChallenge);

/**
 * @route   PUT /api/v1/challenges/:challengeId/progress
 * @desc    Update challenge progress
 * @access  Private
 */
router.put('/:challengeId/progress', challengeController.updateProgress);

/**
 * @route   GET /api/v1/challenges/:challengeId/leaderboard
 * @desc    Get challenge leaderboard
 * @access  Private
 */
router.get('/:challengeId/leaderboard', challengeController.getChallengeLeaderboard);

export default router;
