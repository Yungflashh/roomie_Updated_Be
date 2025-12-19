import { Response } from 'express';
import { AuthRequest } from '../types';
declare class RoommateController {
    /**
     * Send a roommate connection request
     * POST /api/v1/roommates/request
     */
    sendRequest(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Respond to a roommate connection request
     * POST /api/v1/roommates/respond/:connectionId
     */
    respondToRequest(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Cancel a pending roommate request
     * DELETE /api/v1/roommates/request/:connectionId
     */
    cancelRequest(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get connection status for a match
     * GET /api/v1/roommates/match/:matchId
     */
    getConnectionByMatch(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get a specific connection by ID
     * GET /api/v1/roommates/:connectionId
     */
    getConnection(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get all roommate connections for current user
     * GET /api/v1/roommates
     */
    getMyConnections(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get pending requests received
     * GET /api/v1/roommates/requests/received
     */
    getPendingReceived(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get pending requests sent
     * GET /api/v1/roommates/requests/sent
     */
    getPendingSent(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get active roommates
     * GET /api/v1/roommates/active
     */
    getActiveRoommates(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Check if connected with a specific user
     * GET /api/v1/roommates/check/:userId
     */
    checkConnection(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Update features for a connection
     * PATCH /api/v1/roommates/:connectionId/features
     */
    updateFeatures(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Disconnect from a roommate
     * DELETE /api/v1/roommates/:connectionId
     */
    disconnect(req: AuthRequest, res: Response): Promise<void>;
}
declare const _default: RoommateController;
export default _default;
//# sourceMappingURL=roommate.controller.d.ts.map