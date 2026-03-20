import { Response } from 'express';
import { AuthRequest } from '../types';
import rentalAgreementService from '../services/rentalAgreement.service';
import logger from '../utils/logger';

class RentalAgreementController {
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const agreement = await rentalAgreementService.createAgreement(req.params.inquiryId, req.user?.userId!, req.body);
      res.status(201).json({ success: true, data: agreement });
    } catch (error: any) {
      logger.error('Create rental agreement error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getAgreement(req: AuthRequest, res: Response): Promise<void> {
    try {
      const agreement = await rentalAgreementService.getAgreement(req.params.agreementId, req.user?.userId!);
      res.json({ success: true, data: agreement });
    } catch (error: any) {
      const code = error.message.includes('not found') ? 404 : error.message.includes('Unauthorized') ? 403 : 500;
      res.status(code).json({ success: false, message: error.message });
    }
  }

  async getByInquiry(req: AuthRequest, res: Response): Promise<void> {
    try {
      const agreement = await rentalAgreementService.getByInquiry(req.params.inquiryId);
      res.json({ success: true, data: agreement });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateTerms(req: AuthRequest, res: Response): Promise<void> {
    try {
      const agreement = await rentalAgreementService.updateTerms(req.params.agreementId, req.user?.userId!, req.body);
      res.json({ success: true, data: agreement });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async sign(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { fullName } = req.body;
      if (!fullName) { res.status(400).json({ success: false, message: 'fullName is required' }); return; }
      const agreement = await rentalAgreementService.signAgreement(req.params.agreementId, req.user?.userId!, fullName);
      res.json({ success: true, data: agreement });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getMyAgreements(req: AuthRequest, res: Response): Promise<void> {
    try {
      const agreements = await rentalAgreementService.getUserAgreements(req.user?.userId!);
      res.json({ success: true, data: agreements });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async terminate(req: AuthRequest, res: Response): Promise<void> {
    try {
      const agreement = await rentalAgreementService.terminateAgreement(req.params.agreementId, req.user?.userId!);
      res.json({ success: true, data: agreement });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

export default new RentalAgreementController();
