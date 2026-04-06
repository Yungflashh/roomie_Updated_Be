import { RoommateReview, IRoommateReviewDocument, Match } from '../models';
import logger from '../utils/logger';

class RoommateReviewService {
  /**
   * Create a roommate review. Reviewer and reviewee must share an active match.
   */
  async createReview(
    reviewerId: string,
    revieweeId: string,
    data: {
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
    }
  ): Promise<IRoommateReviewDocument> {
    if (reviewerId === revieweeId) {
      throw new Error('You cannot review yourself');
    }

    // Verify the two users share a match
    const match = await Match.findOne({
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
    const existing = await RoommateReview.findOne({ reviewer: reviewerId, reviewee: revieweeId });
    if (existing) {
      throw new Error('You have already reviewed this user');
    }

    const review = await RoommateReview.create({
      reviewer: reviewerId,
      reviewee: revieweeId,
      match: match._id,
      overallRating: data.overallRating,
      categories: data.categories || {},
      comment: data.comment,
      wouldRecommend: data.wouldRecommend,
      livedTogetherMonths: data.livedTogetherMonths,
    });

    logger.info(`Roommate review created by ${reviewerId} for ${revieweeId}`);
    return review;
  }

  /**
   * Get all visible reviews for a user, plus computed averages.
   */
  async getReviewsForUser(userId: string): Promise<{
    reviews: IRoommateReviewDocument[];
    averageRating: number;
    categoryAverages: Record<string, number>;
    totalReviews: number;
  }> {
    const reviews = await RoommateReview.find({ reviewee: userId, isVisible: true })
      .populate('reviewer', 'firstName lastName profilePhoto')
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;

    const averageRating =
      totalReviews > 0
        ? Math.round((reviews.reduce((sum, r) => sum + r.overallRating, 0) / totalReviews) * 10) / 10
        : 0;

    const categoryKeys = ['cleanliness', 'communication', 'reliability', 'respectfulness', 'noiseLevel'] as const;
    const categoryAverages: Record<string, number> = {};

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
  async getMyPendingReviews(userId: string): Promise<any[]> {
    // Find all active matches for this user
    const matches = await Match.find({
      $or: [{ user1: userId }, { user2: userId }],
      status: 'active',
    })
      .populate('user1', 'firstName lastName profilePhoto')
      .populate('user2', 'firstName lastName profilePhoto');

    const pending = [];
    for (const match of matches) {
      const otherUserId =
        match.user1._id.toString() === userId ? match.user2._id.toString() : match.user1._id.toString();

      const existingReview = await RoommateReview.findOne({ reviewer: userId, reviewee: otherUserId });
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
  async updateReview(
    reviewerId: string,
    reviewId: string,
    data: Partial<{
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
    }>
  ): Promise<IRoommateReviewDocument> {
    const review = await RoommateReview.findById(reviewId);
    if (!review) throw new Error('Review not found');
    if (review.reviewer.toString() !== reviewerId) throw new Error('Unauthorized');

    if (data.overallRating != null) review.overallRating = data.overallRating;
    if (data.categories) review.categories = { ...review.categories, ...data.categories } as any;
    if (data.comment != null) review.comment = data.comment;
    if (data.wouldRecommend != null) review.wouldRecommend = data.wouldRecommend;
    if (data.livedTogetherMonths != null) review.livedTogetherMonths = data.livedTogetherMonths;

    await review.save();
    logger.info(`Roommate review ${reviewId} updated by ${reviewerId}`);
    return review;
  }

  /**
   * Delete own review.
   */
  async deleteReview(reviewerId: string, reviewId: string): Promise<void> {
    const review = await RoommateReview.findById(reviewId);
    if (!review) throw new Error('Review not found');
    if (review.reviewer.toString() !== reviewerId) throw new Error('Unauthorized');

    await RoommateReview.findByIdAndDelete(reviewId);
    logger.info(`Roommate review ${reviewId} deleted by ${reviewerId}`);
  }
}

export default new RoommateReviewService();
