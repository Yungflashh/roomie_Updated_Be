export interface DiscoveryFilters {
    city?: string;
    state?: string;
    country?: string;
    maxDistance?: number;
    coordinates?: [number, number];
    minBudget?: number;
    maxBudget?: number;
    roomType?: 'private' | 'shared' | 'any';
    petFriendly?: boolean;
    smoking?: boolean;
    gender?: 'male' | 'female' | 'other' | 'any';
    minAge?: number;
    maxAge?: number;
    occupation?: string;
    sleepSchedule?: 'early-bird' | 'night-owl' | 'flexible';
    minCleanliness?: number;
    maxCleanliness?: number;
    minSocialLevel?: number;
    maxSocialLevel?: number;
    guestFrequency?: 'never' | 'rarely' | 'sometimes' | 'often';
    workFromHome?: boolean;
    interests?: string[];
    verifiedOnly?: boolean;
    page?: number;
    limit?: number;
    sortBy?: 'compatibility' | 'distance' | 'newest' | 'lastActive';
    sortOrder?: 'asc' | 'desc';
}
interface DiscoveryResult {
    users: any[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
    filters: DiscoveryFilters;
}
declare class DiscoveryService {
    /**
     * Discover users with advanced filtering
     */
    discoverUsers(currentUserId: string, filters: DiscoveryFilters): Promise<DiscoveryResult>;
    /**
     * Get filter options (for UI dropdowns)
     */
    getFilterOptions(): Promise<any>;
    /**
     * Search users by keyword
     */
    searchUsers(currentUserId: string, keyword: string, limit?: number): Promise<any[]>;
}
declare const _default: DiscoveryService;
export default _default;
//# sourceMappingURL=discovery.service.d.ts.map