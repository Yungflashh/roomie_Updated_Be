// src/services/discovery.service.ts
import { User, IUserDocument } from '../models/User';
import cacheService from './cache.service';
import logger from '../utils/logger';
import { escapeRegex } from '../utils/sanitize';

export interface DiscoveryFilters {
  // Location filters
  city?: string;
  state?: string;
  country?: string;
  maxDistance?: number; // in kilometers
  coordinates?: [number, number]; // [longitude, latitude]
  
  // Preference filters
  minBudget?: number;
  maxBudget?: number;
  roomType?: 'private' | 'shared' | 'any';
  petFriendly?: boolean;
  smoking?: boolean;
  
  // Personal filters
  gender?: 'male' | 'female' | 'other' | 'any';
  minAge?: number;
  maxAge?: number;
  occupation?: string;
  
  // Lifestyle filters
  sleepSchedule?: 'early-bird' | 'night-owl' | 'flexible';
  minCleanliness?: number;
  maxCleanliness?: number;
  minSocialLevel?: number;
  maxSocialLevel?: number;
  guestFrequency?: 'never' | 'rarely' | 'sometimes' | 'often';
  workFromHome?: boolean;
  
  // Interests
  interests?: string[];
  
  // Verification
  verifiedOnly?: boolean;
  
  // Pagination
  page?: number;
  limit?: number;
  
  // Sorting
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

class DiscoveryService {
  /**
   * Discover users with advanced filtering
   */
  async discoverUsers(
    currentUserId: string,
    filters: DiscoveryFilters
  ): Promise<DiscoveryResult> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'newest',
      sortOrder = 'desc',
      ...searchFilters
    } = filters;

    const skip = (page - 1) * limit;

    // Get current user for exclusions (cached 60s to avoid repeated DB hits under load)
    const currentUser = await cacheService.getOrSet(
      `user:exclusions:${currentUserId}`,
      async () => {
        const u = await User.findById(currentUserId).select('blockedUsers likes').lean();
        if (!u) throw new Error('User not found');
        return u;
      },
      60
    );
    if (!currentUser) {
      throw new Error('User not found');
    }

    // Build exclusion list (self, blocked, already liked)
    // Note: passes are NOT excluded — skipped users can reappear
    const excludeIds = [
      currentUserId,
      ...(currentUser.blockedUsers ?? []).map((id: any) => id.toString()),
      ...(currentUser.likes ?? []).map((id: any) => id.toString()),
    ];

    // Build query
    const query: any = {
      _id: { $nin: excludeIds },
      isActive: true,
      blockedUsers: { $ne: currentUserId },
      // Respect profileVisibility: exclude users who only want matches to see them
      $or: [
        { 'privacySettings.profileVisibility': { $ne: 'matches_only' } },
        { 'privacySettings.profileVisibility': { $exists: false } },
      ],
    };

    // Location filters
    if (searchFilters.city) {
      query['location.city'] = { $regex: escapeRegex(searchFilters.city), $options: 'i' };
    }
    if (searchFilters.state) {
      query['location.state'] = { $regex: escapeRegex(searchFilters.state), $options: 'i' };
    }
    if (searchFilters.country) {
      query['location.country'] = { $regex: escapeRegex(searchFilters.country), $options: 'i' };
    }

    // Geo query for distance
    if (searchFilters.coordinates && searchFilters.maxDistance) {
      query['location.coordinates'] = {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: searchFilters.coordinates,
          },
          $maxDistance: searchFilters.maxDistance * 1000, // Convert km to meters
        },
      };
    }

    // Budget filters
    if (searchFilters.minBudget !== undefined) {
      query['preferences.budget.min'] = { $gte: searchFilters.minBudget };
    }
    if (searchFilters.maxBudget !== undefined) {
      query['preferences.budget.max'] = { $lte: searchFilters.maxBudget };
    }

    // Room type filter
    if (searchFilters.roomType && searchFilters.roomType !== 'any') {
      query['preferences.roomType'] = searchFilters.roomType;
    }

    // Pet friendly filter
    if (searchFilters.petFriendly !== undefined) {
      query['preferences.petFriendly'] = searchFilters.petFriendly;
    }

    // Smoking filter
    if (searchFilters.smoking !== undefined) {
      query['preferences.smoking'] = searchFilters.smoking;
    }

    // Gender filter
    if (searchFilters.gender && searchFilters.gender !== 'any') {
      query.gender = searchFilters.gender;
    }

    // Age filter (calculate from dateOfBirth)
    if (searchFilters.minAge !== undefined || searchFilters.maxAge !== undefined) {
      const today = new Date();
      
      if (searchFilters.maxAge !== undefined) {
        const minDate = new Date(today.getFullYear() - searchFilters.maxAge - 1, today.getMonth(), today.getDate());
        query.dateOfBirth = { ...query.dateOfBirth, $gte: minDate };
      }
      
      if (searchFilters.minAge !== undefined) {
        const maxDate = new Date(today.getFullYear() - searchFilters.minAge, today.getMonth(), today.getDate());
        query.dateOfBirth = { ...query.dateOfBirth, $lte: maxDate };
      }
    }

    // Occupation filter
    if (searchFilters.occupation) {
      query.occupation = { $regex: escapeRegex(searchFilters.occupation), $options: 'i' };
    }

    // Lifestyle filters
    if (searchFilters.sleepSchedule) {
      query['lifestyle.sleepSchedule'] = searchFilters.sleepSchedule;
    }
    if (searchFilters.minCleanliness !== undefined) {
      query['lifestyle.cleanliness'] = { $gte: searchFilters.minCleanliness };
    }
    if (searchFilters.maxCleanliness !== undefined) {
      query['lifestyle.cleanliness'] = { 
        ...query['lifestyle.cleanliness'], 
        $lte: searchFilters.maxCleanliness 
      };
    }
    if (searchFilters.minSocialLevel !== undefined) {
      query['lifestyle.socialLevel'] = { $gte: searchFilters.minSocialLevel };
    }
    if (searchFilters.maxSocialLevel !== undefined) {
      query['lifestyle.socialLevel'] = { 
        ...query['lifestyle.socialLevel'], 
        $lte: searchFilters.maxSocialLevel 
      };
    }
    if (searchFilters.guestFrequency) {
      query['lifestyle.guestFrequency'] = searchFilters.guestFrequency;
    }
    if (searchFilters.workFromHome !== undefined) {
      query['lifestyle.workFromHome'] = searchFilters.workFromHome;
    }

    // Interests filter (match any)
    if (searchFilters.interests && searchFilters.interests.length > 0) {
      query.interests = { $in: searchFilters.interests };
    }

    // Verified only filter
    if (searchFilters.verifiedOnly) {
      query.verified = true;
    }

    logger.info(`Discovery query for user ${currentUserId}:`, JSON.stringify(query));

    // Build sort options
    let sortOptions: any = {};
    switch (sortBy) {
      case 'newest':
        sortOptions = { createdAt: sortOrder === 'asc' ? 1 : -1 };
        break;
      case 'lastActive':
        sortOptions = { lastActive: sortOrder === 'asc' ? 1 : -1 };
        break;
      case 'distance':
        // Distance sorting is handled by $nearSphere
        sortOptions = { createdAt: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    // Execute query
    const [users, total] = await Promise.all([
      User.find(query)
        .select(
          'firstName lastName profilePhoto photos bio occupation ' +
          'location preferences lifestyle interests verified gender ' +
          'dateOfBirth createdAt lastActive subscription metadata equippedCosmetics'
        )
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    // Fetch clan info for all users in batch
    let clanMap: Record<string, { name: string; tag: string; emoji: string; color: string; level: number; badges: string[] }> = {};
    try {
      const { Clan } = await import('../models/Clan');
      const userIds = users.map(u => u._id);
      const clans = await Clan.find({ 'members.user': { $in: userIds } })
        .select('name tag emoji color level badges members.user')
        .lean();
      for (const clan of clans) {
        for (const member of clan.members || []) {
          clanMap[member.user.toString()] = {
            name: clan.name,
            tag: clan.tag,
            emoji: clan.emoji,
            color: clan.color,
            level: clan.level,
            badges: clan.badges || [],
          };
        }
      }
    } catch (e) {
      // Clan lookup is best-effort
    }

    // Fetch equipped cosmetic styles in batch
    let cosmeticStyleMap: Record<string, any> = {};
    try {
      const { Cosmetic } = await import('../models/Cosmetic');
      const allCosmeticIds = users
        .flatMap(u => {
          const eq = (u as any).equippedCosmetics || {};
          return [eq.profileFrame, eq.chatBubble, eq.badge, eq.nameEffect].filter(Boolean);
        });
      if (allCosmeticIds.length > 0) {
        const cosmeticDocs = await Cosmetic.find({ _id: { $in: allCosmeticIds } })
          .select('name type style icon')
          .lean();
        const cosmeticMap = new Map(cosmeticDocs.map((d: any) => [d._id.toString(), d]));
        for (const u of users) {
          const eq = (u as any).equippedCosmetics || {};
          const resolved: any = {};
          if (eq.profileFrame && cosmeticMap.has(eq.profileFrame)) resolved.profileFrame = cosmeticMap.get(eq.profileFrame);
          if (eq.chatBubble && cosmeticMap.has(eq.chatBubble)) resolved.chatBubble = cosmeticMap.get(eq.chatBubble);
          if (eq.badge && cosmeticMap.has(eq.badge)) resolved.badge = cosmeticMap.get(eq.badge);
          if (eq.nameEffect && cosmeticMap.has(eq.nameEffect)) resolved.nameEffect = cosmeticMap.get(eq.nameEffect);
          if (Object.keys(resolved).length > 0) cosmeticStyleMap[u._id.toString()] = resolved;
        }
      }
    } catch (e) {
      // Cosmetics lookup is best-effort
    }

    // Transform users and calculate age
    const transformedUsers = users.map(user => {
      const age = user.dateOfBirth
        ? Math.floor((Date.now() - new Date(user.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        : null;

      return {
        id: user._id,
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePhoto: user.profilePhoto,
        photos: user.photos || [],
        bio: user.bio,
        occupation: user.occupation,
        location: user.location,
        preferences: user.preferences,
        lifestyle: user.lifestyle,
        interests: user.interests || [],
        verified: user.verified,
        subscription: user.subscription,
        gender: user.gender,
        age,
        clan: clanMap[user._id.toString()] || null,
        cosmetics: cosmeticStyleMap[user._id.toString()] || null,
      };
    });

    // Soft boost: clan members with badges get moved slightly higher (within the page)
    const boostedUsers = [...transformedUsers].sort((a, b) => {
      const aHasClan = a.clan ? 1 : 0;
      const bHasClan = b.clan ? 1 : 0;
      if (aHasClan !== bHasClan) return bHasClan - aHasClan; // Clan users first
      return 0; // Preserve original order otherwise
    });

    return {
      users: boostedUsers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      filters: searchFilters,
    };
  }

  /**
   * Get filter options (for UI dropdowns)
   */
  async getFilterOptions(): Promise<any> {
    const [cities, states, occupations, interests] = await Promise.all([
      User.distinct('location.city'),
      User.distinct('location.state'),
      User.distinct('occupation'),
      User.distinct('interests'),
    ]);

    return {
      cities: cities.filter(Boolean).sort(),
      states: states.filter(Boolean).sort(),
      occupations: occupations.filter(Boolean).sort(),
      interests: interests.filter(Boolean).sort(),
      genders: ['male', 'female', 'other', 'any'],
      roomTypes: ['private', 'shared', 'any'],
      sleepSchedules: ['early-bird', 'night-owl', 'flexible'],
      guestFrequencies: ['never', 'rarely', 'sometimes', 'often'],
      cleanlinessRange: { min: 1, max: 5 },
      socialLevelRange: { min: 1, max: 5 },
      ageRange: { min: 18, max: 65 },
    };
  }

  /**
   * Search users by keyword
   */
  async searchUsers(
    currentUserId: string,
    keyword: string,
    limit: number = 20
  ): Promise<any[]> {
    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      throw new Error('User not found');
    }

    const excludeIds = [
      currentUserId,
      ...currentUser.blockedUsers.map(id => id.toString()),
    ];

    const users = await User.find({
      _id: { $nin: excludeIds },
      isActive: true,
      $or: [
        { firstName: { $regex: escapeRegex(keyword), $options: 'i' } },
        { lastName: { $regex: escapeRegex(keyword), $options: 'i' } },
        { occupation: { $regex: escapeRegex(keyword), $options: 'i' } },
        { bio: { $regex: escapeRegex(keyword), $options: 'i' } },
        { 'location.city': { $regex: escapeRegex(keyword), $options: 'i' } },
        { interests: { $in: [new RegExp(keyword, 'i')] } },
      ],
    })
      .select(
        'firstName lastName profilePhoto bio occupation location verified subscription'
      )
      .limit(limit)
      .lean();

    return users.map(user => ({
      id: user._id,
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePhoto: user.profilePhoto,
      bio: user.bio,
      occupation: user.occupation,
      location: user.location,
      verified: user.verified,
      subscription: user.subscription,
    }));
  }
}

export default new DiscoveryService();