import { IChallengeDocument } from '../models';
declare class WeeklyChallengeService {
    /**
     * Get active challenges
     */
    getActiveChallenges(userId?: string): Promise<any[]>;
    /**
     * Join a challenge
     */
    joinChallenge(challengeId: string, userId: string): Promise<void>;
    /**
     * Update progress for a user action
     */
    trackAction(userId: string, action: string, amount?: number): Promise<void>;
    /**
     * Get weekly leaderboard
     */
    getWeeklyLeaderboard(limit?: number): Promise<any[]>;
    /**
     * Admin: Create challenge
     */
    createChallenge(data: any): Promise<IChallengeDocument>;
    /**
     * Admin: Send notification to all users
     */
    broadcastNotification(data: {
        title: string;
        body: string;
        type?: string;
    }): Promise<number>;
}
declare const _default: WeeklyChallengeService;
export default _default;
//# sourceMappingURL=weeklyChallenge.service.d.ts.map