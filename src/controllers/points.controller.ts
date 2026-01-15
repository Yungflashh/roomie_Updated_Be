// src/controllers/points.controller.ts
import { Response } from 'express';
import { AuthRequest } from '../types';
import pointsService from '../services/points.service';
import logger from '../utils/logger';

class PointsController {
  /**
   * Get user points statistics
   */
  async getPointsStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const stats = await pointsService.getUserPointStats(userId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Get points stats error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch points statistics',
      });
    }
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { page = 1, limit = 20, type } = req.query;

      const result = await pointsService.getTransactionHistory(
        userId,
        parseInt(page as string),
        parseInt(limit as string),
        type as string
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Get transaction history error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch transaction history',
      });
    }
  }

  /**
   * Claim daily login bonus
   */
  async claimDailyBonus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const result = await pointsService.awardDailyLoginBonus(userId);

      if (result.awarded) {
        res.status(200).json({
          success: true,
          message: 'Daily bonus claimed!',
          data: result,
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Daily bonus already claimed today',
        });
      }
    } catch (error: any) {
      logger.error('Claim daily bonus error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to claim daily bonus',
      });
    }
  }

  /**
   * Get points configuration
   */
  async getPointsConfig(req: AuthRequest, res: Response): Promise<void> {
    try {
      const config = await pointsService.getConfig();

      res.status(200).json({
        success: true,
        data: { config },
      });
    } catch (error: any) {
      logger.error('Get points config error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch points configuration',
      });
    }
  }

  /**
   * Check if user can afford action
   */
  async checkAffordability(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { action, targetId } = req.query;

      let cost = 0;
      let canAfford = false;
      let message = '';

      switch (action) {
        case 'match':
          cost = await pointsService.calculateMatchCost(userId);
          canAfford = await pointsService.hasEnoughPoints(userId, cost);
          message = canAfford ? 'Can send match request' : 'Insufficient points for match request';
          break;

        case 'game':
          if (!targetId) {
            res.status(400).json({
              success: false,
              message: 'Game ID required for game affordability check',
            });
            return;
          }
          cost = await pointsService.calculateGameCost(userId, targetId as string);
          canAfford = await pointsService.hasEnoughPoints(userId, cost);
          message = canAfford ? 'Can play game' : 'Insufficient points for game';
          break;

        default:
          res.status(400).json({
            success: false,
            message: 'Invalid action type',
          });
          return;
      }

      res.status(200).json({
        success: true,
        data: {
          action,
          cost,
          canAfford,
          message,
        },
      });
    } catch (error: any) {
      logger.error('Check affordability error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to check affordability',
      });
    }
  }
}

export default new PointsController();