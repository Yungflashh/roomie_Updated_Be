interface PotentialMatch {
    user: any;
    compatibilityScore: number;
}
declare class MatchService {
    /**
     * Get potential matches
     */
    getPotentialMatches(userId: string, limit?: number, minCompatibility?: number): Promise<PotentialMatch[]>;
    /**
     * Get sent likes
     */
    getSentLikes(userId: string): Promise<any[]>;
    /**
     * Like a user
     */
    likeUser(userId: string, targetUserId: string): Promise<{
        isMatch: boolean;
        match?: any;
    }>;
    /**
     * Pass a user
     */
    passUser(userId: string, targetUserId: string): Promise<void>;
    /**
     * Get user's matches with last message info
     */
    getMatches(userId: string, page?: number, limit?: number): Promise<{
        matches: any[];
        pagination: any;
    }>;
    /**
     * Get match details
     */
    getMatchDetails(userId: string, matchId: string): Promise<any>;
    /**
     * Unmatch a user
     */
    unmatch(userId: string, matchId: string): Promise<void>;
    /**
     * Get users who liked current user
     */
    getLikes(userId: string): Promise<any[]>;
    /**
     * Get matched user IDs helper
     */
    private getMatchedUserIds;
}
declare const _default: MatchService;
export default _default;
//# sourceMappingURL=match.service.d.ts.map