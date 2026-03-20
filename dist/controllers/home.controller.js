"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const property_service_1 = __importDefault(require("../services/property.service"));
const discovery_service_1 = __importDefault(require("../services/discovery.service"));
const match_service_1 = __importDefault(require("../services/match.service"));
const points_service_1 = __importDefault(require("../services/points.service"));
const cache_service_1 = __importDefault(require("../services/cache.service"));
const logger_1 = __importDefault(require("../utils/logger"));
class HomeController {
    /**
     * Get aggregated home feed data in a single request
     * GET /api/v1/home/feed
     */
    async getHomeFeed(req, res) {
        try {
            const userId = req.user?.userId;
            const { city, lat, lng } = req.query;
            const liveCoords = lat && lng
                ? [parseFloat(lng), parseFloat(lat)]
                : undefined;
            // Cache the entire home feed for 2 minutes (keyed by city + coords)
            const cacheKey = `home:feed:${userId}:${city || 'all'}:${lat || '0'}:${lng || '0'}`;
            const feedData = await cache_service_1.default.getOrSet(cacheKey, async () => {
                // Run all queries in parallel
                const [listingsResult, roomiesResult, receivedLikes, sentLikes, likedProperties, pointsStats,] = await Promise.allSettled([
                    property_service_1.default.searchProperties({
                        city: city,
                        limit: '10',
                        ...(liveCoords ? { lng: liveCoords[0].toString(), lat: liveCoords[1].toString(), maxDistance: '50' } : {}),
                    }),
                    discovery_service_1.default.discoverUsers(userId, {
                        city: city,
                        limit: 10,
                        ...(liveCoords ? { coordinates: liveCoords, maxDistance: 50 } : {}),
                    }),
                    match_service_1.default.getLikes(userId),
                    match_service_1.default.getSentLikes(userId),
                    property_service_1.default.getLikedProperties(userId),
                    points_service_1.default.getUserPointStats(userId),
                ]);
                return {
                    nearbyListings: listingsResult.status === 'fulfilled' ? listingsResult.value : { properties: [], pagination: {} },
                    nearbyRoomies: roomiesResult.status === 'fulfilled' ? roomiesResult.value : { users: [], pagination: {} },
                    receivedLikes: receivedLikes.status === 'fulfilled' ? receivedLikes.value : [],
                    sentLikes: sentLikes.status === 'fulfilled' ? sentLikes.value : [],
                    likedProperties: likedProperties.status === 'fulfilled' ? likedProperties.value : [],
                    pointsStats: pointsStats.status === 'fulfilled' ? pointsStats.value : null,
                };
            }, 120);
            res.status(200).json({
                success: true,
                data: feedData,
            });
        }
        catch (error) {
            logger_1.default.error('Home feed error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch home feed',
            });
        }
    }
}
exports.default = new HomeController();
//# sourceMappingURL=home.controller.js.map