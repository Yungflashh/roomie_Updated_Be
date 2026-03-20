"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const studyBuddy_service_1 = __importDefault(require("../services/studyBuddy.service"));
const logger_1 = __importDefault(require("../utils/logger"));
class StudyBuddyController {
    /**
     * Get all study categories
     * GET /api/v1/study-buddy
     */
    async getCategories(req, res) {
        try {
            const categories = studyBuddy_service_1.default.getCategories();
            res.status(200).json({
                success: true,
                data: { categories },
            });
        }
        catch (error) {
            logger_1.default.error('Get categories error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get categories',
            });
        }
    }
    /**
     * Find study buddies by category
     * GET /api/v1/study-buddy/buddies?category=computer-science
     */
    async findBuddies(req, res) {
        try {
            const userId = req.user?.userId;
            const { category } = req.query;
            if (!category) {
                res.status(400).json({
                    success: false,
                    message: 'Category is required',
                });
                return;
            }
            const buddies = await studyBuddy_service_1.default.findStudyBuddies(userId, category);
            res.status(200).json({
                success: true,
                data: { buddies },
            });
        }
        catch (error) {
            logger_1.default.error('Find buddies error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to find study buddies',
            });
        }
    }
    /**
     * Create a solo study session
     * POST /api/v1/study-buddy/sessions/solo
     */
    async createSoloSession(req, res) {
        try {
            const userId = req.user?.userId;
            const { category, questionCount } = req.body;
            if (!category) {
                res.status(400).json({
                    success: false,
                    message: 'Category is required',
                });
                return;
            }
            const session = await studyBuddy_service_1.default.createSoloSession(userId, category, questionCount || 10);
            res.status(201).json({
                success: true,
                data: { session },
            });
        }
        catch (error) {
            logger_1.default.error('Create solo session error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to create solo session',
            });
        }
    }
    /**
     * Create a challenge session
     * POST /api/v1/study-buddy/sessions/challenge
     */
    async createChallengeSession(req, res) {
        try {
            const userId = req.user?.userId;
            const { opponentId, category, questionCount } = req.body;
            if (!opponentId || !category) {
                res.status(400).json({
                    success: false,
                    message: 'Opponent ID and category are required',
                });
                return;
            }
            const session = await studyBuddy_service_1.default.createChallengeSession(userId, opponentId, category, questionCount || 10);
            res.status(201).json({
                success: true,
                data: { session },
            });
        }
        catch (error) {
            logger_1.default.error('Create challenge session error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to create challenge session',
            });
        }
    }
    /**
     * Respond to a challenge
     * POST /api/v1/study-buddy/sessions/:sessionId/respond
     */
    async respondToChallenge(req, res) {
        try {
            const userId = req.user?.userId;
            const { sessionId } = req.params;
            const { accept } = req.body;
            if (typeof accept !== 'boolean') {
                res.status(400).json({
                    success: false,
                    message: 'Accept (boolean) is required',
                });
                return;
            }
            const session = await studyBuddy_service_1.default.respondToChallenge(sessionId, userId, accept);
            res.status(200).json({
                success: true,
                data: { session },
            });
        }
        catch (error) {
            logger_1.default.error('Respond to challenge error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to respond to challenge',
            });
        }
    }
    /**
     * Submit answers for a session
     * POST /api/v1/study-buddy/sessions/:sessionId/submit
     */
    async submitAnswers(req, res) {
        try {
            const userId = req.user?.userId;
            const { sessionId } = req.params;
            const { answers } = req.body;
            if (!answers || !Array.isArray(answers)) {
                res.status(400).json({
                    success: false,
                    message: 'Answers array is required',
                });
                return;
            }
            const session = await studyBuddy_service_1.default.submitAnswers(sessionId, userId, answers);
            res.status(200).json({
                success: true,
                data: { session },
            });
        }
        catch (error) {
            logger_1.default.error('Submit answers error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to submit answers',
            });
        }
    }
    /**
     * Get a session by ID
     * GET /api/v1/study-buddy/sessions/:sessionId
     */
    async getSession(req, res) {
        try {
            const { sessionId } = req.params;
            const session = await studyBuddy_service_1.default.getSession(sessionId);
            res.status(200).json({
                success: true,
                data: { session },
            });
        }
        catch (error) {
            logger_1.default.error('Get session error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get session',
            });
        }
    }
    /**
     * Get user's session history
     * GET /api/v1/study-buddy/history?page=1&limit=20
     */
    async getUserHistory(req, res) {
        try {
            const userId = req.user?.userId;
            const { page = 1, limit = 20 } = req.query;
            const result = await studyBuddy_service_1.default.getUserHistory(userId, parseInt(page), parseInt(limit));
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            logger_1.default.error('Get user history error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get history',
            });
        }
    }
    /**
     * Get leaderboard
     * GET /api/v1/study-buddy/leaderboard?category=computer-science&limit=20
     */
    async getLeaderboard(req, res) {
        try {
            const { category = 'all', limit = 20 } = req.query;
            const leaderboard = await studyBuddy_service_1.default.getLeaderboard(category, parseInt(limit));
            res.status(200).json({
                success: true,
                data: { leaderboard },
            });
        }
        catch (error) {
            logger_1.default.error('Get leaderboard error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get leaderboard',
            });
        }
    }
}
exports.default = new StudyBuddyController();
//# sourceMappingURL=studyBuddy.controller.js.map