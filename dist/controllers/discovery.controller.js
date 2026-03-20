"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discovery_service_1 = __importDefault(require("../services/discovery.service"));
const cache_service_1 = __importDefault(require("../services/cache.service"));
const points_service_1 = __importDefault(require("../services/points.service"));
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = __importDefault(require("../utils/logger"));
class DiscoveryController {
    /**
     * Aggregated discovery feed — single endpoint for the Discovery screen
     * Returns: users, filterOptions, pointsStats, pointsConfig
     */
    async getDiscoveryFeed(req, res) {
        try {
            const userId = req.user?.userId;
            const filters = {
                page: req.query.page ? Number(req.query.page) : 1,
                limit: req.query.limit ? Number(req.query.limit) : 20,
                sortBy: req.query.sortBy || 'newest',
                city: req.query.city,
                state: req.query.state,
            };
            const filtersHash = crypto_1.default.createHash('md5')
                .update(JSON.stringify(filters))
                .digest('hex')
                .slice(0, 12);
            const [usersResult, filterOptions, pointsStats, pointsConfig] = await Promise.all([
                // No cache — subscription/boost data must be fresh
                discovery_service_1.default.discoverUsers(userId, filters),
                cache_service_1.default.getOrSet('discovery:filter_options', () => discovery_service_1.default.getFilterOptions(), 600),
                cache_service_1.default.getOrSet(cache_service_1.default.pointsStatsKey(userId), () => points_service_1.default.getUserPointStats(userId), 120),
                cache_service_1.default.getOrSet(cache_service_1.default.pointsConfigKey(), () => points_service_1.default.getConfig(), 600),
            ]);
            res.status(200).json({
                success: true,
                data: {
                    ...usersResult,
                    filterOptions,
                    pointsStats,
                    pointsConfig,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Discovery feed error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch discovery feed',
            });
        }
    }
    /**
     * Discover users with filters
     */
    async discoverUsers(req, res) {
        try {
            const userId = req.user?.userId;
            // Parse query parameters into filters
            const filters = {
                // Location
                city: req.query.city,
                state: req.query.state,
                country: req.query.country,
                maxDistance: req.query.maxDistance ? Number(req.query.maxDistance) : undefined,
                // Budget
                minBudget: req.query.minBudget ? Number(req.query.minBudget) : undefined,
                maxBudget: req.query.maxBudget ? Number(req.query.maxBudget) : undefined,
                // Preferences
                roomType: req.query.roomType,
                petFriendly: req.query.petFriendly === 'true' ? true : req.query.petFriendly === 'false' ? false : undefined,
                smoking: req.query.smoking === 'true' ? true : req.query.smoking === 'false' ? false : undefined,
                // Personal
                gender: req.query.gender,
                minAge: req.query.minAge ? Number(req.query.minAge) : undefined,
                maxAge: req.query.maxAge ? Number(req.query.maxAge) : undefined,
                occupation: req.query.occupation,
                // Lifestyle
                sleepSchedule: req.query.sleepSchedule,
                minCleanliness: req.query.minCleanliness ? Number(req.query.minCleanliness) : undefined,
                maxCleanliness: req.query.maxCleanliness ? Number(req.query.maxCleanliness) : undefined,
                minSocialLevel: req.query.minSocialLevel ? Number(req.query.minSocialLevel) : undefined,
                maxSocialLevel: req.query.maxSocialLevel ? Number(req.query.maxSocialLevel) : undefined,
                guestFrequency: req.query.guestFrequency,
                workFromHome: req.query.workFromHome === 'true' ? true : req.query.workFromHome === 'false' ? false : undefined,
                // Interests
                interests: req.query.interests ? req.query.interests.split(',') : undefined,
                // Verification
                verifiedOnly: req.query.verifiedOnly === 'true',
                // Pagination
                page: req.query.page ? Number(req.query.page) : 1,
                limit: req.query.limit ? Number(req.query.limit) : 20,
                // Sorting
                sortBy: req.query.sortBy,
                sortOrder: req.query.sortOrder,
            };
            // Handle coordinates for distance search
            if (req.query.longitude && req.query.latitude) {
                filters.coordinates = [
                    Number(req.query.longitude),
                    Number(req.query.latitude),
                ];
            }
            logger_1.default.info(`User ${userId} discovering with filters:`, filters);
            // Hash the filters to build a stable cache key
            const filtersHash = crypto_1.default.createHash('md5')
                .update(JSON.stringify(filters))
                .digest('hex')
                .slice(0, 12);
            const result = await cache_service_1.default.getOrSet(cache_service_1.default.discoveryKey(userId, filtersHash), () => discovery_service_1.default.discoverUsers(userId, filters), 120);
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            logger_1.default.error('Discover users error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to discover users',
            });
        }
    }
    /**
     * Get filter options for UI
     */
    async getFilterOptions(req, res) {
        try {
            // Filter options rarely change — cache for 10 minutes
            const options = await cache_service_1.default.getOrSet('discovery:filter_options', () => discovery_service_1.default.getFilterOptions(), 600);
            res.status(200).json({
                success: true,
                data: options,
            });
        }
        catch (error) {
            logger_1.default.error('Get filter options error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get filter options',
            });
        }
    }
    /**
     * Search users by keyword
     */
    async searchUsers(req, res) {
        try {
            const userId = req.user?.userId;
            const keyword = req.query.q;
            const limit = req.query.limit ? Number(req.query.limit) : 20;
            if (!keyword || keyword.length < 2) {
                res.status(400).json({
                    success: false,
                    message: 'Search keyword must be at least 2 characters',
                });
                return;
            }
            const users = await discovery_service_1.default.searchUsers(userId, keyword, limit);
            res.status(200).json({
                success: true,
                data: { users },
            });
        }
        catch (error) {
            logger_1.default.error('Search users error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to search users',
            });
        }
    }
}
exports.default = new DiscoveryController();
//# sourceMappingURL=discovery.controller.js.map