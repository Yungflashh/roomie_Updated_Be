"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/studyBuddy.routes.ts
const express_1 = require("express");
const studyBuddy_controller_1 = __importDefault(require("../controllers/studyBuddy.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
/**
 * @route   GET /api/v1/study-buddy
 * @desc    Get all study categories
 * @access  Private
 */
router.get('/', studyBuddy_controller_1.default.getCategories);
/**
 * @route   GET /api/v1/study-buddy/buddies
 * @desc    Find study buddies by category
 * @access  Private
 * @query   category
 */
router.get('/buddies', studyBuddy_controller_1.default.findBuddies);
/**
 * @route   POST /api/v1/study-buddy/sessions/solo
 * @desc    Create a solo study session
 * @access  Private
 * @body    { category: string }
 */
router.post('/sessions/solo', studyBuddy_controller_1.default.createSoloSession);
/**
 * @route   POST /api/v1/study-buddy/sessions/challenge
 * @desc    Create a challenge session
 * @access  Private
 * @body    { opponentId: string, category: string }
 */
router.post('/sessions/challenge', studyBuddy_controller_1.default.createChallengeSession);
/**
 * @route   POST /api/v1/study-buddy/sessions/:sessionId/respond
 * @desc    Respond to a challenge invitation
 * @access  Private
 * @body    { accept: boolean }
 */
router.post('/sessions/:sessionId/respond', studyBuddy_controller_1.default.respondToChallenge);
/**
 * @route   POST /api/v1/study-buddy/sessions/:sessionId/submit
 * @desc    Submit answers for a session
 * @access  Private
 * @body    { answers: Array<{ questionIndex, answer, timeSpent }> }
 */
router.post('/sessions/:sessionId/submit', studyBuddy_controller_1.default.submitAnswers);
/**
 * @route   GET /api/v1/study-buddy/sessions/:sessionId
 * @desc    Get a session by ID
 * @access  Private
 */
router.get('/sessions/:sessionId', studyBuddy_controller_1.default.getSession);
/**
 * @route   GET /api/v1/study-buddy/history
 * @desc    Get user's session history
 * @access  Private
 * @query   page, limit
 */
router.get('/history', studyBuddy_controller_1.default.getUserHistory);
/**
 * @route   GET /api/v1/study-buddy/leaderboard
 * @desc    Get leaderboard
 * @access  Private
 * @query   category, limit
 */
router.get('/leaderboard', studyBuddy_controller_1.default.getLeaderboard);
exports.default = router;
//# sourceMappingURL=studyBuddy.routes.js.map