declare class CacheService {
    private defaultTTL;
    /**
     * Get cached data or fetch fresh
     */
    getOrSet<T>(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T>;
    /**
     * Invalidate a specific cache key
     */
    invalidate(key: string): Promise<void>;
    /**
     * Invalidate all keys matching a pattern
     */
    invalidatePattern(pattern: string): Promise<void>;
    /** Potential matches — For You (by compatibility) */
    forYouKey(userId: string): string;
    /** Potential matches — Near You (by distance + radius) */
    nearYouKey(userId: string, maxDistance: number, lat?: number, lng?: number): string;
    /** Discovery feed */
    discoveryKey(userId: string, filtersHash: string): string;
    /** Points stats */
    pointsStatsKey(userId: string): string;
    /** Points config (global, shared) */
    pointsConfigKey(): string;
    /** Match requests received */
    receivedRequestsKey(userId: string): string;
    /** Sent requests */
    sentRequestsKey(userId: string): string;
    /** User's active matches */
    matchesListKey(userId: string): string;
    /** Home feed aggregated */
    homeFeedKey(userId: string, city?: string): string;
    /** Call after a user likes/passes/matches — bust both users' caches */
    onUserInteraction(userId: string, targetUserId: string): Promise<void>;
    /** Call after points change (gift, purchase, game, daily bonus) */
    onPointsChange(userId: string): Promise<void>;
}
declare const _default: CacheService;
export default _default;
//# sourceMappingURL=cache.service.d.ts.map