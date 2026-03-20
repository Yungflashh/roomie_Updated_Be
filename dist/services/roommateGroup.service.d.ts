import { IRoommateGroupDocument } from '../models/RoommateGroup';
import { IGroupInviteDocument } from '../models/GroupInvite';
declare class RoommateGroupService {
    /**
     * Create a new roommate group
     */
    createGroup(userId: string, data: {
        name: string;
        description?: string;
        coverImage?: string;
        maxMembers?: number;
        settings?: {
            allowMemberInvites?: boolean;
            requireAdminApproval?: boolean;
            defaultSplitType?: 'equal' | 'custom';
            currency?: string;
        };
    }): Promise<IRoommateGroupDocument>;
    /**
     * Get user's groups
     */
    getUserGroups(userId: string): Promise<IRoommateGroupDocument[]>;
    /**
     * Get group by ID
     */
    getGroupById(groupId: string, userId: string): Promise<IRoommateGroupDocument | null>;
    /**
     * Join group via invite code
     */
    joinGroupByCode(userId: string, inviteCode: string): Promise<IRoommateGroupDocument>;
    /**
     * Invite user to group
     */
    inviteToGroup(groupId: string, inviterId: string, data: {
        userId?: string;
        email?: string;
        phone?: string;
    }): Promise<IGroupInviteDocument>;
    /**
     * Get pending invites for user
     */
    getUserInvites(userId: string): Promise<IGroupInviteDocument[]>;
    /**
     * Accept/decline group invite
     */
    respondToInvite(inviteId: string, userId: string, accept: boolean): Promise<IRoommateGroupDocument | null>;
    /**
     * Leave group
     */
    leaveGroup(groupId: string, userId: string): Promise<void>;
    /**
     * Remove member from group (admin only)
     */
    removeMember(groupId: string, adminId: string, targetUserId: string): Promise<IRoommateGroupDocument>;
    /**
     * Update group settings (admin only)
     */
    updateGroup(groupId: string, adminId: string, data: {
        name?: string;
        description?: string;
        coverImage?: string;
        maxMembers?: number;
        settings?: {
            allowMemberInvites?: boolean;
            requireAdminApproval?: boolean;
            defaultSplitType?: 'equal' | 'custom';
            currency?: string;
        };
    }): Promise<IRoommateGroupDocument>;
    /**
     * Promote member to admin
     */
    promoteMember(groupId: string, adminId: string, targetUserId: string): Promise<IRoommateGroupDocument>;
    /**
     * Regenerate invite code based on current group name
     */
    regenerateInviteCode(groupId: string, adminId: string): Promise<string>;
    /**
     * Initialize user points for a group
     */
    private initializeUserPoints;
    /**
     * Get group leaderboard
     */
    getGroupLeaderboard(groupId: string): Promise<{
        userId: string;
        user: any;
        totalPoints: number;
        earnedPoints: number;
        rank: number;
    }[]>;
    /**
     * Delete/disband group (admin only)
     */
    deleteGroup(groupId: string, userId: string): Promise<void>;
}
declare const _default: RoommateGroupService;
export default _default;
//# sourceMappingURL=roommateGroup.service.d.ts.map