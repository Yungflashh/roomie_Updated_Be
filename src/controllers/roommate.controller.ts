// src/controllers/roommate.controller.ts
import { Response } from 'express';
import { AuthRequest } from '../types';
import roommateService from '../services/roommate.service';
import logger from '../utils/logger';

class RoommateController {
  /**
   * Send a roommate connection request
   * POST /api/v1/roommates/request
   */
  async sendRequest(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { recipientId, matchId, message } = req.body;

      logger.info(`User ${userId} sending roommate request to ${recipientId}`);

      const connection = await roommateService.sendConnectionRequest(
        userId,
        recipientId,
        matchId,
        message
      );

      res.status(201).json({
        success: true,
        message: 'Roommate connection request sent',
        data: { connection },
      });
    } catch (error: any) {
      logger.error('Send roommate request error:', error);
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
  async respondToRequest(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { connectionId } = req.params;
      const { accept, declineReason } = req.body;

      logger.info(`User ${userId} responding to roommate request ${connectionId}: ${accept ? 'accept' : 'decline'}`);

      const connection = await roommateService.respondToRequest(
        connectionId,
        userId,
        accept,
        declineReason
      );

      res.status(200).json({
        success: true,
        message: accept ? 'Roommate connection accepted! Features unlocked.' : 'Roommate request declined',
        data: { connection },
      });
    } catch (error: any) {
      logger.error('Respond to roommate request error:', error);
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
  async cancelRequest(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { connectionId } = req.params;

      logger.info(`User ${userId} cancelling roommate request ${connectionId}`);

      await roommateService.cancelRequest(connectionId, userId);

      res.status(200).json({
        success: true,
        message: 'Roommate request cancelled',
      });
    } catch (error: any) {
      logger.error('Cancel roommate request error:', error);
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
  async getConnectionByMatch(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { matchId } = req.params;

      const connection = await roommateService.getConnectionByMatch(matchId);

      res.status(200).json({
        success: true,
        data: { 
          connection,
          isConnected: connection?.status === 'accepted',
          isPending: connection?.status === 'pending',
        },
      });
    } catch (error: any) {
      logger.error('Get connection by match error:', error);
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
  async getConnection(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { connectionId } = req.params;

      const connection = await roommateService.getConnectionById(connectionId);

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
    } catch (error: any) {
      logger.error('Get connection error:', error);
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
  async getMyConnections(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { status } = req.query;

      const connections = await roommateService.getUserConnections(
        userId,
        status as any
      );

      res.status(200).json({
        success: true,
        data: { 
          connections,
          count: connections.length,
        },
      });
    } catch (error: any) {
      logger.error('Get my connections error:', error);
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
  async getPendingReceived(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;

      const requests = await roommateService.getPendingRequestsReceived(userId);

      res.status(200).json({
        success: true,
        data: { 
          requests,
          count: requests.length,
        },
      });
    } catch (error: any) {
      logger.error('Get pending received error:', error);
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
  async getPendingSent(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;

      const requests = await roommateService.getPendingRequestsSent(userId);

      res.status(200).json({
        success: true,
        data: { 
          requests,
          count: requests.length,
        },
      });
    } catch (error: any) {
      logger.error('Get pending sent error:', error);
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
  async getActiveRoommates(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;

      const roommates = await roommateService.getActiveRoommates(userId);

      res.status(200).json({
        success: true,
        data: { 
          roommates,
          count: roommates.length,
        },
      });
    } catch (error: any) {
      logger.error('Get active roommates error:', error);
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
  async checkConnection(req: AuthRequest, res: Response): Promise<void> {
    try {
      const currentUserId = req.user?.userId!;
      const { userId } = req.params;

      const isConnected = await roommateService.areUsersConnected(currentUserId, userId);

      res.status(200).json({
        success: true,
        data: { isConnected },
      });
    } catch (error: any) {
      logger.error('Check connection error:', error);
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
  async updateFeatures(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { connectionId } = req.params;
      const { features } = req.body;

      const connection = await roommateService.updateFeatures(
        connectionId,
        userId,
        features
      );

      res.status(200).json({
        success: true,
        message: 'Features updated',
        data: { connection },
      });
    } catch (error: any) {
      logger.error('Update features error:', error);
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
  async disconnect(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { connectionId } = req.params;

      logger.info(`User ${userId} disconnecting from roommate connection ${connectionId}`);

      await roommateService.disconnect(connectionId, userId);

      res.status(200).json({
        success: true,
        message: 'Roommate connection removed',
      });
    } catch (error: any) {
      logger.error('Disconnect error:', error);
      const statusCode = error.message.includes('not found') ? 404 :
                         error.message.includes('not part') ? 403 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to disconnect',
      });
    }
  }
}

export default new RoommateController();