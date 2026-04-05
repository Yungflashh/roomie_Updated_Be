"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const clanCompetition_service_1 = __importDefault(require("../services/clanCompetition.service"));
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// Get current competition status & leaderboard
router.get('/current', async (req, res) => {
    try {
        const data = await clanCompetition_service_1.default.getLeaderboard();
        res.json({ success: true, data });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// Register clan for competition
router.post('/register/:clanId', async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const competition = await clanCompetition_service_1.default.registerClan(req.params.clanId, userId);
        res.json({ success: true, data: { month: competition.month, competitors: competition.competitors.length, prizeTier: competition.prizeTier, status: competition.status } });
    }
    catch (error) {
        const status = error.message.includes('Only') || error.message.includes('needs') ? 400 : 500;
        res.status(status).json({ success: false, message: error.message });
    }
});
// Admin: finalize competition (call at month end via cron)
router.post('/finalize', async (req, res) => {
    try {
        const result = await clanCompetition_service_1.default.finalizeCompetition(req.body.month);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=clanCompetition.routes.js.map