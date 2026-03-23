import { IClanDocument, IClanWarDocument } from '../models/Clan';
declare class ClanService {
    /**
     * Create a new clan. Leader must spend 500 points.
     */
    createClan(userId: string, data: {
        name: string;
        tag: string;
        description?: string;
        emoji?: string;
        color?: string;
        isOpen?: boolean;
    }): Promise<IClanDocument>;
    /**
     * Get a single clan with populated members.
     */
    getClan(clanId: string): Promise<IClanDocument | null>;
    /**
     * List clans for discovery with pagination and search.
     */
    getClans(page?: number, limit?: number, search?: string, sortBy?: string): Promise<{
        clans: IClanDocument[];
        total: number;
        page: number;
        pages: number;
    }>;
    /**
     * Clan leaderboard by period.
     */
    getLeaderboard(period?: 'weekly' | 'monthly' | 'allTime', limit?: number): Promise<IClanDocument[]>;
    /**
     * Join an open clan.
     */
    joinClan(userId: string, clanId: string): Promise<IClanDocument>;
    /**
     * Join a clan by invite code.
     */
    joinByInviteCode(userId: string, inviteCode: string): Promise<IClanDocument>;
    /**
     * Leave a clan. If leader, must transfer leadership or disband.
     */
    leaveClan(userId: string, clanId: string): Promise<{
        disbanded: boolean;
    }>;
    /**
     * Kick a member (leader/co-leader only).
     */
    kickMember(leaderId: string, clanId: string, targetUserId: string): Promise<IClanDocument>;
    /**
     * Promote a member to co-leader (leader only).
     */
    promoteMember(leaderId: string, clanId: string, targetUserId: string, role: 'co-leader' | 'member'): Promise<IClanDocument>;
    /**
     * Update clan settings (leader only).
     */
    updateClan(userId: string, clanId: string, updates: {
        name?: string;
        description?: string;
        emoji?: string;
        color?: string;
        isOpen?: boolean;
    }): Promise<IClanDocument>;
    /**
     * Disband (delete) a clan (leader only).
     */
    disbandClan(userId: string, clanId: string): Promise<void>;
    /**
     * Get the clan for a specific user.
     */
    getMyClan(userId: string): Promise<IClanDocument | null>;
    /**
     * Add points to a clan from a member's activity.
     */
    addClanPoints(clanId: string, userId: string, points: number, reason: string): Promise<void>;
    /**
     * Track a member's activity and add clan points automatically.
     */
    trackMemberActivity(userId: string, action: string, points: number): Promise<void>;
    /**
     * Reset weekly points. Called by cron. Award top clans before reset.
     */
    resetWeeklyPoints(): Promise<void>;
    /**
     * Reset monthly points. Called by cron. Award top clans before reset.
     */
    resetMonthlyPoints(): Promise<void>;
    /**
     * Start a war challenge between two clans.
     */
    startWar(challengerClanId: string, defenderClanId: string, warType: 'games' | 'study' | 'mixed', pointsStake: number): Promise<IClanWarDocument>;
    /**
     * Accept or decline a war challenge.
     */
    respondToWar(clanId: string, warId: string, accept: boolean): Promise<IClanWarDocument>;
    /**
     * Assign players from a clan to war matchups.
     */
    assignWarPlayers(clanId: string, warId: string, playerIds: string[]): Promise<IClanWarDocument>;
    /**
     * Submit a result for an individual war match.
     */
    submitWarMatchResult(warId: string, matchIndex: number, winningSide: 'challenger' | 'defender' | 'tie', scores: {
        challengerScore: number;
        defenderScore: number;
    }): Promise<IClanWarDocument>;
    /**
     * Check if all matches are complete and determine the war winner.
     */
    checkWarCompletion(warId: string): Promise<IClanWarDocument | null>;
    /**
     * Get active/pending wars for a clan.
     */
    getActiveWars(clanId: string): Promise<IClanWarDocument[]>;
    /**
     * Get war history for a clan.
     */
    getWarHistory(clanId: string): Promise<IClanWarDocument[]>;
    /**
     * Get a single war with details.
     */
    getWar(warId: string): Promise<IClanWarDocument | null>;
}
declare const _default: ClanService;
export default _default;
//# sourceMappingURL=clan.service.d.ts.map