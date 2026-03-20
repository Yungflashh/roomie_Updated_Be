// src/controllers/groupAgreement.controller.ts
import { Response } from 'express';
import { AuthRequest } from '../types';
import groupAgreementService from '../services/groupAgreement.service';
import logger from '../utils/logger';

class GroupAgreementController {
  getOrCreateAgreement = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId!;
      const { groupId } = req.params;

      const agreement = await groupAgreementService.getOrCreateAgreement(groupId, userId);

      res.status(200).json({
        success: true,
        data: { agreement },
      });
    } catch (error: any) {
      logger.error('Get/create group agreement error:', error);
      res.status(error.message.includes('not') ? 404 : 500).json({
        success: false,
        message: error.message || 'Failed to get agreement',
      });
    }
  };

  getAgreement = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { groupId } = req.params;

      const agreement = await groupAgreementService.getAgreementByGroup(groupId);

      res.status(200).json({
        success: true,
        data: { agreement },
      });
    } catch (error: any) {
      logger.error('Get group agreement error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get agreement',
      });
    }
  };

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

      const agreement = await groupAgreementService.signAgreement(
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
      logger.error('Sign group agreement error:', error);
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
}

export default new GroupAgreementController();
