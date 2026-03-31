import { IUserDocument } from '../models/User';
import { IPointsConfigDocument } from '../models/PointsConfig';
interface AddPointsOptions {
    userId: string;
    amount: number;
    type: 'earned' | 'bonus' | 'daily_login' | 'weekly_streak' | 'level_up' | 'verification' | 'game_reward' | 'achievement' | 'refund';
    reason: string;
    metadata?: Record<string, any>;
}
interface DeductPointsOptions {
    userId: string;
    amount: number;
    type: 'spent' | 'penalty' | 'game_entry' | 'match_request' | 'like';
    reason: string;
    metadata?: Record<string, any>;
}
declare class PointsService {
    private configCache;
    private configCacheTime;
    private readonly CACHE_DURATION;
    /**
     * Get active points configuration (with caching)
     */
    getConfig(): Promise<IPointsConfigDocument>;
    /**
     * Calculate level from points
     */
    calculateLevel(points: number, config?: IPointsConfigDocument): number;
    /**
     * Calculate points needed for next level
     */
    calculatePointsForNextLevel(currentLevel: number, config?: IPointsConfigDocument): number;
    /**
     * Add points to user
     */
    addPoints(options: AddPointsOptions): Promise<{
        success: boolean;
        newBalance: number;
        transaction: any;
        leveledUp: boolean;
        newLevel?: number;
        oldLevel?: number;
    }>;
    /**
     * Deduct points from user
     */
    deductPoints(options: DeductPointsOptions): Promise<{
        success: boolean;
        newBalance: number;
        transaction: any;
    }>;
    /**
     * Check if user has enough points
     */
    hasEnoughPoints(userId: string, amount: number): Promise<boolean>;
    /**
     * Check if user meets level requirement
     */
    meetsLevelRequirement(userId: string, requiredLevel: number): Promise<boolean>;
    /**
     * Calculate match request cost for user (considering premium benefits)
     */
    calculateMatchCost(userId: string): Promise<number>;
    /**
     * Calculate game entry cost for user (considering premium benefits)
     */
    calculateGameCost(userId: string, gameId: string): Promise<number>;
    /**
     * Award daily login bonus
     */
    awardDailyLoginBonus(userId: string): Promise<{
        awarded: boolean;
        amount?: number;
        newBalance?: number;
    }>;
    /**
     * Get user point statistics
     */
    getUserPointStats(userId: string): Promise<any>;
    /**
     * Get point transaction history
     */
    getTransactionHistory(userId: string, page?: number, limit?: number, type?: string): Promise<any>;
    /**
     * Check if username is available
     */
    isUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean>;
    /**
     * Find user by points username
     */
    findUserByUsername(username: string): Promise<IUserDocument | null>;
    /**
     * Generate a unique referral code for user
     */
    generateReferralCode(userId: string): Promise<string>;
    /**
     * Apply referral code during/after signup
     */
    applyReferralCode(newUserId: string, code: string): Promise<{
        success: boolean;
        referrerName?: string;
        bonusAwarded?: number;
    }>;
    /**
     * Get referral stats for a user
     */
    getReferralStats(userId: string): Promise<{
        referralCode: string;
        referralCount: number;
        totalEarnedFromReferrals: number;
    }>;
    /**
     * Decay points for users inactive for 90+ days.
     * Call this from a cron job (e.g. daily).
     * Loses a percentage of balance, never goes below 0.
     */
    decayInactivePoints(): Promise<{
        processed: number;
        decayed: number;
    }>;
    /**
     * Get today's earned total for a user (for cap display on frontend).
     */
    getDailyEarned(userId: string): Promise<{
        earned: number;
        cap: number;
    }>;
}
declare const _default: PointsService;
export default _default;
//# sourceMappingURL=points.service.d.ts.map