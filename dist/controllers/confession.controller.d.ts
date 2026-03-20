import { Response } from 'express';
import { AuthRequest } from '../types';
declare class ConfessionController {
    /**
     * Create an anonymous confession
     * POST /api/v1/confessions
     */
    createConfession(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get confessions for a group
     * GET /api/v1/confessions/group/:groupId?page=1&limit=20&category=funny
     */
    getGroupConfessions(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Add a reaction to a confession
     * POST /api/v1/confessions/:confessionId/react
     */
    addReaction(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Add an anonymous reply to a confession
     * POST /api/v1/confessions/:confessionId/reply
     */
    addReply(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Add a reaction to a reply
     * POST /api/v1/confessions/:confessionId/replies/:replyIndex/react
     */
    addReplyReaction(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Report a confession
     * POST /api/v1/confessions/:confessionId/report
     */
    reportConfession(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Delete a confession (admin only)
     * DELETE /api/v1/confessions/:confessionId
     */
    deleteConfession(req: AuthRequest, res: Response): Promise<void>;
}
declare const _default: ConfessionController;
export default _default;
//# sourceMappingURL=confession.controller.d.ts.map