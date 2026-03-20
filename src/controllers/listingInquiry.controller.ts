import { Response } from 'express';
import { AuthRequest } from '../types';
import listingInquiryService from '../services/listingInquiry.service';
import logger from '../utils/logger';

class ListingInquiryController {
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { listerId, propertyId } = req.body;
      if (!listerId || !propertyId) { res.status(400).json({ success: false, message: 'listerId and propertyId are required' }); return; }

      const inquiry = await listingInquiryService.createInquiry(userId, listerId, propertyId);
      res.status(201).json({ success: true, data: inquiry });
    } catch (error: any) {
      logger.error('Create inquiry error:', error);
      res.status(error.message.includes('yourself') ? 400 : 500).json({ success: false, message: error.message });
    }
  }

  async getInquiry(req: AuthRequest, res: Response): Promise<void> {
    try {
      const inquiry = await listingInquiryService.getInquiry(req.params.inquiryId, req.user?.userId!);
      res.json({ success: true, data: inquiry });
    } catch (error: any) {
      const code = error.message.includes('not found') ? 404 : error.message.includes('Unauthorized') ? 403 : 500;
      res.status(code).json({ success: false, message: error.message });
    }
  }

  async getMyInquiries(req: AuthRequest, res: Response): Promise<void> {
    try {
      const inquiries = await listingInquiryService.getSeekerInquiries(req.user?.userId!);
      res.json({ success: true, data: inquiries });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getMyListingInquiries(req: AuthRequest, res: Response): Promise<void> {
    try {
      const inquiries = await listingInquiryService.getListerInquiries(req.user?.userId!);
      res.json({ success: true, data: inquiries });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async requestViewing(req: AuthRequest, res: Response): Promise<void> {
    try {
      const inquiry = await listingInquiryService.requestViewing(req.params.inquiryId, req.user?.userId!, req.body);
      res.json({ success: true, data: inquiry });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async respondToViewing(req: AuthRequest, res: Response): Promise<void> {
    try {
      const inquiry = await listingInquiryService.respondToViewing(req.params.inquiryId, req.user?.userId!, req.body);
      res.json({ success: true, data: inquiry });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async completeViewing(req: AuthRequest, res: Response): Promise<void> {
    try {
      const inquiry = await listingInquiryService.completeViewing(req.params.inquiryId, req.user?.userId!);
      res.json({ success: true, data: inquiry });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async cancelViewing(req: AuthRequest, res: Response): Promise<void> {
    try {
      const inquiry = await listingInquiryService.cancelViewing(req.params.inquiryId, req.user?.userId!);
      res.json({ success: true, data: inquiry });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async makeOffer(req: AuthRequest, res: Response): Promise<void> {
    try {
      const inquiry = await listingInquiryService.makeOffer(req.params.inquiryId, req.user?.userId!, req.body);
      res.json({ success: true, data: inquiry });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async respondToOffer(req: AuthRequest, res: Response): Promise<void> {
    try {
      const inquiry = await listingInquiryService.respondToOffer(req.params.inquiryId, req.user?.userId!, req.body);
      res.json({ success: true, data: inquiry });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async withdraw(req: AuthRequest, res: Response): Promise<void> {
    try {
      const inquiry = await listingInquiryService.withdrawInquiry(req.params.inquiryId, req.user?.userId!);
      res.json({ success: true, data: inquiry });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

export default new ListingInquiryController();
