"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const logger_1 = __importDefault(require("../utils/logger"));
class ReviewService {
    /**
     * Create a review (only after move-in date has passed)
     */
    async createReview(reviewerId, data) {
        const agreement = await models_1.RentalAgreement.findById(data.rentalAgreementId);
        if (!agreement)
            throw new Error('Rental agreement not found');
        if (agreement.status !== 'active' && agreement.status !== 'terminated') {
            throw new Error('Agreement must be active to leave a review');
        }
        if (new Date() < new Date(agreement.terms.moveInDate)) {
            throw new Error('Can only review after move-in date');
        }
        const isLandlord = agreement.landlord.user.toString() === reviewerId;
        const isTenant = agreement.tenant.user.toString() === reviewerId;
        if (!isLandlord && !isTenant)
            throw new Error('Unauthorized');
        const revieweeId = isLandlord ? agreement.tenant.user : agreement.landlord.user;
        const review = await models_1.Review.create({
            reviewer: reviewerId,
            reviewee: revieweeId,
            rentalAgreement: data.rentalAgreementId,
            property: agreement.property,
            role: isLandlord ? 'landlord' : 'tenant',
            rating: data.rating,
            comment: data.comment,
            categories: data.categories || {},
        });
        logger_1.default.info(`Review created by ${reviewerId} for agreement ${data.rentalAgreementId}`);
        return review;
    }
    /**
     * Get reviews for a user
     */
    async getUserReviews(userId) {
        const reviews = await models_1.Review.find({ reviewee: userId, isVisible: true })
            .populate('reviewer', 'firstName lastName profilePhoto')
            .populate('property', 'title photos')
            .sort({ createdAt: -1 });
        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
            : 0;
        return { reviews, averageRating: Math.round(averageRating * 10) / 10, totalReviews };
    }
    /**
     * Get reviews for a property
     */
    async getPropertyReviews(propertyId) {
        return models_1.Review.find({ property: propertyId, isVisible: true })
            .populate('reviewer', 'firstName lastName profilePhoto')
            .sort({ createdAt: -1 });
    }
    /**
     * Get pending reviews (agreements past move-in, not yet reviewed by this user)
     */
    async getPendingReviews(userId) {
        const agreements = await models_1.RentalAgreement.find({
            $or: [{ 'landlord.user': userId }, { 'tenant.user': userId }],
            status: { $in: ['active', 'terminated'] },
            'terms.moveInDate': { $lte: new Date() },
        })
            .populate('landlord.user', 'firstName lastName profilePhoto')
            .populate('tenant.user', 'firstName lastName profilePhoto')
            .populate('property', 'title photos');
        const pending = [];
        for (const agreement of agreements) {
            const existingReview = await models_1.Review.findOne({ reviewer: userId, rentalAgreement: agreement._id });
            if (!existingReview) {
                pending.push(agreement);
            }
        }
        return pending;
    }
    /**
     * Toggle review visibility (admin)
     */
    async toggleVisibility(reviewId) {
        const review = await models_1.Review.findById(reviewId);
        if (!review)
            throw new Error('Review not found');
        review.isVisible = !review.isVisible;
        await review.save();
        return review;
    }
}
exports.default = new ReviewService();
//# sourceMappingURL=review.service.js.map