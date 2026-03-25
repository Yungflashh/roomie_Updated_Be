import { IClanDocument, IClanWarDocument } from '../models/Clan';
import { IClanMissionDocument } from '../models/ClanMission';
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
     * Map action strings to mission types.
     */
    private actionToMissionType;
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
    /**
     * Log an activity to the clan's activity feed. Keeps last 50 entries.
     */
    logActivity(clanId: string, type: string, userId: string, message: string, points?: number): Promise<void>;
    /**
     * Get the activity log for a clan with populated user info.
     */
    getActivityLog(clanId: string): Promise<any[]>;
    /**
     * Generate 3 random weekly missions for a clan.
     */
    generateWeeklyMissions(clanId: string): Promise<IClanMissionDocument[]>;
    /**
     * Update mission progress and check for completion.
     */
    updateMissionProgress(clanId: string, type: string, amount: number): Promise<void>;
    /**
     * Get active missions for a clan (current week).
     */
    getActiveMissions(clanId: string): Promise<IClanMissionDocument[]>;
    /**
     * Donate points to clan treasury.
     */
    donateToTreasury(clanId: string, userId: string, amount: number): Promise<{
        treasury: number;
    }>;
    /**
     * Get treasury history (donations from activity log).
     */
    getTreasuryHistory(clanId: string): Promise<any>;
    /**
     * Update the clan's activity streak.
     */
    updateStreak(clanId: string): Promise<void>;
    /**
     * Get the chat match ID for a clan.
     */
    getChatMatchId(clanId: string): Promise<string | null>;
    /**
     * Level-based perks that unlock automatically.
     */
    static readonly LEVEL_PERKS: Array<{
        id: string;
        name: string;
        description: string;
        icon: string;
        requiredLevel: number;
        effect: {
            type: string;
            value: number;
        };
    }>;
    /**
     * Shop items purchasable with treasury points.
     */
    static readonly SHOP_ITEMS: Array<{
        id: string;
        name: string;
        description: string;
        icon: string;
        cost: number;
        type: 'boost' | 'cosmetic' | 'upgrade';
        duration?: number;
        effect?: {
            type: string;
            value: number;
        };
        requiredLevel?: number;
    }>;
    /**
     * Get perks unlocked for a clan based on its level.
     */
    getClanPerks(level: number): typeof ClanService.LEVEL_PERKS;
    /**
     * Get all level perks with unlock status for a clan.
     */
    getAllPerksWithStatus(level: number): Array<typeof ClanService.LEVEL_PERKS[number] & {
        unlocked: boolean;
    }>;
    /**
     * Get shop items available for a clan, with purchased status.
     */
    getShopItems(clanId: string): Promise<Array<typeof ClanService.SHOP_ITEMS[number] & {
        purchased: boolean;
        active: boolean;
    }>>;
    /**
     * Purchase a shop item using treasury funds. Leader/co-leader only.
     */
    purchaseShopItem(clanId: string, userId: string, itemId: string): Promise<{
        success: boolean;
        treasury: number;
        item: typeof ClanService.SHOP_ITEMS[number];
    }>;
    /**
     * Get active boost multipliers for a clan (used in point calculations).
     */
    getActiveBoostMultiplier(clanId: string): Promise<number>;
    /**
     * Get the treasury donation multiplier (from level perks).
     */
    getTreasuryMultiplier(level: number): number;
    static readonly ACHIEVEMENT_DEFS: Array<{
        id: string;
        name: string;
        description: string;
        icon: string;
        check: (clan: IClanDocument) => boolean;
    }>;
    checkAchievements(clanId: string): Promise<string[]>;
    getAchievementsWithStatus(clan: IClanDocument): Array<typeof ClanService.ACHIEVEMENT_DEFS[number] & {
        unlocked: boolean;
    }>;
    getMemberLeaderboard(clan: IClanDocument): Array<{
        user: any;
        role: string;
        weeklyContribution: number;
        totalContributed: number;
        rank: number;
    }>;
    getHeadToHead(clanId: string, opponentClanId: string): Promise<{
        wins: number;
        losses: number;
        draws: number;
        totalWars: number;
    }>;
    setAnnouncement(clanId: string, userId: string, text: string): Promise<string>;
    resetSeason(): Promise<void>;
    getSeasonLeaderboard(limit?: number): Promise<IClanDocument[]>;
}
declare const _default: ClanService;
export default _default;
//# sourceMappingURL=clan.service.d.ts.map