import { Response } from 'express';
import { AuthRequest } from '../types';
import reviewService from '../services/review.service';
import logger from '../utils/logger';

class ReviewController {
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const review = await reviewService.createReview(req.user?.userId!, req.body);
      res.status(201).json({ success: true, data: review });
    } catch (error: any) {
      logger.error('Create review error:', error);
      const code = error.message.includes('Unauthorized') ? 403 : 400;
      res.status(code).json({ success: false, message: error.message });
    }
  }

  async getUserReviews(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await reviewService.getUserReviews(req.params.userId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getPropertyReviews(req: AuthRequest, res: Response): Promise<void> {
    try {
      const reviews = await reviewService.getPropertyReviews(req.params.propertyId);
      res.json({ success: true, data: reviews });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getPendingReviews(req: AuthRequest, res: Response): Promise<void> {
    try {
      const pending = await reviewService.getPendingReviews(req.user?.userId!);
      res.json({ success: true, data: pending });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async toggleVisibility(req: AuthRequest, res: Response): Promise<void> {
    try {
      const review = await reviewService.toggleVisibility(req.params.reviewId);
      res.json({ success: true, data: review });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

export default new ReviewController();
