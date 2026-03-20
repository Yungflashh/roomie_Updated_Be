"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRO_LIMITS = exports.PREMIUM_LIMITS = exports.FREE_LIMITS = void 0;
const models_1 = require("../models");
const logger_1 = __importDefault(require("../utils/logger"));
// Premium limits config
exports.FREE_LIMITS = {
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
exports.PREMIUM_LIMITS = {
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
exports.PRO_LIMITS = {
    ...exports.PREMIUM_LIMITS,
    dailyBonusMultiplier: 3,
    matchCostMultiplier: 0.3,
    monthlyBonusPoints: 1500,
};
class PremiumService {
    /**
     * Check if user has active premium/pro subscription
     */
    isPremium(user) {
        if (!user?.subscription)
            return false;
        if (user.subscription.plan === 'free')
            return false;
        if (user.subscription.endDate && new Date(user.subscription.endDate) < new Date())
            return false;
        return true;
    }
    /**
     * Get the plan name
     */
    getPlan(user) {
        if (!this.isPremium(user))
            return 'free';
        return user.subscription.plan;
    }
    /**
     * Get limits for user's plan
     */
    getLimits(user) {
        const plan = this.getPlan(user);
        switch (plan) {
            case 'pro': return exports.PRO_LIMITS;
            case 'premium': return exports.PREMIUM_LIMITS;
            default: return exports.FREE_LIMITS;
        }
    }
    /**
     * Check daily swipe count
     */
    async checkSwipeLimit(userId) {
        const user = await models_1.User.findById(userId);
        if (!user)
            throw new Error('User not found');
        const limits = this.getLimits(user);
        if (limits.dailySwipes === Infinity)
            return { allowed: true, remaining: Infinity, limit: Infinity };
        // Count today's swipes (likes + passes)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const swipeCount = (user.likes || []).length; // Simplified — in production, track daily swipes separately
        const dailySwipeKey = `swipes:${userId}:${today.toISOString().split('T')[0]}`;
        // Use a simple in-memory approach via user metadata
        const todaySwipes = user.dailySwipeCount || 0;
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
    async incrementSwipeCount(userId) {
        await models_1.User.findByIdAndUpdate(userId, {
            $inc: { 'metadata.dailySwipeCount': 1 },
            $set: { 'metadata.lastSwipeDate': new Date().toISOString().split('T')[0] },
        });
    }
    /**
     * Reset daily swipe count if new day
     */
    async resetDailySwipesIfNeeded(userId) {
        const user = await models_1.User.findById(userId);
        if (!user)
            return;
        const today = new Date().toISOString().split('T')[0];
        if (user.metadata?.lastSwipeDate !== today) {
            await models_1.User.findByIdAndUpdate(userId, {
                $set: { 'metadata.dailySwipeCount': 0, 'metadata.lastSwipeDate': today },
            });
        }
    }
    /**
     * Activate subscription
     */
    async activateSubscription(userId, plan, durationMonths = 1) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + durationMonths);
        const user = await models_1.User.findByIdAndUpdate(userId, {
            $set: {
                'subscription.plan': plan,
                'subscription.startDate': startDate,
                'subscription.endDate': endDate,
                'subscription.autoRenew': true,
            },
        }, { new: true });
        if (!user)
            throw new Error('User not found');
        logger_1.default.info(`Subscription activated: ${userId} -> ${plan} (${durationMonths} months)`);
        return user;
    }
    /**
     * Cancel subscription (keeps active until end date)
     */
    async cancelSubscription(userId) {
        const user = await models_1.User.findByIdAndUpdate(userId, { $set: { 'subscription.autoRenew': false } }, { new: true });
        if (!user)
            throw new Error('User not found');
        logger_1.default.info(`Subscription auto-renew cancelled: ${userId}`);
        return user;
    }
    /**
     * Get premium status summary for user
     */
    async getPremiumStatus(userId) {
        const user = await models_1.User.findById(userId);
        if (!user)
            throw new Error('User not found');
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
    async boostProfile(userId) {
        const user = await models_1.User.findById(userId);
        if (!user)
            throw new Error('User not found');
        if (!this.isPremium(user))
            throw new Error('Premium subscription required');
        // Check if already boosted today
        const lastBoost = user.metadata?.lastBoostAt;
        if (lastBoost) {
            const today = new Date().toDateString();
            const lastBoostDay = new Date(lastBoost).toDateString();
            if (today === lastBoostDay) {
                throw new Error('You can only boost once per day. Try again tomorrow!');
            }
        }
        await models_1.User.findByIdAndUpdate(userId, {
            $set: { 'metadata.lastBoostAt': new Date() },
        });
        logger_1.default.info(`Profile boosted: ${userId}`);
    }
    /**
     * Record profile visit
     */
    async recordProfileVisit(visitorId, profileId) {
        if (visitorId === profileId)
            return false;
        // Check if this visitor already visited within the last 3 days
        const profileUser = await models_1.User.findById(profileId);
        if (profileUser) {
            const visitors = profileUser.metadata?.profileVisitors || [];
            const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
            const recentVisit = visitors.find((v) => v.userId?.toString() === visitorId && new Date(v.visitedAt) > threeDaysAgo);
            if (recentVisit)
                return false; // Already visited recently, skip
        }
        await models_1.User.findByIdAndUpdate(profileId, {
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
    async getProfileVisitors(userId) {
        const user = await models_1.User.findById(userId);
        if (!user)
            throw new Error('User not found');
        if (!this.isPremium(user))
            throw new Error('Premium subscription required');
        const visitors = user.metadata?.profileVisitors || [];
        const visitorIds = visitors.map((v) => v.userId);
        const users = await models_1.User.find({ _id: { $in: visitorIds } })
            .select('firstName lastName profilePhoto verified subscription')
            .lean();
        return visitors.reverse().map((v) => {
            const visitor = users.find((u) => u._id.toString() === v.userId.toString());
            return {
                ...visitor,
                visitedAt: v.visitedAt,
            };
        });
    }
}
exports.default = new PremiumService();
//# sourceMappingURL=premium.service.js.map