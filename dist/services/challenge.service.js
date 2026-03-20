"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const logger_1 = __importDefault(require("../utils/logger"));
const dayjs_1 = __importDefault(require("dayjs"));
class ChallengeService {
    /**
     * Get active challenges
     */
    async getActiveChallenges(type, userId) {
        const query = {
            isActive: true,
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() },
        };
        if (type) {
            query.type = type;
        }
        const challenges = await models_1.Challenge.find(query).sort({ startDate: -1 });
        return challenges.map((c) => {
            const participant = userId
                ? c.participants.find((p) => p.user.toString() === userId)
                : undefined;
            const totalTarget = c.requirements.reduce((sum, r) => sum + r.target, 0);
            const progress = participant?.progress || 0;
            // Build per-action progress breakdown
            const actionProgress = c.requirements.map((req) => ({
                action: req.action,
                target: req.target,
                current: participant?.progressByAction?.get(req.action) || 0,
            }));
            return {
                _id: c._id,
                title: c.title,
                description: c.description,
                type: c.type,
                category: c.category,
                icon: c.icon,
                startDate: c.startDate,
                endDate: c.endDate,
                pointsReward: c.pointsReward,
                cashReward: c.cashReward,
                cashCurrency: c.cashCurrency,
                badgeReward: c.badgeReward,
                requirements: c.requirements,
                tierRewards: c.tierRewards,
                participantCount: c.participants.length,
                joined: !!participant,
                myProgress: progress,
                myCompleted: participant?.completed || false,
                totalTarget,
                progressPercent: totalTarget > 0 ? Math.min(100, Math.round((progress / totalTarget) * 100)) : 0,
                actionProgress,
            };
        });
    }
    /**
     * Get challenge by ID
     */
    async getChallengeById(challengeId) {
        const challenge = await models_1.Challenge.findById(challengeId);
        if (!challenge) {
            throw new Error('Challenge not found');
        }
        return challenge;
    }
    /**
     * Join challenge
     */
    async joinChallenge(challengeId, userId) {
        const challenge = await models_1.Challenge.findById(challengeId);
        if (!challenge) {
            throw new Error('Challenge not found');
        }
        if (!challenge.isActive) {
            throw new Error('Challenge is not active');
        }
        if ((0, dayjs_1.default)().isAfter((0, dayjs_1.default)(challenge.endDate))) {
            throw new Error('Challenge has ended');
        }
        // Check if already joined
        const alreadyJoined = challenge.participants.some((p) => p.user.toString() === userId);
        if (alreadyJoined) {
            throw new Error('Already joined this challenge');
        }
        challenge.participants.push({
            user: userId,
            progress: 0,
            progressByAction: new Map(),
            completed: false,
        });
        await challenge.save();
        logger_1.default.info(`User ${userId} joined challenge ${challengeId}`);
        return challenge;
    }
    /**
     * Update challenge progress
     */
    async updateProgress(challengeId, userId, progress) {
        const challenge = await models_1.Challenge.findById(challengeId);
        if (!challenge) {
            throw new Error('Challenge not found');
        }
        const participant = challenge.participants.find((p) => p.user.toString() === userId);
        if (!participant) {
            throw new Error('Not a participant of this challenge');
        }
        participant.progress = progress;
        // Check if completed
        const totalRequired = challenge.requirements.reduce((sum, req) => sum + req.target, 0);
        if (progress >= totalRequired && !participant.completed) {
            participant.completed = true;
            participant.completedAt = new Date();
            // Award points and badge
            const user = await models_1.User.findById(userId);
            if (user) {
                user.gamification.points += challenge.pointsReward;
                if (challenge.badgeReward) {
                    user.gamification.badges.push(challenge.badgeReward);
                }
                // Update achievements
                const achievementKey = `challenge_${challenge.type}_${challengeId}`;
                if (!user.gamification.achievements.includes(achievementKey)) {
                    user.gamification.achievements.push(achievementKey);
                }
                await user.save();
                logger_1.default.info(`User ${userId} completed challenge ${challengeId}`);
            }
        }
        await challenge.save();
        return challenge;
    }
    /**
     * Get user challenges
     */
    async getUserChallenges(userId) {
        const challenges = await models_1.Challenge.find({
            'participants.user': userId,
            isActive: true,
        }).sort({ startDate: -1 });
        return challenges;
    }
    /**
     * Get global leaderboard (top users by gamification points)
     */
    async getGlobalLeaderboard(limit = 10, type) {
        // Aggregate points earned from completed challenges per user
        const matchStage = { 'participants.completed': true };
        if (type && ['daily', 'weekly', 'monthly'].includes(type)) {
            matchStage.type = type;
        }
        const leaderboard = await models_1.Challenge.aggregate([
            { $match: type ? { type } : {} },
            { $unwind: '$participants' },
            { $match: { 'participants.completed': true } },
            {
                $group: {
                    _id: '$participants.user',
                    weeklyPoints: { $sum: '$pointsReward' },
                    challengesCompleted: { $sum: 1 },
                },
            },
            { $sort: { weeklyPoints: -1 } },
            { $limit: limit },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'userInfo',
                },
            },
            { $unwind: '$userInfo' },
            {
                $project: {
                    userId: '$_id',
                    firstName: '$userInfo.firstName',
                    lastName: '$userInfo.lastName',
                    profilePhoto: '$userInfo.profilePhoto',
                    verified: '$userInfo.verified',
                    subscription: '$userInfo.subscription',
                    weeklyPoints: 1,
                    challengesCompleted: 1,
                },
            },
        ]);
        return leaderboard.map((entry, index) => ({
            ...entry,
            rank: index + 1,
        }));
    }
    /**
     * Get challenge leaderboard
     */
    async getChallengeLeaderboard(challengeId, limit = 10) {
        const challenge = await models_1.Challenge.findById(challengeId).populate('participants.user', 'firstName lastName profilePhoto');
        if (!challenge) {
            throw new Error('Challenge not found');
        }
        const leaderboard = challenge.participants
            .sort((a, b) => {
            if (a.completed && !b.completed)
                return -1;
            if (!a.completed && b.completed)
                return 1;
            return b.progress - a.progress;
        })
            .slice(0, limit)
            .map((participant, index) => ({
            rank: index + 1,
            user: participant.user,
            progress: participant.progress,
            completed: participant.completed,
            completedAt: participant.completedAt,
        }));
        return leaderboard;
    }
    /**
     * Create daily challenges (called by cron job)
     */
    async createDailyChallenges() {
        const today = (0, dayjs_1.default)().startOf('day');
        const tomorrow = today.add(1, 'day');
        const existingChallenge = await models_1.Challenge.findOne({
            type: 'daily',
            startDate: { $gte: today.toDate() },
        });
        if (existingChallenge) {
            logger_1.default.info('Daily challenge already exists for today');
            return;
        }
        const dailyChallenges = [
            {
                title: 'Match Master',
                description: 'Get 5 matches today',
                requirements: [{ action: 'match', target: 5 }],
                pointsReward: 100,
            },
            {
                title: 'Chat Champion',
                description: 'Send 20 messages today',
                requirements: [{ action: 'message', target: 20 }],
                pointsReward: 50,
            },
            {
                title: 'Profile Perfectionist',
                description: 'Update your profile and add 2 photos',
                requirements: [
                    { action: 'profile_update', target: 1 },
                    { action: 'photo_upload', target: 2 },
                ],
                pointsReward: 75,
            },
        ];
        const randomChallenge = dailyChallenges[Math.floor(Math.random() * dailyChallenges.length)];
        await models_1.Challenge.create({
            ...randomChallenge,
            type: 'daily',
            startDate: today.toDate(),
            endDate: tomorrow.toDate(),
            isActive: true,
        });
        logger_1.default.info('Daily challenge created');
    }
    /**
     * Create weekly challenges (called by cron job)
     */
    async createWeeklyChallenges() {
        const startOfWeek = (0, dayjs_1.default)().startOf('week');
        const endOfWeek = startOfWeek.add(1, 'week');
        const existingChallenge = await models_1.Challenge.findOne({
            type: 'weekly',
            startDate: { $gte: startOfWeek.toDate() },
        });
        if (existingChallenge) {
            logger_1.default.info('Weekly challenge already exists');
            return;
        }
        const weeklyChallenges = [
            {
                title: 'Social Butterfly',
                description: 'Get 20 matches this week',
                requirements: [{ action: 'match', target: 20 }],
                pointsReward: 500,
                badgeReward: 'social_butterfly',
            },
            {
                title: 'Property Hunter',
                description: 'View 30 properties this week',
                requirements: [{ action: 'property_view', target: 30 }],
                pointsReward: 300,
                badgeReward: 'property_hunter',
            },
            {
                title: 'Game Master',
                description: 'Win 10 games this week',
                requirements: [{ action: 'game_win', target: 10 }],
                pointsReward: 600,
                badgeReward: 'game_master',
            },
        ];
        const randomChallenge = weeklyChallenges[Math.floor(Math.random() * weeklyChallenges.length)];
        await models_1.Challenge.create({
            ...randomChallenge,
            type: 'weekly',
            startDate: startOfWeek.toDate(),
            endDate: endOfWeek.toDate(),
            isActive: true,
        });
        logger_1.default.info('Weekly challenge created');
    }
}
exports.default = new ChallengeService();
//# sourceMappingURL=challenge.service.js.map