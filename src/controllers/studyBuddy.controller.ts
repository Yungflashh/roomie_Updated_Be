// src/controllers/studyBuddy.controller.ts
import { Response } from 'express';
import { AuthRequest } from '../types';
import studyBuddyService from '../services/studyBuddy.service';
import logger from '../utils/logger';

class StudyBuddyController {
  /**
   * Get all study categories
   * GET /api/v1/study-buddy
   */
  async getCategories(req: AuthRequest, res: Response): Promise<void> {
    try {
      const categories = studyBuddyService.getCategories();

      res.status(200).json({
        success: true,
        data: { categories },
      });
    } catch (error: any) {
      logger.error('Get categories error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get categories',
      });
    }
  }

  /**
   * Find study buddies by category
   * GET /api/v1/study-buddy/buddies?category=computer-science
   */
  async findBuddies(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { category } = req.query;

      if (!category) {
        res.status(400).json({
          success: false,
          message: 'Category is required',
        });
        return;
      }

      const buddies = await studyBuddyService.findStudyBuddies(userId, category as string);

      res.status(200).json({
        success: true,
        data: { buddies },
      });
    } catch (error: any) {
      logger.error('Find buddies error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to find study buddies',
      });
    }
  }

  /**
   * Create a solo study session
   * POST /api/v1/study-buddy/sessions/solo
   */
  async createSoloSession(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { category, questionCount } = req.body;

      if (!category) {
        res.status(400).json({
          success: false,
          message: 'Category is required',
        });
        return;
      }

      const session = await studyBuddyService.createSoloSession(userId, category, questionCount || 10);

      res.status(201).json({
        success: true,
        data: { session },
      });
    } catch (error: any) {
      logger.error('Create solo session error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create solo session',
      });
    }
  }

  /**
   * Create a challenge session
   * POST /api/v1/study-buddy/sessions/challenge
   */
  async createChallengeSession(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { opponentId, category, questionCount } = req.body;

      if (!opponentId || !category) {
        res.status(400).json({
          success: false,
          message: 'Opponent ID and category are required',
        });
        return;
      }

      const session = await studyBuddyService.createChallengeSession(userId, opponentId, category, questionCount || 10);

      res.status(201).json({
        success: true,
        data: { session },
      });
    } catch (error: any) {
      logger.error('Create challenge session error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create challenge session',
      });
    }
  }

  /**
   * Respond to a challenge
   * POST /api/v1/study-buddy/sessions/:sessionId/respond
   */
  async respondToChallenge(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { sessionId } = req.params;
      const { accept } = req.body;

      if (typeof accept !== 'boolean') {
        res.status(400).json({
          success: false,
          message: 'Accept (boolean) is required',
        });
        return;
      }

      const session = await studyBuddyService.respondToChallenge(sessionId, userId, accept);

      res.status(200).json({
        success: true,
        data: { session },
      });
    } catch (error: any) {
      logger.error('Respond to challenge error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to respond to challenge',
      });
    }
  }

  /**
   * Submit answers for a session
   * POST /api/v1/study-buddy/sessions/:sessionId/submit
   */
  async submitAnswers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { sessionId } = req.params;
      const { answers } = req.body;

      if (!answers || !Array.isArray(answers)) {
        res.status(400).json({
          success: false,
          message: 'Answers array is required',
        });
        return;
      }

      const session = await studyBuddyService.submitAnswers(sessionId, userId, answers);

      res.status(200).json({
        success: true,
        data: { session },
      });
    } catch (error: any) {
      logger.error('Submit answers error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to submit answers',
      });
    }
  }

  /**
   * Get a session by ID
   * GET /api/v1/study-buddy/sessions/:sessionId
   */
  async getSession(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;

      const session = await studyBuddyService.getSession(sessionId);

      res.status(200).json({
        success: true,
        data: { session },
      });
    } catch (error: any) {
      logger.error('Get session error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get session',
      });
    }
  }

  /**
   * Get user's session history
   * GET /api/v1/study-buddy/history?page=1&limit=20
   */
  async getUserHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { page = 1, limit = 20 } = req.query;

      const result = await studyBuddyService.getUserHistory(
        userId,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Get user history error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get history',
      });
    }
  }

  /**
   * Get leaderboard
   * GET /api/v1/study-buddy/leaderboard?category=computer-science&limit=20
   */
  async getLeaderboard(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { category = 'all', limit = 20 } = req.query;

      const leaderboard = await studyBuddyService.getLeaderboard(
        category as string,
        parseInt(limit as string)
      );

      res.status(200).json({
        success: true,
        data: { leaderboard },
      });
    } catch (error: any) {
      logger.error('Get leaderboard error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get leaderboard',
      });
    }
  }
}

export default new StudyBuddyController();
