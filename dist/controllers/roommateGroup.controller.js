"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const roommateGroup_service_1 = __importDefault(require("../services/roommateGroup.service"));
const logger_1 = __importDefault(require("../utils/logger"));
class RoommateGroupController {
    /**
     * Create a new roommate group
     */
    createGroup = async (req, res) => {
        try {
            const userId = req.user?.userId;
            const group = await roommateGroup_service_1.default.createGroup(userId, req.body);
            res.status(201).json({
                success: true,
                message: 'Group created successfully!',
                data: { group },
            });
        }
        catch (error) {
            logger_1.default.error('Create group error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to create group',
            });
        }
    };
    /**
     * Get user's groups
     */
    getMyGroups = async (req, res) => {
        try {
            const userId = req.user?.userId;
            const groups = await roommateGroup_service_1.default.getUserGroups(userId);
            res.status(200).json({
                success: true,
                data: { groups, count: groups.length },
            });
        }
        catch (error) {
            logger_1.default.error('Get my groups error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get groups',
            });
        }
    };
    /**
     * Get group details
     */
    getGroup = async (req, res) => {
        try {
            const userId = req.user?.userId;
            const { groupId } = req.params;
            const group = await roommateGroup_service_1.default.getGroupById(groupId, userId);
            if (!group) {
                res.status(404).json({
                    success: false,
                    message: 'Group not found or you are not a member',
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: { group },
            });
        }
        catch (error) {
            logger_1.default.error('Get group error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get group',
            });
        }
    };
    /**
     * Join group via invite code
     */
    joinByCode = async (req, res) => {
        try {
            const userId = req.user?.userId;
            const { inviteCode } = req.body;
            if (!inviteCode) {
                res.status(400).json({
                    success: false,
                    message: 'Invite code is required',
                });
                return;
            }
            const group = await roommateGroup_service_1.default.joinGroupByCode(userId, inviteCode);
            res.status(200).json({
                success: true,
                message: `Welcome to ${group.name}! 🎉`,
                data: { group },
            });
        }
        catch (error) {
            logger_1.default.error('Join by code error:', error);
            res.status(error.message.includes('Invalid') ? 400 : error.message.includes('already') ? 409 : 500).json({
                success: false,
                message: error.message || 'Failed to join group',
            });
        }
    };
    /**
     * Invite user to group
     */
    inviteUser = async (req, res) => {
        try {
            const userId = req.user?.userId;
            const { groupId } = req.params;
            const invite = await roommateGroup_service_1.default.inviteToGroup(groupId, userId, req.body);
            res.status(201).json({
                success: true,
                message: 'Invitation sent!',
                data: { invite },
            });
        }
        catch (error) {
            logger_1.default.error('Invite user error:', error);
            res.status(error.message.includes('Only') ? 403 : error.message.includes('already') ? 409 : 500).json({
                success: false,
                message: error.message || 'Failed to send invite',
            });
        }
    };
    /**
     * Get pending invites
     */
    getMyInvites = async (req, res) => {
        try {
            const userId = req.user?.userId;
            const invites = await roommateGroup_service_1.default.getUserInvites(userId);
            res.status(200).json({
                success: true,
                data: { invites, count: invites.length },
            });
        }
        catch (error) {
            logger_1.default.error('Get invites error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get invites',
            });
        }
    };
    /**
     * Accept or decline invite
     */
    respondToInvite = async (req, res) => {
        try {
            const userId = req.user?.userId;
            const { inviteId } = req.params;
            const { accept } = req.body;
            const group = await roommateGroup_service_1.default.respondToInvite(inviteId, userId, accept === true);
            if (accept && group) {
                res.status(200).json({
                    success: true,
                    message: `Welcome to ${group.name}! 🎉`,
                    data: { group },
                });
            }
            else {
                res.status(200).json({
                    success: true,
                    message: 'Invitation declined',
                });
            }
        }
        catch (error) {
            logger_1.default.error('Respond to invite error:', error);
            res.status(error.message.includes('not for you') ? 403 : 500).json({
                success: false,
                message: error.message || 'Failed to respond to invite',
            });
        }
    };
    /**
     * Leave group
     */
    leaveGroup = async (req, res) => {
        try {
            const userId = req.user?.userId;
            const { groupId } = req.params;
            await roommateGroup_service_1.default.leaveGroup(groupId, userId);
            res.status(200).json({
                success: true,
                message: 'You have left the group',
            });
        }
        catch (error) {
            logger_1.default.error('Leave group error:', error);
            res.status(error.message.includes('not a member') ? 400 : 500).json({
                success: false,
                message: error.message || 'Failed to leave group',
            });
        }
    };
    /**
     * Remove member (admin only)
     */
    removeMember = async (req, res) => {
        try {
            const userId = req.user?.userId;
            const { groupId, memberId } = req.params;
            const group = await roommateGroup_service_1.default.removeMember(groupId, userId, memberId);
            res.status(200).json({
                success: true,
                message: 'Member removed',
                data: { group },
            });
        }
        catch (error) {
            logger_1.default.error('Remove member error:', error);
            res.status(error.message.includes('Only') ? 403 : 500).json({
                success: false,
                message: error.message || 'Failed to remove member',
            });
        }
    };
    /**
     * Update group settings (admin only)
     */
    updateGroup = async (req, res) => {
        try {
            const userId = req.user?.userId;
            const { groupId } = req.params;
            const group = await roommateGroup_service_1.default.updateGroup(groupId, userId, req.body);
            res.status(200).json({
                success: true,
                message: 'Group updated',
                data: { group },
            });
        }
        catch (error) {
            logger_1.default.error('Update group error:', error);
            res.status(error.message.includes('Only') ? 403 : 500).json({
                success: false,
                message: error.message || 'Failed to update group',
            });
        }
    };
    /**
     * Promote member to admin
     */
    promoteMember = async (req, res) => {
        try {
            const userId = req.user?.userId;
            const { groupId, memberId } = req.params;
            const group = await roommateGroup_service_1.default.promoteMember(groupId, userId, memberId);
            res.status(200).json({
                success: true,
                message: 'Member promoted to admin',
                data: { group },
            });
        }
        catch (error) {
            logger_1.default.error('Promote member error:', error);
            res.status(error.message.includes('Only') ? 403 : 500).json({
                success: false,
                message: error.message || 'Failed to promote member',
            });
        }
    };
    /**
     * Regenerate invite code (admin only)
     */
    regenerateInviteCode = async (req, res) => {
        try {
            const userId = req.user?.userId;
            const { groupId } = req.params;
            const newCode = await roommateGroup_service_1.default.regenerateInviteCode(groupId, userId);
            res.status(200).json({
                success: true,
                message: 'New invite code generated',
                data: { inviteCode: newCode },
            });
        }
        catch (error) {
            logger_1.default.error('Regenerate code error:', error);
            res.status(error.message.includes('Only') ? 403 : 500).json({
                success: false,
                message: error.message || 'Failed to regenerate code',
            });
        }
    };
    /**
     * Get group leaderboard
     */
    getLeaderboard = async (req, res) => {
        try {
            const { groupId } = req.params;
            const leaderboard = await roommateGroup_service_1.default.getGroupLeaderboard(groupId);
            res.status(200).json({
                success: true,
                data: { leaderboard },
            });
        }
        catch (error) {
            logger_1.default.error('Get leaderboard error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get leaderboard',
            });
        }
    };
}
exports.default = new RoommateGroupController();
//# sourceMappingURL=roommateGroup.controller.js.map