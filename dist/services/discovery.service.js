"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/services/discovery.service.ts
const User_1 = require("../models/User");
const cache_service_1 = __importDefault(require("./cache.service"));
const logger_1 = __importDefault(require("../utils/logger"));
const sanitize_1 = require("../utils/sanitize");
class DiscoveryService {
    /**
     * Discover users with advanced filtering
     */
    async discoverUsers(currentUserId, filters) {
        const { page = 1, limit = 20, sortBy = 'newest', sortOrder = 'desc', ...searchFilters } = filters;
        const skip = (page - 1) * limit;
        // Get current user for exclusions (cached 60s to avoid repeated DB hits under load)
        const currentUser = await cache_service_1.default.getOrSet(`user:exclusions:${currentUserId}`, async () => {
            const u = await User_1.User.findById(currentUserId).select('blockedUsers likes').lean();
            if (!u)
                throw new Error('User not found');
            return u;
        }, 60);
        if (!currentUser) {
            throw new Error('User not found');
        }
        // Build exclusion list (self, blocked, already liked)
        // Note: passes are NOT excluded — skipped users can reappear
        const excludeIds = [
            currentUserId,
            ...(currentUser.blockedUsers ?? []).map((id) => id.toString()),
            ...(currentUser.likes ?? []).map((id) => id.toString()),
        ];
        // Build query
        const query = {
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
            query['location.city'] = { $regex: (0, sanitize_1.escapeRegex)(searchFilters.city), $options: 'i' };
        }
        if (searchFilters.state) {
            query['location.state'] = { $regex: (0, sanitize_1.escapeRegex)(searchFilters.state), $options: 'i' };
        }
        if (searchFilters.country) {
            query['location.country'] = { $regex: (0, sanitize_1.escapeRegex)(searchFilters.country), $options: 'i' };
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
            query.occupation = { $regex: (0, sanitize_1.escapeRegex)(searchFilters.occupation), $options: 'i' };
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
        logger_1.default.info(`Discovery query for user ${currentUserId}:`, JSON.stringify(query));
        // Build sort options
        let sortOptions = {};
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
            User_1.User.find(query)
                .select('firstName lastName profilePhoto photos bio occupation ' +
                'location preferences lifestyle interests verified gender ' +
                'dateOfBirth createdAt lastActive subscription metadata equippedCosmetics')
                .sort(sortOptions)
                .skip(skip)
                .limit(limit)
                .lean(),
            User_1.User.countDocuments(query),
        ]);
        // Fetch clan info for all users in batch
        let clanMap = {};
        try {
            const { Clan } = await Promise.resolve().then(() => __importStar(require('../models/Clan')));
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
        }
        catch (e) {
            // Clan lookup is best-effort
        }
        // Fetch equipped cosmetic styles in batch
        let cosmeticStyleMap = {};
        try {
            const { Cosmetic } = await Promise.resolve().then(() => __importStar(require('../models/Cosmetic')));
            const allCosmeticIds = users
                .flatMap(u => {
                const eq = u.equippedCosmetics || {};
                return [eq.profileFrame, eq.chatBubble, eq.badge, eq.nameEffect].filter(Boolean);
            });
            if (allCosmeticIds.length > 0) {
                const cosmeticDocs = await Cosmetic.find({ _id: { $in: allCosmeticIds } })
                    .select('name type style icon')
                    .lean();
                const cosmeticMap = new Map(cosmeticDocs.map((d) => [d._id.toString(), d]));
                for (const u of users) {
                    const eq = u.equippedCosmetics || {};
                    const resolved = {};
                    if (eq.profileFrame && cosmeticMap.has(eq.profileFrame))
                        resolved.profileFrame = cosmeticMap.get(eq.profileFrame);
                    if (eq.chatBubble && cosmeticMap.has(eq.chatBubble))
                        resolved.chatBubble = cosmeticMap.get(eq.chatBubble);
                    if (eq.badge && cosmeticMap.has(eq.badge))
                        resolved.badge = cosmeticMap.get(eq.badge);
                    if (eq.nameEffect && cosmeticMap.has(eq.nameEffect))
                        resolved.nameEffect = cosmeticMap.get(eq.nameEffect);
                    if (Object.keys(resolved).length > 0)
                        cosmeticStyleMap[u._id.toString()] = resolved;
                }
            }
        }
        catch (e) {
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
            if (aHasClan !== bHasClan)
                return bHasClan - aHasClan; // Clan users first
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
    async getFilterOptions() {
        const [cities, states, occupations, interests] = await Promise.all([
            User_1.User.distinct('location.city'),
            User_1.User.distinct('location.state'),
            User_1.User.distinct('occupation'),
            User_1.User.distinct('interests'),
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
    async searchUsers(currentUserId, keyword, limit = 20) {
        const currentUser = await User_1.User.findById(currentUserId);
        if (!currentUser) {
            throw new Error('User not found');
        }
        const excludeIds = [
            currentUserId,
            ...currentUser.blockedUsers.map(id => id.toString()),
        ];
        const users = await User_1.User.find({
            _id: { $nin: excludeIds },
            isActive: true,
            $or: [
                { firstName: { $regex: (0, sanitize_1.escapeRegex)(keyword), $options: 'i' } },
                { lastName: { $regex: (0, sanitize_1.escapeRegex)(keyword), $options: 'i' } },
                { occupation: { $regex: (0, sanitize_1.escapeRegex)(keyword), $options: 'i' } },
                { bio: { $regex: (0, sanitize_1.escapeRegex)(keyword), $options: 'i' } },
                { 'location.city': { $regex: (0, sanitize_1.escapeRegex)(keyword), $options: 'i' } },
                { interests: { $in: [new RegExp(keyword, 'i')] } },
            ],
        })
            .select('firstName lastName profilePhoto bio occupation location verified subscription')
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
exports.default = new DiscoveryService();
//# sourceMappingURL=discovery.service.js.map