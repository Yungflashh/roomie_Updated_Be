import { Challenge, User, IChallengeDocument } from '../models';
import logger from '../utils/logger';
import dayjs from 'dayjs';

class ChallengeService {
  /**
   * Get active challenges
   */
  async getActiveChallenges(type?: 'daily' | 'weekly' | 'monthly'): Promise<IChallengeDocument[]> {
    const query: any = {
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    };

    if (type) {
      query.type = type;
    }

    const challenges = await Challenge.find(query).sort({ startDate: -1 });
    return challenges;
  }

  /**
   * Get challenge by ID
   */
  async getChallengeById(challengeId: string): Promise<IChallengeDocument> {
    const challenge = await Challenge.findById(challengeId);
    
    if (!challenge) {
      throw new Error('Challenge not found');
    }

    return challenge;
  }

  /**
   * Join challenge
   */
  async joinChallenge(challengeId: string, userId: string): Promise<IChallengeDocument> {
    const challenge = await Challenge.findById(challengeId);

    if (!challenge) {
      throw new Error('Challenge not found');
    }

    if (!challenge.isActive) {
      throw new Error('Challenge is not active');
    }

    if (dayjs().isAfter(dayjs(challenge.endDate))) {
      throw new Error('Challenge has ended');
    }

    // Check if already joined
    const alreadyJoined = challenge.participants.some(
      (p) => p.user.toString() === userId
    );

    if (alreadyJoined) {
      throw new Error('Already joined this challenge');
    }

    challenge.participants.push({
      user: userId as any,
      progress: 0,
      completed: false,
    });

    await challenge.save();

    logger.info(`User ${userId} joined challenge ${challengeId}`);
    return challenge;
  }

  /**
   * Update challenge progress
   */
  async updateProgress(
    challengeId: string,
    userId: string,
    progress: number
  ): Promise<IChallengeDocument> {
    const challenge = await Challenge.findById(challengeId);

    if (!challenge) {
      throw new Error('Challenge not found');
    }

    const participant = challenge.participants.find(
      (p) => p.user.toString() === userId
    );

    if (!participant) {
      throw new Error('Not a participant of this challenge');
    }

    participant.progress = progress;

    // Check if completed
    const totalRequired = challenge.requirements.reduce(
      (sum, req) => sum + req.target,
      0
    );

    if (progress >= totalRequired && !participant.completed) {
      participant.completed = true;
      participant.completedAt = new Date();

      // Award points and badge
      const user = await User.findById(userId);
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
        logger.info(`User ${userId} completed challenge ${challengeId}`);
      }
    }

    await challenge.save();
    return challenge;
  }

  /**
   * Get user challenges
   */
  async getUserChallenges(userId: string): Promise<IChallengeDocument[]> {
    const challenges = await Challenge.find({
      'participants.user': userId,
      isActive: true,
    }).sort({ startDate: -1 });

    return challenges;
  }

  /**
   * Get challenge leaderboard
   */
  async getChallengeLeaderboard(challengeId: string, limit: number = 10): Promise<any[]> {
    const challenge = await Challenge.findById(challengeId).populate(
      'participants.user',
      'firstName lastName profilePhoto'
    );

    if (!challenge) {
      throw new Error('Challenge not found');
    }

    const leaderboard = challenge.participants
      .sort((a, b) => {
        if (a.completed && !b.completed) return -1;
        if (!a.completed && b.completed) return 1;
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
  async createDailyChallenges(): Promise<void> {
    const today = dayjs().startOf('day');
    const tomorrow = today.add(1, 'day');

    const existingChallenge = await Challenge.findOne({
      type: 'daily',
      startDate: { $gte: today.toDate() },
    });

    if (existingChallenge) {
      logger.info('Daily challenge already exists for today');
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

    const randomChallenge =
      dailyChallenges[Math.floor(Math.random() * dailyChallenges.length)];

    await Challenge.create({
      ...randomChallenge,
      type: 'daily',
      startDate: today.toDate(),
      endDate: tomorrow.toDate(),
      isActive: true,
    });

    logger.info('Daily challenge created');
  }

  /**
   * Create weekly challenges (called by cron job)
   */
  async createWeeklyChallenges(): Promise<void> {
    const startOfWeek = dayjs().startOf('week');
    const endOfWeek = startOfWeek.add(1, 'week');

    const existingChallenge = await Challenge.findOne({
      type: 'weekly',
      startDate: { $gte: startOfWeek.toDate() },
    });

    if (existingChallenge) {
      logger.info('Weekly challenge already exists');
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

    const randomChallenge =
      weeklyChallenges[Math.floor(Math.random() * weeklyChallenges.length)];

    await Challenge.create({
      ...randomChallenge,
      type: 'weekly',
      startDate: startOfWeek.toDate(),
      endDate: endOfWeek.toDate(),
      isActive: true,
    });

    logger.info('Weekly challenge created');
  }
}

export default new ChallengeService();
