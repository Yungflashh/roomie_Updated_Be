"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const challenge_controller_1 = __importDefault(require("../controllers/challenge.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
/**
 * @route   GET /api/v1/challenges
 * @desc    Get active challenges
 * @access  Private
 */
router.get('/', challenge_controller_1.default.getActiveChallenges);
/**
 * @route   GET /api/v1/challenges/active
 * @desc    Get active challenges (alias)
 * @access  Private
 */
router.get('/active', challenge_controller_1.default.getActiveChallenges);
/**
 * @route   GET /api/v1/challenges/leaderboard
 * @desc    Get global leaderboard
 * @access  Private
 */
router.get('/leaderboard', challenge_controller_1.default.getGlobalLeaderboard);
/**
 * @route   GET /api/v1/challenges/my-challenges
 * @desc    Get user's challenges
 * @access  Private
 */
router.get('/my-challenges', challenge_controller_1.default.getUserChallenges);
/**
 * @route   GET /api/v1/challenges/:challengeId
 * @desc    Get challenge details
 * @access  Private
 */
router.get('/:challengeId', challenge_controller_1.default.getChallenge);
/**
 * @route   POST /api/v1/challenges/:challengeId/join
 * @desc    Join a challenge
 * @access  Private
 */
router.post('/:challengeId/join', challenge_controller_1.default.joinChallenge);
/**
 * @route   PUT /api/v1/challenges/:challengeId/progress
 * @desc    Update challenge progress
 * @access  Private
 */
router.put('/:challengeId/progress', challenge_controller_1.default.updateProgress);
/**
 * @route   GET /api/v1/challenges/:challengeId/leaderboard
 * @desc    Get challenge leaderboard
 * @access  Private
 */
router.get('/:challengeId/leaderboard', challenge_controller_1.default.getChallengeLeaderboard);
exports.default = router;
//# sourceMappingURL=challenge.routes.js.map