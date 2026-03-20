// src/controllers/message.controller.ts
import { Response } from 'express';
import { AuthRequest } from '../types';
import messageService from '../services/message.service';
import { mediaService } from '../services/media.service';
import { cloudinary } from '../config/cloudinary.config';
import logger from '../utils/logger';
import fs from 'fs';
import path from 'path';

// Pending media uploads: pendingId -> { filePath, userId, matchId, receiverId, type, timer, cancelled }
const pendingMediaUploads = new Map<string, {
  filePath: string;
  userId: string;
  matchId: string;
  receiverId: string;
  type: string;
  content?: string;
  timer: NodeJS.Timeout;
  cancelled: boolean;
}>();

class MessageController {
  /**
   * Send message
   */
  async sendMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { matchId, receiverId, type, content, replyTo } = req.body;

      // For media messages (image/audio/video): defer processing with cancel window
      if (req.file && (type === 'image' || type === 'audio' || type === 'video')) {
        const pendingId = `pending_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const filePath = req.file.path;

        logger.info(`Media upload received, deferring processing. pendingId: ${pendingId}`);

        // Set a 4-second timer before processing
        const timer = setTimeout(async () => {
          const pending = pendingMediaUploads.get(pendingId);
          if (!pending || pending.cancelled) {
            logger.info(`Pending upload ${pendingId} was cancelled, skipping.`);
            pendingMediaUploads.delete(pendingId);
            // Clean up temp file
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            return;
          }

          pendingMediaUploads.delete(pendingId);

          try {
            // Upload to Cloudinary
            const isAudio = type === 'audio';
            const isVideo = type === 'video';
            const folder = `roomie/users/${userId}${isAudio ? '/audio' : isVideo ? '/video' : ''}`;

            let mediaUrl: string;
            if (isAudio || isVideo) {
              const result = await cloudinary.uploader.upload(filePath, {
                folder,
                resource_type: isVideo ? 'video' : 'raw',
                public_id: `${Date.now()}_media`,
              });
              mediaUrl = result.secure_url;
            } else {
              const result = await mediaService.uploadFromPath(filePath, folder, `${Date.now()}_media`);
              mediaUrl = result.url;
            }

            // Clean up temp file
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

            // Now create and send the message
            const metadata: any = { fileSize: req.file!.size, fileName: req.file!.filename };
            const message = await messageService.sendMessage({
              matchId,
              senderId: userId,
              receiverId,
              type,
              content,
              replyTo,
              mediaUrl,
              metadata,
            });

            logger.info(`Deferred media message sent: ${message._id}`);
          } catch (err) {
            logger.error(`Failed to process deferred upload ${pendingId}:`, err);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          }
        }, 4000);

        pendingMediaUploads.set(pendingId, {
          filePath,
          userId,
          matchId,
          receiverId,
          type,
          content,
          timer,
          cancelled: false,
        });

        // Return immediately with pendingId — client shows preview
        res.status(202).json({
          success: true,
          message: 'Media upload queued',
          data: { pendingId },
        });
        return;
      }

      // Text messages: send immediately (no delay)
      const message = await messageService.sendMessage({
        matchId,
        senderId: userId,
        receiverId,
        type,
        content,
        replyTo,
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
   * Cancel a pending media upload (within the 4s window)
   */
  async cancelPendingUpload(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { pendingId } = req.params;
      const userId = req.user?.userId!;

      const pending = pendingMediaUploads.get(pendingId);

      if (!pending) {
        res.status(404).json({ success: false, message: 'Pending upload not found or already processed' });
        return;
      }

      if (pending.userId !== userId) {
        res.status(403).json({ success: false, message: 'Unauthorized' });
        return;
      }

      // Mark as cancelled and clear the timer
      pending.cancelled = true;
      clearTimeout(pending.timer);
      pendingMediaUploads.delete(pendingId);

      // Clean up temp file
      if (fs.existsSync(pending.filePath)) {
        fs.unlinkSync(pending.filePath);
      }

      logger.info(`Pending upload cancelled: ${pendingId}`);

      res.status(200).json({
        success: true,
        message: 'Upload cancelled',
      });
    } catch (error: any) {
      logger.error('Cancel pending upload error:', error);
      res.status(500).json({ success: false, message: 'Failed to cancel upload' });
    }
  }

  /**
   * Clear chat (soft delete all messages for the requesting user)
   */
  async clearChat(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { matchId } = req.params;

      const count = await messageService.clearChat(matchId, userId);

      res.status(200).json({
        success: true,
        message: `Cleared ${count} messages`,
      });
    } catch (error: any) {
      logger.error('Clear chat error:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to clear chat',
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