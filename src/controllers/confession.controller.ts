// src/controllers/confession.controller.ts
import { Response } from 'express';
import { AuthRequest } from '../types';
import confessionService from '../services/confession.service';
import logger from '../utils/logger';

class ConfessionController {
  /**
   * Create an anonymous confession
   * POST /api/v1/confessions
   */
  async createConfession(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { groupId, content, category } = req.body;

      if (!groupId || !content) {
        res.status(400).json({
          success: false,
          message: 'Group ID and content are required',
        });
        return;
      }

      const confession = await confessionService.createConfession(groupId, userId, content, category);

      res.status(201).json({
        success: true,
        data: { confession },
      });
    } catch (error: any) {
      logger.error('Create confession error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create confession',
      });
    }
  }

  /**
   * Get confessions for a group
   * GET /api/v1/confessions/group/:groupId?page=1&limit=20&category=funny
   */
  async getGroupConfessions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { groupId } = req.params;
      const { page = 1, limit = 20, category } = req.query;

      const result = await confessionService.getGroupConfessions(
        groupId,
        userId,
        parseInt(page as string),
        parseInt(limit as string),
        category as string
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Get group confessions error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get confessions',
      });
    }
  }

  /**
   * Add a reaction to a confession
   * POST /api/v1/confessions/:confessionId/react
   */
  async addReaction(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { confessionId } = req.params;
      const { emoji } = req.body;

      if (!emoji) {
        res.status(400).json({
          success: false,
          message: 'Emoji is required',
        });
        return;
      }

      const confession = await confessionService.addReaction(confessionId, userId, emoji);

      res.status(200).json({
        success: true,
        data: { confession },
      });
    } catch (error: any) {
      logger.error('Add reaction error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to add reaction',
      });
    }
  }

  /**
   * Add an anonymous reply to a confession
   * POST /api/v1/confessions/:confessionId/reply
   */
  async addReply(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { confessionId } = req.params;
      const { content } = req.body;

      if (!content) {
        res.status(400).json({
          success: false,
          message: 'Content is required',
        });
        return;
      }

      const confession = await confessionService.addReply(confessionId, userId, content);

      res.status(200).json({
        success: true,
        data: { confession },
      });
    } catch (error: any) {
      logger.error('Add reply error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to add reply',
      });
    }
  }

  /**
   * Add a reaction to a reply
   * POST /api/v1/confessions/:confessionId/replies/:replyIndex/react
   */
  async addReplyReaction(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { confessionId, replyIndex } = req.params;
      const { emoji } = req.body;

      if (!emoji) {
        res.status(400).json({
          success: false,
          message: 'Emoji is required',
        });
        return;
      }

      const confession = await confessionService.addReplyReaction(
        confessionId,
        parseInt(replyIndex),
        userId,
        emoji
      );

      res.status(200).json({
        success: true,
        data: { confession },
      });
    } catch (error: any) {
      logger.error('Add reply reaction error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to add reaction to reply',
      });
    }
  }

  /**
   * Report a confession
   * POST /api/v1/confessions/:confessionId/report
   */
  async reportConfession(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { confessionId } = req.params;

      const confession = await confessionService.reportConfession(confessionId, userId);

      res.status(200).json({
        success: true,
        message: 'Confession reported',
        data: { confession },
      });
    } catch (error: any) {
      logger.error('Report confession error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to report confession',
      });
    }
  }

  /**
   * Delete a confession (admin only)
   * DELETE /api/v1/confessions/:confessionId
   */
  async deleteConfession(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { confessionId } = req.params;

      await confessionService.deleteConfession(confessionId, userId);

      res.status(200).json({
        success: true,
        message: 'Confession deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete confession error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete confession',
      });
    }
  }
}

export default new ConfessionController();
