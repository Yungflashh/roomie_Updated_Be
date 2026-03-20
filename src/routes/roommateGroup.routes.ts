// src/routes/roommateGroup.routes.ts
import { Router } from 'express';
import roommateGroupController from '../controllers/roommateGroup.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ==================== GROUP MANAGEMENT ====================

/**
 * @route   POST /api/v1/roommate-groups
 * @desc    Create a new roommate group
 * @access  Private
 */
router.post('/', roommateGroupController.createGroup);

/**
 * @route   GET /api/v1/roommate-groups
 * @desc    Get user's groups
 * @access  Private
 */
router.get('/', roommateGroupController.getMyGroups);

/**
 * @route   GET /api/v1/roommate-groups/invites
 * @desc    Get user's pending invites
 * @access  Private
 */
router.get('/invites', roommateGroupController.getMyInvites);

/**
 * @route   POST /api/v1/roommate-groups/join
 * @desc    Join group via invite code
 * @access  Private
 */
router.post('/join', roommateGroupController.joinByCode);

/**
 * @route   GET /api/v1/roommate-groups/:groupId
 * @desc    Get group details
 * @access  Private
 */
router.get('/:groupId', roommateGroupController.getGroup);

/**
 * @route   PUT /api/v1/roommate-groups/:groupId
 * @desc    Update group settings (admin only)
 * @access  Private
 */
router.put('/:groupId', roommateGroupController.updateGroup);

/**
 * @route   POST /api/v1/roommate-groups/:groupId/leave
 * @desc    Leave a group
 * @access  Private
 */
router.post('/:groupId/leave', roommateGroupController.leaveGroup);

/**
 * @route   GET /api/v1/roommate-groups/:groupId/leaderboard
 * @desc    Get group leaderboard
 * @access  Private
 */
router.get('/:groupId/leaderboard', roommateGroupController.getLeaderboard);

// ==================== INVITATIONS ====================

/**
 * @route   POST /api/v1/roommate-groups/:groupId/invite
 * @desc    Invite user to group
 * @access  Private
 */
router.post('/:groupId/invite', roommateGroupController.inviteUser);

/**
 * @route   POST /api/v1/roommate-groups/invites/:inviteId/respond
 * @desc    Accept or decline invite
 * @access  Private
 */
router.post('/invites/:inviteId/respond', roommateGroupController.respondToInvite);

/**
 * @route   POST /api/v1/roommate-groups/:groupId/regenerate-code
 * @desc    Regenerate invite code (admin only)
 * @access  Private
 */
router.post('/:groupId/regenerate-code', roommateGroupController.regenerateInviteCode);

// ==================== MEMBER MANAGEMENT ====================

/**
 * @route   DELETE /api/v1/roommate-groups/:groupId/members/:memberId
 * @desc    Remove member from group (admin only)
 * @access  Private
 */
router.delete('/:groupId/members/:memberId', roommateGroupController.removeMember);

/**
 * @route   POST /api/v1/roommate-groups/:groupId/members/:memberId/promote
 * @desc    Promote member to admin
 * @access  Private
 */
router.post('/:groupId/members/:memberId/promote', roommateGroupController.promoteMember);

/**
 * @route   DELETE /api/v1/roommate-groups/:groupId
 * @desc    Delete/disband group (admin only)
 * @access  Private
 */
router.delete('/:groupId', roommateGroupController.deleteGroup);

export default router;