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
 * @route   GET /api/v1/points/daily-cap
 * @desc    Get today's earning progress vs daily cap
 * @access  Private
 */
router.get('/daily-cap', async (req: any, res: any) => {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
    const pointsService = (await import('../services/points.service')).default;
    const data = await pointsService.getDailyEarned(userId);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

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

/**
 * @route   POST /api/v1/points/purchase
 * @desc    Request to purchase points (pending admin approval)
 * @access  Private
 * @body    { packageId: string, amount: number, pointsAmount: number, label?: string }
 */
router.post('/purchase', pointsController.requestPurchase);

/**
 * @route   POST /api/v1/points/verify-payment
 * @desc    Verify Paystack payment after checkout
 * @access  Private
 */
router.post('/verify-payment', pointsController.verifyPayment);

/**
 * @route   GET /api/v1/points/purchases
 * @desc    Get user's purchase history
 * @access  Private
 */
router.get('/purchases', pointsController.getPurchaseHistory);

/**
 * @route   GET /api/v1/points/referral
 * @desc    Get referral code and stats
 * @access  Private
 */
router.get('/referral', pointsController.getReferralStats);

/**
 * @route   POST /api/v1/points/referral/apply
 * @desc    Apply a referral code
 * @access  Private
 * @body    { code: string }
 */
router.post('/referral/apply', pointsController.applyReferralCode);

export default router;