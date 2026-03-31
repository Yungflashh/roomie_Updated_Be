"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const UserActivity_1 = require("../models/UserActivity");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// Record a session heartbeat (call every 60s from frontend)
router.post('/heartbeat', async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false });
            return;
        }
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const activity = await UserActivity_1.UserActivity.findOneAndUpdate({ user: userId, date: today }, {
            $inc: { totalSeconds: 60 },
            $set: { lastSessionStart: new Date() },
            $setOnInsert: { sessions: 1 },
        }, { upsert: true, new: true });
        res.json({ success: true, data: { totalSeconds: activity.totalSeconds } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// Record session start
router.post('/session-start', async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false });
            return;
        }
        const today = new Date().toISOString().slice(0, 10);
        await UserActivity_1.UserActivity.findOneAndUpdate({ user: userId, date: today }, {
            $inc: { sessions: 1 },
            $set: { lastSessionStart: new Date() },
        }, { upsert: true });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=activity.routes.js.map