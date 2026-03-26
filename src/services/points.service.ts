// src/services/points.service.ts - COMPLETE FILE WITH USERNAME SUPPORT
import { User, IUserDocument } from '../models/User';
import { PointTransaction } from '../models/PointTransaction';
import { PointsConfig, IPointsConfigDocument } from '../models/PointsConfig';
import { Game } from '../models/Game';
import logger from '../utils/logger';

interface AddPointsOptions {
  userId: string;
  amount: number;
  type: 
    | 'earned' 
    | 'bonus' 
    | 'daily_login' 
    | 'weekly_streak' 
    | 'level_up'
    | 'verification'
    | 'game_reward'
    | 'achievement'
    | 'refund';
  reason: string;
  metadata?: Record<string, any>;
}

interface DeductPointsOptions {
  userId: string;
  amount: number;
  type: 'spent' | 'penalty' | 'game_entry' | 'match_request';
  reason: string;
  metadata?: Record<string, any>;
}

class PointsService {
  private configCache: IPointsConfigDocument | null = null;
  private configCacheTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get active points configuration (with caching)
   */
  async getConfig(): Promise<IPointsConfigDocument> {
    const now = Date.now();
    
    // Return cached config if still valid
    if (this.configCache && (now - this.configCacheTime) < this.CACHE_DURATION) {
      return this.configCache;
    }

    // Fetch from database
    let config = await PointsConfig.findOne({ isActive: true });

    // Create default config if none exists
    if (!config) {
      config = await PointsConfig.create({
        isActive: true,
      });
      logger.info('Created default points configuration');
    }

    this.configCache = config;
    this.configCacheTime = now;
    
    return config;
  }

  /**
   * Calculate level from points
   */
  calculateLevel(points: number, config?: IPointsConfigDocument): number {
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
  calculatePointsForNextLevel(currentLevel: number, config?: IPointsConfigDocument): number {
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
  async addPoints(options: AddPointsOptions): Promise<{
    success: boolean;
    newBalance: number;
    transaction: any;
    leveledUp: boolean;
    newLevel?: number;
    oldLevel?: number;
  }> {
    const { userId, amount, type, reason, metadata = {} } = options;

    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Apply clan perk bonus to personal points (for earned/game_reward/achievement types)
      let finalAmount = amount;
      const boostableTypes = ['earned', 'game_reward', 'achievement', 'daily_login', 'bonus'];
      if (boostableTypes.includes(type) && amount > 0) {
        try {
          const { Clan } = await import('../models/Clan');
          const clan = await Clan.findOne({ 'members.user': userId }).select('level purchasedUpgrades').lean();
          if (clan) {
            const clanService = (await import('./clan.service')).default;
            const boostPct = await clanService.getActiveBoostMultiplier(clan._id.toString());
            if (boostPct > 0) {
              const bonus = Math.round(amount * boostPct);
              finalAmount = amount + bonus;
              logger.info(`Clan boost: +${Math.round(boostPct * 100)}% (+${bonus}) for user ${userId}`);
            }
          }
        } catch (e) {
          // Clan boost is best-effort; don't fail the point award
        }
      }

      const config = await this.getConfig();
      const oldPoints = user.gamification.points;
      const oldLevel = user.gamification.level;
      const newPoints = oldPoints + finalAmount;

      // Update user points
      user.gamification.points = newPoints;

      // Check for level up
      const newLevel = this.calculateLevel(newPoints, config);
      let leveledUp = false;

      if (newLevel > oldLevel) {
        user.gamification.level = newLevel;
        leveledUp = true;
        logger.info(`User ${userId} leveled up from ${oldLevel} to ${newLevel}`);
      }

      await user.save();

      // Create transaction record
      const transaction = await PointTransaction.create({
        user: userId,
        type,
        amount: finalAmount,
        balance: newPoints,
        reason: finalAmount > amount ? `${reason} (+${finalAmount - amount} clan boost)` : reason,
        metadata: {
          ...metadata,
          oldLevel: leveledUp ? oldLevel : undefined,
          newLevel: leveledUp ? newLevel : undefined,
        },
      });

      logger.info(`Added ${amount} points to user ${userId}. New balance: ${newPoints}`);

      // Track challenge progress for points earned (lazy import to avoid circular dependency)
      if (type !== 'level_up' && type !== 'achievement') {
        try {
          const wcs = (await import('./weeklyChallenge.service')).default;
          await wcs.trackAction(userId, 'points_earned', amount);
        } catch (e) { logger.warn('Challenge tracking (points_earned) error:', e); }
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
    } catch (error: any) {
      logger.error('Add points error:', error);
      throw new Error(error.message || 'Failed to add points');
    }
  }

  /**
   * Deduct points from user
   */
  async deductPoints(options: DeductPointsOptions): Promise<{
    success: boolean;
    newBalance: number;
    transaction: any;
  }> {
    const { userId, amount, type, reason, metadata = {} } = options;

    try {
      const user = await User.findById(userId);
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
      const transaction = await PointTransaction.create({
        user: userId,
        type,
        amount: -amount,
        balance: newPoints,
        reason,
        metadata,
      });

      logger.info(`Deducted ${amount} points from user ${userId}. New balance: ${newPoints}`);

      return {
        success: true,
        newBalance: newPoints,
        transaction,
      };
    } catch (error: any) {
      logger.error('Deduct points error:', error);
      throw new Error(error.message || 'Failed to deduct points');
    }
  }

  /**
   * Check if user has enough points
   */
  async hasEnoughPoints(userId: string, amount: number): Promise<boolean> {
    const user = await User.findById(userId).select('gamification.points');
    if (!user) return false;
    return user.gamification.points >= amount;
  }

  /**
   * Check if user meets level requirement
   */
  async meetsLevelRequirement(userId: string, requiredLevel: number): Promise<boolean> {
    const user = await User.findById(userId).select('gamification.level');
    if (!user) return false;
    return user.gamification.level >= requiredLevel;
  }

  /**
   * Calculate match request cost for user (considering premium benefits)
   */
  async calculateMatchCost(userId: string): Promise<number> {
    const user = await User.findById(userId).select('subscription.plan gamification');
    if (!user) throw new Error('User not found');

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
  async calculateGameCost(userId: string, gameId: string): Promise<number> {
    const [user, game] = await Promise.all([
      User.findById(userId).select('subscription.plan'),
      Game.findById(gameId).select('pointsCost'),
    ]);

    if (!user) throw new Error('User not found');
    if (!game) throw new Error('Game not found');

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
  async awardDailyLoginBonus(userId: string): Promise<{
    awarded: boolean;
    amount?: number;
    newBalance?: number;
  }> {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

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
      } else {
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

      // Clan daily bonus — clan members get extra daily points
      let clanBonus = 0;
      try {
        const { Clan } = await import('../models/Clan');
        const clan = await Clan.findOne({ 'members.user': userId }).select('level tag');
        if (clan) {
          clanBonus = 5 + Math.min(clan.level, 10) * 2; // 7 at level 1, up to 25 at level 10
          await this.addPoints({
            userId,
            amount: clanBonus,
            type: 'bonus',
            reason: `Clan [${clan.tag}] daily member bonus`,
            metadata: { clanId: clan._id.toString(), clanLevel: clan.level },
          });
          // Also track for clan
          const clanService = (await import('./clan.service')).default;
          await clanService.trackMemberActivity(userId, 'daily_login', 5);
        }
      } catch (e) {
        // Best-effort
      }

      return {
        awarded: true,
        amount: bonus + clanBonus,
        newBalance: result.newBalance,
      };
    } catch (error: any) {
      logger.error('Award daily login bonus error:', error);
      return { awarded: false };
    }
  }

  /**
   * Get user point statistics
   */
  async getUserPointStats(userId: string): Promise<any> {
    const [user, transactions, config] = await Promise.all([
      User.findById(userId).select('gamification subscription pointsUsername'),
      PointTransaction.find({ user: userId }).sort({ createdAt: -1 }).limit(50),
      this.getConfig(),
    ]);

    if (!user) throw new Error('User not found');

    const totalEarned = await PointTransaction.aggregate([
      { $match: { user: user._id, amount: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const totalSpent = await PointTransaction.aggregate([
      { $match: { user: user._id, amount: { $lt: 0 } } },
      { $group: { _id: null, total: { $sum: { $abs: '$amount' } } } },
    ]);

    const pointsForNextLevel = this.calculatePointsForNextLevel(
      user.gamification.level + 1,
      config
    );

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
  async getTransactionHistory(
    userId: string,
    page: number = 1,
    limit: number = 20,
    type?: string
  ): Promise<any> {
    const skip = (page - 1) * limit;
    const query: any = { user: userId };
    
    if (type) {
      query.type = type;
    }

    const [transactions, total] = await Promise.all([
      PointTransaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PointTransaction.countDocuments(query),
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
  async isUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> {
    const cleanUsername = username.toLowerCase().trim();
    const existingUser = await User.findOne({ pointsUsername: cleanUsername });
    
    if (!existingUser) return true;
    if (excludeUserId && existingUser._id.toString() === excludeUserId) return true;
    
    return false;
  }

  /**
   * Find user by points username
   */
  async findUserByUsername(username: string): Promise<IUserDocument | null> {
    const cleanUsername = username.toLowerCase().trim();
    return await User.findOne({ pointsUsername: cleanUsername })
      .select('firstName lastName profilePhoto verified pointsUsername gamification.points gamification.level');
  }

  /**
   * Generate a unique referral code for user
   */
  async generateReferralCode(userId: string): Promise<string> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // If user already has a code, return it
    if (user.referralCode) return user.referralCode;

    // Generate a unique 6-char alphanumeric code
    let code = '';
    let attempts = 0;
    do {
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const existing = await User.findOne({ referralCode: code });
      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    user.referralCode = code;
    await user.save();

    logger.info(`Generated referral code ${code} for user ${userId}`);
    return code;
  }

  /**
   * Apply referral code during/after signup
   */
  async applyReferralCode(newUserId: string, code: string): Promise<{
    success: boolean;
    referrerName?: string;
    bonusAwarded?: number;
  }> {
    const cleanCode = code.toUpperCase().trim();

    const referrer = await User.findOne({ referralCode: cleanCode });
    if (!referrer) throw new Error('Invalid referral code');

    if (referrer._id.toString() === newUserId) {
      throw new Error('Cannot use your own referral code');
    }

    const newUser = await User.findById(newUserId);
    if (!newUser) throw new Error('User not found');

    if (newUser.referredBy) {
      throw new Error('You have already used a referral code');
    }

    const config = await this.getConfig();

    // Mark referral relationship
    newUser.referredBy = referrer._id.toString();
    await newUser.save();

    // Increment referrer's count
    referrer.referralCount = (referrer.referralCount || 0) + 1;
    await referrer.save();

    // Award bonus to referrer
    await this.addPoints({
      userId: referrer._id.toString(),
      amount: config.referralBonus || 50,
      type: 'bonus',
      reason: `Referral bonus — ${newUser.firstName} joined with your code`,
      metadata: { referredUserId: newUserId, referralCode: cleanCode },
    });

    // Award signup bonus to new user
    await this.addPoints({
      userId: newUserId,
      amount: config.referralSignupBonus || 20,
      type: 'bonus',
      reason: `Welcome bonus — joined with referral code`,
      metadata: { referrerId: referrer._id.toString(), referralCode: cleanCode },
    });

    logger.info(`Referral applied: ${newUserId} used code ${cleanCode} from ${referrer._id}`);

    return {
      success: true,
      referrerName: referrer.firstName,
      bonusAwarded: config.referralSignupBonus || 20,
    };
  }

  /**
   * Get referral stats for a user
   */
  async getReferralStats(userId: string): Promise<{
    referralCode: string;
    referralCount: number;
    totalEarnedFromReferrals: number;
  }> {
    const user = await User.findById(userId).select('referralCode referralCount');
    if (!user) throw new Error('User not found');

    // Generate code if user doesn't have one yet
    const code = user.referralCode || await this.generateReferralCode(userId);

    // Count total points earned from referrals
    const referralTransactions = await PointTransaction.aggregate([
      { $match: { user: user._id, 'metadata.referralCode': { $exists: true }, amount: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    return {
      referralCode: code,
      referralCount: user.referralCount || 0,
      totalEarnedFromReferrals: referralTransactions[0]?.total || 0,
    };
  }
}

export default new PointsService();