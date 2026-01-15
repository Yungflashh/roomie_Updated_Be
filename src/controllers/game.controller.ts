// src/controllers/game.controller.ts
import { Response } from 'express';
import { AuthRequest } from '../types';
import gameService from '../services/game.service';
import logger from '../utils/logger';

class GameController {
  /**
   * Get all available games
   */
  async getAllGames(req: AuthRequest, res: Response): Promise<void> {
    try {
      const games = await gameService.getAllGames();

      res.status(200).json({
        success: true,
        data: { games },
      });
    } catch (error) {
      logger.error('Get all games error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch games',
      });
    }
  }

  /**
   * Get game details
   */
  async getGame(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { gameId } = req.params;
      const game = await gameService.getGameById(gameId);

      res.status(200).json({
        success: true,
        data: { game },
      });
    } catch (error: any) {
      logger.error('Get game error:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to fetch game',
      });
    }
  }

  /**
   * Send game invitation
   */
  async sendInvitation(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { gameId, invitedUserId, matchId } = req.body;

      if (!gameId || !invitedUserId || !matchId) {
        res.status(400).json({
          success: false,
          message: 'gameId, invitedUserId, and matchId are required',
        });
        return;
      }

      const session = await gameService.sendGameInvitation(
        gameId,
        userId,
        invitedUserId,
        matchId
      );

      res.status(201).json({
        success: true,
        message: 'Game invitation sent',
        data: { session },
      });
    } catch (error: any) {
      logger.error('Send invitation error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to send invitation',
      });
    }
  }

  /**
   * Respond to game invitation
   */
  async respondToInvitation(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { sessionId } = req.params;
      const { accept } = req.body;

      if (typeof accept !== 'boolean') {
        res.status(400).json({
          success: false,
          message: 'accept must be a boolean',
        });
        return;
      }

      const session = await gameService.respondToInvitation(sessionId, userId, accept);

      res.status(200).json({
        success: true,
        message: accept ? 'Invitation accepted' : 'Invitation declined',
        data: { session },
      });
    } catch (error: any) {
      logger.error('Respond to invitation error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to respond to invitation',
      });
    }
  }

  /**
   * Cancel game invitation
   */
  async cancelInvitation(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { sessionId } = req.params;

      await gameService.cancelInvitation(sessionId, userId);

      res.status(200).json({
        success: true,
        message: 'Invitation cancelled',
      });
    } catch (error: any) {
      logger.error('Cancel invitation error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to cancel invitation',
      });
    }
  }

  /**
   * Get game session
   */
  async getSession(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const session = await gameService.getGameSession(sessionId);

      res.status(200).json({
        success: true,
        data: { session },
      });
    } catch (error: any) {
      logger.error('Get session error:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to fetch session',
      });
    }
  }

  /**
   * Get active game session for a match
   */
  async getActiveSession(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { matchId } = req.params;
      const session = await gameService.getActiveGameSession(matchId);

      res.status(200).json({
        success: true,
        data: { session },
      });
    } catch (error: any) {
      logger.error('Get active session error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch active session',
      });
    }
  }

  /**
   * Start game session
   */
  async startSession(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { sessionId } = req.params;

      const session = await gameService.startGameSession(sessionId, userId);

      res.status(200).json({
        success: true,
        message: 'Game session started',
        data: { session },
      });
    } catch (error: any) {
      logger.error('Start session error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to start session',
      });
    }
  }

  /**
   * Submit answer (legacy - single answer)
   */
  async submitAnswer(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { sessionId } = req.params;
      const { questionIndex, answer, timeSpent } = req.body;

      const result = await gameService.submitAnswer(
        sessionId,
        userId,
        questionIndex,
        answer,
        timeSpent
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Submit answer error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to submit answer',
      });
    }
  }

  /**
   * Submit all answers at once when player completes game
   */
  async submitAllAnswers(req: AuthRequest, res: Response): Promise<void> {
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

      const result = await gameService.submitAllAnswers(sessionId, userId, answers);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Submit all answers error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to submit answers',
      });
    }
  }

  /**
   * Complete game session
   */
  async completeSession(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const session = await gameService.completeGameSession(sessionId);

      res.status(200).json({
        success: true,
        message: 'Game session completed',
        data: { session },
      });
    } catch (error: any) {
      logger.error('Complete session error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to complete session',
      });
    }
  }

  /**
   * Get user's game history
   */
  async getGameHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { page = 1, limit = 20 } = req.query;

      const result = await gameService.getUserGameHistory(
        userId,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Get game history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch game history',
      });
    }
  }

  /**
   * Get game leaderboard
   */
  async getLeaderboard(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { gameId } = req.params;
      const { limit = 10 } = req.query;

      const leaderboard = await gameService.getGameLeaderboard(
        gameId,
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
        message: error.message || 'Failed to fetch leaderboard',
      });
    }
  }


  // ADD THESE TWO METHODS TO YOUR src/controllers/game.controller.ts
// Place them after the getLeaderboard method, before the closing bracket

  /**
   * Get games available for user (filtered by level)
   */
  async getAvailableGames(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const result = await gameService.getAvailableGamesForUser(userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Get available games error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch available games',
      });
    }
  }

  /**
   * Check if user can play specific game
   */
  async canPlayGame(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { gameId } = req.params;

      const result = await gameService.canUserPlayGame(userId, gameId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Can play game error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to check game availability',
      });
    }
  }
}

export default new GameController();