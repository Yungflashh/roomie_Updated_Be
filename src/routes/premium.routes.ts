import { Router } from 'express';
import premiumController from '../controllers/premium.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

// Get premium status + available plans
router.get('/status', premiumController.getStatus);

// Subscribe to a plan
router.post('/subscribe', premiumController.subscribe);

// Verify subscription payment
router.post('/verify', premiumController.verifySubscription);

// Cancel subscription
router.post('/cancel', premiumController.cancel);

// Boost profile (premium only)
router.post('/boost', premiumController.boost);

// Get profile visitors (premium only)
router.get('/visitors', premiumController.getVisitors);

// Rewind last pass (premium only)
router.post('/rewind', premiumController.rewind);

// Check swipe limit
router.get('/swipe-limit', premiumController.checkSwipeLimit);

export default router;
