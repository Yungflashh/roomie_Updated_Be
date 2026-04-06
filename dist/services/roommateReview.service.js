"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const logger_1 = __importDefault(require("../utils/logger"));
class RoommateReviewService {
    /**
     * Create a roommate review. Reviewer and reviewee must share an active match.
     */
    async createReview(reviewerId, revieweeId, data) {
        if (reviewerId === revieweeId) {
            throw new Error('You cannot review yourself');
        }
        // Verify the two users share a match
        const match = await models_1.Match.findOne({
            $or: [
                { user1: reviewerId, user2: revieweeId },
                { user1: revieweeId, user2: reviewerId },
            ],
            status: 'active',
        });
        if (!match) {
            throw new Error('You can only review someone you have an active match with');
        }
        // Check for existing review (unique index will also catch this)
        const existing = await models_1.RoommateReview.findOne({ reviewer: reviewerId, reviewee: revieweeId });
        if (existing) {
            throw new Error('You have already reviewed this user');
        }
        const review = await models_1.RoommateReview.create({
            reviewer: reviewerId,
            reviewee: revieweeId,
            match: match._id,
            overallRating: data.overallRating,
            categories: data.categories || {},
            comment: data.comment,
            wouldRecommend: data.wouldRecommend,
            livedTogetherMonths: data.livedTogetherMonths,
        });
        logger_1.default.info(`Roommate review created by ${reviewerId} for ${revieweeId}`);
        return review;
    }
    /**
     * Get all visible reviews for a user, plus computed averages.
     */
    async getReviewsForUser(userId) {
        const reviews = await models_1.RoommateReview.find({ reviewee: userId, isVisible: true })
            .populate('reviewer', 'firstName lastName profilePhoto')
            .sort({ createdAt: -1 });
        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0
            ? Math.round((reviews.reduce((sum, r) => sum + r.overallRating, 0) / totalReviews) * 10) / 10
            : 0;
        const categoryKeys = ['cleanliness', 'communication', 'reliability', 'respectfulness', 'noiseLevel'];
        const categoryAverages = {};
        for (const key of categoryKeys) {
            const rated = reviews.filter((r) => r.categories?.[key] != null);
            categoryAverages[key] =
                rated.length > 0
                    ? Math.round((rated.reduce((sum, r) => sum + (r.categories[key] || 0), 0) / rated.length) * 10) / 10
                    : 0;
        }
        return { reviews, averageRating, categoryAverages, totalReviews };
    }
    /**
     * Get matched users that the caller has not yet reviewed.
     */
    async getMyPendingReviews(userId) {
        // Find all active matches for this user
        const matches = await models_1.Match.find({
            $or: [{ user1: userId }, { user2: userId }],
            status: 'active',
        })
            .populate('user1', 'firstName lastName profilePhoto')
            .populate('user2', 'firstName lastName profilePhoto');
        const pending = [];
        for (const match of matches) {
            const otherUserId = match.user1._id.toString() === userId ? match.user2._id.toString() : match.user1._id.toString();
            const existingReview = await models_1.RoommateReview.findOne({ reviewer: userId, reviewee: otherUserId });
            if (!existingReview) {
                const otherUser = match.user1._id.toString() === userId ? match.user2 : match.user1;
                pending.push({
                    matchId: match._id,
                    user: otherUser,
                    matchedAt: match.matchedAt,
                });
            }
        }
        return pending;
    }
    /**
     * Update own review.
     */
    async updateReview(reviewerId, reviewId, data) {
        const review = await models_1.RoommateReview.findById(reviewId);
        if (!review)
            throw new Error('Review not found');
        if (review.reviewer.toString() !== reviewerId)
            throw new Error('Unauthorized');
        if (data.overallRating != null)
            review.overallRating = data.overallRating;
        if (data.categories)
            review.categories = { ...review.categories, ...data.categories };
        if (data.comment != null)
            review.comment = data.comment;
        if (data.wouldRecommend != null)
            review.wouldRecommend = data.wouldRecommend;
        if (data.livedTogetherMonths != null)
            review.livedTogetherMonths = data.livedTogetherMonths;
        await review.save();
        logger_1.default.info(`Roommate review ${reviewId} updated by ${reviewerId}`);
        return review;
    }
    /**
     * Delete own review.
     */
    async deleteReview(reviewerId, reviewId) {
        const review = await models_1.RoommateReview.findById(reviewId);
        if (!review)
            throw new Error('Review not found');
        if (review.reviewer.toString() !== reviewerId)
            throw new Error('Unauthorized');
        await models_1.RoommateReview.findByIdAndDelete(reviewId);
        logger_1.default.info(`Roommate review ${reviewId} deleted by ${reviewerId}`);
    }
}
exports.default = new RoommateReviewService();
//# sourceMappingURL=roommateReview.service.js.map