// src/routes/roommate.routes.ts
import { Router } from 'express';
import roommateController from '../controllers/roommate.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/roommates/request
 * @desc    Send a roommate connection request
 * @access  Private
 */
router.post('/request', roommateController.sendRequest);

/**
 * @route   POST /api/v1/roommates/respond/:connectionId
 * @desc    Respond to a roommate connection request (accept/decline)
 * @access  Private
 */
router.post('/respond/:connectionId', roommateController.respondToRequest);

/**
 * @route   DELETE /api/v1/roommates/request/:connectionId
 * @desc    Cancel a pending roommate request
 * @access  Private
 */
router.delete('/request/:connectionId', roommateController.cancelRequest);

/**
 * @route   GET /api/v1/roommates
 * @desc    Get all roommate connections for current user
 * @access  Private
 */
router.get('/', roommateController.getMyConnections);

/**
 * @route   GET /api/v1/roommates/active
 * @desc    Get active roommates (accepted connections)
 * @access  Private
 */
router.get('/active', roommateController.getActiveRoommates);

/**
 * @route   GET /api/v1/roommates/requests/received
 * @desc    Get pending requests received
 * @access  Private
 */
router.get('/requests/received', roommateController.getPendingReceived);

/**
 * @route   GET /api/v1/roommates/requests/sent
 * @desc    Get pending requests sent
 * @access  Private
 */
router.get('/requests/sent', roommateController.getPendingSent);

/**
 * @route   GET /api/v1/roommates/match/:matchId
 * @desc    Get connection status for a specific match
 * @access  Private
 */
router.get('/match/:matchId', roommateController.getConnectionByMatch);

/**
 * @route   GET /api/v1/roommates/check/:userId
 * @desc    Check if connected with a specific user
 * @access  Private
 */
router.get('/check/:userId', roommateController.checkConnection);

/**
 * @route   GET /api/v1/roommates/:connectionId
 * @desc    Get a specific connection by ID
 * @access  Private
 */
router.get('/:connectionId', roommateController.getConnection);

/**
 * @route   PATCH /api/v1/roommates/:connectionId/features
 * @desc    Update features for a connection
 * @access  Private
 */
router.patch('/:connectionId/features', roommateController.updateFeatures);

/**
 * @route   DELETE /api/v1/roommates/:connectionId
 * @desc    Disconnect from a roommate
 * @access  Private
 */
router.delete('/:connectionId', roommateController.disconnect);

export default router;