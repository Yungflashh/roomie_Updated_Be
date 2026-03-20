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
// src/services/points.service.ts - COMPLETE FILE WITH USERNAME SUPPORT
const User_1 = require("../models/User");
const PointTransaction_1 = require("../models/PointTransaction");
const PointsConfig_1 = require("../models/PointsConfig");
const Game_1 = require("../models/Game");
const logger_1 = __importDefault(require("../utils/logger"));
class PointsService {
    configCache = null;
    configCacheTime = 0;
    CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    /**
     * Get active points configuration (with caching)
     */
    async getConfig() {
        const now = Date.now();
        // Return cached config if still valid
        if (this.configCache && (now - this.configCacheTime) < this.CACHE_DURATION) {
            return this.configCache;
        }
        // Fetch from database
        let config = await PointsConfig_1.PointsConfig.findOne({ isActive: true });
        // Create default config if none exists
        if (!config) {
            config = await PointsConfig_1.PointsConfig.create({
                isActive: true,
            });
            logger_1.default.info('Created default points configuration');
        }
        this.configCache = config;
        this.configCacheTime = now;
        return config;
    }
    /**
     * Calculate level from points
     */
    calculateLevel(points, config) {
        if (!config) {
            // Default calculation if config not provided
            return Math.floor(points / 100) + 1;
        }
        let level = 1;
        let pointsNeeded = config.baseLevelPoints;
        while (points >= pointsNeeded) {
            level++;
            pointsNeeded += Math.floor(config.pointsPerLevel * Math.pow(config.levelMultiplier, level - 2));
        }
        return level;
    }
    /**
     * Calculate points needed for next level
     */
    calculatePointsForNextLevel(currentLevel, config) {
        if (!config) {
            return currentLevel * 100;
        }
        let pointsNeeded = config.baseLevelPoints;
        for (let i = 1; i < currentLevel; i++) {
            pointsNeeded += Math.floor(config.pointsPerLevel * Math.pow(config.levelMultiplier, i - 1));
        }
        return pointsNeeded;
    }
    /**
     * Add points to user
     */
    async addPoints(options) {
        const { userId, amount, type, reason, metadata = {} } = options;
        try {
            const user = await User_1.User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }
            const config = await this.getConfig();
            const oldPoints = user.gamification.points;
            const oldLevel = user.gamification.level;
            const newPoints = oldPoints + amount;
            // Update user points
            user.gamification.points = newPoints;
            // Check for level up
            const newLevel = this.calculateLevel(newPoints, config);
            let leveledUp = false;
            if (newLevel > oldLevel) {
                user.gamification.level = newLevel;
                leveledUp = true;
                logger_1.default.info(`User ${userId} leveled up from ${oldLevel} to ${newLevel}`);
            }
            await user.save();
            // Create transaction record
            const transaction = await PointTransaction_1.PointTransaction.create({
                user: userId,
                type,
                amount,
                balance: newPoints,
                reason,
                metadata: {
                    ...metadata,
                    oldLevel: leveledUp ? oldLevel : undefined,
                    newLevel: leveledUp ? newLevel : undefined,
                },
            });
            logger_1.default.info(`Added ${amount} points to user ${userId}. New balance: ${newPoints}`);
            // Track challenge progress for points earned (lazy import to avoid circular dependency)
            if (type !== 'level_up' && type !== 'achievement') {
                try {
                    const wcs = (await Promise.resolve().then(() => __importStar(require('./weeklyChallenge.service')))).default;
                    await wcs.trackAction(userId, 'points_earned', amount);
                }
                catch (e) {
                    logger_1.default.warn('Challenge tracking (points_earned) error:', e);
                }
            }
            // Award level up bonus if leveled up
            if (leveledUp) {
                const levelUpBonus = Math.floor(newLevel * 10); // 10 points per new level
                await this.addPoints({
                    userId,
                    amount: levelUpBonus,
                    type: 'level_up',
                    reason: `Level ${newLevel} bonus`,
                    metadata: { level: newLevel },
                });
            }
            return {
                success: true,
                newBalance: newPoints,
                transaction,
                leveledUp,
                newLevel: leveledUp ? newLevel : undefined,
                oldLevel: leveledUp ? oldLevel : undefined,
            };
        }
        catch (error) {
            logger_1.default.error('Add points error:', error);
            throw new Error(error.message || 'Failed to add points');
        }
    }
    /**
     * Deduct points from user
     */
    async deductPoints(options) {
        const { userId, amount, type, reason, metadata = {} } = options;
        try {
            const user = await User_1.User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }
            if (user.gamification.points < amount) {
                throw new Error('Insufficient points');
            }
            const oldPoints = user.gamification.points;
            const newPoints = oldPoints - amount;
            user.gamification.points = newPoints;
            await user.save();
            // Create transaction record (negative amount)
            const transaction = await PointTransaction_1.PointTransaction.create({
                user: userId,
                type,
                amount: -amount,
                balance: newPoints,
                reason,
                metadata,
            });
            logger_1.default.info(`Deducted ${amount} points from user ${userId}. New balance: ${newPoints}`);
            return {
                success: true,
                newBalance: newPoints,
                transaction,
            };
        }
        catch (error) {
            logger_1.default.error('Deduct points error:', error);
            throw new Error(error.message || 'Failed to deduct points');
        }
    }
    /**
     * Check if user has enough points
     */
    async hasEnoughPoints(userId, amount) {
        const user = await User_1.User.findById(userId).select('gamification.points');
        if (!user)
            return false;
        return user.gamification.points >= amount;
    }
    /**
     * Check if user meets level requirement
     */
    async meetsLevelRequirement(userId, requiredLevel) {
        const user = await User_1.User.findById(userId).select('gamification.level');
        if (!user)
            return false;
        return user.gamification.level >= requiredLevel;
    }
    /**
     * Calculate match request cost for user (considering premium benefits)
     */
    async calculateMatchCost(userId) {
        const user = await User_1.User.findById(userId).select('subscription.plan gamification');
        if (!user)
            throw new Error('User not found');
        const config = await this.getConfig();
        let cost = config.matchRequestCost;
        // Premium users get discount
        if (user.subscription.plan === 'premium' || user.subscription.plan === 'pro') {
            const discount = config.premiumMatchDiscount / 100;
            cost = Math.floor(cost * (1 - discount));
        }
        return cost;
    }
    /**
     * Calculate game entry cost for user (considering premium benefits)
     */
    async calculateGameCost(userId, gameId) {
        const [user, game] = await Promise.all([
            User_1.User.findById(userId).select('subscription.plan'),
            Game_1.Game.findById(gameId).select('pointsCost'),
        ]);
        if (!user)
            throw new Error('User not found');
        if (!game)
            throw new Error('Game not found');
        let cost = game.pointsCost;
        // Premium users get discount
        if (user.subscription.plan === 'premium' || user.subscription.plan === 'pro') {
            const config = await this.getConfig();
            const discount = config.premiumGameDiscount / 100;
            cost = Math.floor(cost * (1 - discount));
        }
        return cost;
    }
    /**
     * Award daily login bonus
     */
    async awardDailyLoginBonus(userId) {
        try {
            const user = await User_1.User.findById(userId);
            if (!user)
                throw new Error('User not found');
            const config = await this.getConfig();
            const today = new Date().toDateString();
            const lastActive = user.gamification.lastActiveDate
                ? new Date(user.gamification.lastActiveDate).toDateString()
                : null;
            // Check if already awarded today
            if (lastActive === today) {
                return { awarded: false };
            }
            // Calculate bonus with premium multiplier
            const premiumService = require('./premium.service').default;
            const limits = premiumService.getLimits(user);
            let bonus = config.dailyLoginBonus * limits.dailyBonusMultiplier;
            // Update streak
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toDateString();
            if (lastActive === yesterdayStr) {
                user.gamification.streak += 1;
            }
            else {
                user.gamification.streak = 1;
            }
            user.gamification.lastActiveDate = new Date();
            await user.save();
            // Award points
            const result = await this.addPoints({
                userId,
                amount: bonus,
                type: 'daily_login',
                reason: `Daily login bonus (Day ${user.gamification.streak})`,
                metadata: { streak: user.gamification.streak },
            });
            // Check for weekly streak bonus (7 days)
            if (user.gamification.streak % 7 === 0) {
                await this.addPoints({
                    userId,
                    amount: config.weeklyStreakBonus,
                    type: 'weekly_streak',
                    reason: `${user.gamification.streak} days streak bonus!`,
                    metadata: { streak: user.gamification.streak },
                });
            }
            return {
                awarded: true,
                amount: bonus,
                newBalance: result.newBalance,
            };
        }
        catch (error) {
            logger_1.default.error('Award daily login bonus error:', error);
            return { awarded: false };
        }
    }
    /**
     * Get user point statistics
     */
    async getUserPointStats(userId) {
        const [user, transactions, config] = await Promise.all([
            User_1.User.findById(userId).select('gamification subscription pointsUsername'),
            PointTransaction_1.PointTransaction.find({ user: userId }).sort({ createdAt: -1 }).limit(50),
            this.getConfig(),
        ]);
        if (!user)
            throw new Error('User not found');
        const totalEarned = await PointTransaction_1.PointTransaction.aggregate([
            { $match: { user: user._id, amount: { $gt: 0 } } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const totalSpent = await PointTransaction_1.PointTransaction.aggregate([
            { $match: { user: user._id, amount: { $lt: 0 } } },
            { $group: { _id: null, total: { $sum: { $abs: '$amount' } } } },
        ]);
        const pointsForNextLevel = this.calculatePointsForNextLevel(user.gamification.level + 1, config);
        return {
            currentPoints: user.gamification.points,
            currentLevel: user.gamification.level,
            pointsForNextLevel,
            pointsToNextLevel: pointsForNextLevel - user.gamification.points,
            totalEarned: totalEarned[0]?.total || 0,
            totalSpent: totalSpent[0]?.total || 0,
            streak: user.gamification.streak,
            pointsUsername: user.pointsUsername,
            recentTransactions: transactions,
            isPremium: user.subscription.plan !== 'free',
        };
    }
    /**
     * Get point transaction history
     */
    async getTransactionHistory(userId, page = 1, limit = 20, type) {
        const skip = (page - 1) * limit;
        const query = { user: userId };
        if (type) {
            query.type = type;
        }
        const [transactions, total] = await Promise.all([
            PointTransaction_1.PointTransaction.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            PointTransaction_1.PointTransaction.countDocuments(query),
        ]);
        return {
            transactions,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }
    /**
     * Check if username is available
     */
    async isUsernameAvailable(username, excludeUserId) {
        const cleanUsername = username.toLowerCase().trim();
        const existingUser = await User_1.User.findOne({ pointsUsername: cleanUsername });
        if (!existingUser)
            return true;
        if (excludeUserId && existingUser._id.toString() === excludeUserId)
            return true;
        return false;
    }
    /**
     * Find user by points username
     */
    async findUserByUsername(username) {
        const cleanUsername = username.toLowerCase().trim();
        return await User_1.User.findOne({ pointsUsername: cleanUsername })
            .select('firstName lastName profilePhoto verified pointsUsername gamification.points gamification.level');
    }
}
exports.default = new PointsService();
//# sourceMappingURL=points.service.js.map