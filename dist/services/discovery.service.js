"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/services/discovery.service.ts
const User_1 = require("../models/User");
const logger_1 = __importDefault(require("../utils/logger"));
class DiscoveryService {
    /**
     * Discover users with advanced filtering
     */
    async discoverUsers(currentUserId, filters) {
        const { page = 1, limit = 20, sortBy = 'newest', sortOrder = 'desc', ...searchFilters } = filters;
        const skip = (page - 1) * limit;
        // Get current user for exclusions and compatibility
        const currentUser = await User_1.User.findById(currentUserId);
        if (!currentUser) {
            throw new Error('User not found');
        }
        // Build exclusion list (self, blocked, already liked)
        // Note: passes are NOT excluded — skipped users can reappear
        const excludeIds = [
            currentUserId,
            ...currentUser.blockedUsers.map(id => id.toString()),
            ...currentUser.likes.map(id => id.toString()),
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
            query['location.city'] = { $regex: searchFilters.city, $options: 'i' };
        }
        if (searchFilters.state) {
            query['location.state'] = { $regex: searchFilters.state, $options: 'i' };
        }
        if (searchFilters.country) {
            query['location.country'] = { $regex: searchFilters.country, $options: 'i' };
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
            query.occupation = { $regex: searchFilters.occupation, $options: 'i' };
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
                'dateOfBirth createdAt lastActive subscription metadata')
                .sort(sortOptions)
                .skip(skip)
                .limit(limit)
                .lean(),
            User_1.User.countDocuments(query),
        ]);
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
            };
        });
        return {
            users: transformedUsers,
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
                { firstName: { $regex: keyword, $options: 'i' } },
                { lastName: { $regex: keyword, $options: 'i' } },
                { occupation: { $regex: keyword, $options: 'i' } },
                { bio: { $regex: keyword, $options: 'i' } },
                { 'location.city': { $regex: keyword, $options: 'i' } },
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