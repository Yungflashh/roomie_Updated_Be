"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/discovery.routes.ts
const express_1 = require("express");
const discovery_controller_1 = __importDefault(require("../controllers/discovery.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
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
router.get('/', discovery_controller_1.default.discoverUsers);
/**
 * @route   GET /api/v1/discover/filters
 * @desc    Get available filter options for UI
 * @access  Private
 */
router.get('/filters', discovery_controller_1.default.getFilterOptions);
/**
 * @route   GET /api/v1/discover/search
 * @desc    Search users by keyword
 * @access  Private
 * @query   q (keyword), limit
 */
router.get('/search', discovery_controller_1.default.searchUsers);
exports.default = router;
//# sourceMappingURL=discovery.routes.js.map