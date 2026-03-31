import { Response } from 'express';
import { AuthRequest } from '../types';
declare class MatchController {
    /**
     * Aggregated matches feed — single endpoint for the Matches screen
     * Returns: forYou, nearYou, received, sent, matches, pointsStats, pointsConfig
     */
    getMatchesFeed(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Refresh only Near You data — lightweight endpoint for distance changes
     */
    refreshNearYou(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get potential matches (with distance sorting support)
     */
    getPotentialMatches(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get sent likes (users I have liked)
     */
    getSentLikes(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Like a user
     */
    likeUser(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Send a match request (visible, costs more points)
     */
    sendMatchRequest(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Pass a user
     */
    passUser(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get user's matches
     */
    getMatches(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get match details
     */
    getMatchDetails(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Unmatch a user
     */
    unmatch(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get likes (users who liked current user)
     */
    getLikes(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Find or create a match for listing inquiry
     * POST /api/v1/matches/listing-inquiry
     */
    listingInquiry(req: AuthRequest, res: Response): Promise<void>;
}
declare const _default: MatchController;
export default _default;
//# sourceMappingURL=match.controller.d.ts.map