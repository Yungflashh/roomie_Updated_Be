"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/services/match.service.ts - COMPLETE WITH POINTS SYSTEM AND DISTANCE SORTING
const models_1 = require("../models");
const socket_config_1 = require("../config/socket.config");
const compatibility_service_1 = __importDefault(require("./compatibility.service"));
const notification_service_1 = __importDefault(require("./notification.service"));
const points_service_1 = __importDefault(require("./points.service"));
const logger_1 = __importDefault(require("../utils/logger"));
class MatchService {
    /**
     * Get potential matches
     */
    async getPotentialMatches(userId, limit = 20, minCompatibility = 0, sortBy = 'compatibility' // NEW: Sort parameter
    ) {
        const currentUser = await models_1.User.findById(userId);
        if (!currentUser) {
            throw new Error('User not found');
        }
        logger_1.default.info(`Getting potential matches for user: ${userId}, sortBy: ${sortBy}`);
        // Get user's coordinates for distance calculation
        const userCoords = currentUser.location?.coordinates;
        const interactedUserIds = [
            ...currentUser.likes.map(id => id.toString()),
            ...currentUser.passes.map(id => id.toString()),
            ...currentUser.blockedUsers.map(id => id.toString()),
        ];
        const potentialMatches = await models_1.User.find({
            _id: {
                $ne: userId,
                $nin: interactedUserIds,
            },
            isActive: true,
            blockedUsers: { $ne: userId },
        })
            .select('firstName lastName profilePhoto photos bio occupation ' +
            'location preferences lifestyle interests verified')
            .limit(limit * 2)
            .lean();
        logger_1.default.info(`Found ${potentialMatches.length} potential matches before scoring`);
        const matchesWithScores = potentialMatches
            .map((user) => {
            const score = compatibility_service_1.default.calculateCompatibility(currentUser, user);
            // Calculate distance if both users have coordinates
            let distance;
            if (userCoords && user.location?.coordinates) {
                distance = this.calculateDistance(userCoords, user.location.coordinates);
            }
            return {
                user: {
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
                },
                compatibilityScore: score,
                distance, // NEW: Include distance in result
            };
        })
            .filter((match) => match.compatibilityScore >= minCompatibility);
        // Sort based on the sortBy parameter
        if (sortBy === 'distance') {
            // Filter out users without location data and sort by distance (closest first)
            const matchesWithDistance = matchesWithScores
                .filter(m => m.distance !== undefined)
                .sort((a, b) => (a.distance || 0) - (b.distance || 0));
            logger_1.default.info(`Returning ${matchesWithDistance.slice(0, limit).length} matches sorted by distance`);
            return matchesWithDistance.slice(0, limit);
        }
        else {
            // Sort by compatibility score (highest first) - default behavior
            const sortedMatches = matchesWithScores
                .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
                .slice(0, limit);
            logger_1.default.info(`Returning ${sortedMatches.length} matches sorted by compatibility`);
            return sortedMatches;
        }
    }
    /**
     * Calculate distance between two coordinates using Haversine formula
     * @param coords1 - [longitude, latitude]
     * @param coords2 - [longitude, latitude]
     * @returns Distance in kilometers
     */
    calculateDistance(coords1, coords2) {
        const [lon1, lat1] = coords1;
        const [lon2, lat2] = coords2;
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) *
                Math.cos(this.toRad(lat2)) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return Math.round(distance * 100) / 100; // Round to 2 decimal places
    }
    /**
     * Convert degrees to radians
     */
    toRad(degrees) {
        return degrees * (Math.PI / 180);
    }
    /**
     * Get sent likes
     */
    async getSentLikes(userId) {
        const currentUser = await models_1.User.findById(userId).select('likes');
        if (!currentUser) {
            throw new Error('User not found');
        }
        const matchedUserIds = await this.getMatchedUserIds(userId);
        const pendingLikeIds = currentUser.likes.filter((likeId) => !matchedUserIds.includes(likeId.toString()));
        const likedUsers = await models_1.User.find({
            _id: { $in: pendingLikeIds },
        })
            .select('firstName lastName profilePhoto photos bio occupation ' +
            'location preferences lifestyle interests verified')
            .lean();
        logger_1.default.info(`Found ${likedUsers.length} sent likes for ${userId}`);
        return likedUsers.map(user => ({
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
        }));
    }
    /**
     * Check if user can send match request (has enough points)
     */
    async canSendMatchRequest(userId) {
        const user = await models_1.User.findById(userId).select('gamification subscription');
        if (!user)
            throw new Error('User not found');
        // Calculate match cost
        const pointsCost = await points_service_1.default.calculateMatchCost(userId);
        // Check if user has enough points
        if (user.gamification.points < pointsCost) {
            return {
                canSend: false,
                reason: `Requires ${pointsCost} points. You have ${user.gamification.points}`,
                pointsCost,
                userPoints: user.gamification.points,
            };
        }
        return {
            canSend: true,
            pointsCost,
            userPoints: user.gamification.points,
        };
    }
    /**
     * Like a user (with points deduction)
     */
    async likeUser(userId, targetUserId) {
        if (userId === targetUserId) {
            throw new Error('Cannot like yourself');
        }
        const [currentUser, targetUser] = await Promise.all([
            models_1.User.findById(userId),
            models_1.User.findById(targetUserId),
        ]);
        if (!currentUser || !targetUser) {
            throw new Error('User not found');
        }
        // Check if user can send match request
        const canSend = await this.canSendMatchRequest(userId);
        if (!canSend.canSend) {
            throw new Error(canSend.reason || 'Cannot send match request');
        }
        // Deduct points for match request
        const pointsCost = canSend.pointsCost;
        try {
            await points_service_1.default.deductPoints({
                userId,
                amount: pointsCost,
                type: 'match_request',
                reason: `Match request to ${targetUser.firstName}`,
                metadata: {
                    targetUserId,
                    targetUserName: `${targetUser.firstName} ${targetUser.lastName}`,
                },
            });
            logger_1.default.info(`Deducted ${pointsCost} points from ${userId} for match request`);
        }
        catch (error) {
            throw new Error(`Failed to deduct points: ${error.message}`);
        }
        // Add to likes
        if (!currentUser.likes.includes(targetUserId)) {
            currentUser.likes.push(targetUserId);
            await currentUser.save();
        }
        // Check for mutual match
        const isMutualMatch = targetUser.likes.includes(userId);
        if (isMutualMatch) {
            const compatibilityScore = compatibility_service_1.default.calculateCompatibility(currentUser, targetUser);
            let match = await models_1.Match.findOne({
                $or: [
                    { user1: userId, user2: targetUserId },
                    { user1: targetUserId, user2: userId },
                ],
            });
            if (!match) {
                match = await models_1.Match.create({
                    user1: userId,
                    user2: targetUserId,
                    compatibilityScore,
                    matchedAt: new Date(),
                    status: 'active',
                    initiatedBy: userId,
                    pointsCost,
                });
                logger_1.default.info(`New match created: ${userId} <-> ${targetUserId}`);
                // Award bonus for successful match
                const config = await points_service_1.default.getConfig();
                const matchBonus = config.firstMatchBonus;
                if (matchBonus > 0) {
                    await points_service_1.default.addPoints({
                        userId,
                        amount: matchBonus,
                        type: 'bonus',
                        reason: `Match with ${targetUser.firstName}!`,
                        metadata: {
                            matchId: match._id,
                            targetUserId,
                        },
                    });
                    logger_1.default.info(`Awarded ${matchBonus} points bonus for successful match`);
                }
                // Emit match events
                try {
                    (0, socket_config_1.emitNewMatch)(userId, targetUserId, {
                        _id: match._id,
                        matchedAt: match.matchedAt,
                        user: {
                            _id: targetUser._id,
                            firstName: targetUser.firstName,
                            lastName: targetUser.lastName,
                            profilePhoto: targetUser.profilePhoto,
                        },
                        compatibilityScore,
                    });
                    (0, socket_config_1.emitNewMatch)(targetUserId, userId, {
                        _id: match._id,
                        matchedAt: match.matchedAt,
                        user: {
                            _id: currentUser._id,
                            firstName: currentUser.firstName,
                            lastName: currentUser.lastName,
                            profilePhoto: currentUser.profilePhoto,
                        },
                        compatibilityScore,
                    });
                }
                catch (socketError) {
                    logger_1.default.warn('Socket emit failed:', socketError);
                }
                // Create notifications
                await notification_service_1.default.notifyMatchAccepted(userId, targetUserId, match._id.toString());
                await notification_service_1.default.notifyMatchAccepted(targetUserId, userId, match._id.toString());
            }
            return {
                isMatch: true,
                pointsDeducted: pointsCost,
                match: {
                    id: match._id,
                    user: {
                        id: targetUser._id,
                        firstName: targetUser.firstName,
                        lastName: targetUser.lastName,
                        profilePhoto: targetUser.profilePhoto,
                    },
                    compatibilityScore,
                },
            };
        }
        // Not a match yet - emit match request
        try {
            (0, socket_config_1.emitMatchRequest)(targetUserId, {
                _id: currentUser._id,
                firstName: currentUser.firstName,
                lastName: currentUser.lastName,
                profilePhoto: currentUser.profilePhoto,
            });
        }
        catch (socketError) {
            logger_1.default.warn('Socket emit failed:', socketError);
        }
        // Create notification
        await notification_service_1.default.notifyLike(userId, targetUserId);
        return {
            isMatch: false,
            pointsDeducted: pointsCost,
        };
    }
    /**
     * Pass a user
     */
    async passUser(userId, targetUserId) {
        await models_1.User.findByIdAndUpdate(userId, { $addToSet: { passes: targetUserId } });
    }
    /**
     * Get user's matches with last message info
     */
    async getMatches(userId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const matches = await models_1.Match.find({
            $or: [{ user1: userId }, { user2: userId }],
            status: 'active',
        })
            .sort({ lastMessageAt: -1, matchedAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('user1 user2', 'firstName lastName profilePhoto bio occupation isActive lastSeen');
        const total = await models_1.Match.countDocuments({
            $or: [{ user1: userId }, { user2: userId }],
            status: 'active',
        });
        // Get last message for each match
        const formattedMatches = await Promise.all(matches.map(async (match) => {
            const otherUser = match.user1._id.toString() === userId
                ? match.user2
                : match.user1;
            const isUser1 = match.user1._id.toString() === userId;
            // Get last message
            const lastMessage = await models_1.Message.findOne({
                match: match._id,
                deleted: false,
            })
                .sort({ createdAt: -1 })
                .select('type content sender createdAt read')
                .lean();
            return {
                _id: match._id,
                id: match._id,
                user: otherUser,
                compatibilityScore: match.compatibilityScore,
                matchedAt: match.matchedAt,
                lastMessageAt: match.lastMessageAt || match.matchedAt,
                lastMessage,
                unreadCount: isUser1
                    ? match.unreadCount.user1
                    : match.unreadCount.user2,
            };
        }));
        return {
            matches: formattedMatches,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }
    /**
     * Get match details
     */
    async getMatchDetails(userId, matchId) {
        const match = await models_1.Match.findOne({
            _id: matchId,
            $or: [{ user1: userId }, { user2: userId }],
        }).populate('user1 user2');
        if (!match) {
            throw new Error('Match not found');
        }
        const otherUser = match.user1._id.toString() === userId
            ? match.user2
            : match.user1;
        return {
            id: match._id,
            user: otherUser,
            compatibilityScore: match.compatibilityScore,
            matchedAt: match.matchedAt,
            status: match.status,
        };
    }
    /**
     * Unmatch a user
     */
    async unmatch(userId, matchId) {
        const match = await models_1.Match.findOne({
            _id: matchId,
            $or: [{ user1: userId }, { user2: userId }],
        });
        if (!match) {
            throw new Error('Match not found');
        }
        match.status = 'blocked';
        await match.save();
        // Delete all messages
        await models_1.Message.deleteMany({ match: matchId });
    }
    /**
     * Get users who liked current user
     */
    async getLikes(userId) {
        const matchedUserIds = await this.getMatchedUserIds(userId);
        const usersWhoLiked = await models_1.User.find({
            likes: userId,
            _id: {
                $ne: userId,
                $nin: matchedUserIds
            },
        })
            .select('firstName lastName profilePhoto photos bio occupation ' +
            'location preferences lifestyle interests verified')
            .limit(50)
            .lean();
        logger_1.default.info(`Found ${usersWhoLiked.length} users who liked ${userId}`);
        return usersWhoLiked.map(user => ({
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
        }));
    }
    /**
     * Get matched user IDs helper
     */
    async getMatchedUserIds(userId) {
        const matches = await models_1.Match.find({
            $or: [{ user1: userId }, { user2: userId }],
            status: 'active',
        }).select('user1 user2');
        return matches.map((match) => match.user1.toString() === userId
            ? match.user2.toString()
            : match.user1.toString());
    }
}
exports.default = new MatchService();
//# sourceMappingURL=match.service.js.map