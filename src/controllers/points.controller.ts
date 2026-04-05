// src/controllers/points.controller.ts - WITH REDIS CACHING + USERNAME SUPPORT
import { Response } from 'express';
import { AuthRequest } from '../types';
import pointsService from '../services/points.service';
import paystackService from '../services/paystack.service';
import cacheService from '../services/cache.service';
import { User } from '../models/User';
import logger from '../utils/logger';
import { logAudit } from '../utils/audit';

class PointsController {
  /**
   * Get user points statistics
   * GET /api/v1/points/stats
   */
  async getPointsStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const stats = await cacheService.getOrSet(
        cacheService.pointsStatsKey(userId),
        () => pointsService.getUserPointStats(userId),
        120
      );

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Get points stats error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch points statistics',
      });
    }
  }

  /**
   * Get transaction history
   * GET /api/v1/points/transactions
   */
  async getTransactionHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { page = 1, limit = 20, type } = req.query;

      const result = await pointsService.getTransactionHistory(
        userId,
        parseInt(page as string),
        parseInt(limit as string),
        type as string
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Get transaction history error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch transaction history',
      });
    }
  }

  /**
   * Claim daily login bonus
   * POST /api/v1/points/daily-bonus
   */
  async claimDailyBonus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const result = await pointsService.awardDailyLoginBonus(userId);

      if (result.awarded) {
        // Bust points cache after earning bonus
        await cacheService.onPointsChange(userId);

        await logAudit({
          actor: { id: userId, name: '', email: '' },
          actorType: 'user', action: 'claim_daily_bonus', category: 'points',
          details: 'Claimed daily login bonus', req
        });

        res.status(200).json({
          success: true,
          message: 'Daily bonus claimed!',
          data: result,
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Daily bonus already claimed today',
        });
      }
    } catch (error: any) {
      logger.error('Claim daily bonus error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to claim daily bonus',
      });
    }
  }

  /**
   * Get points configuration
   * GET /api/v1/points/config
   */
  async getPointsConfig(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Points config is global and rarely changes — cache for 10 minutes
      const config = await cacheService.getOrSet(
        cacheService.pointsConfigKey(),
        () => pointsService.getConfig(),
        600
      );

      res.status(200).json({
        success: true,
        data: { config },
      });
    } catch (error: any) {
      logger.error('Get points config error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch points configuration',
      });
    }
  }

  /**
   * Check if user can afford action
   * GET /api/v1/points/check-affordability
   */
  async checkAffordability(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { action, targetId } = req.query;

      let cost = 0;
      let canAfford = false;
      let message = '';

      switch (action) {
        case 'match':
          cost = await pointsService.calculateMatchCost(userId);
          canAfford = await pointsService.hasEnoughPoints(userId, cost);
          message = canAfford ? 'Can send match request' : 'Insufficient points for match request';
          break;

        case 'game':
          if (!targetId) {
            res.status(400).json({
              success: false,
              message: 'Game ID required for game affordability check',
            });
            return;
          }
          cost = await pointsService.calculateGameCost(userId, targetId as string);
          canAfford = await pointsService.hasEnoughPoints(userId, cost);
          message = canAfford ? 'Can play game' : 'Insufficient points for game';
          break;

        default:
          res.status(400).json({
            success: false,
            message: 'Invalid action type',
          });
          return;
      }

      res.status(200).json({
        success: true,
        data: {
          action,
          cost,
          canAfford,
          message,
        },
      });
    } catch (error: any) {
      logger.error('Check affordability error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to check affordability',
      });
    }
  }

  /**
   * Set or update points username
   * PUT /api/v1/points/username
   * Body: { username: string }
   */
  async setPointsUsername(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { username } = req.body;

      if (!username) {
        res.status(400).json({
          success: false,
          message: 'Username is required',
        });
        return;
      }

      const cleanUsername = username.toLowerCase().trim();

      // Validation
      if (cleanUsername.length < 3 || cleanUsername.length > 20) {
        res.status(400).json({
          success: false,
          message: 'Username must be between 3 and 20 characters',
        });
        return;
      }

      if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
        res.status(400).json({
          success: false,
          message: 'Username can only contain lowercase letters, numbers, and underscores',
        });
        return;
      }

      // Reserved usernames
      const reservedUsernames = [
        'admin', 'support', 'help', 'roomie', 'official', 'team',
        'moderator', 'mod', 'system', 'bot', 'service', 'staff',
        'developer', 'dev', 'test', 'user', 'root'
      ];

      if (reservedUsernames.includes(cleanUsername)) {
        res.status(400).json({
          success: false,
          message: 'This username is reserved',
        });
        return;
      }

      // Check if username is already taken
      const isAvailable = await pointsService.isUsernameAvailable(cleanUsername, userId);
      if (!isAvailable) {
        res.status(409).json({
          success: false,
          message: 'Username is already taken',
        });
        return;
      }

      // Update user
      const user = await User.findByIdAndUpdate(
        userId,
        { pointsUsername: cleanUsername },
        { new: true }
      ).select('pointsUsername firstName lastName profilePhoto');

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      logger.info(`User ${userId} set points username to: ${cleanUsername}`);

      await logAudit({
        actor: { id: userId, name: '', email: '' },
        actorType: 'user', action: 'set_points_username', category: 'points',
        details: `Set points username to ${cleanUsername}`, req
      });

      res.status(200).json({
        success: true,
        message: 'Username set successfully',
        data: {
          pointsUsername: user.pointsUsername,
        },
      });
    } catch (error: any) {
      logger.error('Set points username error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to set username',
      });
    }
  }

  /**
   * Check if points username is available
   * GET /api/v1/points/username/check?username=value
   */
  async checkUsernameAvailability(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { username } = req.query;
      const userId = req.user?.userId;

      if (!username || typeof username !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Username is required',
        });
        return;
      }

      const cleanUsername = username.toLowerCase().trim();

      // Basic validation
      if (cleanUsername.length < 3 || cleanUsername.length > 20) {
        res.status(200).json({
          success: true,
          data: {
            available: false,
            reason: 'Username must be between 3 and 20 characters',
          },
        });
        return;
      }

      if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
        res.status(200).json({
          success: true,
          data: {
            available: false,
            reason: 'Username can only contain lowercase letters, numbers, and underscores',
          },
        });
        return;
      }

      // Reserved usernames
      const reservedUsernames = [
        'admin', 'support', 'help', 'roomie', 'official', 'team',
        'moderator', 'mod', 'system', 'bot', 'service', 'staff',
        'developer', 'dev', 'test', 'user', 'root'
      ];

      if (reservedUsernames.includes(cleanUsername)) {
        res.status(200).json({
          success: true,
          data: {
            available: false,
            reason: 'This username is reserved',
          },
        });
        return;
      }

      // Check if taken
      const existingUser = await User.findOne({ pointsUsername: cleanUsername });
      
      // If it's the current user's username, it's available
      if (existingUser && existingUser._id.toString() === userId) {
        res.status(200).json({
          success: true,
          data: {
            available: true,
            reason: 'This is your current username',
          },
        });
        return;
      }

      // Check if taken by someone else
      if (existingUser) {
        res.status(200).json({
          success: true,
          data: {
            available: false,
            reason: 'Username is already taken',
          },
        });
        return;
      }

      // Available!
      res.status(200).json({
        success: true,
        data: {
          available: true,
          reason: 'Username is available',
        },
      });
    } catch (error: any) {
      logger.error('Check username availability error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check username availability',
      });
    }
  }

  /**
   * Search user by points username
   * GET /api/v1/points/username/search?username=value
   */
  async searchByUsername(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { username } = req.query;

      if (!username || typeof username !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Username is required',
        });
        return;
      }

      const user = await pointsService.findUserByUsername(username);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          user: {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            profilePhoto: user.profilePhoto,
            verified: user.verified,
            pointsUsername: user.pointsUsername,
            points: user.gamification.points,
            level: user.gamification.level,
          },
        },
      });
    } catch (error: any) {
      logger.error('Search by username error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search user',
      });
    }
  }

  /**
   * Gift points to user by username
   * POST /api/v1/points/gift
   * Body: { username: string, amount: number, message: string }
   */
  async giftPoints(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { username, amount, message } = req.body;

      // Validation
      if (!username || !amount || !message) {
        res.status(400).json({
          success: false,
          message: 'Username, amount, and message are required',
        });
        return;
      }

      if (amount < 1) {
        res.status(400).json({
          success: false,
          message: 'Amount must be at least 1 point',
        });
        return;
      }

      if (amount > 1000) {
        res.status(400).json({
          success: false,
          message: 'Cannot gift more than 1000 points at once',
        });
        return;
      }

      const cleanUsername = username.toLowerCase().trim();

      // Check if sender is verified
      const sender = await User.findById(userId);
      if (!sender) {
        res.status(404).json({
          success: false,
          message: 'Sender not found',
        });
        return;
      }

      if (!sender.verified) {
        res.status(403).json({
          success: false,
          message: 'Only verified users can gift points',
        });
        return;
      }

      // Find recipient by username
      const recipient = await pointsService.findUserByUsername(cleanUsername);
      if (!recipient) {
        res.status(404).json({
          success: false,
          message: 'User not found with that username',
        });
        return;
      }

      // Can't gift to yourself
      if (recipient._id.toString() === userId) {
        res.status(400).json({
          success: false,
          message: 'Cannot gift points to yourself',
        });
        return;
      }

      // Check if sender has enough points
      if (sender.gamification.points < amount) {
        res.status(400).json({
          success: false,
          message: 'Insufficient points',
        });
        return;
      }

      // Deduct points from sender
      const deductResult = await pointsService.deductPoints({
        userId,
        amount,
        type: 'spent',
        reason: `Gifted ${amount} points to @${recipient.pointsUsername}`,
        metadata: {
          recipientId: recipient._id.toString(),
          recipientUsername: recipient.pointsUsername,
          recipientName: `${recipient.firstName} ${recipient.lastName}`,
          giftMessage: message,
        },
      });

      // Add points to recipient
      const addResult = await pointsService.addPoints({
        userId: recipient._id.toString(),
        amount,
        type: 'bonus',
        reason: `Received ${amount} points from @${sender.pointsUsername || sender.firstName}`,
        metadata: {
          senderId: userId,
          senderUsername: sender.pointsUsername,
          senderName: `${sender.firstName} ${sender.lastName}`,
          giftMessage: message,
        },
      });

      logger.info(`User ${userId} gifted ${amount} points to ${recipient._id} (@${cleanUsername})`);

      await logAudit({
        actor: { id: userId, name: '', email: '' },
        actorType: 'user', action: 'gift_points', category: 'points',
        target: { type: 'user', id: recipient._id.toString(), name: cleanUsername },
        details: `Gifted ${amount} points to ${cleanUsername}`, req,
        metadata: { amount, recipientUsername: cleanUsername, message }
      });

      // Bust points cache for both sender and recipient
      await cacheService.onPointsChange(userId);
      await cacheService.onPointsChange(recipient._id.toString());

      res.status(200).json({
        success: true,
        message: `Successfully gifted ${amount} points to @${cleanUsername}!`,
        data: {
          sender: {
            newBalance: deductResult.newBalance,
            transaction: deductResult.transaction,
          },
          recipient: {
            username: recipient.pointsUsername,
            name: `${recipient.firstName} ${recipient.lastName}`,
            newBalance: addResult.newBalance,
          },
        },
      });
    } catch (error: any) {
      logger.error('Gift points error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to gift points',
      });
    }
  }
  /**
   * Request to purchase points (pending admin approval)
   * POST /api/v1/points/purchase
   * Body: { packageId: string, amount: number, pointsAmount: number }
   */
  async requestPurchase(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { packageId, amount, pointsAmount, label } = req.body;

      if (!packageId || !amount || !pointsAmount) {
        res.status(400).json({ success: false, message: 'Package ID, amount, and points amount are required' });
        return;
      }

      const user = await User.findById(userId).select('firstName lastName email');
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      const { Transaction } = require('../models');
      const reference = `pts_${userId}_${Date.now()}`;

      // Create pending transaction
      const transaction = await Transaction.create({
        user: userId,
        type: 'coins',
        amount,
        currency: 'NGN',
        status: 'pending',
        provider: 'paystack',
        providerReference: reference,
        description: `Purchase ${pointsAmount} points (${label || packageId})`,
        metadata: {
          packageId,
          pointsAmount,
          label: label || `${pointsAmount} Points`,
          userName: `${user.firstName} ${user.lastName}`,
        },
      });

      // Initialize Paystack payment
      const paystack = await paystackService.initializeTransaction({
        email: user.email,
        amount: amount * 100, // Convert NGN to kobo
        reference,
        metadata: {
          userId,
          transactionId: transaction._id.toString(),
          pointsAmount,
          packageId,
        },
      });

      logger.info(`Paystack payment initialized: ${reference} — ₦${amount} for ${pointsAmount} pts`);

      res.status(201).json({
        success: true,
        message: 'Payment initialized',
        data: {
          transactionId: transaction._id,
          reference,
          status: 'pending',
          pointsAmount,
          amount,
          authorization_url: paystack.authorization_url,
          access_code: paystack.access_code,
        },
      });
    } catch (error: any) {
      logger.error('Request purchase error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to initialize payment' });
    }
  }

  /**
   * Verify Paystack payment after user completes checkout
   * POST /api/v1/points/verify-payment
   */
  async verifyPayment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { reference } = req.body;
      if (!reference) {
        res.status(400).json({ success: false, message: 'Reference is required' });
        return;
      }

      const userId = req.user?.userId;
      const { Transaction } = require('../models');
      const transaction = await Transaction.findOne({ providerReference: reference });
      if (!transaction) {
        res.status(404).json({ success: false, message: 'Transaction not found' });
        return;
      }

      // Verify the authenticated user owns this transaction
      if (transaction.user.toString() !== userId) {
        res.status(403).json({ success: false, message: 'This transaction does not belong to you' });
        return;
      }

      // Already completed
      if (transaction.status === 'completed') {
        res.json({ success: true, message: 'Payment already verified', data: { status: 'completed', pointsAmount: transaction.metadata?.pointsAmount } });
        return;
      }

      // Verify with Paystack
      const paystack = await paystackService.verifyTransaction(reference);

      if (paystack.status === 'success') {
        // Credit points
        const pointsAmount = transaction.metadata?.pointsAmount || 0;
        transaction.status = 'completed';
        transaction.providerMetadata = paystack;
        await transaction.save();

        // Add points to user (through service for proper transaction logging)
        if (pointsAmount > 0) {
          await pointsService.addPoints({
            userId: transaction.user.toString(),
            amount: pointsAmount,
            type: 'purchase',
            reason: `Purchased ${pointsAmount} points`,
            metadata: { reference, transactionId: transaction._id },
          });
        }

        // Bust cache
        await cacheService.invalidatePattern(`points:stats:${transaction.user}*`);

        logger.info(`Payment verified & points credited: ${reference} — ${pointsAmount} pts`);

        res.json({
          success: true,
          message: `${pointsAmount} points added to your account!`,
          data: { status: 'completed', pointsAmount },
        });
      } else {
        transaction.status = 'failed';
        transaction.providerMetadata = paystack;
        await transaction.save();

        res.json({
          success: false,
          message: 'Payment was not successful',
          data: { status: 'failed' },
        });
      }
    } catch (error: any) {
      logger.error('Verify payment error:', error);
      res.status(500).json({ success: false, message: error.message || 'Payment verification failed' });
    }
  }

  /**
   * Get user's purchase history
   * GET /api/v1/points/purchases
   */
  async getPurchaseHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { Transaction } = require('../models');

      const purchases = await Transaction.find({
        user: userId,
        type: 'coins',
      })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      res.status(200).json({
        success: true,
        data: { purchases },
      });
    } catch (error: any) {
      logger.error('Get purchase history error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch purchase history',
      });
    }
  }
  /**
   * Get referral stats and code
   * GET /api/v1/points/referral
   */
  async getReferralStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const stats = await pointsService.getReferralStats(userId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Get referral stats error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch referral stats',
      });
    }
  }

  /**
   * Apply a referral code
   * POST /api/v1/points/referral/apply
   * Body: { code: string }
   */
  async applyReferralCode(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { code } = req.body;

      if (!code) {
        res.status(400).json({ success: false, message: 'Referral code is required' });
        return;
      }

      const result = await pointsService.applyReferralCode(userId, code);

      await cacheService.onPointsChange(userId);

      await logAudit({
        actor: { id: userId, name: '', email: '' },
        actorType: 'user', action: 'apply_referral', category: 'points',
        details: `Applied referral code ${code}`, req,
        metadata: { code }
      });

      res.status(200).json({
        success: true,
        message: `Welcome! You earned ${result.bonusAwarded} bonus points`,
        data: result,
      });
    } catch (error: any) {
      logger.error('Apply referral code error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to apply referral code',
      });
    }
  }
}

export default new PointsController();