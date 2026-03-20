import { Router } from 'express';
import reviewController from '../controllers/review.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

// Create review
router.post('/', reviewController.create);

// Pending reviews for me
router.get('/pending', reviewController.getPendingReviews);

// Reviews for a user
router.get('/user/:userId', reviewController.getUserReviews);

// Reviews for a property
router.get('/property/:propertyId', reviewController.getPropertyReviews);

export default router;
