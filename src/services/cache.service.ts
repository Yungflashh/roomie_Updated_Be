// src/services/cache.service.ts — Redis caching layer for frequently accessed data
import redisClient from '../config/redis';
import logger from '../utils/logger';

class CacheService {
  private defaultTTL = 300; // 5 minutes

  /**
   * Get cached data or fetch fresh
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    try {
      const cached = await redisClient.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      logger.warn(`Cache read error for ${key}:`, err);
    }

    // Cache miss — fetch fresh data
    const data = await fetcher();

    try {
      await redisClient.setex(key, ttl || this.defaultTTL, JSON.stringify(data));
    } catch (err) {
      logger.warn(`Cache write error for ${key}:`, err);
    }

    return data;
  }

  /**
   * Invalidate a specific cache key
   */
  async invalidate(key: string): Promise<void> {
    try {
      await redisClient.del(key);
    } catch (err) {
      logger.warn(`Cache invalidate error for ${key}:`, err);
    }
  }

  /**
   * Invalidate all keys matching a pattern
   */
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
        logger.info(`Invalidated ${keys.length} cache keys matching: ${pattern}`);
      }
    } catch (err) {
      logger.warn(`Cache pattern invalidate error for ${pattern}:`, err);
    }
  }

  // =====================
  // KEY BUILDERS
  // =====================

  /** Potential matches — For You (by compatibility) */
  forYouKey(userId: string): string {
    return `matches:foryou:${userId}`;
  }

  /** Potential matches — Near You (by distance + radius) */
  nearYouKey(userId: string, maxDistance: number, lat?: number, lng?: number): string {
    // Round coords to 2 decimal places (~1km precision) so small GPS drift doesn't bust cache
    const latR = lat ? Math.round(lat * 100) / 100 : 'profile';
    const lngR = lng ? Math.round(lng * 100) / 100 : 'profile';
    return `matches:nearyou:${userId}:${maxDistance}:${latR}:${lngR}`;
  }

  /** Discovery feed */
  discoveryKey(userId: string, filtersHash: string): string {
    return `discovery:${userId}:${filtersHash}`;
  }

  /** Points stats */
  pointsStatsKey(userId: string): string {
    return `points:stats:${userId}`;
  }

  /** Points config (global, shared) */
  pointsConfigKey(): string {
    return `points:config`;
  }

  /** Match requests received */
  receivedRequestsKey(userId: string): string {
    return `matches:received:${userId}`;
  }

  /** Sent requests */
  sentRequestsKey(userId: string): string {
    return `matches:sent:${userId}`;
  }

  /** User's active matches */
  matchesListKey(userId: string): string {
    return `matches:list:${userId}`;
  }

  /** Home feed aggregated */
  homeFeedKey(userId: string, city?: string): string {
    return `home:feed:${userId}:${city || 'all'}`;
  }

  // =====================
  // INVALIDATION HELPERS
  // =====================

  /** Call after a user likes/passes/matches — bust both users' caches */
  async onUserInteraction(userId: string, targetUserId: string): Promise<void> {
    await Promise.all([
      this.invalidatePattern(`matches:*:${userId}*`),
      this.invalidatePattern(`matches:*:${targetUserId}*`),
      this.invalidatePattern(`discovery:${userId}:*`),
      this.invalidatePattern(`home:feed:${userId}:*`),
      this.invalidatePattern(`home:feed:${targetUserId}:*`),
    ]);
  }

  /** Call after points change (gift, purchase, game, daily bonus) */
  async onPointsChange(userId: string): Promise<void> {
    await this.invalidate(this.pointsStatsKey(userId));
  }
}

export default new CacheService();
