// src/routes/discovery.routes.ts
import { Router } from 'express';
import discoveryController from '../controllers/discovery.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/discover
 * @desc    Discover users with advanced filters
 * @access  Private
 * @query   city, state, country, maxDistance, longitude, latitude
 * @query   minBudget, maxBudget, roomType, petFriendly, smoking
 * @query   gender, minAge, maxAge, occupation
 * @query   sleepSchedule, minCleanliness, maxCleanliness
 * @query   minSocialLevel, maxSocialLevel, guestFrequency, workFromHome
 * @query   interests (comma-separated), verifiedOnly
 * @query   page, limit, sortBy, sortOrder
 */
router.get('/', discoveryController.discoverUsers);

/**
 * @route   GET /api/v1/discover/filters
 * @desc    Get available filter options for UI
 * @access  Private
 */
router.get('/filters', discoveryController.getFilterOptions);

/**
 * @route   GET /api/v1/discover/search
 * @desc    Search users by keyword
 * @access  Private
 * @query   q (keyword), limit
 */
router.get('/search', discoveryController.searchUsers);

export default router;