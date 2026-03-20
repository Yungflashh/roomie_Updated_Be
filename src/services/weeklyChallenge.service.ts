import { Challenge, IChallengeDocument, User, Leaderboard } from '../models';
import notificationService from './notification.service';
import pointsService from './points.service';
import logger from '../utils/logger';

class WeeklyChallengeService {
  /**
   * Get active challenges
   */
  async getActiveChallenges(userId?: string): Promise<any[]> {
    const now = new Date();
    const challenges = await Challenge.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).sort({ type: 1, startDate: -1 });

    return challenges.map(c => {
      const participant = userId ? c.participants.find((p: any) => p.user.toString() === userId) : null;
      const totalTarget = c.requirements.reduce((sum, r) => sum + r.target, 0);
      return {
        _id: c._id,
        title: c.title,
        description: c.description,
        type: c.type,
        category: (c as any).category,
        icon: (c as any).icon,
        startDate: c.startDate,
        endDate: c.endDate,
        pointsReward: c.pointsReward,
        cashReward: (c as any).cashReward,
        cashCurrency: (c as any).cashCurrency,
        badgeReward: c.badgeReward,
        requirements: c.requirements,
        tierRewards: (c as any).tierRewards,
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
  async joinChallenge(challengeId: string, userId: string): Promise<void> {
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) throw new Error('Challenge not found');
    if (!challenge.isActive) throw new Error('Challenge is no longer active');
    if (new Date() > challenge.endDate) throw new Error('Challenge has ended');

    const existing = challenge.participants.find((p: any) => p.user.toString() === userId);
    if (existing) throw new Error('Already joined this challenge');

    if ((challenge as any).maxParticipants && challenge.participants.length >= (challenge as any).maxParticipants) {
      throw new Error('Challenge is full');
    }

    challenge.participants.push({ user: userId as any, progress: 0, completed: false } as any);
    await challenge.save();
    logger.info(`User ${userId} joined challenge ${challengeId}`);
  }

  /**
   * Update progress for a user action
   */
  async trackAction(userId: string, action: string, amount: number = 1): Promise<void> {
    const now = new Date();
    const activeChallenges = await Challenge.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      'participants.user': userId,
      'requirements.action': action,
    });

    for (const challenge of activeChallenges) {
      const participant = challenge.participants.find((p: any) => p.user.toString() === userId);
      if (!participant || participant.completed) continue;

      // Initialize progressByAction map if needed
      if (!participant.progressByAction) {
        (participant as any).progressByAction = new Map();
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
          await pointsService.addPoints({
            userId,
            amount: challenge.pointsReward,
            type: 'achievement',
            reason: `Completed challenge: ${challenge.title}`,
            metadata: { challengeId: challenge._id.toString() },
          });
          (participant as any).pointsAwarded = challenge.pointsReward;
          logger.info(`Challenge completed: ${userId} — ${challenge.title} (+${challenge.pointsReward} pts)`);
        } catch (err) {
          logger.error('Award challenge points error:', err);
        }

        // Notify user
        try {
          await notificationService.createNotification({
            user: userId,
            type: 'achievement',
            title: 'Challenge Completed! 🎉',
            body: `You completed "${challenge.title}" and earned ${challenge.pointsReward} points!`,
            data: { challengeId: challenge._id.toString() },
          });
        } catch {}
      }

      await challenge.save();
    }
  }

  /**
   * Get weekly leaderboard
   */
  async getWeeklyLeaderboard(limit: number = 50): Promise<any[]> {
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
    const challenges = await Challenge.find({
      type: 'weekly',
      startDate: { $gte: weekStart },
      endDate: { $lte: weekEnd },
    });

    // Aggregate points per user
    const userPoints: { [userId: string]: number } = {};
    for (const challenge of challenges) {
      for (const p of challenge.participants) {
        if (p.completed) {
          const uid = p.user.toString();
          userPoints[uid] = (userPoints[uid] || 0) + ((p as any).pointsAwarded || challenge.pointsReward);
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
    const users = await User.find({ _id: { $in: userIds } })
      .select('firstName lastName profilePhoto verified subscription')
      .lean();

    return sorted.map(([userId, points], index) => {
      const user = users.find((u: any) => u._id.toString() === userId);
      return {
        rank: index + 1,
        userId,
        firstName: user?.firstName || 'Unknown',
        lastName: user?.lastName || '',
        profilePhoto: user?.profilePhoto,
        verified: user?.verified,
        subscription: (user as any)?.subscription,
        weeklyPoints: points,
      };
    });
  }

  /**
   * Admin: Create challenge
   */
  async createChallenge(data: any): Promise<IChallengeDocument> {
    const challenge = await Challenge.create({
      title: data.title,
      description: data.description,
      type: data.type || 'weekly',
      category: data.category || 'general',
      icon: data.icon,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      pointsReward: data.pointsReward || 100,
      cashReward: data.cashReward || 0,
      cashCurrency: data.cashCurrency || 'NGN',
      badgeReward: data.badgeReward,
      requirements: data.requirements || [],
      tierRewards: data.tierRewards || [
        { tier: 'champion', minRank: 1, maxRank: 1, points: 500, cash: 0, badge: 'weekly_champion', title: 'Weekly Champion' },
        { tier: 'gold', minRank: 2, maxRank: 3, points: 200, cash: 0, badge: 'gold' },
        { tier: 'silver', minRank: 4, maxRank: 10, points: 100, cash: 0, badge: 'silver' },
        { tier: 'bronze', minRank: 11, maxRank: 50, points: 50, cash: 0, badge: 'bronze' },
      ],
      maxParticipants: data.maxParticipants,
      isActive: true,
      createdBy: data.createdBy,
    });

    logger.info(`Challenge created: ${challenge.title} (${challenge.type})`);
    return challenge;
  }

  /**
   * Admin: Send notification to all users
   */
  async broadcastNotification(data: { title: string; body: string; type?: string }): Promise<number> {
    const users = await User.find({ isActive: true }).select('_id fcmToken').lean();
    let sent = 0;

    for (const user of users) {
      try {
        await notificationService.createNotification({
          user: user._id.toString(),
          type: (data.type as any) || 'system',
          title: data.title,
          body: data.body,
        });
        sent++;
      } catch {}
    }

    // Also send FCM push notifications
    try {
      const admin = require('firebase-admin');
      const tokens = users.filter(u => u.fcmToken).map(u => u.fcmToken);
      if (tokens.length > 0) {
        // Send in batches of 500
        for (let i = 0; i < tokens.length; i += 500) {
          const batch = tokens.slice(i, i + 500);
          await admin.messaging().sendEachForMulticast({
            tokens: batch,
            notification: { title: data.title, body: data.body },
          }).catch((err: any) => logger.error('FCM batch error:', err));
        }
      }
    } catch (err) {
      logger.error('FCM push error:', err);
    }

    logger.info(`Broadcast notification sent to ${sent} users: ${data.title}`);
    return sent;
  }
}

export default new WeeklyChallengeService();
