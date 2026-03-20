import { IReviewDocument } from '../models';
declare class ReviewService {
    /**
     * Create a review (only after move-in date has passed)
     */
    createReview(reviewerId: string, data: {
        rentalAgreementId: string;
        rating: number;
        comment?: string;
        categories?: {
            communication?: number;
            cleanliness?: number;
            reliability?: number;
            respectfulness?: number;
        };
    }): Promise<IReviewDocument>;
    /**
     * Get reviews for a user
     */
    getUserReviews(userId: string): Promise<{
        reviews: IReviewDocument[];
        averageRating: number;
        totalReviews: number;
    }>;
    /**
     * Get reviews for a property
     */
    getPropertyReviews(propertyId: string): Promise<IReviewDocument[]>;
    /**
     * Get pending reviews (agreements past move-in, not yet reviewed by this user)
     */
    getPendingReviews(userId: string): Promise<any[]>;
    /**
     * Toggle review visibility (admin)
     */
    toggleVisibility(reviewId: string): Promise<IReviewDocument>;
}
declare const _default: ReviewService;
export default _default;
//# sourceMappingURL=review.service.d.ts.map