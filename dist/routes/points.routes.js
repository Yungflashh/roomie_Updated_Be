"use strict";
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
exports.default = router;
//# sourceMappingURL=points.routes.js.map