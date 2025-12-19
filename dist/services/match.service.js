"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const compatibility_service_1 = __importDefault(require("./compatibility.service"));
const logger_1 = __importDefault(require("../utils/logger"));
class MatchService {
    /**
     * Get potential matches
     */
    async getPotentialMatches(userId, limit = 20, minCompatibility = 50) {
        const currentUser = await models_1.User.findById(userId);
        if (!currentUser) {
            throw new Error('User not found');
        }
        // Get interacted user IDs
        const interactedUserIds = [
            ...currentUser.likes.map(id => id.toString()),
            ...currentUser.passes.map(id => id.toString()),
            ...currentUser.blockedUsers.map(id => id.toString()),
        ];
        // Find potential matches
        const potentialMatches = await models_1.User.find({
            _id: {
                $ne: userId,
                $nin: interactedUserIds,
            },
            isActive: true,
            blockedUsers: { $ne: userId },
        })
            .limit(limit)
            .lean();
        // Calculate compatibility scores
        const matchesWithScores = potentialMatches.map((user) => {
            const score = compatibility_service_1.default.calculateCompatibility(currentUser, user);
            return {
                user,
                compatibilityScore: score,
            };
        })
            .filter((match) => match.compatibilityScore >= minCompatibility)
            .sort((a, b) => b.compatibilityScore - a.compatibilityScore);
        return matchesWithScores;
    }
    /**
     * Like a user
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
        // Add to likes
        if (!currentUser.likes.includes(targetUserId)) {
            currentUser.likes.push(targetUserId);
            await currentUser.save();
        }
        // Check for mutual match
        const isMutualMatch = targetUser.likes.includes(userId);
        if (isMutualMatch) {
            const compatibilityScore = compatibility_service_1.default.calculateCompatibility(currentUser, targetUser);
            // Check if match exists
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
                });
                logger_1.default.info(`New match created: ${userId} <-> ${targetUserId}`);
            }
            return {
                isMatch: true,
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
        return { isMatch: false };
    }
    /**
     * Pass a user
     */
    async passUser(userId, targetUserId) {
        await models_1.User.findByIdAndUpdate(userId, { $addToSet: { passes: targetUserId } });
    }
    /**
     * Get user's matches
     */
    async getMatches(userId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const matches = await models_1.Match.find({
            $or: [{ user1: userId }, { user2: userId }],
            status: 'active',
        })
            .sort({ matchedAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('user1 user2', 'firstName lastName profilePhoto bio occupation');
        const total = await models_1.Match.countDocuments({
            $or: [{ user1: userId }, { user2: userId }],
            status: 'active',
        });
        // Format matches
        const formattedMatches = matches.map((match) => {
            const otherUser = match.user1._id.toString() === userId
                ? match.user2
                : match.user1;
            return {
                id: match._id,
                user: otherUser,
                compatibilityScore: match.compatibilityScore,
                matchedAt: match.matchedAt,
                lastMessageAt: match.lastMessageAt,
                unreadCount: match.user1._id.toString() === userId
                    ? match.unreadCount.user1
                    : match.unreadCount.user2,
            };
        });
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
    }
    /**
     * Get users who liked current user
     */
    async getLikes(userId) {
        const matchedUserIds = await this.getMatchedUserIds(userId);
        const usersWhoLiked = await models_1.User.find({
            likes: userId,
            _id: { $nin: matchedUserIds },
        })
            .select('firstName lastName profilePhoto bio occupation')
            .limit(20);
        return usersWhoLiked;
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