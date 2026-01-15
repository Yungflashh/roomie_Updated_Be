// src/controllers/match.controller.ts - COMPLETE WITH DISTANCE SORTING
import { Response } from 'express';
import { AuthRequest } from '../types';
import matchService from '../services/match.service';
import logger from '../utils/logger';

class MatchController {
  /**
   * Get potential matches (with distance sorting support)
   */
  async getPotentialMatches(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { 
        limit = 20, 
        minCompatibility = 50,
        sort = 'compatibility' // NEW: Add sort parameter
      } = req.query;

      const matches = await matchService.getPotentialMatches(
        userId,
        parseInt(limit as string),
        parseInt(minCompatibility as string),
        sort as 'compatibility' | 'distance' // NEW: Pass sort type to service
      );

      res.status(200).json({
        success: true,
        data: {
          matches,
          total: matches.length,
        },
      });
    } catch (error: any) {
      logger.error('Get potential matches error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch potential matches',
      });
    }
  }

  /**
   * Get sent likes (users I have liked)
   */
  async getSentLikes(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const likes = await matchService.getSentLikes(userId);

      res.status(200).json({
        success: true,
        data: {
          likes,
          total: likes.length,
        },
      });
    } catch (error) {
      logger.error('Get sent likes error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch sent likes',
      });
    }
  }

  /**
   * Like a user
   */
  async likeUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { targetUserId } = req.params;

      const result = await matchService.likeUser(userId, targetUserId);

      if (result.isMatch) {
        res.status(200).json({
          success: true,
          message: "It's a match!",
          data: result,
        });
      } else {
        res.status(200).json({
          success: true,
          message: 'User liked',
          data: result,
        });
      }
    } catch (error: any) {
      logger.error('Like user error:', error);
      
      const statusCode = error.message.includes('Cannot') ? 400 :
                         error.message.includes('not found') ? 404 : 500;
      
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to like user',
      });
    }
  }

  /**
   * Pass a user
   */
  async passUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { targetUserId } = req.params;

      await matchService.passUser(userId, targetUserId);

      res.status(200).json({
        success: true,
        message: 'User passed',
      });
    } catch (error) {
      logger.error('Pass user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to pass user',
      });
    }
  }

  /**
   * Get user's matches
   */
  async getMatches(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { page = 1, limit = 20 } = req.query;

      const result = await matchService.getMatches(
        userId,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Get matches error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch matches',
      });
    }
  }

  /**
   * Get match details
   */
  async getMatchDetails(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { matchId } = req.params;

      const match = await matchService.getMatchDetails(userId, matchId);

      res.status(200).json({
        success: true,
        data: { match },
      });
    } catch (error: any) {
      logger.error('Get match details error:', error);
      
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to fetch match details',
      });
    }
  }

  /**
   * Unmatch a user
   */
  async unmatch(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { matchId } = req.params;

      await matchService.unmatch(userId, matchId);

      res.status(200).json({
        success: true,
        message: 'Unmatched successfully',
      });
    } catch (error: any) {
      logger.error('Unmatch error:', error);
      
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to unmatch',
      });
    }
  }

  /**
   * Get likes (users who liked current user)
   */
  async getLikes(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const likes = await matchService.getLikes(userId);

      res.status(200).json({
        success: true,
        data: {
          likes,
          total: likes.length,
        },
      });
    } catch (error) {
      logger.error('Get likes error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch likes',
      });
    }
  }
}

export default new MatchController();