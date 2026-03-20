import { IMatchDocument } from '../models';
interface PotentialMatch {
    user: any;
    compatibilityScore: number;
    distance?: number;
}
declare class MatchService {
    /**
     * Get potential matches
     */
    getPotentialMatches(userId: string, limit?: number, minCompatibility?: number, sortBy?: 'compatibility' | 'distance', liveCoords?: [number, number], // [longitude, latitude] from device GPS
    maxDistance?: number): Promise<PotentialMatch[]>;
    /**
     * Calculate distance between two coordinates using Haversine formula
     * @param coords1 - [longitude, latitude]
     * @param coords2 - [longitude, latitude]
     * @returns Distance in kilometers
     */
    private calculateDistance;
    /**
     * Convert degrees to radians
     */
    private toRad;
    /**
     * Get sent likes
     */
    getSentLikes(userId: string): Promise<any[]>;
    /**
     * Check if user can send match request (has enough points)
     */
    canSendMatchRequest(userId: string): Promise<{
        canSend: boolean;
        reason?: string;
        pointsCost?: number;
        userPoints?: number;
    }>;
    /**
     * Like a user (with points deduction)
     */
    likeUser(userId: string, targetUserId: string): Promise<{
        isMatch: boolean;
        match?: any;
        pointsDeducted?: number;
    }>;
    /**
     * Pass a user — soft skip, does NOT permanently exclude them.
     * The user will reappear in future discover queries.
     * Only used for declining/cancelling explicit match requests.
     */
    passUser(userId: string, targetUserId: string): Promise<void>;
    /**
     * Get user's matches with last message info
     */
    getMatches(userId: string, page?: number, limit?: number, excludeListingInquiries?: boolean): Promise<{
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
     * Find or create a conversation for listing inquiry — not a match, just a chat channel
     */
    findOrCreateListingInquiry(userId: string, landlordId: string, listingId?: string): Promise<IMatchDocument>;
    /**
     * Calculate user priority for discovery sorting (boosted > premium > free)
     */
    private getUserPriority;
    /**
     * Get matched user IDs helper
     */
    private getMatchedUserIds;
}
declare const _default: MatchService;
export default _default;
//# sourceMappingURL=match.service.d.ts.map