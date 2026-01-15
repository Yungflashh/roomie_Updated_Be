// src/routes/points.routes.ts - NEW FILE
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

export default router;