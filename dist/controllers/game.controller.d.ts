import { Response } from 'express';
import { AuthRequest } from '../types';
declare class GameController {
    /**
     * Get all available games
     */
    getAllGames(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get game details
     */
    getGame(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Send game invitation
     */
    sendInvitation(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Respond to game invitation
     */
    respondToInvitation(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Cancel game invitation
     */
    cancelInvitation(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get game session
     */
    getSession(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get active game session for a match
     */
    getActiveSession(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Start game session
     */
    startSession(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Submit answer (legacy - single answer)
     */
    submitAnswer(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Submit all answers at once when player completes game
     */
    submitAllAnswers(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Complete game session
     */
    completeSession(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get user's game history
     */
    getGameHistory(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get game leaderboard
     */
    getLeaderboard(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get games available for user (filtered by level)
     */
    getAvailableGames(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Check if user can play specific game
     */
    canPlayGame(req: AuthRequest, res: Response): Promise<void>;
}
declare const _default: GameController;
export default _default;
//# sourceMappingURL=game.controller.d.ts.map