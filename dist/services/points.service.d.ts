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
    type: 'spent' | 'penalty' | 'game_entry' | 'match_request';
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
}
declare const _default: PointsService;
export default _default;
//# sourceMappingURL=points.service.d.ts.map