"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const review_service_1 = __importDefault(require("../services/review.service"));
const logger_1 = __importDefault(require("../utils/logger"));
class ReviewController {
    async create(req, res) {
        try {
            const review = await review_service_1.default.createReview(req.user?.userId, req.body);
            res.status(201).json({ success: true, data: review });
        }
        catch (error) {
            logger_1.default.error('Create review error:', error);
            const code = error.message.includes('Unauthorized') ? 403 : 400;
            res.status(code).json({ success: false, message: error.message });
        }
    }
    async getUserReviews(req, res) {
        try {
            const result = await review_service_1.default.getUserReviews(req.params.userId);
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async getPropertyReviews(req, res) {
        try {
            const reviews = await review_service_1.default.getPropertyReviews(req.params.propertyId);
            res.json({ success: true, data: reviews });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async getPendingReviews(req, res) {
        try {
            const pending = await review_service_1.default.getPendingReviews(req.user?.userId);
            res.json({ success: true, data: pending });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async toggleVisibility(req, res) {
        try {
            const review = await review_service_1.default.toggleVisibility(req.params.reviewId);
            res.json({ success: true, data: review });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}
exports.default = new ReviewController();
//# sourceMappingURL=review.controller.js.map