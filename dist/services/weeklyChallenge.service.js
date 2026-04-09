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
const models_1 = require("../models");
const notification_service_1 = __importDefault(require("./notification.service"));
const points_service_1 = __importDefault(require("./points.service"));
const logger_1 = __importDefault(require("../utils/logger"));
class WeeklyChallengeService {
    /**
     * Get active challenges
     */
    async getActiveChallenges(userId) {
        const now = new Date();
        const challenges = await models_1.Challenge.find({
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now },
        }).sort({ type: 1, startDate: -1 });
        return challenges.map(c => {
            const participant = userId ? c.participants.find((p) => p.user.toString() === userId) : null;
            const totalTarget = c.requirements.reduce((sum, r) => sum + r.target, 0);
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
                myProgress: participant?.progress || 0,
                myCompleted: participant?.completed || false,
                totalTarget,
                progressPercent: totalTarget > 0 ? Math.min(100, Math.round(((participant?.progress || 0) / totalTarget) * 100)) : 0,
            };
        });
    }
    /**
     * Join a challenge
     */
    async joinChallenge(challengeId, userId) {
        const challenge = await models_1.Challenge.findById(challengeId);
        if (!challenge)
            throw new Error('Challenge not found');
        if (!challenge.isActive)
            throw new Error('Challenge is no longer active');
        if (new Date() > challenge.endDate)
            throw new Error('Challenge has ended');
        const existing = challenge.participants.find((p) => p.user.toString() === userId);
        if (existing)
            throw new Error('Already joined this challenge');
        if (challenge.maxParticipants && challenge.participants.length >= challenge.maxParticipants) {
            throw new Error('Challenge is full');
        }
        challenge.participants.push({ user: userId, progress: 0, completed: false });
        await challenge.save();
        logger_1.default.info(`User ${userId} joined challenge ${challengeId}`);
    }
    /**
     * Update progress for a user action
     */
    async trackAction(userId, action, amount = 1) {
        const now = new Date();
        const activeChallenges = await models_1.Challenge.find({
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now },
            'participants.user': userId,
            'requirements.action': action,
        });
        for (const challenge of activeChallenges) {
            const participant = challenge.participants.find((p) => p.user.toString() === userId);
            if (!participant || participant.completed)
                continue;
            // Initialize progressByAction map if needed
            if (!participant.progressByAction) {
                participant.progressByAction = new Map();
            }
            // Update per-action progress (cap at that action's target)
            const actionTarget = challenge.requirements
                .filter(r => r.action === action)
                .reduce((sum, r) => sum + r.target, 0);
            const currentActionProgress = participant.progressByAction.get(action) || 0;
            const newActionProgress = Math.min(currentActionProgress + amount, actionTarget);
            participant.progressByAction.set(action, newActionProgress);
            // Recalculate total progress from all actions
            let totalProgress = 0;
            for (const req of challenge.requirements) {
                totalProgress += participant.progressByAction.get(req.action) || 0;
            }
            participant.progress = totalProgress;
            // Check if ALL requirements are met
            const allRequirementsMet = challenge.requirements.every(req => {
                const actionProgress = participant.progressByAction.get(req.action) || 0;
                return actionProgress >= req.target;
            });
            if (allRequirementsMet) {
                participant.completed = true;
                participant.completedAt = new Date();
                // Award points
                try {
                    await points_service_1.default.addPoints({
                        userId,
                        amount: challenge.pointsReward,
                        type: 'achievement',
                        reason: `Completed challenge: ${challenge.title}`,
                        metadata: { challengeId: challenge._id.toString() },
                    });
                    participant.pointsAwarded = challenge.pointsReward;
                    logger_1.default.info(`Challenge completed: ${userId} — ${challenge.title} (+${challenge.pointsReward} pts)`);
                }
                catch (err) {
                    logger_1.default.error('Award challenge points error:', err);
                }
                // Notify user
                try {
                    await notification_service_1.default.createNotification({
                        user: userId,
                        type: 'achievement',
                        title: 'Challenge Completed! 🎉',
                        body: `You completed "${challenge.title}" and earned ${challenge.pointsReward} points!`,
                        data: { challengeId: challenge._id.toString() },
                    });
                }
                catch { }
                // Track clan points for challenge completion
                try {
                    const clanService = (await Promise.resolve().then(() => __importStar(require('./clan.service')))).default;
                    await clanService.trackMemberActivity(userId, 'challenge_complete', 5);
                }
                catch (e) {
                    logger_1.default.warn('Clan tracking error:', e);
                }
            }
            await challenge.save();
        }
    }
    /**
     * Get weekly leaderboard
     */
    async getWeeklyLeaderboard(limit = 50) {
        // Get current week's start (Monday)
        const now = new Date();
        const dayOfWeek = now.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() + mondayOffset);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        // Get all completed challenges this week
        const challenges = await models_1.Challenge.find({
            type: 'weekly',
            startDate: { $gte: weekStart },
            endDate: { $lte: weekEnd },
        });
        // Aggregate points per user
        const userPoints = {};
        for (const challenge of challenges) {
            for (const p of challenge.participants) {
                if (p.completed) {
                    const uid = p.user.toString();
                    userPoints[uid] = (userPoints[uid] || 0) + (p.pointsAwarded || challenge.pointsReward);
                }
            }
        }
        // Also include general weekly points earned
        const { UserPoints } = require('../models');
        const weeklyTransactions = await UserPoints.find({
            createdAt: { $gte: weekStart, $lt: weekEnd },
        }).select('user amount').lean().catch(() => []);
        for (const tx of weeklyTransactions) {
            if (tx.amount > 0) {
                const uid = tx.user.toString();
                userPoints[uid] = (userPoints[uid] || 0) + tx.amount;
            }
        }
        // Sort and rank
        const sorted = Object.entries(userPoints)
            .sort(([, a], [, b]) => b - a)
            .slice(0, limit);
        const userIds = sorted.map(([id]) => id);
        const users = await models_1.User.find({ _id: { $in: userIds } })
            .select('firstName lastName profilePhoto verified subscription')
            .lean();
        return sorted.map(([userId, points], index) => {
            const user = users.find((u) => u._id.toString() === userId);
            return {
                rank: index + 1,
                userId,
                firstName: user?.firstName || 'Unknown',
                lastName: user?.lastName || '',
                profilePhoto: user?.profilePhoto,
                verified: user?.verified,
                subscription: user?.subscription,
                weeklyPoints: points,
            };
        });
    }
    /**
     * Admin: Create challenge
     */
    async createChallenge(data) {
        const challenge = await models_1.Challenge.create({
            title: data.title,
            description: data.description,
            type: data.type || 'weekly',
            category: data.category || 'general',
            icon: data.icon,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
            pointsReward: data.pointsReward || 40,
            cashReward: data.cashReward || 0,
            cashCurrency: data.cashCurrency || 'NGN',
            badgeReward: data.badgeReward,
            requirements: data.requirements || [],
            tierRewards: data.tierRewards || [
                { tier: 'champion', minRank: 1, maxRank: 1, points: 150, cash: 0, badge: 'weekly_champion', title: 'Weekly Champion' },
                { tier: 'gold', minRank: 2, maxRank: 3, points: 75, cash: 0, badge: 'gold' },
                { tier: 'silver', minRank: 4, maxRank: 10, points: 40, cash: 0, badge: 'silver' },
                { tier: 'bronze', minRank: 11, maxRank: 50, points: 20, cash: 0, badge: 'bronze' },
            ],
            maxParticipants: data.maxParticipants,
            isActive: true,
            createdBy: data.createdBy,
        });
        logger_1.default.info(`Challenge created: ${challenge.title} (${challenge.type})`);
        return challenge;
    }
    /**
     * Admin: Send notification to all users
     */
    async broadcastNotification(data) {
        const users = await models_1.User.find({ isActive: true }).select('_id fcmToken').lean();
        let sent = 0;
        for (const user of users) {
            try {
                await notification_service_1.default.createNotification({
                    user: user._id.toString(),
                    type: data.type || 'system',
                    title: data.title,
                    body: data.body,
                });
                sent++;
            }
            catch { }
        }
        // Push notifications are now sent automatically by notificationService.createNotification()
        logger_1.default.info(`Broadcast notification sent to ${sent} users: ${data.title}`);
        return sent;
    }
}
exports.default = new WeeklyChallengeService();
//# sourceMappingURL=weeklyChallenge.service.js.map