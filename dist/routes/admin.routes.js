"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = __importDefault(require("../controllers/admin.controller"));
const router = (0, express_1.Router)();
/**
 * @route   POST /api/v1/admin/login
 * @desc    Admin login
 * @access  Public
 */
router.post('/login', admin_controller_1.default.login);
// All routes below require authentication
// router.use(authenticate);
// Dashboard routes
/**
 * @route   GET /api/v1/admin/dashboard/stats
 * @desc    Get dashboard statistics
 * @access  Private (Admin)
 */
router.get('/dashboard/stats', admin_controller_1.default.getDashboardStats);
/**
 * @route   GET /api/v1/admin/dashboard/user-growth
 * @desc    Get user growth data
 * @access  Private (Admin)
 */
router.get('/dashboard/user-growth', admin_controller_1.default.getUserGrowth);
// User management routes
/**
 * @route   GET /api/v1/admin/users
 * @desc    Get all users with pagination and filters
 * @access  Private (Admin)
 */
router.get('/users', admin_controller_1.default.getUsers);
/**
 * @route   GET /api/v1/admin/users/:userId
 * @desc    Get single user details
 * @access  Private (Admin)
 */
router.get('/users/:userId', admin_controller_1.default.getUser);
/**
 * @route   POST /api/v1/admin/users/:userId/verify
 * @desc    Verify a user
 * @access  Private (Admin)
 */
router.post('/users/:userId/verify', admin_controller_1.default.verifyUser);
/**
 * @route   POST /api/v1/admin/users/:userId/suspend
 * @desc    Suspend a user
 * @access  Private (Admin)
 */
router.post('/users/:userId/suspend', admin_controller_1.default.suspendUser);
/**
 * @route   POST /api/v1/admin/users/:userId/unsuspend
 * @desc    Unsuspend a user
 * @access  Private (Admin)
 */
router.post('/users/:userId/unsuspend', admin_controller_1.default.unsuspendUser);
/**
 * @route   DELETE /api/v1/admin/users/:userId
 * @desc    Delete a user
 * @access  Private (Admin)
 */
router.delete('/users/:userId', admin_controller_1.default.deleteUser);
// Match management routes
/**
 * @route   GET /api/v1/admin/matches
 * @desc    Get all matches with pagination
 * @access  Private (Admin)
 */
router.get('/matches', admin_controller_1.default.getMatches);
/**
 * @route   GET /api/v1/admin/matches/:matchId
 * @desc    Get match details
 * @access  Private (Admin)
 */
router.get('/matches/:matchId', admin_controller_1.default.getMatch);
/**
 * @route   DELETE /api/v1/admin/matches/:matchId
 * @desc    Delete a match
 * @access  Private (Admin)
 */
router.delete('/matches/:matchId', admin_controller_1.default.deleteMatch);
// Property management routes
/**
 * @route   GET /api/v1/admin/properties
 * @desc    Get all properties with pagination and filters
 * @access  Private (Admin)
 */
router.get('/properties', admin_controller_1.default.getProperties);
/**
 * @route   GET /api/v1/admin/properties/:propertyId
 * @desc    Get property details
 * @access  Private (Admin)
 */
router.get('/properties/:propertyId', admin_controller_1.default.getProperty);
/**
 * @route   PATCH /api/v1/admin/properties/:propertyId
 * @desc    Update property
 * @access  Private (Admin)
 */
router.patch('/properties/:propertyId', admin_controller_1.default.updateProperty);
/**
 * @route   DELETE /api/v1/admin/properties/:propertyId
 * @desc    Delete property
 * @access  Private (Admin)
 */
router.delete('/properties/:propertyId', admin_controller_1.default.deleteProperty);
/**
 * @route   POST /api/v1/admin/properties/:propertyId/approve
 * @desc    Approve property
 * @access  Private (Admin)
 */
router.post('/properties/:propertyId/approve', admin_controller_1.default.approveProperty);
/**
 * @route   POST /api/v1/admin/properties/:propertyId/reject
 * @desc    Reject property
 * @access  Private (Admin)
 */
router.post('/properties/:propertyId/reject', admin_controller_1.default.rejectProperty);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map