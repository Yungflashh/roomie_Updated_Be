"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const roommateReview_service_1 = __importDefault(require("../services/roommateReview.service"));
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// Create a roommate review
router.post('/', async (req, res) => {
    try {
        const { revieweeId, overallRating, categories, comment, wouldRecommend, livedTogetherMonths } = req.body;
        const review = await roommateReview_service_1.default.createReview(req.user?.userId, revieweeId, {
            overallRating,
            categories,
            comment,
            wouldRecommend,
            livedTogetherMonths,
        });
        res.status(201).json({ success: true, data: review });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
// Get reviews for a specific user
router.get('/user/:userId', async (req, res) => {
    try {
        const result = await roommateReview_service_1.default.getReviewsForUser(req.params.userId);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
// Get my pending reviews (matched users I haven't reviewed yet)
router.get('/pending', async (req, res) => {
    try {
        const pending = await roommateReview_service_1.default.getMyPendingReviews(req.user?.userId);
        res.json({ success: true, data: pending });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
// Update my review
router.put('/:reviewId', async (req, res) => {
    try {
        const review = await roommateReview_service_1.default.updateReview(req.user?.userId, req.params.reviewId, req.body);
        res.json({ success: true, data: review });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
// Delete my review
router.delete('/:reviewId', async (req, res) => {
    try {
        await roommateReview_service_1.default.deleteReview(req.user?.userId, req.params.reviewId);
        res.json({ success: true, message: 'Review deleted' });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=roommateReview.routes.js.map