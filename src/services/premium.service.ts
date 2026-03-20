import { User, IUserDocument } from '../models';
import logger from '../utils/logger';

// Premium limits config
export const FREE_LIMITS = {
  dailySwipes: 20,
  listingInquiriesPerMonth: 10,
  maxPhotos: 5,
  maxListingPhotos: 5,
  maxListingVideos: 1,
  maxRoommateGroups: 1,
  canSeeWhoLiked: false,
  canRewind: false,
  canBoost: false,
  readReceipts: false,
  profileVisitors: false,
  listingAnalytics: false,
  priorityInDiscovery: false,
  featuredListings: false,
  priorityApproval: false,
  dailyBonusMultiplier: 1,
  matchCostMultiplier: 1,
  monthlyBonusPoints: 0,
};

export const PREMIUM_LIMITS = {
  dailySwipes: Infinity,
  listingInquiriesPerMonth: Infinity,
  maxPhotos: 15,
  maxListingPhotos: 15,
  maxListingVideos: 3,
  maxRoommateGroups: Infinity,
  canSeeWhoLiked: true,
  canRewind: true,
  canBoost: true,
  readReceipts: true,
  profileVisitors: true,
  listingAnalytics: true,
  priorityInDiscovery: true,
  featuredListings: true,
  priorityApproval: true,
  dailyBonusMultiplier: 2,
  matchCostMultiplier: 0.5,
  monthlyBonusPoints: 500,
};

export const PRO_LIMITS = {
  ...PREMIUM_LIMITS,
  dailyBonusMultiplier: 3,
  matchCostMultiplier: 0.3,
  monthlyBonusPoints: 1500,
};

class PremiumService {
  /**
   * Check if user has active premium/pro subscription
   */
  isPremium(user: any): boolean {
    if (!user?.subscription) return false;
    if (user.subscription.plan === 'free') return false;
    if (user.subscription.endDate && new Date(user.subscription.endDate) < new Date()) return false;
    return true;
  }

  /**
   * Get the plan name
   */
  getPlan(user: any): 'free' | 'premium' | 'pro' {
    if (!this.isPremium(user)) return 'free';
    return user.subscription.plan;
  }

  /**
   * Get limits for user's plan
   */
  getLimits(user: any) {
    const plan = this.getPlan(user);
    switch (plan) {
      case 'pro': return PRO_LIMITS;
      case 'premium': return PREMIUM_LIMITS;
      default: return FREE_LIMITS;
    }
  }

  /**
   * Check daily swipe count
   */
  async checkSwipeLimit(userId: string): Promise<{ allowed: boolean; remaining: number; limit: number }> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const limits = this.getLimits(user);
    if (limits.dailySwipes === Infinity) return { allowed: true, remaining: Infinity, limit: Infinity };

    // Count today's swipes (likes + passes)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const swipeCount = (user.likes || []).length; // Simplified — in production, track daily swipes separately
    const dailySwipeKey = `swipes:${userId}:${today.toISOString().split('T')[0]}`;

    // Use a simple in-memory approach via user metadata
    const todaySwipes = (user as any).dailySwipeCount || 0;
    const remaining = Math.max(0, limits.dailySwipes - todaySwipes);

    return {
      allowed: remaining > 0,
      remaining,
      limit: limits.dailySwipes,
    };
  }

  /**
   * Increment daily swipe count
   */
  async incrementSwipeCount(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $inc: { 'metadata.dailySwipeCount': 1 },
      $set: { 'metadata.lastSwipeDate': new Date().toISOString().split('T')[0] },
    });
  }

  /**
   * Reset daily swipe count if new day
   */
  async resetDailySwipesIfNeeded(userId: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    if ((user as any).metadata?.lastSwipeDate !== today) {
      await User.findByIdAndUpdate(userId, {
        $set: { 'metadata.dailySwipeCount': 0, 'metadata.lastSwipeDate': today },
      });
    }
  }

  /**
   * Activate subscription
   */
  async activateSubscription(userId: string, plan: 'premium' | 'pro', durationMonths: number = 1): Promise<IUserDocument> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + durationMonths);

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          'subscription.plan': plan,
          'subscription.startDate': startDate,
          'subscription.endDate': endDate,
          'subscription.autoRenew': true,
        },
      },
      { new: true }
    );

    if (!user) throw new Error('User not found');
    logger.info(`Subscription activated: ${userId} -> ${plan} (${durationMonths} months)`);
    return user;
  }

  /**
   * Cancel subscription (keeps active until end date)
   */
  async cancelSubscription(userId: string): Promise<IUserDocument> {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { 'subscription.autoRenew': false } },
      { new: true }
    );
    if (!user) throw new Error('User not found');
    logger.info(`Subscription auto-renew cancelled: ${userId}`);
    return user;
  }

  /**
   * Get premium status summary for user
   */
  async getPremiumStatus(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const plan = this.getPlan(user);
    const limits = this.getLimits(user);
    const isPremium = this.isPremium(user);

    return {
      plan,
      isPremium,
      startDate: user.subscription?.startDate,
      endDate: user.subscription?.endDate,
      autoRenew: user.subscription?.autoRenew,
      limits,
      features: {
        unlimitedSwipes: limits.dailySwipes === Infinity,
        seeWhoLiked: limits.canSeeWhoLiked,
        rewind: limits.canRewind,
        boost: limits.canBoost,
        readReceipts: limits.readReceipts,
        profileVisitors: limits.profileVisitors,
        listingAnalytics: limits.listingAnalytics,
        priorityDiscovery: limits.priorityInDiscovery,
        featuredListings: limits.featuredListings,
        dailyBonusMultiplier: limits.dailyBonusMultiplier,
        matchCostDiscount: Math.round((1 - limits.matchCostMultiplier) * 100),
        monthlyBonusPoints: limits.monthlyBonusPoints,
        maxPhotos: limits.maxPhotos,
        maxListingPhotos: limits.maxListingPhotos,
      },
    };
  }

  /**
   * Boost profile (premium only) — adds boost timestamp
   */
  async boostProfile(userId: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    if (!this.isPremium(user)) throw new Error('Premium subscription required');

    // Check if already boosted today
    const lastBoost = (user as any).metadata?.lastBoostAt;
    if (lastBoost) {
      const today = new Date().toDateString();
      const lastBoostDay = new Date(lastBoost).toDateString();
      if (today === lastBoostDay) {
        throw new Error('You can only boost once per day. Try again tomorrow!');
      }
    }

    await User.findByIdAndUpdate(userId, {
      $set: { 'metadata.lastBoostAt': new Date() },
    });
    logger.info(`Profile boosted: ${userId}`);
  }

  /**
   * Record profile visit
   */
  async recordProfileVisit(visitorId: string, profileId: string): Promise<boolean> {
    if (visitorId === profileId) return false;

    // Check if this visitor already visited within the last 3 days
    const profileUser = await User.findById(profileId);
    if (profileUser) {
      const visitors = (profileUser as any).metadata?.profileVisitors || [];
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const recentVisit = visitors.find((v: any) =>
        v.userId?.toString() === visitorId && new Date(v.visitedAt) > threeDaysAgo
      );
      if (recentVisit) return false; // Already visited recently, skip
    }

    await User.findByIdAndUpdate(profileId, {
      $push: {
        'metadata.profileVisitors': {
          $each: [{ userId: visitorId, visitedAt: new Date() }],
          $slice: -50,
        },
      },
    });
    return true; // New visit recorded
  }

  /**
   * Get profile visitors (premium only)
   */
  async getProfileVisitors(userId: string): Promise<any[]> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    if (!this.isPremium(user)) throw new Error('Premium subscription required');

    const visitors = (user as any).metadata?.profileVisitors || [];
    const visitorIds = visitors.map((v: any) => v.userId);

    const users = await User.find({ _id: { $in: visitorIds } })
      .select('firstName lastName profilePhoto verified subscription')
      .lean();

    return visitors.reverse().map((v: any) => {
      const visitor = users.find((u: any) => u._id.toString() === v.userId.toString());
      return {
        ...visitor,
        visitedAt: v.visitedAt,
      };
    });
  }
}

export default new PremiumService();
