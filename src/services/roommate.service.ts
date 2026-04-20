// src/services/roommate.service.ts
import mongoose from 'mongoose';
import { RoommateConnection, IRoommateConnectionDocument } from '../models/RoommateConnection';
import { Match, User, Message } from '../models';
import { emitToUser, getIO } from '../config/socket.config';
import logger from '../utils/logger';

class RoommateService {
  /**
   * Send a roommate connection request
   */
  async sendConnectionRequest(
    requesterId: string,
    recipientId: string,
    matchId: string,
    message?: string
  ): Promise<IRoommateConnectionDocument> {
    logger.info(`Roommate connection request: ${requesterId} -> ${recipientId} for match ${matchId}`);

    // Verify match exists and both users are part of it
    const match = await Match.findById(matchId);
    if (!match) {
      throw new Error('Match not found');
    }

    const matchUsers = [match.user1.toString(), match.user2.toString()];
    if (!matchUsers.includes(requesterId) || !matchUsers.includes(recipientId)) {
      throw new Error('Users are not part of this match');
    }

    // Check if connection already exists for this match
    const existingConnection = await RoommateConnection.findOne({ match: matchId });
    
    if (existingConnection) {
      if (existingConnection.status === 'accepted') {
        throw new Error('You are already connected as roommates');
      }
      if (existingConnection.status === 'pending') {
        // If recipient is trying to send request, treat as acceptance
        if (existingConnection.recipient.toString() === requesterId) {
          return this.respondToRequest(existingConnection._id.toString(), requesterId, true);
        }
        throw new Error('A connection request is already pending');
      }
      if (existingConnection.status === 'declined') {
        // Allow re-request after decline (update the existing record)
        existingConnection.requester = new mongoose.Types.ObjectId(requesterId);
        existingConnection.recipient = new mongoose.Types.ObjectId(recipientId);
        existingConnection.status = 'pending';
        existingConnection.requestedAt = new Date();
        existingConnection.respondedAt = undefined;
        existingConnection.metadata.requestMessage = message;
        existingConnection.metadata.declineReason = undefined;
        await existingConnection.save();
        
        // Notify recipient
        await this.notifyConnectionRequest(existingConnection, requesterId, recipientId);
        
        return existingConnection;
      }
    }

    // Create new connection request
    const connection = new RoommateConnection({
      match: new mongoose.Types.ObjectId(matchId),
      requester: new mongoose.Types.ObjectId(requesterId),
      recipient: new mongoose.Types.ObjectId(recipientId),
      status: 'pending',
      requestedAt: new Date(),
      metadata: {
        requestMessage: message,
      },
    });

    await connection.save();

    // Notify recipient via socket
    await this.notifyConnectionRequest(connection, requesterId, recipientId);

    // Send system message in chat
    await this.sendSystemMessage(matchId, requesterId, recipientId, 'request');

    logger.info(`Roommate connection request created: ${connection._id}`);

    return connection;
  }

  /**
   * Respond to a roommate connection request
   */
  async respondToRequest(
    connectionId: string,
    userId: string,
    accept: boolean,
    declineReason?: string
  ): Promise<IRoommateConnectionDocument> {
    const connection = await RoommateConnection.findById(connectionId)
      .populate('requester', 'firstName lastName profilePhoto')
      .populate('recipient', 'firstName lastName profilePhoto');

    if (!connection) {
      throw new Error('Connection request not found');
    }

    if (connection.recipient.toString() !== userId && 
        (connection.recipient as any)._id?.toString() !== userId) {
      throw new Error('You are not authorized to respond to this request');
    }

    if (connection.status !== 'pending') {
      throw new Error('This request has already been responded to');
    }

    connection.status = accept ? 'accepted' : 'declined';
    connection.respondedAt = new Date();

    if (accept) {
      connection.connectedAt = new Date();
      // Unlock all features on acceptance
      connection.features = {
        sharedExpenses: true,
        sharedCalendar: true,
        roommateAgreement: true,
        choreManagement: true,
        sharedListings: true,
      };
    } else {
      connection.metadata.declineReason = declineReason;
    }

    await connection.save();

    // Get requester ID for notifications
    const requesterId = (connection.requester as any)._id?.toString() || connection.requester.toString();
    const recipientId = (connection.recipient as any)._id?.toString() || connection.recipient.toString();

    // Notify requester via socket
    emitToUser(requesterId, 'roommate:response', {
      connectionId: connection._id,
      matchId: connection.match,
      accepted: accept,
      respondedBy: userId,
      respondedAt: connection.respondedAt,
    });

    // Send system message in chat
    await this.sendSystemMessage(
      connection.match.toString(),
      recipientId,
      requesterId,
      accept ? 'accepted' : 'declined'
    );

    logger.info(`Roommate connection ${accept ? 'accepted' : 'declined'}: ${connectionId}`);

    return connection;
  }

  /**
   * Cancel a pending connection request (by requester)
   */
  async cancelRequest(connectionId: string, userId: string): Promise<void> {
    const connection = await RoommateConnection.findById(connectionId);

    if (!connection) {
      throw new Error('Connection request not found');
    }

    if (connection.requester.toString() !== userId) {
      throw new Error('You can only cancel your own requests');
    }

    if (connection.status !== 'pending') {
      throw new Error('Only pending requests can be cancelled');
    }

    connection.status = 'cancelled';
    connection.respondedAt = new Date();
    await connection.save();

    // Notify recipient
    const recipientId = connection.recipient.toString();
    emitToUser(recipientId, 'roommate:cancelled', {
      connectionId: connection._id,
      matchId: connection.match,
      cancelledBy: userId,
    });

    logger.info(`Roommate connection request cancelled: ${connectionId}`);
  }

  /**
   * Get connection status for a match
   */
  async getConnectionByMatch(matchId: string): Promise<IRoommateConnectionDocument | null> {
    return RoommateConnection.findOne({ match: matchId })
      .populate('requester', 'firstName lastName profilePhoto')
      .populate('recipient', 'firstName lastName profilePhoto');
  }

  /**
   * Get connection by ID
   */
  async getConnectionById(connectionId: string): Promise<IRoommateConnectionDocument | null> {
    return RoommateConnection.findById(connectionId)
      .populate('requester', 'firstName lastName profilePhoto')
      .populate('recipient', 'firstName lastName profilePhoto')
      .populate('match');
  }

  /**
   * Get all roommate connections for a user
   */
  async getUserConnections(
    userId: string,
    status?: 'pending' | 'accepted' | 'declined' | 'all'
  ): Promise<IRoommateConnectionDocument[]> {
    const query: any = {
      $or: [{ requester: userId }, { recipient: userId }],
    };

    if (status && status !== 'all') {
      query.status = status;
    }

    return RoommateConnection.find(query)
      .populate('requester', 'firstName lastName profilePhoto')
      .populate('recipient', 'firstName lastName profilePhoto')
      .populate('match')
      .sort({ updatedAt: -1 });
  }

  /**
   * Get pending requests received by user
   */
  async getPendingRequestsReceived(userId: string): Promise<IRoommateConnectionDocument[]> {
    return RoommateConnection.find({
      recipient: userId,
      status: 'pending',
    })
      .populate('requester', 'firstName lastName profilePhoto')
      .populate('match')
      .sort({ requestedAt: -1 });
  }

  /**
   * Get pending requests sent by user
   */
  async getPendingRequestsSent(userId: string): Promise<IRoommateConnectionDocument[]> {
    return RoommateConnection.find({
      requester: userId,
      status: 'pending',
    })
      .populate('recipient', 'firstName lastName profilePhoto')
      .populate('match')
      .sort({ requestedAt: -1 });
  }

  /**
   * Check if two users are connected as roommates
   */
  async areUsersConnected(userId1: string, userId2: string): Promise<boolean> {
    const connection = await RoommateConnection.findOne({
      status: 'accepted',
      $or: [
        { requester: userId1, recipient: userId2 },
        { requester: userId2, recipient: userId1 },
      ],
    });

    return !!connection;
  }

  /**
   * Get active roommates for a user
   */
  async getActiveRoommates(userId: string): Promise<any[]> {
    const connections = await RoommateConnection.find({
      status: 'accepted',
      $or: [{ requester: userId }, { recipient: userId }],
    })
      .populate('requester', 'firstName lastName profilePhoto location occupation')
      .populate('recipient', 'firstName lastName profilePhoto location occupation')
      .populate('match');

    return connections.map(conn => {
      const isRequester = conn.requester._id?.toString() === userId || 
                          conn.requester.toString() === userId;
      const roommate = isRequester ? conn.recipient : conn.requester;
      
      return {
        connection: conn,
        roommate,
        connectedAt: conn.connectedAt,
        features: conn.features,
      };
    });
  }

  /**
   * Update feature access for a connection
   */
  async updateFeatures(
    connectionId: string,
    userId: string,
    features: Partial<IRoommateConnectionDocument['features']>
  ): Promise<IRoommateConnectionDocument> {
    const connection = await RoommateConnection.findById(connectionId);

    if (!connection) {
      throw new Error('Connection not found');
    }

    // Verify user is part of the connection
    if (connection.requester.toString() !== userId && 
        connection.recipient.toString() !== userId) {
      throw new Error('You are not part of this connection');
    }

    if (connection.status !== 'accepted') {
      throw new Error('Features can only be updated for accepted connections');
    }

    // Update features
    Object.assign(connection.features, features);
    await connection.save();

    return connection;
  }

  /**
   * Disconnect roommates
   */
  async disconnect(connectionId: string, userId: string): Promise<void> {
    const connection = await RoommateConnection.findById(connectionId);

    if (!connection) {
      throw new Error('Connection not found');
    }

    // Verify user is part of the connection
    if (connection.requester.toString() !== userId && 
        connection.recipient.toString() !== userId) {
      throw new Error('You are not part of this connection');
    }

    // Delete the connection
    await RoommateConnection.findByIdAndDelete(connectionId);

    // Notify the other user
    const otherUserId = connection.requester.toString() === userId 
      ? connection.recipient.toString() 
      : connection.requester.toString();

    emitToUser(otherUserId, 'roommate:disconnected', {
      connectionId: connection._id,
      matchId: connection.match,
      disconnectedBy: userId,
    });

    logger.info(`Roommate connection disconnected: ${connectionId} by ${userId}`);
  }

  /**
   * Helper: Notify recipient of connection request
   */
  private async notifyConnectionRequest(
    connection: IRoommateConnectionDocument,
    requesterId: string,
    recipientId: string
  ): Promise<void> {
    const requester = await User.findById(requesterId).select('firstName lastName profilePhoto');
    
    emitToUser(recipientId, 'roommate:request', {
      connectionId: connection._id,
      matchId: connection.match,
      requester: {
        _id: requesterId,
        firstName: requester?.firstName,
        lastName: requester?.lastName,
        profilePhoto: requester?.profilePhoto,
      },
      message: connection.metadata.requestMessage,
      requestedAt: connection.requestedAt,
    });
  }

  /**
   * Helper: Send system message in chat
   */
  private async sendSystemMessage(
    matchId: string,
    senderId: string,
    receiverId: string,
    type: 'request' | 'accepted' | 'declined'
  ): Promise<void> {
    const sender = await User.findById(senderId).select('firstName');
    
    let content = '';
    switch (type) {
      case 'request':
        content = `${sender?.firstName} sent a roommate connection request`;
        break;
      case 'accepted':
        content = `${sender?.firstName} accepted the roommate connection. Roommate features are now unlocked.`;
        break;
      case 'declined':
        content = `${sender?.firstName} declined the roommate connection request.`;
        break;
    }

    const message = new Message({
      match: new mongoose.Types.ObjectId(matchId),
      sender: new mongoose.Types.ObjectId(senderId),
      receiver: new mongoose.Types.ObjectId(receiverId),
      type: 'system',
      content,
      systemData: {
        action: `roommate_${type}`,
        relatedId: matchId,
      },
    });

    await message.save();

    // Emit to chat room
    const io = getIO();
    if (io) {
      io.to(`chat:${matchId}`).emit('message:new', message);
    }
  }
}

export default new RoommateService();