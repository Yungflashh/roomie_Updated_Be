import { Response } from 'express';
import { AuthRequest } from '../types';
declare class MatchController {
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
}
declare const _default: MatchController;
export default _default;
//# sourceMappingURL=match.controller.d.ts.map