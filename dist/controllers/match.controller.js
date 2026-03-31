"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const match_service_1 = __importDefault(require("../services/match.service"));
const cache_service_1 = __importDefault(require("../services/cache.service"));
const points_service_1 = __importDefault(require("../services/points.service"));
const logger_1 = __importDefault(require("../utils/logger"));
const audit_1 = require("../utils/audit");
class MatchController {
    /**
     * Aggregated matches feed — single endpoint for the Matches screen
     * Returns: forYou, nearYou, received, sent, matches, pointsStats, pointsConfig
     */
    async getMatchesFeed(req, res) {
        try {
            const userId = req.user?.userId;
            const { maxDistance = 10, lat, lng } = req.query;
            const liveCoords = lat && lng
                ? [parseFloat(lng), parseFloat(lat)]
                : undefined;
            const maxDist = parseFloat(maxDistance);
            // Build cache keys
            const forYouCacheKey = cache_service_1.default.forYouKey(userId);
            const nearYouCacheKey = cache_service_1.default.nearYouKey(userId, maxDist, liveCoords ? liveCoords[1] : undefined, liveCoords ? liveCoords[0] : undefined);
            // Run all queries in parallel — each individually cached
            const [forYou, nearYou, received, sent, matches, pointsStats, pointsConfig] = await Promise.all([
                cache_service_1.default.getOrSet(forYouCacheKey, () => match_service_1.default.getPotentialMatches(userId, 20, 0, 'compatibility'), 180),
                cache_service_1.default.getOrSet(nearYouCacheKey, () => match_service_1.default.getPotentialMatches(userId, 20, 0, 'distance', liveCoords, maxDist), 180),
                cache_service_1.default.getOrSet(cache_service_1.default.receivedRequestsKey(userId), () => match_service_1.default.getLikes(userId), 120),
                cache_service_1.default.getOrSet(cache_service_1.default.sentRequestsKey(userId), () => match_service_1.default.getSentLikes(userId), 120),
                cache_service_1.default.getOrSet(cache_service_1.default.matchesListKey(userId), () => match_service_1.default.getMatches(userId, 1, 50, true), 120),
                cache_service_1.default.getOrSet(cache_service_1.default.pointsStatsKey(userId), () => points_service_1.default.getUserPointStats(userId), 120),
                cache_service_1.default.getOrSet(cache_service_1.default.pointsConfigKey(), () => points_service_1.default.getConfig(), 600),
            ]);
            res.status(200).json({
                success: true,
                data: {
                    forYou,
                    nearYou,
                    received,
                    sent,
                    matches: matches.matches || [],
                    matchesPagination: matches.pagination,
                    pointsStats,
                    pointsConfig,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Get matches feed error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch matches feed',
            });
        }
    }
    /**
     * Refresh only Near You data — lightweight endpoint for distance changes
     */
    async refreshNearYou(req, res) {
        try {
            const userId = req.user?.userId;
            const { maxDistance = 10, lat, lng } = req.query;
            const liveCoords = lat && lng
                ? [parseFloat(lng), parseFloat(lat)]
                : undefined;
            const maxDist = parseFloat(maxDistance);
            const cacheKey = cache_service_1.default.nearYouKey(userId, maxDist, liveCoords ? liveCoords[1] : undefined, liveCoords ? liveCoords[0] : undefined);
            const nearYou = await cache_service_1.default.getOrSet(cacheKey, () => match_service_1.default.getPotentialMatches(userId, 20, 0, 'distance', liveCoords, maxDist), 180);
            res.status(200).json({
                success: true,
                data: { nearYou },
            });
        }
        catch (error) {
            logger_1.default.error('Refresh near you error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to refresh nearby matches',
            });
        }
    }
    /**
     * Get potential matches (with distance sorting support)
     */
    async getPotentialMatches(req, res) {
        try {
            const userId = req.user?.userId;
            const { limit = 20, minCompatibility = 50, sort = 'compatibility', lat, lng, maxDistance, } = req.query;
            // If live coordinates provided, use them for distance sorting
            const liveCoords = lat && lng
                ? [parseFloat(lng), parseFloat(lat)]
                : undefined;
            const sortType = sort;
            const maxDist = maxDistance ? parseFloat(maxDistance) : undefined;
            // Build cache key based on sort type
            const cacheKey = sortType === 'distance'
                ? cache_service_1.default.nearYouKey(userId, maxDist || 0, liveCoords ? liveCoords[1] : undefined, liveCoords ? liveCoords[0] : undefined)
                : cache_service_1.default.forYouKey(userId);
            // 3 min cache for matches
            const matches = await cache_service_1.default.getOrSet(cacheKey, () => match_service_1.default.getPotentialMatches(userId, parseInt(limit), parseInt(minCompatibility), sortType, liveCoords, maxDist), 180);
            res.status(200).json({
                success: true,
                data: {
                    matches,
                    total: matches.length,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Get potential matches error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch potential matches',
            });
        }
    }
    /**
     * Get sent likes (users I have liked)
     */
    async getSentLikes(req, res) {
        try {
            const userId = req.user?.userId;
            const likes = await cache_service_1.default.getOrSet(cache_service_1.default.sentRequestsKey(userId), () => match_service_1.default.getSentLikes(userId), 120);
            res.status(200).json({
                success: true,
                data: {
                    likes,
                    total: likes.length,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Get sent likes error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch sent likes',
            });
        }
    }
    /**
     * Like a user
     */
    async likeUser(req, res) {
        try {
            const userId = req.user?.userId;
            const { targetUserId } = req.params;
            const result = await match_service_1.default.likeUser(userId, targetUserId);
            // Bust caches for both users after interaction
            await cache_service_1.default.onUserInteraction(userId, targetUserId);
            // Points changed due to match request cost
            await cache_service_1.default.onPointsChange(userId);
            await (0, audit_1.logAudit)({
                actor: { id: userId, name: '', email: '' },
                actorType: 'user', action: 'like_user', category: 'matching',
                target: { type: 'user', id: targetUserId },
                details: result.isMatch ? 'Liked user - Match created!' : 'Liked user', req,
                metadata: { isMatch: result.isMatch }
            });
            if (result.isMatch) {
                res.status(200).json({
                    success: true,
                    message: "It's a match!",
                    data: result,
                });
            }
            else {
                res.status(200).json({
                    success: true,
                    message: 'User liked',
                    data: result,
                });
            }
        }
        catch (error) {
            logger_1.default.error('Like user error:', error);
            const statusCode = error.message.includes('Cannot') ? 400 :
                error.message.includes('not found') ? 404 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Failed to like user',
            });
        }
    }
    /**
     * Send a match request (visible, costs more points)
     */
    async sendMatchRequest(req, res) {
        try {
            const userId = req.user?.userId;
            const { targetUserId } = req.params;
            const result = await match_service_1.default.sendMatchRequest(userId, targetUserId);
            await cache_service_1.default.onUserInteraction(userId, targetUserId);
            await cache_service_1.default.onPointsChange(userId);
            res.status(200).json({
                success: true,
                message: result.isMatch ? "It's a match!" : 'Match request sent',
                data: result,
            });
        }
        catch (error) {
            logger_1.default.error('Send match request error:', error);
            const statusCode = error.message.includes('Cannot') || error.message.includes('yourself') ? 400 :
                error.message.includes('not found') ? 404 :
                    error.message.includes('Requires') ? 402 : 500;
            res.status(statusCode).json({ success: false, message: error.message || 'Failed to send request' });
        }
    }
    /**
     * Pass a user
     */
    async passUser(req, res) {
        try {
            const userId = req.user?.userId;
            const { targetUserId } = req.params;
            await match_service_1.default.passUser(userId, targetUserId);
            // Bust caches after pass/decline
            await cache_service_1.default.onUserInteraction(userId, targetUserId);
            await (0, audit_1.logAudit)({
                actor: { id: userId, name: '', email: '' },
                actorType: 'user', action: 'pass_user', category: 'matching',
                target: { type: 'user', id: targetUserId },
                details: `Passed on user ${targetUserId}`, req
            });
            res.status(200).json({
                success: true,
                message: 'User passed',
            });
        }
        catch (error) {
            logger_1.default.error('Pass user error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to pass user',
            });
        }
    }
    /**
     * Get user's matches
     */
    async getMatches(req, res) {
        try {
            const userId = req.user?.userId;
            const { page = 1, limit = 20 } = req.query;
            // Cache for 30s — reduces DB pressure on free-tier infra
            const cacheKey = `matches:list:${userId}:${page}:${limit}`;
            const result = await cache_service_1.default.getOrSet(cacheKey, () => match_service_1.default.getMatches(userId, parseInt(page), parseInt(limit)), 30);
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            logger_1.default.error('Get matches error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch matches',
            });
        }
    }
    /**
     * Get match details
     */
    async getMatchDetails(req, res) {
        try {
            const userId = req.user?.userId;
            const { matchId } = req.params;
            const match = await match_service_1.default.getMatchDetails(userId, matchId);
            res.status(200).json({
                success: true,
                data: { match },
            });
        }
        catch (error) {
            logger_1.default.error('Get match details error:', error);
            const statusCode = error.message.includes('not found') ? 404 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Failed to fetch match details',
            });
        }
    }
    /**
     * Unmatch a user
     */
    async unmatch(req, res) {
        try {
            const userId = req.user?.userId;
            const { matchId } = req.params;
            await match_service_1.default.unmatch(userId, matchId);
            // Bust match caches for both users
            await cache_service_1.default.invalidatePattern(`matches:*:${userId}*`);
            await cache_service_1.default.invalidatePattern(`home:feed:${userId}:*`);
            await (0, audit_1.logAudit)({
                actor: { id: userId, name: '', email: '' },
                actorType: 'user', action: 'unmatch', category: 'matching',
                target: { type: 'match', id: matchId },
                details: `Unmatched from match ${matchId}`, req
            });
            res.status(200).json({
                success: true,
                message: 'Unmatched successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Unmatch error:', error);
            const statusCode = error.message.includes('not found') ? 404 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Failed to unmatch',
            });
        }
    }
    /**
     * Get likes (users who liked current user)
     */
    async getLikes(req, res) {
        try {
            const userId = req.user?.userId;
            const likes = await cache_service_1.default.getOrSet(cache_service_1.default.receivedRequestsKey(userId), () => match_service_1.default.getLikes(userId), 120);
            res.status(200).json({
                success: true,
                data: {
                    likes,
                    total: likes.length,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Get likes error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch likes',
            });
        }
    }
    /**
     * Find or create a match for listing inquiry
     * POST /api/v1/matches/listing-inquiry
     */
    async listingInquiry(req, res) {
        try {
            const userId = req.user?.userId;
            const { landlordId, listingId } = req.body;
            if (!landlordId) {
                res.status(400).json({ success: false, message: 'landlordId is required' });
                return;
            }
            const match = await match_service_1.default.findOrCreateListingInquiry(userId, landlordId, listingId);
            res.status(200).json({
                success: true,
                data: { matchId: match._id.toString() },
            });
        }
        catch (error) {
            logger_1.default.error('Listing inquiry error:', error);
            const statusCode = error.message.includes('yourself') ? 400 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Failed to create inquiry',
            });
        }
    }
}
exports.default = new MatchController();
//# sourceMappingURL=match.controller.js.map