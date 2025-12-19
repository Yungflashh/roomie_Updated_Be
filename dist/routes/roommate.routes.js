"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/roommate.routes.ts
const express_1 = require("express");
const roommate_controller_1 = __importDefault(require("../controllers/roommate.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
/**
 * @route   POST /api/v1/roommates/request
 * @desc    Send a roommate connection request
 * @access  Private
 */
router.post('/request', roommate_controller_1.default.sendRequest);
/**
 * @route   POST /api/v1/roommates/respond/:connectionId
 * @desc    Respond to a roommate connection request (accept/decline)
 * @access  Private
 */
router.post('/respond/:connectionId', roommate_controller_1.default.respondToRequest);
/**
 * @route   DELETE /api/v1/roommates/request/:connectionId
 * @desc    Cancel a pending roommate request
 * @access  Private
 */
router.delete('/request/:connectionId', roommate_controller_1.default.cancelRequest);
/**
 * @route   GET /api/v1/roommates
 * @desc    Get all roommate connections for current user
 * @access  Private
 */
router.get('/', roommate_controller_1.default.getMyConnections);
/**
 * @route   GET /api/v1/roommates/active
 * @desc    Get active roommates (accepted connections)
 * @access  Private
 */
router.get('/active', roommate_controller_1.default.getActiveRoommates);
/**
 * @route   GET /api/v1/roommates/requests/received
 * @desc    Get pending requests received
 * @access  Private
 */
router.get('/requests/received', roommate_controller_1.default.getPendingReceived);
/**
 * @route   GET /api/v1/roommates/requests/sent
 * @desc    Get pending requests sent
 * @access  Private
 */
router.get('/requests/sent', roommate_controller_1.default.getPendingSent);
/**
 * @route   GET /api/v1/roommates/match/:matchId
 * @desc    Get connection status for a specific match
 * @access  Private
 */
router.get('/match/:matchId', roommate_controller_1.default.getConnectionByMatch);
/**
 * @route   GET /api/v1/roommates/check/:userId
 * @desc    Check if connected with a specific user
 * @access  Private
 */
router.get('/check/:userId', roommate_controller_1.default.checkConnection);
/**
 * @route   GET /api/v1/roommates/:connectionId
 * @desc    Get a specific connection by ID
 * @access  Private
 */
router.get('/:connectionId', roommate_controller_1.default.getConnection);
/**
 * @route   PATCH /api/v1/roommates/:connectionId/features
 * @desc    Update features for a connection
 * @access  Private
 */
router.patch('/:connectionId/features', roommate_controller_1.default.updateFeatures);
/**
 * @route   DELETE /api/v1/roommates/:connectionId
 * @desc    Disconnect from a roommate
 * @access  Private
 */
router.delete('/:connectionId', roommate_controller_1.default.disconnect);
exports.default = router;
//# sourceMappingURL=roommate.routes.js.map