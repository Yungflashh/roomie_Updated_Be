// src/routes/points.routes.ts - COMPLETE FILE
import { Router } from 'express';
import pointsController from '../controllers/points.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/points/stats
 * @desc    Get user points statistics
 * @access  Private
 */
router.get('/stats', pointsController.getPointsStats);

/**
 * @route   GET /api/v1/points/transactions
 * @desc    Get transaction history
 * @access  Private
 * @query   page, limit, type
 */
router.get('/transactions', pointsController.getTransactionHistory);

/**
 * @route   POST /api/v1/points/daily-bonus
 * @desc    Claim daily login bonus
 * @access  Private
 */
router.post('/daily-bonus', pointsController.claimDailyBonus);

/**
 * @route   GET /api/v1/points/config
 * @desc    Get points system configuration
 * @access  Private
 */
router.get('/config', pointsController.getPointsConfig);

/**
 * @route   GET /api/v1/points/check-affordability
 * @desc    Check if user can afford an action
 * @access  Private
 * @query   action (match|game), targetId
 */
router.get('/check-affordability', pointsController.checkAffordability);

/**
 * @route   PUT /api/v1/points/username
 * @desc    Set or update points username
 * @access  Private
 * @body    { username: string }
 */
router.put('/username', pointsController.setPointsUsername);

/**
 * @route   GET /api/v1/points/username/check
 * @desc    Check if username is available
 * @access  Private
 * @query   username
 */
router.get('/username/check', pointsController.checkUsernameAvailability);

/**
 * @route   GET /api/v1/points/username/search
 * @desc    Search user by points username
 * @access  Private
 * @query   username
 */
router.get('/username/search', pointsController.searchByUsername);

/**
 * @route   POST /api/v1/points/gift
 * @desc    Gift points to user by username
 * @access  Private (Verified users only)
 * @body    { username: string, amount: number, message: string }
 */
router.post('/gift', pointsController.giftPoints);

export default router;