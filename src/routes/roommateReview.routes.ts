import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { AuthRequest } from '../types';
import roommateReviewService from '../services/roommateReview.service';

const router = Router();
router.use(authenticate);

// Create a roommate review
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { revieweeId, overallRating, categories, comment, wouldRecommend, livedTogetherMonths } = req.body;
    const review = await roommateReviewService.createReview(req.user?.userId!, revieweeId, {
      overallRating,
      categories,
      comment,
      wouldRecommend,
      livedTogetherMonths,
    });
    res.status(201).json({ success: true, data: review });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get reviews for a specific user
router.get('/user/:userId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await roommateReviewService.getReviewsForUser(req.params.userId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get my pending reviews (matched users I haven't reviewed yet)
router.get('/pending', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const pending = await roommateReviewService.getMyPendingReviews(req.user?.userId!);
    res.json({ success: true, data: pending });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Update my review
router.put('/:reviewId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const review = await roommateReviewService.updateReview(req.user?.userId!, req.params.reviewId, req.body);
    res.json({ success: true, data: review });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete my review
router.delete('/:reviewId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await roommateReviewService.deleteReview(req.user?.userId!, req.params.reviewId);
    res.json({ success: true, message: 'Review deleted' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
