// src/controllers/message.controller.ts
import { Response } from 'express';
import { AuthRequest } from '../types';
import messageService from '../services/message.service';
import logger from '../utils/logger';

class MessageController {
  /**
   * Send message
   */
  async sendMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { matchId, receiverId, type, content } = req.body;

      let mediaUrl: string | undefined;
      let thumbnail: string | undefined;
      let metadata: { duration?: number; fileSize?: number; fileName?: string } | undefined;

      if (req.file) {
        mediaUrl = `/uploads/chat/${req.file.filename}`;
        
        if (type === 'image' || type === 'video') {
          metadata = {
            fileSize: req.file.size,
            fileName: req.file.filename,
          };
        }

        if (type === 'video' || type === 'audio') {
          metadata = {
            ...metadata,
            duration: (req as any).duration,
          };
        }
      }

      const message = await messageService.sendMessage({
        matchId,
        senderId: userId,
        receiverId,
        type,
        content,
        mediaUrl,
        thumbnail,
        metadata,
      });

      res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: { message },
      });
    } catch (error: any) {
      logger.error('Send message error:', error);
      
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to send message',
      });
    }
  }

  /**
   * Get messages
   */
  async getMessages(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { matchId } = req.params;
      const { page = 1, limit = 50 } = req.query;

      const result = await messageService.getMessages(
        matchId,
        userId,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Get messages error:', error);
      
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to fetch messages',
      });
    }
  }

  /**
   * Mark messages as read
   */
  async markAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { matchId } = req.params;

      await messageService.markAsRead(matchId, userId);

      res.status(200).json({
        success: true,
        message: 'Messages marked as read',
      });
    } catch (error) {
      logger.error('Mark as read error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark messages as read',
      });
    }
  }

  /**
   * Delete message
   */
  async deleteMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { messageId } = req.params;

      await messageService.deleteMessage(messageId, userId);

      res.status(200).json({
        success: true,
        message: 'Message deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete message error:', error);
      
      const statusCode = error.message.includes('not found') || 
                         error.message.includes('unauthorized') ? 404 : 500;
      
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to delete message',
      });
    }
  }

  /**
   * Add reaction
   */
  async addReaction(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { messageId } = req.params;
      const { emoji } = req.body;

      await messageService.addReaction(messageId, userId, emoji);

      res.status(200).json({
        success: true,
        message: 'Reaction added',
      });
    } catch (error) {
      logger.error('Add reaction error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add reaction',
      });
    }
  }

  /**
   * Remove reaction
   */
  async removeReaction(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { messageId } = req.params;

      await messageService.removeReaction(messageId, userId);

      res.status(200).json({
        success: true,
        message: 'Reaction removed',
      });
    } catch (error) {
      logger.error('Remove reaction error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove reaction',
      });
    }
  }

  /**
   * Get unread count
   */
  async getUnreadCount(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const count = await messageService.getUnreadCount(userId);

      res.status(200).json({
        success: true,
        data: { unreadCount: count },
      });
    } catch (error) {
      logger.error('Get unread count error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch unread count',
      });
    }
  }

  /**
   * Search messages
   */
  async searchMessages(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { matchId } = req.params;
      const { query } = req.query;

      if (!query) {
        res.status(400).json({
          success: false,
          message: 'Search query is required',
        });
        return;
      }

      const messages = await messageService.searchMessages(
        matchId,
        userId,
        query as string
      );

      res.status(200).json({
        success: true,
        data: { messages },
      });
    } catch (error: any) {
      logger.error('Search messages error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to search messages',
      });
    }
  }
}

export default new MessageController();