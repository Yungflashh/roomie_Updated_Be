"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/services/roommateGroup.service.ts
const mongoose_1 = __importDefault(require("mongoose"));
const RoommateGroup_1 = require("../models/RoommateGroup");
const GroupInvite_1 = require("../models/GroupInvite");
const UserPoints_1 = require("../models/UserPoints");
const socket_config_1 = require("../config/socket.config");
const logger_1 = __importDefault(require("../utils/logger"));
class RoommateGroupService {
    /**
     * Create a new roommate group
     */
    async createGroup(userId, data) {
        // Generate unique invite code
        const inviteCode = await RoommateGroup_1.RoommateGroup.generateInviteCode();
        const group = new RoommateGroup_1.RoommateGroup({
            name: data.name,
            description: data.description,
            coverImage: data.coverImage,
            inviteCode,
            createdBy: new mongoose_1.default.Types.ObjectId(userId),
            members: [{
                    user: new mongoose_1.default.Types.ObjectId(userId),
                    role: 'admin',
                    joinedAt: new Date(),
                    status: 'active',
                }],
            maxMembers: data.maxMembers || 10,
            settings: {
                allowMemberInvites: data.settings?.allowMemberInvites ?? true,
                requireAdminApproval: data.settings?.requireAdminApproval ?? false,
                defaultSplitType: data.settings?.defaultSplitType || 'equal',
                currency: data.settings?.currency || 'NGN',
            },
            isActive: true,
        });
        await group.save();
        // Initialize points for creator
        await this.initializeUserPoints(group._id.toString(), userId);
        logger_1.default.info(`Roommate group created: ${group._id} by user ${userId}`);
        return group.populate('members.user', 'firstName lastName profilePhoto email');
    }
    /**
     * Get user's groups
     */
    async getUserGroups(userId) {
        return RoommateGroup_1.RoommateGroup.find({
            'members.user': userId,
            'members.status': 'active',
            isActive: true,
        })
            .populate('members.user', 'firstName lastName profilePhoto email')
            .populate('createdBy', 'firstName lastName profilePhoto')
            .sort({ updatedAt: -1 });
    }
    /**
     * Get group by ID
     */
    async getGroupById(groupId, userId) {
        const group = await RoommateGroup_1.RoommateGroup.findOne({
            _id: groupId,
            'members.user': userId,
            'members.status': 'active',
            isActive: true,
        })
            .populate('members.user', 'firstName lastName profilePhoto email phone')
            .populate('createdBy', 'firstName lastName profilePhoto');
        return group;
    }
    /**
     * Join group via invite code
     */
    async joinGroupByCode(userId, inviteCode) {
        const group = await RoommateGroup_1.RoommateGroup.findOne({
            inviteCode: inviteCode.toUpperCase(),
            isActive: true,
        });
        if (!group) {
            throw new Error('Invalid invite code');
        }
        // Check if already a member
        const existingMember = group.members.find(m => m.user.toString() === userId && m.status === 'active');
        if (existingMember) {
            throw new Error('You are already a member of this group');
        }
        // Check if group is full
        const activeMembers = group.members.filter(m => m.status === 'active');
        if (activeMembers.length >= group.maxMembers) {
            throw new Error('This group is full');
        }
        // Check if previously left - rejoin
        const previousMember = group.members.find(m => m.user.toString() === userId && m.status === 'left');
        if (previousMember) {
            previousMember.status = 'active';
            previousMember.joinedAt = new Date();
            previousMember.leftAt = undefined;
        }
        else {
            // Add as new member
            group.members.push({
                user: new mongoose_1.default.Types.ObjectId(userId),
                role: 'member',
                joinedAt: new Date(),
                status: 'active',
            });
        }
        await group.save();
        // Initialize points for new member
        await this.initializeUserPoints(group._id.toString(), userId);
        // Notify other members
        const io = (0, socket_config_1.getIO)();
        if (io) {
            io.to(`group:${group._id}`).emit('group:memberJoined', {
                groupId: group._id,
                userId,
            });
        }
        logger_1.default.info(`User ${userId} joined group ${group._id} via invite code`);
        return group.populate('members.user', 'firstName lastName profilePhoto email');
    }
    /**
     * Invite user to group
     */
    async inviteToGroup(groupId, inviterId, data) {
        const group = await RoommateGroup_1.RoommateGroup.findById(groupId);
        if (!group || !group.isActive) {
            throw new Error('Group not found');
        }
        // Check if inviter is a member
        const inviterMember = group.members.find(m => m.user.toString() === inviterId && m.status === 'active');
        if (!inviterMember) {
            throw new Error('You are not a member of this group');
        }
        // Check permissions
        if (!group.settings.allowMemberInvites && inviterMember.role !== 'admin') {
            throw new Error('Only admins can invite new members');
        }
        // Check if group is full
        const activeMembers = group.members.filter(m => m.status === 'active');
        if (activeMembers.length >= group.maxMembers) {
            throw new Error('This group is full');
        }
        // Check if user is already a member (if userId provided)
        if (data.userId) {
            const existingMember = group.members.find(m => m.user.toString() === data.userId && m.status === 'active');
            if (existingMember) {
                throw new Error('User is already a member of this group');
            }
        }
        // Check for existing pending invite
        const existingInvite = await GroupInvite_1.GroupInvite.findOne({
            group: groupId,
            status: 'pending',
            $or: [
                { invitedUser: data.userId },
                { email: data.email },
                { phone: data.phone },
            ].filter(Boolean),
        });
        if (existingInvite) {
            throw new Error('An invite is already pending for this user');
        }
        const invite = new GroupInvite_1.GroupInvite({
            group: new mongoose_1.default.Types.ObjectId(groupId),
            invitedBy: new mongoose_1.default.Types.ObjectId(inviterId),
            invitedUser: data.userId ? new mongoose_1.default.Types.ObjectId(data.userId) : undefined,
            email: data.email,
            phone: data.phone,
            status: 'pending',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        });
        await invite.save();
        // Notify invited user if they have an account
        if (data.userId) {
            (0, socket_config_1.emitToUser)(data.userId, 'group:inviteReceived', {
                invite: await invite.populate('group invitedBy'),
            });
        }
        logger_1.default.info(`Invite created for group ${groupId} by user ${inviterId}`);
        return invite.populate('group invitedBy');
    }
    /**
     * Get pending invites for user
     */
    async getUserInvites(userId) {
        return GroupInvite_1.GroupInvite.find({
            invitedUser: userId,
            status: 'pending',
            expiresAt: { $gt: new Date() },
        })
            .populate('group', 'name description coverImage memberCount')
            .populate('invitedBy', 'firstName lastName profilePhoto')
            .sort({ createdAt: -1 });
    }
    /**
     * Accept/decline group invite
     */
    async respondToInvite(inviteId, odlpUserId, accept) {
        const invite = await GroupInvite_1.GroupInvite.findById(inviteId);
        if (!invite) {
            throw new Error('Invite not found');
        }
        if (invite.invitedUser?.toString() !== odlpUserId) {
            throw new Error('This invite is not for you');
        }
        if (invite.status !== 'pending') {
            throw new Error('This invite has already been responded to');
        }
        if (new Date() > invite.expiresAt) {
            invite.status = 'expired';
            await invite.save();
            throw new Error('This invite has expired');
        }
        if (accept) {
            invite.status = 'accepted';
            invite.acceptedAt = new Date();
            await invite.save();
            // Add user to group
            const group = await RoommateGroup_1.RoommateGroup.findById(invite.group);
            if (!group || !group.isActive) {
                throw new Error('Group no longer exists');
            }
            group.members.push({
                user: new mongoose_1.default.Types.ObjectId(odlpUserId),
                role: 'member',
                joinedAt: new Date(),
                invitedBy: invite.invitedBy,
                status: 'active',
            });
            await group.save();
            // Initialize points
            await this.initializeUserPoints(group._id.toString(), odlpUserId);
            // Notify group
            const io = (0, socket_config_1.getIO)();
            if (io) {
                io.to(`group:${group._id}`).emit('group:memberJoined', {
                    groupId: group._id,
                    odlpUserId,
                });
            }
            logger_1.default.info(`User ${odlpUserId} accepted invite to group ${group._id}`);
            return group.populate('members.user', 'firstName lastName profilePhoto email');
        }
        else {
            invite.status = 'declined';
            invite.declinedAt = new Date();
            await invite.save();
            logger_1.default.info(`User ${odlpUserId} declined invite ${inviteId}`);
            return null;
        }
    }
    /**
     * Leave group
     */
    async leaveGroup(groupId, userId) {
        const group = await RoommateGroup_1.RoommateGroup.findById(groupId);
        if (!group) {
            throw new Error('Group not found');
        }
        const memberIndex = group.members.findIndex(m => m.user.toString() === userId && m.status === 'active');
        if (memberIndex === -1) {
            throw new Error('You are not a member of this group');
        }
        const member = group.members[memberIndex];
        // Check if user is the only admin
        const activeAdmins = group.members.filter(m => m.status === 'active' && m.role === 'admin');
        if (member.role === 'admin' && activeAdmins.length === 1) {
            // Transfer admin to another member
            const otherMembers = group.members.filter(m => m.status === 'active' && m.user.toString() !== userId);
            if (otherMembers.length > 0) {
                otherMembers[0].role = 'admin';
            }
            else {
                // Last member leaving - deactivate group
                group.isActive = false;
            }
        }
        group.members[memberIndex].status = 'left';
        group.members[memberIndex].leftAt = new Date();
        await group.save();
        // Notify group
        const io = (0, socket_config_1.getIO)();
        if (io) {
            io.to(`group:${groupId}`).emit('group:memberLeft', {
                groupId,
                userId,
            });
        }
        logger_1.default.info(`User ${userId} left group ${groupId}`);
    }
    /**
     * Remove member from group (admin only)
     */
    async removeMember(groupId, adminId, targetUserId) {
        const group = await RoommateGroup_1.RoommateGroup.findById(groupId);
        if (!group) {
            throw new Error('Group not found');
        }
        // Check if requester is admin
        const adminMember = group.members.find(m => m.user.toString() === adminId && m.status === 'active' && m.role === 'admin');
        if (!adminMember) {
            throw new Error('Only admins can remove members');
        }
        // Can't remove yourself
        if (adminId === targetUserId) {
            throw new Error('Use leave group to remove yourself');
        }
        const targetIndex = group.members.findIndex(m => m.user.toString() === targetUserId && m.status === 'active');
        if (targetIndex === -1) {
            throw new Error('User is not a member of this group');
        }
        group.members[targetIndex].status = 'removed';
        group.members[targetIndex].leftAt = new Date();
        await group.save();
        // Notify removed user
        (0, socket_config_1.emitToUser)(targetUserId, 'group:removed', {
            groupId,
            groupName: group.name,
        });
        // Notify group
        const io = (0, socket_config_1.getIO)();
        if (io) {
            io.to(`group:${groupId}`).emit('group:memberRemoved', {
                groupId,
                targetUserId,
                removedBy: adminId,
            });
        }
        logger_1.default.info(`User ${targetUserId} removed from group ${groupId} by ${adminId}`);
        return group.populate('members.user', 'firstName lastName profilePhoto email');
    }
    /**
     * Update group settings (admin only)
     */
    async updateGroup(groupId, adminId, data) {
        const group = await RoommateGroup_1.RoommateGroup.findById(groupId);
        if (!group) {
            throw new Error('Group not found');
        }
        // Check if requester is admin
        const adminMember = group.members.find(m => m.user.toString() === adminId && m.status === 'active' && m.role === 'admin');
        if (!adminMember) {
            throw new Error('Only admins can update group settings');
        }
        if (data.name)
            group.name = data.name;
        if (data.description !== undefined)
            group.description = data.description;
        if (data.coverImage !== undefined)
            group.coverImage = data.coverImage;
        if (data.maxMembers) {
            const activeCount = group.members.filter(m => m.status === 'active').length;
            if (data.maxMembers < activeCount) {
                throw new Error(`Cannot set max members below current count (${activeCount})`);
            }
            group.maxMembers = data.maxMembers;
        }
        if (data.settings) {
            group.settings = { ...group.settings, ...data.settings };
        }
        await group.save();
        // Notify group
        const io = (0, socket_config_1.getIO)();
        if (io) {
            io.to(`group:${groupId}`).emit('group:updated', {
                group: await group.populate('members.user', 'firstName lastName profilePhoto email'),
            });
        }
        logger_1.default.info(`Group ${groupId} updated by ${adminId}`);
        return group.populate('members.user', 'firstName lastName profilePhoto email');
    }
    /**
     * Promote member to admin
     */
    async promoteMember(groupId, adminId, targetUserId) {
        const group = await RoommateGroup_1.RoommateGroup.findById(groupId);
        if (!group) {
            throw new Error('Group not found');
        }
        // Check if requester is admin
        const adminMember = group.members.find(m => m.user.toString() === adminId && m.status === 'active' && m.role === 'admin');
        if (!adminMember) {
            throw new Error('Only admins can promote members');
        }
        const targetMember = group.members.find(m => m.user.toString() === targetUserId && m.status === 'active');
        if (!targetMember) {
            throw new Error('User is not a member of this group');
        }
        if (targetMember.role === 'admin') {
            throw new Error('User is already an admin');
        }
        targetMember.role = 'admin';
        await group.save();
        // Notify the promoted user
        (0, socket_config_1.emitToUser)(targetUserId, 'group:promoted', {
            groupId,
            groupName: group.name,
        });
        logger_1.default.info(`User ${targetUserId} promoted to admin in group ${groupId}`);
        return group.populate('members.user', 'firstName lastName profilePhoto email');
    }
    /**
     * Regenerate invite code
     */
    async regenerateInviteCode(groupId, adminId) {
        const group = await RoommateGroup_1.RoommateGroup.findById(groupId);
        if (!group) {
            throw new Error('Group not found');
        }
        // Check if requester is admin
        const adminMember = group.members.find(m => m.user.toString() === adminId && m.status === 'active' && m.role === 'admin');
        if (!adminMember) {
            throw new Error('Only admins can regenerate invite code');
        }
        const newCode = await RoommateGroup_1.RoommateGroup.generateInviteCode();
        group.inviteCode = newCode;
        await group.save();
        logger_1.default.info(`Invite code regenerated for group ${groupId}`);
        return newCode;
    }
    /**
     * Initialize user points for a group
     */
    async initializeUserPoints(groupId, userId) {
        const existing = await UserPoints_1.UserPoints.findOne({
            group: groupId,
            user: userId,
        });
        if (!existing) {
            await UserPoints_1.UserPoints.create({
                group: new mongoose_1.default.Types.ObjectId(groupId),
                user: new mongoose_1.default.Types.ObjectId(userId),
                totalPoints: 0,
                earnedPoints: 0,
                spentPoints: 0,
                penaltyPoints: 0,
                transactions: [],
            });
        }
    }
    /**
     * Get group leaderboard
     */
    async getGroupLeaderboard(groupId) {
        const points = await UserPoints_1.UserPoints.find({ group: groupId })
            .populate('user', 'firstName lastName profilePhoto')
            .sort({ totalPoints: -1 });
        return points.map((p, index) => ({
            odlpUserId: p.user._id.toString(),
            user: p.user,
            totalPoints: p.totalPoints,
            earnedPoints: p.earnedPoints,
            rank: index + 1,
        }));
    }
}
exports.default = new RoommateGroupService();
//# sourceMappingURL=roommateGroup.service.js.map