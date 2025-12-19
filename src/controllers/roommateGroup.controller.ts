// src/controllers/roommateGroup.controller.ts
import { Response } from 'express';
import { AuthRequest } from '../types';
import roommateGroupService from '../services/roommateGroup.service';
import logger from '../utils/logger';

class RoommateGroupController {
  /**
   * Create a new roommate group
   */
  createGroup = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId!;

      const group = await roommateGroupService.createGroup(userId, req.body);

      res.status(201).json({
        success: true,
        message: 'Group created successfully!',
        data: { group },
      });
    } catch (error: any) {
      logger.error('Create group error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create group',
      });
    }
  };

  /**
   * Get user's groups
   */
  getMyGroups = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId!;

      const groups = await roommateGroupService.getUserGroups(userId);

      res.status(200).json({
        success: true,
        data: { groups, count: groups.length },
      });
    } catch (error: any) {
      logger.error('Get my groups error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get groups',
      });
    }
  };

  /**
   * Get group details
   */
  getGroup = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId!;
      const { groupId } = req.params;

      const group = await roommateGroupService.getGroupById(groupId, userId);

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
    } catch (error: any) {
      logger.error('Get group error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get group',
      });
    }
  };

  /**
   * Join group via invite code
   */
  joinByCode = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId!;
      const { inviteCode } = req.body;

      if (!inviteCode) {
        res.status(400).json({
          success: false,
          message: 'Invite code is required',
        });
        return;
      }

      const group = await roommateGroupService.joinGroupByCode(userId, inviteCode);

      res.status(200).json({
        success: true,
        message: `Welcome to ${group.name}! 🎉`,
        data: { group },
      });
    } catch (error: any) {
      logger.error('Join by code error:', error);
      res.status(error.message.includes('Invalid') ? 400 : error.message.includes('already') ? 409 : 500).json({
        success: false,
        message: error.message || 'Failed to join group',
      });
    }
  };

  /**
   * Invite user to group
   */
  inviteUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId!;
      const { groupId } = req.params;

      const invite = await roommateGroupService.inviteToGroup(groupId, userId, req.body);

      res.status(201).json({
        success: true,
        message: 'Invitation sent!',
        data: { invite },
      });
    } catch (error: any) {
      logger.error('Invite user error:', error);
      res.status(error.message.includes('Only') ? 403 : error.message.includes('already') ? 409 : 500).json({
        success: false,
        message: error.message || 'Failed to send invite',
      });
    }
  };

  /**
   * Get pending invites
   */
  getMyInvites = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId!;

      const invites = await roommateGroupService.getUserInvites(userId);

      res.status(200).json({
        success: true,
        data: { invites, count: invites.length },
      });
    } catch (error: any) {
      logger.error('Get invites error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get invites',
      });
    }
  };

  /**
   * Accept or decline invite
   */
  respondToInvite = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId!;
      const { inviteId } = req.params;
      const { accept } = req.body;

      const group = await roommateGroupService.respondToInvite(inviteId, userId, accept === true);

      if (accept && group) {
        res.status(200).json({
          success: true,
          message: `Welcome to ${group.name}! 🎉`,
          data: { group },
        });
      } else {
        res.status(200).json({
          success: true,
          message: 'Invitation declined',
        });
      }
    } catch (error: any) {
      logger.error('Respond to invite error:', error);
      res.status(error.message.includes('not for you') ? 403 : 500).json({
        success: false,
        message: error.message || 'Failed to respond to invite',
      });
    }
  };

  /**
   * Leave group
   */
  leaveGroup = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId!;
      const { groupId } = req.params;

      await roommateGroupService.leaveGroup(groupId, userId);

      res.status(200).json({
        success: true,
        message: 'You have left the group',
      });
    } catch (error: any) {
      logger.error('Leave group error:', error);
      res.status(error.message.includes('not a member') ? 400 : 500).json({
        success: false,
        message: error.message || 'Failed to leave group',
      });
    }
  };

  /**
   * Remove member (admin only)
   */
  removeMember = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId!;
      const { groupId, memberId } = req.params;

      const group = await roommateGroupService.removeMember(groupId, userId, memberId);

      res.status(200).json({
        success: true,
        message: 'Member removed',
        data: { group },
      });
    } catch (error: any) {
      logger.error('Remove member error:', error);
      res.status(error.message.includes('Only') ? 403 : 500).json({
        success: false,
        message: error.message || 'Failed to remove member',
      });
    }
  };

  /**
   * Update group settings (admin only)
   */
  updateGroup = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId!;
      const { groupId } = req.params;

      const group = await roommateGroupService.updateGroup(groupId, userId, req.body);

      res.status(200).json({
        success: true,
        message: 'Group updated',
        data: { group },
      });
    } catch (error: any) {
      logger.error('Update group error:', error);
      res.status(error.message.includes('Only') ? 403 : 500).json({
        success: false,
        message: error.message || 'Failed to update group',
      });
    }
  };

  /**
   * Promote member to admin
   */
  promoteMember = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId!;
      const { groupId, memberId } = req.params;

      const group = await roommateGroupService.promoteMember(groupId, userId, memberId);

      res.status(200).json({
        success: true,
        message: 'Member promoted to admin',
        data: { group },
      });
    } catch (error: any) {
      logger.error('Promote member error:', error);
      res.status(error.message.includes('Only') ? 403 : 500).json({
        success: false,
        message: error.message || 'Failed to promote member',
      });
    }
  };

  /**
   * Regenerate invite code (admin only)
   */
  regenerateInviteCode = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId!;
      const { groupId } = req.params;

      const newCode = await roommateGroupService.regenerateInviteCode(groupId, userId);

      res.status(200).json({
        success: true,
        message: 'New invite code generated',
        data: { inviteCode: newCode },
      });
    } catch (error: any) {
      logger.error('Regenerate code error:', error);
      res.status(error.message.includes('Only') ? 403 : 500).json({
        success: false,
        message: error.message || 'Failed to regenerate code',
      });
    }
  };

  /**
   * Get group leaderboard
   */
  getLeaderboard = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { groupId } = req.params;

      const leaderboard = await roommateGroupService.getGroupLeaderboard(groupId);

      res.status(200).json({
        success: true,
        data: { leaderboard },
      });
    } catch (error: any) {
      logger.error('Get leaderboard error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get leaderboard',
      });
    }
  };
}

export default new RoommateGroupController();