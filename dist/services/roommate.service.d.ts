import { IRoommateConnectionDocument } from '../models/RoommateConnection';
declare class RoommateService {
    /**
     * Send a roommate connection request
     */
    sendConnectionRequest(requesterId: string, recipientId: string, matchId: string, message?: string): Promise<IRoommateConnectionDocument>;
    /**
     * Respond to a roommate connection request
     */
    respondToRequest(connectionId: string, userId: string, accept: boolean, declineReason?: string): Promise<IRoommateConnectionDocument>;
    /**
     * Cancel a pending connection request (by requester)
     */
    cancelRequest(connectionId: string, userId: string): Promise<void>;
    /**
     * Get connection status for a match
     */
    getConnectionByMatch(matchId: string): Promise<IRoommateConnectionDocument | null>;
    /**
     * Get connection by ID
     */
    getConnectionById(connectionId: string): Promise<IRoommateConnectionDocument | null>;
    /**
     * Get all roommate connections for a user
     */
    getUserConnections(userId: string, status?: 'pending' | 'accepted' | 'declined' | 'all'): Promise<IRoommateConnectionDocument[]>;
    /**
     * Get pending requests received by user
     */
    getPendingRequestsReceived(userId: string): Promise<IRoommateConnectionDocument[]>;
    /**
     * Get pending requests sent by user
     */
    getPendingRequestsSent(userId: string): Promise<IRoommateConnectionDocument[]>;
    /**
     * Check if two users are connected as roommates
     */
    areUsersConnected(userId1: string, userId2: string): Promise<boolean>;
    /**
     * Get active roommates for a user
     */
    getActiveRoommates(userId: string): Promise<any[]>;
    /**
     * Update feature access for a connection
     */
    updateFeatures(connectionId: string, userId: string, features: Partial<IRoommateConnectionDocument['features']>): Promise<IRoommateConnectionDocument>;
    /**
     * Disconnect roommates
     */
    disconnect(connectionId: string, userId: string): Promise<void>;
    /**
     * Helper: Notify recipient of connection request
     */
    private notifyConnectionRequest;
    /**
     * Helper: Send system message in chat
     */
    private sendSystemMessage;
}
declare const _default: RoommateService;
export default _default;
//# sourceMappingURL=roommate.service.d.ts.map