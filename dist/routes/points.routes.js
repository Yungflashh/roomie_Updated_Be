"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/points.routes.ts - COMPLETE FILE
const express_1 = require("express");
const points_controller_1 = __importDefault(require("../controllers/points.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
/**
 * @route   GET /api/v1/points/stats
 * @desc    Get user points statistics
 * @access  Private
 */
router.get('/stats', points_controller_1.default.getPointsStats);
/**
 * @route   GET /api/v1/points/transactions
 * @desc    Get transaction history
 * @access  Private
 * @query   page, limit, type
 */
router.get('/transactions', points_controller_1.default.getTransactionHistory);
/**
 * @route   POST /api/v1/points/daily-bonus
 * @desc    Claim daily login bonus
 * @access  Private
 */
router.post('/daily-bonus', points_controller_1.default.claimDailyBonus);
/**
 * @route   GET /api/v1/points/daily-cap
 * @desc    Get today's earning progress vs daily cap
 * @access  Private
 */
router.get('/daily-cap', async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const pointsService = (await Promise.resolve().then(() => __importStar(require('../services/points.service')))).default;
        const data = await pointsService.getDailyEarned(userId);
        res.json({ success: true, data });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
/**
 * @route   GET /api/v1/points/config
 * @desc    Get points system configuration
 * @access  Private
 */
router.get('/config', points_controller_1.default.getPointsConfig);
/**
 * @route   GET /api/v1/points/check-affordability
 * @desc    Check if user can afford an action
 * @access  Private
 * @query   action (match|game), targetId
 */
router.get('/check-affordability', points_controller_1.default.checkAffordability);
/**
 * @route   PUT /api/v1/points/username
 * @desc    Set or update points username
 * @access  Private
 * @body    { username: string }
 */
router.put('/username', points_controller_1.default.setPointsUsername);
/**
 * @route   GET /api/v1/points/username/check
 * @desc    Check if username is available
 * @access  Private
 * @query   username
 */
router.get('/username/check', points_controller_1.default.checkUsernameAvailability);
/**
 * @route   GET /api/v1/points/username/search
 * @desc    Search user by points username
 * @access  Private
 * @query   username
 */
router.get('/username/search', points_controller_1.default.searchByUsername);
/**
 * @route   POST /api/v1/points/gift
 * @desc    Gift points to user by username
 * @access  Private (Verified users only)
 * @body    { username: string, amount: number, message: string }
 */
router.post('/gift', points_controller_1.default.giftPoints);
/**
 * @route   POST /api/v1/points/purchase
 * @desc    Request to purchase points (pending admin approval)
 * @access  Private
 * @body    { packageId: string, amount: number, pointsAmount: number, label?: string }
 */
router.post('/purchase', points_controller_1.default.requestPurchase);
/**
 * @route   POST /api/v1/points/verify-payment
 * @desc    Verify Paystack payment after checkout
 * @access  Private
 */
router.post('/verify-payment', points_controller_1.default.verifyPayment);
/**
 * @route   GET /api/v1/points/purchases
 * @desc    Get user's purchase history
 * @access  Private
 */
router.get('/purchases', points_controller_1.default.getPurchaseHistory);
/**
 * @route   GET /api/v1/points/referral
 * @desc    Get referral code and stats
 * @access  Private
 */
router.get('/referral', points_controller_1.default.getReferralStats);
/**
 * @route   POST /api/v1/points/referral/apply
 * @desc    Apply a referral code
 * @access  Private
 * @body    { code: string }
 */
router.post('/referral/apply', points_controller_1.default.applyReferralCode);
exports.default = router;
//# sourceMappingURL=points.routes.js.map