import { IChallengeDocument } from '../models';
declare class ChallengeService {
    /**
     * Get active challenges
     */
    getActiveChallenges(type?: 'daily' | 'weekly' | 'monthly', userId?: string): Promise<any[]>;
    /**
     * Get challenge by ID
     */
    getChallengeById(challengeId: string): Promise<IChallengeDocument>;
    /**
     * Join challenge
     */
    joinChallenge(challengeId: string, userId: string): Promise<IChallengeDocument>;
    /**
     * Update challenge progress
     */
    updateProgress(challengeId: string, userId: string, progress: number): Promise<IChallengeDocument>;
    /**
     * Get user challenges
     */
    getUserChallenges(userId: string): Promise<IChallengeDocument[]>;
    /**
     * Get global leaderboard (top users by gamification points)
     */
    getGlobalLeaderboard(limit?: number, type?: string): Promise<any[]>;
    /**
     * Get challenge leaderboard
     */
    getChallengeLeaderboard(challengeId: string, limit?: number): Promise<any[]>;
    /**
     * Create daily challenges (called by cron job)
     */
    createDailyChallenges(): Promise<void>;
    /**
     * Create weekly challenges (called by cron job)
     */
    createWeeklyChallenges(): Promise<void>;
}
declare const _default: ChallengeService;
export default _default;
//# sourceMappingURL=challenge.service.d.ts.map