import { Response } from 'express';
import { AuthRequest } from '../types';
import challengeService from '../services/challenge.service';
import logger from '../utils/logger';

class ChallengeController {
  async getActiveChallenges(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { type } = req.query;
      const userId = req.user?.userId;
      const challenges = await challengeService.getActiveChallenges(
        type as 'daily' | 'weekly' | 'monthly',
        userId
      );

      res.status(200).json({
        success: true,
        data: { challenges },
      });
    } catch (error) {
      logger.error('Get active challenges error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch challenges',
      });
    }
  }

  async getChallenge(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { challengeId } = req.params;
      const challenge = await challengeService.getChallengeById(challengeId);

      res.status(200).json({
        success: true,
        data: { challenge },
      });
    } catch (error: any) {
      logger.error('Get challenge error:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to fetch challenge',
      });
    }
  }

  async joinChallenge(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { challengeId } = req.params;

      const challenge = await challengeService.joinChallenge(challengeId, userId);

      res.status(200).json({
        success: true,
        message: 'Joined challenge successfully',
        data: { challenge },
      });
    } catch (error: any) {
      logger.error('Join challenge error:', error);
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to join challenge',
      });
    }
  }

  async updateProgress(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { challengeId } = req.params;
      const { progress } = req.body;

      const challenge = await challengeService.updateProgress(
        challengeId,
        userId,
        progress
      );

      res.status(200).json({
        success: true,
        message: 'Progress updated',
        data: { challenge },
      });
    } catch (error: any) {
      logger.error('Update progress error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update progress',
      });
    }
  }

  async getUserChallenges(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const challenges = await challengeService.getUserChallenges(userId);

      res.status(200).json({
        success: true,
        data: { challenges },
      });
    } catch (error) {
      logger.error('Get user challenges error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user challenges',
      });
    }
  }

  async getGlobalLeaderboard(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { limit = 10, type } = req.query;
      const leaderboard = await challengeService.getGlobalLeaderboard(
        parseInt(limit as string),
        type as string | undefined
      );

      res.status(200).json({
        success: true,
        data: leaderboard,
      });
    } catch (error) {
      logger.error('Get global leaderboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch leaderboard',
      });
    }
  }

  async getChallengeLeaderboard(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { challengeId } = req.params;
      const { limit = 10 } = req.query;

      const leaderboard = await challengeService.getChallengeLeaderboard(
        challengeId,
        parseInt(limit as string)
      );

      res.status(200).json({
        success: true,
        data: { leaderboard },
      });
    } catch (error: any) {
      logger.error('Get challenge leaderboard error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch leaderboard',
      });
    }
  }
}

export default new ChallengeController();
