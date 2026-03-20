"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const weeklyChallenge_service_1 = __importDefault(require("../services/weeklyChallenge.service"));
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// Get active challenges
router.get('/active', async (req, res) => {
    try {
        const challenges = await weeklyChallenge_service_1.default.getActiveChallenges(req.user?.userId);
        res.json({ success: true, data: challenges });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// Join a challenge
router.post('/:challengeId/join', async (req, res) => {
    try {
        await weeklyChallenge_service_1.default.joinChallenge(req.params.challengeId, req.user?.userId);
        res.json({ success: true, message: 'Joined challenge!' });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
// Get weekly leaderboard
router.get('/leaderboard', async (req, res) => {
    try {
        const leaderboard = await weeklyChallenge_service_1.default.getWeeklyLeaderboard(50);
        res.json({ success: true, data: leaderboard });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=weeklyChallenge.routes.js.map