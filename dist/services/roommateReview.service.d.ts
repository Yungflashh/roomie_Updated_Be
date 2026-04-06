import { IRoommateReviewDocument } from '../models';
declare class RoommateReviewService {
    /**
     * Create a roommate review. Reviewer and reviewee must share an active match.
     */
    createReview(reviewerId: string, revieweeId: string, data: {
        overallRating: number;
        categories?: {
            cleanliness?: number;
            communication?: number;
            reliability?: number;
            respectfulness?: number;
            noiseLevel?: number;
        };
        comment?: string;
        wouldRecommend?: boolean;
        livedTogetherMonths?: number;
    }): Promise<IRoommateReviewDocument>;
    /**
     * Get all visible reviews for a user, plus computed averages.
     */
    getReviewsForUser(userId: string): Promise<{
        reviews: IRoommateReviewDocument[];
        averageRating: number;
        categoryAverages: Record<string, number>;
        totalReviews: number;
    }>;
    /**
     * Get matched users that the caller has not yet reviewed.
     */
    getMyPendingReviews(userId: string): Promise<any[]>;
    /**
     * Update own review.
     */
    updateReview(reviewerId: string, reviewId: string, data: Partial<{
        overallRating: number;
        categories: {
            cleanliness?: number;
            communication?: number;
            reliability?: number;
            respectfulness?: number;
            noiseLevel?: number;
        };
        comment: string;
        wouldRecommend: boolean;
        livedTogetherMonths: number;
    }>): Promise<IRoommateReviewDocument>;
    /**
     * Delete own review.
     */
    deleteReview(reviewerId: string, reviewId: string): Promise<void>;
}
declare const _default: RoommateReviewService;
export default _default;
//# sourceMappingURL=roommateReview.service.d.ts.map