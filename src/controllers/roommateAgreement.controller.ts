// src/controllers/roommateAgreement.controller.ts
import { Response } from 'express';
import { AuthRequest } from '../types';
import roommateAgreementService from '../services/roommateAgreement.service';
import logger from '../utils/logger';

class RoommateAgreementController {
  /**
   * Get or create agreement for a match
   */
  getOrCreateAgreement = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId!;
      const { matchId } = req.params;

      const agreement = await roommateAgreementService.getOrCreateAgreement(matchId, userId);

      res.status(200).json({
        success: true,
        data: { agreement },
      });
    } catch (error: any) {
      logger.error('Get/create agreement error:', error);
      res.status(error.message.includes('not') ? 404 : 500).json({
        success: false,
        message: error.message || 'Failed to get agreement',
      });
    }
  };

  /**
   * Get agreement by match ID
   */
  getAgreement = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { matchId } = req.params;

      const agreement = await roommateAgreementService.getAgreementByMatch(matchId);

      res.status(200).json({
        success: true,
        data: { agreement },
      });
    } catch (error: any) {
      logger.error('Get agreement error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get agreement',
      });
    }
  };

  /**
   * Sign agreement
   */
  signAgreement = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId!;
      const { agreementId } = req.params;
      const { fullName, moveInDate, leaseEndDate, rentAmount, address } = req.body;

      if (!fullName || !fullName.trim()) {
        res.status(400).json({
          success: false,
          message: 'Full name is required',
        });
        return;
      }

      const agreement = await roommateAgreementService.signAgreement(
        agreementId,
        userId,
        { fullName, moveInDate, leaseEndDate, rentAmount, address }
      );

      res.status(200).json({
        success: true,
        message: 'Agreement signed!',
        data: { agreement },
      });
    } catch (error: any) {
      logger.error('Sign agreement error:', error);
      res.status(
        error.message.includes('already') ? 400 :
        error.message.includes('not part') ? 403 :
        error.message.includes('not found') ? 404 : 500
      ).json({
        success: false,
        message: error.message || 'Failed to sign agreement',
      });
    }
  };

  /**
   * Get all my agreements
   */
  getMyAgreements = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId!;

      const agreements = await roommateAgreementService.getMyAgreements(userId);

      res.status(200).json({
        success: true,
        data: { agreements, count: agreements.length },
      });
    } catch (error: any) {
      logger.error('Get my agreements error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get agreements',
      });
    }
  };
}

export default new RoommateAgreementController();
