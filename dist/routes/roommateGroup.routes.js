"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/roommateGroup.routes.ts
const express_1 = require("express");
const roommateGroup_controller_1 = __importDefault(require("../controllers/roommateGroup.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
// ==================== GROUP MANAGEMENT ====================
/**
 * @route   POST /api/v1/roommate-groups
 * @desc    Create a new roommate group
 * @access  Private
 */
router.post('/', roommateGroup_controller_1.default.createGroup);
/**
 * @route   GET /api/v1/roommate-groups
 * @desc    Get user's groups
 * @access  Private
 */
router.get('/', roommateGroup_controller_1.default.getMyGroups);
/**
 * @route   GET /api/v1/roommate-groups/invites
 * @desc    Get user's pending invites
 * @access  Private
 */
router.get('/invites', roommateGroup_controller_1.default.getMyInvites);
/**
 * @route   POST /api/v1/roommate-groups/join
 * @desc    Join group via invite code
 * @access  Private
 */
router.post('/join', roommateGroup_controller_1.default.joinByCode);
/**
 * @route   GET /api/v1/roommate-groups/:groupId
 * @desc    Get group details
 * @access  Private
 */
router.get('/:groupId', roommateGroup_controller_1.default.getGroup);
/**
 * @route   PUT /api/v1/roommate-groups/:groupId
 * @desc    Update group settings (admin only)
 * @access  Private
 */
router.put('/:groupId', roommateGroup_controller_1.default.updateGroup);
/**
 * @route   POST /api/v1/roommate-groups/:groupId/leave
 * @desc    Leave a group
 * @access  Private
 */
router.post('/:groupId/leave', roommateGroup_controller_1.default.leaveGroup);
/**
 * @route   GET /api/v1/roommate-groups/:groupId/leaderboard
 * @desc    Get group leaderboard
 * @access  Private
 */
router.get('/:groupId/leaderboard', roommateGroup_controller_1.default.getLeaderboard);
// ==================== INVITATIONS ====================
/**
 * @route   POST /api/v1/roommate-groups/:groupId/invite
 * @desc    Invite user to group
 * @access  Private
 */
router.post('/:groupId/invite', roommateGroup_controller_1.default.inviteUser);
/**
 * @route   POST /api/v1/roommate-groups/invites/:inviteId/respond
 * @desc    Accept or decline invite
 * @access  Private
 */
router.post('/invites/:inviteId/respond', roommateGroup_controller_1.default.respondToInvite);
/**
 * @route   POST /api/v1/roommate-groups/:groupId/regenerate-code
 * @desc    Regenerate invite code (admin only)
 * @access  Private
 */
router.post('/:groupId/regenerate-code', roommateGroup_controller_1.default.regenerateInviteCode);
// ==================== MEMBER MANAGEMENT ====================
/**
 * @route   DELETE /api/v1/roommate-groups/:groupId/members/:memberId
 * @desc    Remove member from group (admin only)
 * @access  Private
 */
router.delete('/:groupId/members/:memberId', roommateGroup_controller_1.default.removeMember);
/**
 * @route   POST /api/v1/roommate-groups/:groupId/members/:memberId/promote
 * @desc    Promote member to admin
 * @access  Private
 */
router.post('/:groupId/members/:memberId/promote', roommateGroup_controller_1.default.promoteMember);
exports.default = router;
//# sourceMappingURL=roommateGroup.routes.js.map