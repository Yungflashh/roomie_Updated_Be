import { IClanCompetitionDocument } from '../models/ClanCompetition';
declare class ClanCompetitionService {
    /**
     * Get or create the current month's competition.
     */
    getCurrentCompetition(): Promise<IClanCompetitionDocument>;
    /**
     * Register a clan for the monthly competition.
     */
    registerClan(clanId: string, userId: string): Promise<IClanCompetitionDocument>;
    /**
     * Record points from a game or study session between competing clan members.
     * Called after game/study completion.
     */
    recordCompetitionPoints(userId: string, clanId: string, points: number, type: 'game' | 'study'): Promise<void>;
    /**
     * Finalize the competition at month end. Rank clans, distribute prizes.
     */
    finalizeCompetition(month?: string): Promise<any>;
    /**
     * Distribute prize money within a winning clan based on contribution.
     * MVP 40%, #2 25%, #3 15%, #4-5 10% split, rest to treasury.
     */
    private distributeClanPrize;
    /**
     * Get competition leaderboard for the current month.
     */
    getLeaderboard(): Promise<any>;
    private calculatePrizeTier;
}
declare const _default: ClanCompetitionService;
export default _default;
//# sourceMappingURL=clanCompetition.service.d.ts.map