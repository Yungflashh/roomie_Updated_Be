// src/controllers/roommateFeatures.controller.ts
import { Response } from 'express';
import { AuthRequest } from '../types';
import roommateFeaturesService from '../services/roommateFeatures.service';
import logger from '../utils/logger';

class RoommateFeaturesController {
  // ==================== EXPENSES ====================

  createExpense = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId!;
      const { groupId } = req.params;
      
      const expense = await roommateFeaturesService.createExpense(
        groupId,
        userId,
        req.body
      );

      res.status(201).json({
        success: true,
        message: 'Expense created',
        data: { expense },
      });
    } catch (error: any) {
      logger.error('Create expense error:', error);
      res.status(error.message.includes('Invalid') || error.message.includes('not found') ? 403 : 500).json({
        success: false,
        message: error.message || 'Failed to create expense',
      });
    }
  };

  getExpenses = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { groupId } = req.params;
      const { status } = req.query;

      const expenses = await roommateFeaturesService.getExpenses(
        groupId,
        status as string
      );

      res.status(200).json({
        success: true,
        data: { expenses, count: expenses.length },
      });
    } catch (error: any) {
      logger.error('Get expenses error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get expenses',
      });
    }
  };

  markExpensePaid = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId!;
      const { expenseId } = req.params;
      const { paymentProof, paymentNote } = req.body;

      const expense = await roommateFeaturesService.markExpensePaid(
        expenseId, 
        userId,
        paymentProof,
        paymentNote
      );

      res.status(200).json({
        success: true,
        message: 'Payment marked! Waiting for verification.',
        data: { expense },
      });
    } catch (error: any) {
      logger.error('Mark expense paid error:', error);
      res.status(error.message.includes('not') ? 404 : 500).json({
        success: false,
        message: error.message || 'Failed to mark expense as paid',
      });
    }
  };

  verifyExpensePayment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId!;
      const { expenseId } = req.params;
      const { participantId, approved } = req.body;

      const expense = await roommateFeaturesService.verifyExpensePayment(
        expenseId,
        userId,
        participantId,
        approved === true
      );

      res.status(200).json({
        success: true,
        message: approved ? 'Payment verified! ✓' : 'Payment disputed.',
        data: { expense },
      });
    } catch (error: any) {
      logger.error('Verify expense payment error:', error);
      res.status(error.message.includes('Only') ? 403 : 500).json({
        success: false,
        message: error.message || 'Failed to verify payment',
      });
    }
  };

  deleteExpense = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId!;
      const { expenseId } = req.params;

      await roommateFeaturesService.deleteExpense(expenseId, userId);

      res.status(200).json({
        success: true,
        message: 'Expense deleted',
      });
    } catch (error: any) {
      logger.error('Delete expense error:', error);
      res.status(error.message.includes('Only') ? 403 : 500).json({
        success: false,
        message: error.message || 'Failed to delete expense',
      });
    }
  };

  getExpenseSummary = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { groupId } = req.params;

      const summary = await roommateFeaturesService.getExpenseSummary(groupId);

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error: any) {
      logger.error('Get expense summary error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get expense summary',
      });
    }
  };

  // ==================== CHORES ====================

  createChore = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId!;
      const { groupId } = req.params;

      const chore = await roommateFeaturesService.createChore(
        groupId,
        userId,
        req.body
      );

      res.status(201).json({
        success: true,
        message: 'Chore created',
        data: { chore },
      });
    } catch (error: any) {
      logger.error('Create chore error:', error);
      res.status(error.message.includes('Invalid') || error.message.includes('not found') ? 403 : 500).json({
        success: false,
        message: error.message || 'Failed to create chore',
      });
    }
  };

  getChores = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { groupId } = req.params;
      const { includeInactive } = req.query;

      const chores = await roommateFeaturesService.getChores(
        groupId,
        includeInactive === 'true'
      );

      res.status(200).json({
        success: true,
        data: { chores, count: chores.length },
      });
    } catch (error: any) {
      logger.error('Get chores error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get chores',
      });
    }
  };

  completeChore = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId!;
      const { choreId } = req.params;
      const { proofImage, notes } = req.body;

      const chore = await roommateFeaturesService.completeChore(
        choreId,
        userId,
        proofImage,
        notes
      );

      res.status(200).json({
        success: true,
        message: 'Chore marked as done! Waiting for roommate to verify.',
        data: { chore },
      });
    } catch (error: any) {
      logger.error('Complete chore error:', error);
      res.status(error.message.includes('not') ? 403 : 500).json({
        success: false,
        message: error.message || 'Failed to complete chore',
      });
    }
  };

  verifyChore = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId!;
      const { choreId } = req.params;
      const { approved } = req.body;

      const chore = await roommateFeaturesService.verifyChore(
        choreId,
        userId,
        approved === true
      );

      res.status(200).json({
        success: true,
        message: approved ? 'Chore verified! Points awarded. 🎉' : 'Chore disputed.',
        data: { chore },
      });
    } catch (error: any) {
      logger.error('Verify chore error:', error);
      res.status(error.message.includes('cannot') ? 403 : 500).json({
        success: false,
        message: error.message || 'Failed to verify chore',
      });
    }
  };

  transferChore = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId!;
      const { choreId } = req.params;
      const { targetUserId } = req.body;

      if (!targetUserId) {
        res.status(400).json({
          success: false,
          message: 'targetUserId is required',
        });
        return;
      }

      const result = await roommateFeaturesService.transferChore(choreId, userId, targetUserId);

      res.status(200).json({
        success: true,
        message: `Chore transferred! You spent ${result.pointsSpent} points. ⚡`,
        data: { chore: result.chore, pointsSpent: result.pointsSpent },
      });
    } catch (error: any) {
      logger.error('Transfer chore error:', error);
      res.status(error.message.includes('need') ? 400 : error.message.includes('not') ? 403 : 500).json({
        success: false,
        message: error.message || 'Failed to transfer chore',
      });
    }
  };

  skipChore = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId!;
      const { choreId } = req.params;

      const chore = await roommateFeaturesService.skipChore(choreId, userId);

      res.status(200).json({
        success: true,
        message: 'Chore skipped. -5 points penalty.',
        data: { chore },
      });
    } catch (error: any) {
      logger.error('Skip chore error:', error);
      res.status(error.message.includes('not') ? 403 : 500).json({
        success: false,
        message: error.message || 'Failed to skip chore',
      });
    }
  };

  deleteChore = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId!;
      const { choreId } = req.params;

      await roommateFeaturesService.deleteChore(choreId, userId);

      res.status(200).json({
        success: true,
        message: 'Chore deleted',
      });
    } catch (error: any) {
      logger.error('Delete chore error:', error);
      res.status(error.message.includes('Only') ? 403 : 500).json({
        success: false,
        message: error.message || 'Failed to delete chore',
      });
    }
  };

  getChoreStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { groupId } = req.params;

      const stats = await roommateFeaturesService.getChoreStats(groupId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Get chore stats error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get chore stats',
      });
    }
  };
}

export default new RoommateFeaturesController();