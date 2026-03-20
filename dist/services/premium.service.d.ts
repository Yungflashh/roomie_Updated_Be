import { IUserDocument } from '../models';
export declare const FREE_LIMITS: {
    dailySwipes: number;
    listingInquiriesPerMonth: number;
    maxPhotos: number;
    maxListingPhotos: number;
    maxListingVideos: number;
    maxRoommateGroups: number;
    canSeeWhoLiked: boolean;
    canRewind: boolean;
    canBoost: boolean;
    readReceipts: boolean;
    profileVisitors: boolean;
    listingAnalytics: boolean;
    priorityInDiscovery: boolean;
    featuredListings: boolean;
    priorityApproval: boolean;
    dailyBonusMultiplier: number;
    matchCostMultiplier: number;
    monthlyBonusPoints: number;
};
export declare const PREMIUM_LIMITS: {
    dailySwipes: number;
    listingInquiriesPerMonth: number;
    maxPhotos: number;
    maxListingPhotos: number;
    maxListingVideos: number;
    maxRoommateGroups: number;
    canSeeWhoLiked: boolean;
    canRewind: boolean;
    canBoost: boolean;
    readReceipts: boolean;
    profileVisitors: boolean;
    listingAnalytics: boolean;
    priorityInDiscovery: boolean;
    featuredListings: boolean;
    priorityApproval: boolean;
    dailyBonusMultiplier: number;
    matchCostMultiplier: number;
    monthlyBonusPoints: number;
};
export declare const PRO_LIMITS: {
    dailyBonusMultiplier: number;
    matchCostMultiplier: number;
    monthlyBonusPoints: number;
    dailySwipes: number;
    listingInquiriesPerMonth: number;
    maxPhotos: number;
    maxListingPhotos: number;
    maxListingVideos: number;
    maxRoommateGroups: number;
    canSeeWhoLiked: boolean;
    canRewind: boolean;
    canBoost: boolean;
    readReceipts: boolean;
    profileVisitors: boolean;
    listingAnalytics: boolean;
    priorityInDiscovery: boolean;
    featuredListings: boolean;
    priorityApproval: boolean;
};
declare class PremiumService {
    /**
     * Check if user has active premium/pro subscription
     */
    isPremium(user: any): boolean;
    /**
     * Get the plan name
     */
    getPlan(user: any): 'free' | 'premium' | 'pro';
    /**
     * Get limits for user's plan
     */
    getLimits(user: any): {
        dailySwipes: number;
        listingInquiriesPerMonth: number;
        maxPhotos: number;
        maxListingPhotos: number;
        maxListingVideos: number;
        maxRoommateGroups: number;
        canSeeWhoLiked: boolean;
        canRewind: boolean;
        canBoost: boolean;
        readReceipts: boolean;
        profileVisitors: boolean;
        listingAnalytics: boolean;
        priorityInDiscovery: boolean;
        featuredListings: boolean;
        priorityApproval: boolean;
        dailyBonusMultiplier: number;
        matchCostMultiplier: number;
        monthlyBonusPoints: number;
    };
    /**
     * Check daily swipe count
     */
    checkSwipeLimit(userId: string): Promise<{
        allowed: boolean;
        remaining: number;
        limit: number;
    }>;
    /**
     * Increment daily swipe count
     */
    incrementSwipeCount(userId: string): Promise<void>;
    /**
     * Reset daily swipe count if new day
     */
    resetDailySwipesIfNeeded(userId: string): Promise<void>;
    /**
     * Activate subscription
     */
    activateSubscription(userId: string, plan: 'premium' | 'pro', durationMonths?: number): Promise<IUserDocument>;
    /**
     * Cancel subscription (keeps active until end date)
     */
    cancelSubscription(userId: string): Promise<IUserDocument>;
    /**
     * Get premium status summary for user
     */
    getPremiumStatus(userId: string): Promise<{
        plan: "free" | "premium" | "pro";
        isPremium: boolean;
        startDate: Date | undefined;
        endDate: Date | undefined;
        autoRenew: boolean;
        limits: {
            dailySwipes: number;
            listingInquiriesPerMonth: number;
            maxPhotos: number;
            maxListingPhotos: number;
            maxListingVideos: number;
            maxRoommateGroups: number;
            canSeeWhoLiked: boolean;
            canRewind: boolean;
            canBoost: boolean;
            readReceipts: boolean;
            profileVisitors: boolean;
            listingAnalytics: boolean;
            priorityInDiscovery: boolean;
            featuredListings: boolean;
            priorityApproval: boolean;
            dailyBonusMultiplier: number;
            matchCostMultiplier: number;
            monthlyBonusPoints: number;
        };
        features: {
            unlimitedSwipes: boolean;
            seeWhoLiked: boolean;
            rewind: boolean;
            boost: boolean;
            readReceipts: boolean;
            profileVisitors: boolean;
            listingAnalytics: boolean;
            priorityDiscovery: boolean;
            featuredListings: boolean;
            dailyBonusMultiplier: number;
            matchCostDiscount: number;
            monthlyBonusPoints: number;
            maxPhotos: number;
            maxListingPhotos: number;
        };
    }>;
    /**
     * Boost profile (premium only) — adds boost timestamp
     */
    boostProfile(userId: string): Promise<void>;
    /**
     * Record profile visit
     */
    recordProfileVisit(visitorId: string, profileId: string): Promise<boolean>;
    /**
     * Get profile visitors (premium only)
     */
    getProfileVisitors(userId: string): Promise<any[]>;
}
declare const _default: PremiumService;
export default _default;
//# sourceMappingURL=premium.service.d.ts.map