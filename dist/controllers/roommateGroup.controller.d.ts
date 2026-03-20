import { Response } from 'express';
import { AuthRequest } from '../types';
declare class RoommateGroupController {
    /**
     * Create a new roommate group
     */
    createGroup: (req: AuthRequest, res: Response) => Promise<void>;
    /**
     * Get user's groups
     */
    getMyGroups: (req: AuthRequest, res: Response) => Promise<void>;
    /**
     * Get group details
     */
    getGroup: (req: AuthRequest, res: Response) => Promise<void>;
    /**
     * Join group via invite code
     */
    joinByCode: (req: AuthRequest, res: Response) => Promise<void>;
    /**
     * Invite user to group
     */
    inviteUser: (req: AuthRequest, res: Response) => Promise<void>;
    /**
     * Get pending invites
     */
    getMyInvites: (req: AuthRequest, res: Response) => Promise<void>;
    /**
     * Accept or decline invite
     */
    respondToInvite: (req: AuthRequest, res: Response) => Promise<void>;
    /**
     * Leave group
     */
    leaveGroup: (req: AuthRequest, res: Response) => Promise<void>;
    /**
     * Remove member (admin only)
     */
    removeMember: (req: AuthRequest, res: Response) => Promise<void>;
    /**
     * Update group settings (admin only)
     */
    updateGroup: (req: AuthRequest, res: Response) => Promise<void>;
    /**
     * Promote member to admin
     */
    promoteMember: (req: AuthRequest, res: Response) => Promise<void>;
    /**
     * Regenerate invite code (admin only)
     */
    regenerateInviteCode: (req: AuthRequest, res: Response) => Promise<void>;
    /**
     * Get group leaderboard
     */
    getLeaderboard: (req: AuthRequest, res: Response) => Promise<void>;
    deleteGroup: (req: AuthRequest, res: Response) => Promise<void>;
}
declare const _default: RoommateGroupController;
export default _default;
//# sourceMappingURL=roommateGroup.controller.d.ts.map