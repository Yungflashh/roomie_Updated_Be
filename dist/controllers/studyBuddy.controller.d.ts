import { Response } from 'express';
import { AuthRequest } from '../types';
declare class StudyBuddyController {
    /**
     * Get all study categories
     * GET /api/v1/study-buddy
     */
    getCategories(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Find study buddies by category
     * GET /api/v1/study-buddy/buddies?category=computer-science
     */
    findBuddies(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Create a solo study session
     * POST /api/v1/study-buddy/sessions/solo
     */
    createSoloSession(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Create a challenge session
     * POST /api/v1/study-buddy/sessions/challenge
     */
    createChallengeSession(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Respond to a challenge
     * POST /api/v1/study-buddy/sessions/:sessionId/respond
     */
    respondToChallenge(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Submit answers for a session
     * POST /api/v1/study-buddy/sessions/:sessionId/submit
     */
    submitAnswers(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get a session by ID
     * GET /api/v1/study-buddy/sessions/:sessionId
     */
    getSession(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get user's session history
     * GET /api/v1/study-buddy/history?page=1&limit=20
     */
    getUserHistory(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get leaderboard
     * GET /api/v1/study-buddy/leaderboard?category=computer-science&limit=20
     */
    getLeaderboard(req: AuthRequest, res: Response): Promise<void>;
}
declare const _default: StudyBuddyController;
export default _default;
//# sourceMappingURL=studyBuddy.controller.d.ts.map