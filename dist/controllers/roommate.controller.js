"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const roommate_service_1 = __importDefault(require("../services/roommate.service"));
const logger_1 = __importDefault(require("../utils/logger"));
class RoommateController {
    /**
     * Send a roommate connection request
     * POST /api/v1/roommates/request
     */
    async sendRequest(req, res) {
        try {
            const userId = req.user?.userId;
            const { recipientId, matchId, message } = req.body;
            logger_1.default.info(`User ${userId} sending roommate request to ${recipientId}`);
            const connection = await roommate_service_1.default.sendConnectionRequest(userId, recipientId, matchId, message);
            res.status(201).json({
                success: true,
                message: 'Roommate connection request sent',
                data: { connection },
            });
        }
        catch (error) {
            logger_1.default.error('Send roommate request error:', error);
            const statusCode = error.message.includes('not found') ? 404 :
                error.message.includes('already') ? 409 :
                    error.message.includes('not part') ? 403 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Failed to send roommate request',
            });
        }
    }
    /**
     * Respond to a roommate connection request
     * POST /api/v1/roommates/respond/:connectionId
     */
    async respondToRequest(req, res) {
        try {
            const userId = req.user?.userId;
            const { connectionId } = req.params;
            const { accept, declineReason } = req.body;
            logger_1.default.info(`User ${userId} responding to roommate request ${connectionId}: ${accept ? 'accept' : 'decline'}`);
            const connection = await roommate_service_1.default.respondToRequest(connectionId, userId, accept, declineReason);
            res.status(200).json({
                success: true,
                message: accept ? 'Roommate connection accepted! Features unlocked.' : 'Roommate request declined',
                data: { connection },
            });
        }
        catch (error) {
            logger_1.default.error('Respond to roommate request error:', error);
            const statusCode = error.message.includes('not found') ? 404 :
                error.message.includes('not authorized') ? 403 :
                    error.message.includes('already') ? 409 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Failed to respond to roommate request',
            });
        }
    }
    /**
     * Cancel a pending roommate request
     * DELETE /api/v1/roommates/request/:connectionId
     */
    async cancelRequest(req, res) {
        try {
            const userId = req.user?.userId;
            const { connectionId } = req.params;
            logger_1.default.info(`User ${userId} cancelling roommate request ${connectionId}`);
            await roommate_service_1.default.cancelRequest(connectionId, userId);
            res.status(200).json({
                success: true,
                message: 'Roommate request cancelled',
            });
        }
        catch (error) {
            logger_1.default.error('Cancel roommate request error:', error);
            const statusCode = error.message.includes('not found') ? 404 :
                error.message.includes('Only pending') ? 400 :
                    error.message.includes('only cancel') ? 403 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Failed to cancel roommate request',
            });
        }
    }
    /**
     * Get connection status for a match
     * GET /api/v1/roommates/match/:matchId
     */
    async getConnectionByMatch(req, res) {
        try {
            const { matchId } = req.params;
            const connection = await roommate_service_1.default.getConnectionByMatch(matchId);
            res.status(200).json({
                success: true,
                data: {
                    connection,
                    isConnected: connection?.status === 'accepted',
                    isPending: connection?.status === 'pending',
                },
            });
        }
        catch (error) {
            logger_1.default.error('Get connection by match error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get connection status',
            });
        }
    }
    /**
     * Get a specific connection by ID
     * GET /api/v1/roommates/:connectionId
     */
    async getConnection(req, res) {
        try {
            const { connectionId } = req.params;
            const connection = await roommate_service_1.default.getConnectionById(connectionId);
            if (!connection) {
                res.status(404).json({
                    success: false,
                    message: 'Connection not found',
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: { connection },
            });
        }
        catch (error) {
            logger_1.default.error('Get connection error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get connection',
            });
        }
    }
    /**
     * Get all roommate connections for current user
     * GET /api/v1/roommates
     */
    async getMyConnections(req, res) {
        try {
            const userId = req.user?.userId;
            const { status } = req.query;
            const connections = await roommate_service_1.default.getUserConnections(userId, status);
            res.status(200).json({
                success: true,
                data: {
                    connections,
                    count: connections.length,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Get my connections error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get connections',
            });
        }
    }
    /**
     * Get pending requests received
     * GET /api/v1/roommates/requests/received
     */
    async getPendingReceived(req, res) {
        try {
            const userId = req.user?.userId;
            const requests = await roommate_service_1.default.getPendingRequestsReceived(userId);
            res.status(200).json({
                success: true,
                data: {
                    requests,
                    count: requests.length,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Get pending received error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get pending requests',
            });
        }
    }
    /**
     * Get pending requests sent
     * GET /api/v1/roommates/requests/sent
     */
    async getPendingSent(req, res) {
        try {
            const userId = req.user?.userId;
            const requests = await roommate_service_1.default.getPendingRequestsSent(userId);
            res.status(200).json({
                success: true,
                data: {
                    requests,
                    count: requests.length,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Get pending sent error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get sent requests',
            });
        }
    }
    /**
     * Get active roommates
     * GET /api/v1/roommates/active
     */
    async getActiveRoommates(req, res) {
        try {
            const userId = req.user?.userId;
            const roommates = await roommate_service_1.default.getActiveRoommates(userId);
            res.status(200).json({
                success: true,
                data: {
                    roommates,
                    count: roommates.length,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Get active roommates error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get roommates',
            });
        }
    }
    /**
     * Check if connected with a specific user
     * GET /api/v1/roommates/check/:userId
     */
    async checkConnection(req, res) {
        try {
            const currentUserId = req.user?.userId;
            const { userId } = req.params;
            const isConnected = await roommate_service_1.default.areUsersConnected(currentUserId, userId);
            res.status(200).json({
                success: true,
                data: { isConnected },
            });
        }
        catch (error) {
            logger_1.default.error('Check connection error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to check connection',
            });
        }
    }
    /**
     * Update features for a connection
     * PATCH /api/v1/roommates/:connectionId/features
     */
    async updateFeatures(req, res) {
        try {
            const userId = req.user?.userId;
            const { connectionId } = req.params;
            const { features } = req.body;
            const connection = await roommate_service_1.default.updateFeatures(connectionId, userId, features);
            res.status(200).json({
                success: true,
                message: 'Features updated',
                data: { connection },
            });
        }
        catch (error) {
            logger_1.default.error('Update features error:', error);
            const statusCode = error.message.includes('not found') ? 404 :
                error.message.includes('not part') ? 403 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Failed to update features',
            });
        }
    }
    /**
     * Disconnect from a roommate
     * DELETE /api/v1/roommates/:connectionId
     */
    async disconnect(req, res) {
        try {
            const userId = req.user?.userId;
            const { connectionId } = req.params;
            logger_1.default.info(`User ${userId} disconnecting from roommate connection ${connectionId}`);
            await roommate_service_1.default.disconnect(connectionId, userId);
            res.status(200).json({
                success: true,
                message: 'Roommate connection removed',
            });
        }
        catch (error) {
            logger_1.default.error('Disconnect error:', error);
            const statusCode = error.message.includes('not found') ? 404 :
                error.message.includes('not part') ? 403 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Failed to disconnect',
            });
        }
    }
}
exports.default = new RoommateController();
//# sourceMappingURL=roommate.controller.js.map