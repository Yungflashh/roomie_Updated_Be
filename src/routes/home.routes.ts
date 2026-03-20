// src/routes/home.routes.ts
import { Router } from 'express';
import homeController from '../controllers/home.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/home/feed
 * @desc    Get aggregated home screen data (listings, roomies, matches, points) in one call
 * @access  Private
 * @query   city - optional city filter
 */
router.get('/feed', homeController.getHomeFeed);

export default router;
