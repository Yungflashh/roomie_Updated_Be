"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/services/cache.service.ts — Redis caching layer for frequently accessed data
const redis_1 = __importDefault(require("../config/redis"));
const logger_1 = __importDefault(require("../utils/logger"));
class CacheService {
    defaultTTL = 300; // 5 minutes
    /**
     * Get cached data or fetch fresh
     */
    async getOrSet(key, fetcher, ttl) {
        try {
            const cached = await redis_1.default.get(key);
            if (cached) {
                return JSON.parse(cached);
            }
        }
        catch (err) {
            logger_1.default.warn(`Cache read error for ${key}:`, err);
        }
        // Cache miss — fetch fresh data
        const data = await fetcher();
        try {
            await redis_1.default.setex(key, ttl || this.defaultTTL, JSON.stringify(data));
        }
        catch (err) {
            logger_1.default.warn(`Cache write error for ${key}:`, err);
        }
        return data;
    }
    /**
     * Invalidate a specific cache key
     */
    async invalidate(key) {
        try {
            await redis_1.default.del(key);
        }
        catch (err) {
            logger_1.default.warn(`Cache invalidate error for ${key}:`, err);
        }
    }
    /**
     * Invalidate all keys matching a pattern
     */
    async invalidatePattern(pattern) {
        try {
            const keys = await redis_1.default.keys(pattern);
            if (keys.length > 0) {
                await redis_1.default.del(...keys);
                logger_1.default.info(`Invalidated ${keys.length} cache keys matching: ${pattern}`);
            }
        }
        catch (err) {
            logger_1.default.warn(`Cache pattern invalidate error for ${pattern}:`, err);
        }
    }
    // =====================
    // KEY BUILDERS
    // =====================
    /** Potential matches — For You (by compatibility) */
    forYouKey(userId) {
        return `matches:foryou:${userId}`;
    }
    /** Potential matches — Near You (by distance + radius) */
    nearYouKey(userId, maxDistance, lat, lng) {
        // Round coords to 2 decimal places (~1km precision) so small GPS drift doesn't bust cache
        const latR = lat ? Math.round(lat * 100) / 100 : 'profile';
        const lngR = lng ? Math.round(lng * 100) / 100 : 'profile';
        return `matches:nearyou:${userId}:${maxDistance}:${latR}:${lngR}`;
    }
    /** Discovery feed */
    discoveryKey(userId, filtersHash) {
        return `discovery:${userId}:${filtersHash}`;
    }
    /** Points stats */
    pointsStatsKey(userId) {
        return `points:stats:${userId}`;
    }
    /** Points config (global, shared) */
    pointsConfigKey() {
        return `points:config`;
    }
    /** Match requests received */
    receivedRequestsKey(userId) {
        return `matches:received:${userId}`;
    }
    /** Sent requests */
    sentRequestsKey(userId) {
        return `matches:sent:${userId}`;
    }
    /** User's active matches */
    matchesListKey(userId) {
        return `matches:list:${userId}`;
    }
    /** Home feed aggregated */
    homeFeedKey(userId, city) {
        return `home:feed:${userId}:${city || 'all'}`;
    }
    // =====================
    // INVALIDATION HELPERS
    // =====================
    /** Call after a user likes/passes/matches — bust both users' caches */
    async onUserInteraction(userId, targetUserId) {
        await Promise.all([
            this.invalidatePattern(`matches:*:${userId}*`),
            this.invalidatePattern(`matches:*:${targetUserId}*`),
            this.invalidatePattern(`discovery:${userId}:*`),
            this.invalidatePattern(`home:feed:${userId}:*`),
            this.invalidatePattern(`home:feed:${targetUserId}:*`),
        ]);
    }
    /** Call after points change (gift, purchase, game, daily bonus) */
    async onPointsChange(userId) {
        await this.invalidate(this.pointsStatsKey(userId));
    }
}
exports.default = new CacheService();
//# sourceMappingURL=cache.service.js.map