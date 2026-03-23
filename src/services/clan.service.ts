import mongoose from 'mongoose';
import { Clan, IClanDocument, ClanWar, IClanWarDocument } from '../models/Clan';
import { ClanMission, IClanMissionDocument } from '../models/ClanMission';
import notificationService from './notification.service';
import pointsService from './points.service';
import logger from '../utils/logger';
import { emitClanWarUpdate } from '../config/socket.config';

class ClanService {
  // ─── Clan CRUD ───────────────────────────────────────────────────────────

  /**
   * Create a new clan. Leader must spend 500 points.
   */
  async createClan(
    userId: string,
    data: { name: string; tag: string; description?: string; emoji?: string; color?: string; isOpen?: boolean }
  ): Promise<IClanDocument> {
    try {
      // Check user is not already in a clan
      const existing = await Clan.findOne({ 'members.user': userId });
      if (existing) {
        throw new Error('You are already in a clan. Leave your current clan first.');
      }

      // Deduct creation cost
      await pointsService.deductPoints({
        userId,
        amount: 500,
        type: 'spent',
        reason: 'Clan creation cost',
        metadata: { action: 'clan_create' },
      });

      const userOid = new mongoose.Types.ObjectId(userId);
      const clan = await Clan.create({
        name: data.name,
        tag: data.tag.toUpperCase(),
        description: data.description || '',
        emoji: data.emoji || '🏠',
        color: data.color || '#6C63FF',
        isOpen: data.isOpen !== undefined ? data.isOpen : true,
        leader: userOid,
        coLeaders: [],
        members: [
          {
            user: userOid,
            role: 'leader' as const,
            joinedAt: new Date(),
            pointsContributed: 0,
          },
        ],
      } as Partial<IClanDocument>);

      // Log activity
      await this.logActivity(clan._id.toString(), 'clan_created', userId, 'created the clan');

      logger.info(`Clan created: ${clan.name} [${clan.tag}] by user ${userId}`);
      return clan;
    } catch (error) {
      logger.error('createClan error:', error);
      throw error;
    }
  }

  /**
   * Get a single clan with populated members.
   */
  async getClan(clanId: string): Promise<IClanDocument | null> {
    try {
      const clan = await Clan.findById(clanId)
        .populate('leader', 'firstName lastName profilePhoto')
        .populate('coLeaders', 'firstName lastName profilePhoto')
        .populate('members.user', 'firstName lastName profilePhoto');
      return clan;
    } catch (error) {
      logger.error('getClan error:', error);
      throw error;
    }
  }

  /**
   * List clans for discovery with pagination and search.
   */
  async getClans(
    page: number = 1,
    limit: number = 20,
    search?: string,
    sortBy: string = 'totalPoints'
  ): Promise<{ clans: IClanDocument[]; total: number; page: number; pages: number }> {
    try {
      const query: Record<string, unknown> = {};
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { tag: { $regex: search, $options: 'i' } },
        ];
      }

      const sortOptions: Record<string, Record<string, 1 | -1>> = {
        totalPoints: { totalPoints: -1 },
        weeklyPoints: { weeklyPoints: -1 },
        level: { level: -1 },
        members: { level: -1 },
        newest: { createdAt: -1 },
      };
      const sort = sortOptions[sortBy] || sortOptions.totalPoints;

      const [clans, total] = await Promise.all([
        Clan.find(query)
          .populate('leader', 'firstName lastName profilePhoto')
          .sort(sort)
          .skip((page - 1) * limit)
          .limit(limit),
        Clan.countDocuments(query),
      ]);

      return { clans, total, page, pages: Math.ceil(total / limit) };
    } catch (error) {
      logger.error('getClans error:', error);
      throw error;
    }
  }

  /**
   * Clan leaderboard by period.
   */
  async getLeaderboard(
    period: 'weekly' | 'monthly' | 'allTime' = 'allTime',
    limit: number = 50
  ): Promise<IClanDocument[]> {
    try {
      const sortField =
        period === 'weekly' ? 'weeklyPoints' : period === 'monthly' ? 'monthlyPoints' : 'totalPoints';

      return Clan.find()
        .populate('leader', 'firstName lastName profilePhoto')
        .sort({ [sortField]: -1 })
        .limit(limit);
    } catch (error) {
      logger.error('getLeaderboard error:', error);
      throw error;
    }
  }

  /**
   * Join an open clan.
   */
  async joinClan(userId: string, clanId: string): Promise<IClanDocument> {
    try {
      const existing = await Clan.findOne({ 'members.user': userId });
      if (existing) {
        throw new Error('You are already in a clan.');
      }

      const clan = await Clan.findById(clanId);
      if (!clan) throw new Error('Clan not found.');
      if (!clan.isOpen) throw new Error('This clan is invite-only.');
      if (clan.members.length >= clan.maxMembers) throw new Error('Clan is full.');

      clan.members.push({
        user: new mongoose.Types.ObjectId(userId),
        role: 'member',
        joinedAt: new Date(),
        pointsContributed: 0,
      });
      await clan.save();

      // Log activity
      await this.logActivity(clan._id.toString(), 'member_joined', userId, 'joined the clan');

      logger.info(`User ${userId} joined clan ${clan.name}`);

      // Notify leader
      try {
        await notificationService.createNotification({
          user: clan.leader.toString(),
          type: 'system',
          title: 'New Clan Member',
          body: `A new member joined your clan [${clan.tag}]!`,
          data: { clanId: clan._id.toString() },
        });
      } catch (e) {
        logger.warn('Clan join notification error:', e);
      }

      return clan;
    } catch (error) {
      logger.error('joinClan error:', error);
      throw error;
    }
  }

  /**
   * Join a clan by invite code.
   */
  async joinByInviteCode(userId: string, inviteCode: string): Promise<IClanDocument> {
    try {
      const existing = await Clan.findOne({ 'members.user': userId });
      if (existing) {
        throw new Error('You are already in a clan.');
      }

      const clan = await Clan.findOne({ inviteCode: inviteCode.toUpperCase() });
      if (!clan) throw new Error('Invalid invite code.');
      if (clan.members.length >= clan.maxMembers) throw new Error('Clan is full.');

      clan.members.push({
        user: new mongoose.Types.ObjectId(userId),
        role: 'member',
        joinedAt: new Date(),
        pointsContributed: 0,
      });
      await clan.save();

      // Log activity
      await this.logActivity(clan._id.toString(), 'member_joined', userId, 'joined the clan via invite code');

      logger.info(`User ${userId} joined clan ${clan.name} via invite code`);

      try {
        await notificationService.createNotification({
          user: clan.leader.toString(),
          type: 'system',
          title: 'New Clan Member',
          body: `A new member joined your clan [${clan.tag}] via invite code!`,
          data: { clanId: clan._id.toString() },
        });
      } catch (e) {
        logger.warn('Clan join notification error:', e);
      }

      // Invite rewards: joiner gets welcome bonus, inviter (leader) gets referral bonus
      try {
        await pointsService.addPoints({ userId, amount: 50, type: 'bonus', reason: `Welcome bonus for joining clan [${clan.tag}]`, metadata: { clanId: clan._id.toString() } });
        await pointsService.addPoints({ userId: clan.leader.toString(), amount: 30, type: 'bonus', reason: `Referral bonus — new member joined [${clan.tag}] via invite`, metadata: { clanId: clan._id.toString(), referredUserId: userId } });
        await notificationService.createNotification({ user: userId, type: 'achievement', title: 'Welcome Bonus!', body: `You earned 50 points for joining clan [${clan.tag}]!`, data: { clanId: clan._id.toString() } });
        await notificationService.createNotification({ user: clan.leader.toString(), type: 'achievement', title: 'Referral Bonus!', body: `You earned 30 points — someone joined via your invite code!`, data: { clanId: clan._id.toString() } });
      } catch (e) {
        logger.warn('Invite reward error:', e);
      }

      return clan;
    } catch (error) {
      logger.error('joinByInviteCode error:', error);
      throw error;
    }
  }

  /**
   * Leave a clan. If leader, must transfer leadership or disband.
   */
  async leaveClan(userId: string, clanId: string): Promise<{ disbanded: boolean }> {
    try {
      const clan = await Clan.findById(clanId);
      if (!clan) throw new Error('Clan not found.');

      const memberIndex = clan.members.findIndex((m) => m.user.toString() === userId);
      if (memberIndex === -1) throw new Error('You are not in this clan.');

      const isLeader = clan.leader.toString() === userId;

      if (isLeader) {
        // Try to transfer leadership to a co-leader, then any member
        const successor =
          clan.members.find((m) => m.user.toString() !== userId && m.role === 'co-leader') ||
          clan.members.find((m) => m.user.toString() !== userId);

        if (!successor) {
          // Last member — disband
          await Clan.findByIdAndDelete(clanId);
          logger.info(`Clan ${clan.name} disbanded (last member left)`);
          return { disbanded: true };
        }

        successor.role = 'leader';
        clan.leader = successor.user;
        clan.coLeaders = clan.coLeaders.filter((id) => id.toString() !== successor.user.toString());
      }

      clan.members.splice(memberIndex, 1);
      clan.coLeaders = clan.coLeaders.filter((id) => id.toString() !== userId);
      await clan.save();

      logger.info(`User ${userId} left clan ${clan.name}`);
      return { disbanded: false };
    } catch (error) {
      logger.error('leaveClan error:', error);
      throw error;
    }
  }

  /**
   * Kick a member (leader/co-leader only).
   */
  async kickMember(leaderId: string, clanId: string, targetUserId: string): Promise<IClanDocument> {
    try {
      const clan = await Clan.findById(clanId);
      if (!clan) throw new Error('Clan not found.');

      const kicker = clan.members.find((m) => m.user.toString() === leaderId);
      if (!kicker || (kicker.role !== 'leader' && kicker.role !== 'co-leader')) {
        throw new Error('Only leaders and co-leaders can kick members.');
      }

      const target = clan.members.find((m) => m.user.toString() === targetUserId);
      if (!target) throw new Error('User is not in this clan.');
      if (target.role === 'leader') throw new Error('Cannot kick the clan leader.');
      if (target.role === 'co-leader' && kicker.role !== 'leader') {
        throw new Error('Only the leader can kick co-leaders.');
      }

      clan.members = clan.members.filter((m) => m.user.toString() !== targetUserId) as typeof clan.members;
      clan.coLeaders = clan.coLeaders.filter((id) => id.toString() !== targetUserId);
      await clan.save();

      // Log activity
      await this.logActivity(clan._id.toString(), 'member_kicked', leaderId, 'removed a member from the clan');

      logger.info(`User ${targetUserId} kicked from clan ${clan.name} by ${leaderId}`);

      try {
        await notificationService.createNotification({
          user: targetUserId,
          type: 'system',
          title: 'Removed from Clan',
          body: `You have been removed from clan [${clan.tag}].`,
          data: { clanId: clan._id.toString() },
        });
      } catch (e) {
        logger.warn('Kick notification error:', e);
      }

      return clan;
    } catch (error) {
      logger.error('kickMember error:', error);
      throw error;
    }
  }

  /**
   * Promote a member to co-leader (leader only).
   */
  async promoteMember(
    leaderId: string,
    clanId: string,
    targetUserId: string,
    role: 'co-leader' | 'member'
  ): Promise<IClanDocument> {
    try {
      const clan = await Clan.findById(clanId);
      if (!clan) throw new Error('Clan not found.');
      if (clan.leader.toString() !== leaderId) {
        throw new Error('Only the clan leader can promote members.');
      }

      const member = clan.members.find((m) => m.user.toString() === targetUserId);
      if (!member) throw new Error('User is not in this clan.');
      if (member.role === 'leader') throw new Error('Cannot change the leader role this way.');

      member.role = role;

      if (role === 'co-leader') {
        if (!clan.coLeaders.some((id) => id.toString() === targetUserId)) {
          clan.coLeaders.push(new mongoose.Types.ObjectId(targetUserId));
        }
      } else {
        clan.coLeaders = clan.coLeaders.filter((id) => id.toString() !== targetUserId);
      }

      await clan.save();

      // Log activity
      const action = role === 'co-leader' ? 'was promoted to Co-Leader' : 'was demoted to Member';
      await this.logActivity(clan._id.toString(), 'member_promoted', targetUserId, action);

      logger.info(`User ${targetUserId} promoted to ${role} in clan ${clan.name}`);
      return clan;
    } catch (error) {
      logger.error('promoteMember error:', error);
      throw error;
    }
  }

  /**
   * Update clan settings (leader only).
   */
  async updateClan(
    userId: string,
    clanId: string,
    updates: { name?: string; description?: string; emoji?: string; color?: string; isOpen?: boolean }
  ): Promise<IClanDocument> {
    try {
      const clan = await Clan.findById(clanId);
      if (!clan) throw new Error('Clan not found.');
      if (clan.leader.toString() !== userId) {
        throw new Error('Only the clan leader can update settings.');
      }

      if (updates.name !== undefined) clan.name = updates.name;
      if (updates.description !== undefined) clan.description = updates.description;
      if (updates.emoji !== undefined) clan.emoji = updates.emoji;
      if (updates.color !== undefined) clan.color = updates.color;
      if (updates.isOpen !== undefined) clan.isOpen = updates.isOpen;

      await clan.save();
      logger.info(`Clan ${clan.tag} updated by ${userId}`);
      return clan;
    } catch (error) {
      logger.error('updateClan error:', error);
      throw error;
    }
  }

  /**
   * Disband (delete) a clan (leader only).
   */
  async disbandClan(userId: string, clanId: string): Promise<void> {
    try {
      const clan = await Clan.findById(clanId);
      if (!clan) throw new Error('Clan not found.');
      if (clan.leader.toString() !== userId) {
        throw new Error('Only the clan leader can disband the clan.');
      }

      // Cancel active wars
      await ClanWar.updateMany(
        { $or: [{ challenger: clanId }, { defender: clanId }], status: { $in: ['pending', 'accepted', 'in_progress'] } },
        { $set: { status: 'expired' } }
      );

      await Clan.findByIdAndDelete(clanId);
      logger.info(`Clan ${clan.name} [${clan.tag}] disbanded by leader ${userId}`);
    } catch (error) {
      logger.error('disbandClan error:', error);
      throw error;
    }
  }

  /**
   * Get the clan for a specific user.
   */
  async getMyClan(userId: string): Promise<IClanDocument | null> {
    try {
      return Clan.findOne({ 'members.user': userId })
        .populate('leader', 'firstName lastName profilePhoto')
        .populate('coLeaders', 'firstName lastName profilePhoto')
        .populate('members.user', 'firstName lastName profilePhoto');
    } catch (error) {
      logger.error('getMyClan error:', error);
      throw error;
    }
  }

  /**
   * Add points to a clan from a member's activity.
   */
  async addClanPoints(clanId: string, userId: string, points: number, reason: string): Promise<void> {
    try {
      await Clan.findOneAndUpdate(
        { _id: clanId, 'members.user': userId },
        {
          $inc: {
            totalPoints: points,
            weeklyPoints: points,
            monthlyPoints: points,
            'season.points': points,
            'members.$.pointsContributed': points,
            'members.$.weeklyContribution': points,
          },
        }
      );

      // Level up check: every 1000 total points = 1 level
      const clan = await Clan.findById(clanId);
      if (clan) {
        const newLevel = Math.floor(clan.totalPoints / 1000) + 1;
        if (newLevel > clan.level) {
          clan.level = newLevel;
          clan.maxMembers = 10 + (newLevel - 1) * 5; // +5 per level
          await clan.save();
          logger.info(`Clan ${clan.tag} leveled up to ${newLevel}`);
        }
        // Check achievements
        await this.checkAchievements(clanId);
      }
    } catch (error) {
      logger.error('addClanPoints error:', error);
    }
  }

  /**
   * Track a member's activity and add clan points automatically.
   */
  async trackMemberActivity(userId: string, action: string, points: number): Promise<void> {
    try {
      const clan = await Clan.findOne({ 'members.user': userId });
      if (!clan) return; // user not in a clan

      // Apply streak multiplier
      let multiplier = 1;
      if (clan.streak && clan.streak.current >= 14) {
        multiplier = 2;
      } else if (clan.streak && clan.streak.current >= 7) {
        multiplier = 1.5;
      }

      // Apply perk/boost multiplier
      const boostMultiplier = await this.getActiveBoostMultiplier(clan._id.toString());
      multiplier += boostMultiplier;

      const adjustedPoints = Math.round(points * multiplier);

      await this.addClanPoints(clan._id.toString(), userId, adjustedPoints, action);

      // Log activity
      const multiplierText = multiplier > 1 ? ` (${multiplier}x streak bonus)` : '';
      await this.logActivity(
        clan._id.toString(),
        'points_earned',
        userId,
        `earned ${adjustedPoints} pts from ${action}${multiplierText}`,
        adjustedPoints
      );

      // Update streak
      await this.updateStreak(clan._id.toString());

      // Update mission progress
      const missionType = this.actionToMissionType(action);
      if (missionType) {
        await this.updateMissionProgress(clan._id.toString(), missionType, missionType === 'points_earned' ? adjustedPoints : 1);
      }
    } catch (error) {
      logger.warn('trackMemberActivity error:', error);
    }
  }

  /**
   * Map action strings to mission types.
   */
  private actionToMissionType(action: string): string | null {
    if (action.toLowerCase().includes('game') && action.toLowerCase().includes('win')) return 'games_won';
    if (action.toLowerCase().includes('war') && action.toLowerCase().includes('won')) return 'wars_won';
    if (action.toLowerCase().includes('challenge')) return 'challenges_completed';
    return 'points_earned';
  }

  /**
   * Reset weekly points. Called by cron. Award top clans before reset.
   */
  async resetWeeklyPoints(): Promise<void> {
    try {
      // Award top 3 weekly clans
      const topClans = await Clan.find().sort({ weeklyPoints: -1 }).limit(3);
      const rewards = [500, 300, 100];

      for (let i = 0; i < topClans.length; i++) {
        const clan = topClans[i];
        if (clan.weeklyPoints <= 0) continue;

        clan.totalPoints += rewards[i];
        if (i === 0 && !clan.badges.includes('weekly_champion')) {
          clan.badges.push('weekly_champion');
        }
        await clan.save();

        // Notify leader
        try {
          await notificationService.createNotification({
            user: clan.leader.toString(),
            type: 'achievement',
            title: 'Weekly Clan Reward!',
            body: `Your clan [${clan.tag}] placed #${i + 1} this week and earned ${rewards[i]} bonus points!`,
            data: { clanId: clan._id.toString() },
          });
        } catch (e) {
          logger.warn('Weekly reset notification error:', e);
        }
      }

      // Award top 3 contributing members in every clan with personal points
      const allClans = await Clan.find({ 'members.1': { $exists: true } }); // clans with 2+ members
      const memberRewards = [100, 50, 25];

      for (const clan of allClans) {
        // Sort members by weekly contributions (pointsContributed is cumulative, but we use it as a proxy)
        const sortedMembers = [...clan.members]
          .filter(m => m.pointsContributed > 0)
          .sort((a, b) => b.pointsContributed - a.pointsContributed);

        for (let j = 0; j < Math.min(sortedMembers.length, 3); j++) {
          const member = sortedMembers[j];
          try {
            await pointsService.addPoints({
              userId: member.user.toString(),
              amount: memberRewards[j],
              type: 'bonus',
              reason: `#${j + 1} clan contributor this week in [${clan.tag}]`,
              metadata: { clanId: clan._id.toString(), rank: j + 1 },
            });

            await notificationService.createNotification({
              user: member.user.toString(),
              type: 'achievement',
              title: 'Weekly Clan Reward!',
              body: `You ranked #${j + 1} contributor in [${clan.tag}] and earned ${memberRewards[j]} personal points!`,
              data: { clanId: clan._id.toString() },
            });
          } catch (e) {
            logger.warn(`Weekly member reward error for ${member.user}:`, e);
          }
        }
      }

      await Clan.updateMany({}, { $set: { weeklyPoints: 0, 'members.$[].weeklyContribution': 0 } });
      logger.info('Weekly clan points reset completed (clan rewards + member rewards)');
    } catch (error) {
      logger.error('resetWeeklyPoints error:', error);
    }
  }

  /**
   * Reset monthly points. Called by cron. Award top clans before reset.
   */
  async resetMonthlyPoints(): Promise<void> {
    try {
      const topClans = await Clan.find().sort({ monthlyPoints: -1 }).limit(3);
      const rewards = [1500, 800, 400];

      for (let i = 0; i < topClans.length; i++) {
        const clan = topClans[i];
        if (clan.monthlyPoints <= 0) continue;

        clan.totalPoints += rewards[i];
        if (i === 0 && !clan.badges.includes('monthly_champion')) {
          clan.badges.push('monthly_champion');
        }
        await clan.save();

        try {
          await notificationService.createNotification({
            user: clan.leader.toString(),
            type: 'achievement',
            title: 'Monthly Clan Reward!',
            body: `Your clan [${clan.tag}] placed #${i + 1} this month and earned ${rewards[i]} bonus points!`,
            data: { clanId: clan._id.toString() },
          });
        } catch (e) {
          logger.warn('Monthly reset notification error:', e);
        }
      }

      await Clan.updateMany({}, { $set: { monthlyPoints: 0 } });
      logger.info('Monthly clan points reset completed');
    } catch (error) {
      logger.error('resetMonthlyPoints error:', error);
    }
  }

  // ─── Clan Wars ───────────────────────────────────────────────────────────

  /**
   * Start a war challenge between two clans.
   */
  async startWar(
    challengerClanId: string,
    defenderClanId: string,
    warType: 'games' | 'study' | 'mixed',
    pointsStake: number
  ): Promise<IClanWarDocument> {
    try {
      if (challengerClanId === defenderClanId) {
        throw new Error('A clan cannot war against itself.');
      }

      const [challenger, defender] = await Promise.all([
        Clan.findById(challengerClanId),
        Clan.findById(defenderClanId),
      ]);
      if (!challenger) throw new Error('Challenger clan not found.');
      if (!defender) throw new Error('Defender clan not found.');

      // Check no active war between these clans
      const activeWar = await ClanWar.findOne({
        $or: [
          { challenger: challengerClanId, defender: defenderClanId },
          { challenger: defenderClanId, defender: challengerClanId },
        ],
        status: { $in: ['pending', 'accepted', 'in_progress'] },
      });
      if (activeWar) throw new Error('There is already an active war between these clans.');

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24h to accept

      const war = await ClanWar.create({
        challenger: challengerClanId,
        defender: defenderClanId,
        warType,
        pointsStake,
        expiresAt,
      });

      // Log activity for both clans
      await this.logActivity(challengerClanId, 'war_started', challenger.leader.toString(), `declared war on [${defender.tag}]`);
      await this.logActivity(defenderClanId, 'war_started', defender.leader.toString(), `received war challenge from [${challenger.tag}]`);

      logger.info(`Clan war created: [${challenger.tag}] vs [${defender.tag}]`);

      // Notify defender clan leader
      try {
        await notificationService.createNotification({
          user: defender.leader.toString(),
          type: 'system',
          title: 'Clan War Challenge!',
          body: `Clan [${challenger.tag}] has challenged your clan to a war! ${pointsStake} points at stake.`,
          data: { warId: war._id.toString(), clanId: defenderClanId },
        });
      } catch (e) {
        logger.warn('War challenge notification error:', e);
      }

      return war;
    } catch (error) {
      logger.error('startWar error:', error);
      throw error;
    }
  }

  /**
   * Accept or decline a war challenge.
   */
  async respondToWar(clanId: string, warId: string, accept: boolean): Promise<IClanWarDocument> {
    try {
      const war = await ClanWar.findById(warId);
      if (!war) throw new Error('War not found.');
      if (war.defender.toString() !== clanId) throw new Error('Only the defender clan can respond.');
      if (war.status !== 'pending') throw new Error('War is no longer pending.');
      if (war.expiresAt < new Date()) {
        war.status = 'expired';
        await war.save();
        throw new Error('War challenge has expired.');
      }

      if (accept) {
        war.status = 'accepted';
        logger.info(`Clan war ${warId} accepted`);

        // Notify challenger
        const challenger = await Clan.findById(war.challenger);
        if (challenger) {
          try {
            await notificationService.createNotification({
              user: challenger.leader.toString(),
              type: 'system',
              title: 'War Accepted!',
              body: `Your clan war challenge has been accepted! Assign your players.`,
              data: { warId: war._id.toString(), clanId: war.challenger.toString() },
            });
          } catch (e) {
            logger.warn('War accept notification error:', e);
          }

          // Emit socket event to challenger clan members
          try {
            const memberIds = challenger.members.map((m) => m.user.toString());
            emitClanWarUpdate(memberIds, 'clan:war_accepted', { warId: war._id.toString(), status: 'accepted' });
          } catch {}
        }
      } else {
        war.status = 'declined';
        logger.info(`Clan war ${warId} declined`);
      }

      await war.save();

      // Emit socket event to defender clan members
      try {
        const defender = await Clan.findById(clanId);
        if (defender) {
          const memberIds = defender.members.map((m) => m.user.toString());
          emitClanWarUpdate(memberIds, accept ? 'clan:war_accepted' : 'clan:war_declined', { warId: war._id.toString(), status: war.status });
        }
      } catch {}

      return war;
    } catch (error) {
      logger.error('respondToWar error:', error);
      throw error;
    }
  }

  /**
   * Assign players from a clan to war matchups.
   */
  async assignWarPlayers(
    clanId: string,
    warId: string,
    playerIds: string[]
  ): Promise<IClanWarDocument> {
    try {
      const war = await ClanWar.findById(warId);
      if (!war) throw new Error('War not found.');
      if (war.status !== 'accepted' && war.status !== 'in_progress') {
        throw new Error('War must be accepted before assigning players.');
      }

      const clan = await Clan.findById(clanId);
      if (!clan) throw new Error('Clan not found.');

      // Verify all players are clan members
      for (const pid of playerIds) {
        if (!clan.members.some((m) => m.user.toString() === pid)) {
          throw new Error(`Player ${pid} is not a member of this clan.`);
        }
      }

      const isChallenger = war.challenger.toString() === clanId;
      const isDefender = war.defender.toString() === clanId;
      if (!isChallenger && !isDefender) throw new Error('Clan is not part of this war.');

      // Build or update matches
      const gameTypes = ['speed_math', 'word_scramble', 'emoji_guess', 'memory_match', 'trivia'];

      if (war.matches.length === 0) {
        // First side to assign — create placeholder matches
        const matchCount = Math.min(playerIds.length, 5);
        for (let i = 0; i < matchCount; i++) {
          const pid = new mongoose.Types.ObjectId(playerIds[i]);
          war.matches.push({
            challengerPlayer: isChallenger ? pid : undefined,
            defenderPlayer: isDefender ? pid : undefined,
            gameType: gameTypes[i % gameTypes.length],
            challengerScore: 0,
            defenderScore: 0,
            winner: null,
            status: 'pending',
          } as IClanWarDocument['matches'][number]);
        }
      } else {
        // Second side — fill in their players
        for (let i = 0; i < Math.min(playerIds.length, war.matches.length); i++) {
          const pid = new mongoose.Types.ObjectId(playerIds[i]);
          if (isChallenger) {
            war.matches[i].challengerPlayer = pid;
          } else {
            war.matches[i].defenderPlayer = pid;
          }
        }
      }

      // If both sides have assigned, start the war
      const challengerAssigned = war.matches.every((m) => m.challengerPlayer);
      const defenderAssigned = war.matches.every((m) => m.defenderPlayer);
      if (challengerAssigned && defenderAssigned && war.status === 'accepted') {
        war.status = 'in_progress';
        war.startedAt = new Date();
        // Extend expiry for gameplay
        const newExpiry = new Date();
        newExpiry.setHours(newExpiry.getHours() + 48);
        war.expiresAt = newExpiry;
      }

      await war.save();
      logger.info(`Players assigned for war ${warId} by clan ${clanId}`);
      return war;
    } catch (error) {
      logger.error('assignWarPlayers error:', error);
      throw error;
    }
  }

  /**
   * Submit a result for an individual war match.
   */
  async submitWarMatchResult(
    warId: string,
    matchIndex: number,
    winningSide: 'challenger' | 'defender' | 'tie',
    scores: { challengerScore: number; defenderScore: number }
  ): Promise<IClanWarDocument> {
    try {
      const war = await ClanWar.findById(warId);
      if (!war) throw new Error('War not found.');
      if (war.status !== 'in_progress') throw new Error('War is not in progress.');
      if (matchIndex < 0 || matchIndex >= war.matches.length) throw new Error('Invalid match index.');

      const match = war.matches[matchIndex];
      if (match.status === 'completed') throw new Error('Match already completed.');

      match.challengerScore = scores.challengerScore;
      match.defenderScore = scores.defenderScore;
      match.winner = winningSide;
      match.status = 'completed';
      match.completedAt = new Date();

      // Update aggregate scores
      if (winningSide === 'challenger') {
        war.challengerScore += 1;
      } else if (winningSide === 'defender') {
        war.defenderScore += 1;
      }

      await war.save();
      logger.info(`War ${warId} match ${matchIndex} completed: ${winningSide}`);

      // Emit real-time score update to both clans
      try {
        const [challengerClan, defenderClan] = await Promise.all([
          Clan.findById(war.challenger),
          Clan.findById(war.defender),
        ]);
        const allMemberIds = [
          ...(challengerClan?.members?.map((m) => m.user.toString()) || []),
          ...(defenderClan?.members?.map((m) => m.user.toString()) || []),
        ];
        emitClanWarUpdate(allMemberIds, 'clan:war_score_update', {
          warId: war._id.toString(),
          challengerScore: war.challengerScore,
          defenderScore: war.defenderScore,
          matchIndex,
          winningSide,
        });
      } catch {}

      // Check if war is done
      await this.checkWarCompletion(warId);
      return war;
    } catch (error) {
      logger.error('submitWarMatchResult error:', error);
      throw error;
    }
  }

  /**
   * Check if all matches are complete and determine the war winner.
   */
  async checkWarCompletion(warId: string): Promise<IClanWarDocument | null> {
    try {
      const war = await ClanWar.findById(warId);
      if (!war || war.status !== 'in_progress') return war;

      const allDone = war.matches.every((m) => m.status === 'completed');
      if (!allDone) return war;

      // Determine winner
      if (war.challengerScore > war.defenderScore) {
        war.winner = 'challenger';
      } else if (war.defenderScore > war.challengerScore) {
        war.winner = 'defender';
      } else {
        war.winner = 'tie';
      }

      war.status = 'completed';
      war.completedAt = new Date();
      await war.save();

      // Award points
      const [challengerClan, defenderClan] = await Promise.all([
        Clan.findById(war.challenger),
        Clan.findById(war.defender),
      ]);

      if (challengerClan && defenderClan) {
        if (war.winner === 'challenger') {
          challengerClan.warsWon += 1;
          defenderClan.warsLost += 1;
          challengerClan.totalPoints += war.pointsStake;
          challengerClan.weeklyPoints += war.pointsStake;
          challengerClan.monthlyPoints += war.pointsStake;
        } else if (war.winner === 'defender') {
          defenderClan.warsWon += 1;
          challengerClan.warsLost += 1;
          defenderClan.totalPoints += war.pointsStake;
          defenderClan.weeklyPoints += war.pointsStake;
          defenderClan.monthlyPoints += war.pointsStake;
        } else {
          challengerClan.warsTied += 1;
          defenderClan.warsTied += 1;
          // Split stake on tie
          const half = Math.floor(war.pointsStake / 2);
          challengerClan.totalPoints += half;
          defenderClan.totalPoints += half;
        }

        await Promise.all([challengerClan.save(), defenderClan.save()]);

        // Log war completion activity
        if (war.winner === 'challenger') {
          await this.logActivity(challengerClan._id.toString(), 'war_won', challengerClan.leader.toString(), `Won war vs [${defenderClan.tag}]! +${war.pointsStake} pts`, war.pointsStake);
          await this.logActivity(defenderClan._id.toString(), 'war_lost', defenderClan.leader.toString(), `Lost war vs [${challengerClan.tag}]`);
        } else if (war.winner === 'defender') {
          await this.logActivity(defenderClan._id.toString(), 'war_won', defenderClan.leader.toString(), `Won war vs [${challengerClan.tag}]! +${war.pointsStake} pts`, war.pointsStake);
          await this.logActivity(challengerClan._id.toString(), 'war_lost', challengerClan.leader.toString(), `Lost war vs [${defenderClan.tag}]`);
        } else {
          await this.logActivity(challengerClan._id.toString(), 'war_tied', challengerClan.leader.toString(), `War vs [${defenderClan.tag}] ended in a tie`);
          await this.logActivity(defenderClan._id.toString(), 'war_tied', defenderClan.leader.toString(), `War vs [${challengerClan.tag}] ended in a tie`);
        }

        // Update mission progress for war wins
        if (war.winner === 'challenger') {
          await this.updateMissionProgress(challengerClan._id.toString(), 'wars_won', 1);
        } else if (war.winner === 'defender') {
          await this.updateMissionProgress(defenderClan._id.toString(), 'wars_won', 1);
        }

        // Notify both clans
        const winnerTag =
          war.winner === 'challenger'
            ? challengerClan.tag
            : war.winner === 'defender'
              ? defenderClan.tag
              : null;
        const resultText = winnerTag ? `[${winnerTag}] won!` : "It's a tie!";

        for (const clan of [challengerClan, defenderClan]) {
          for (const member of clan.members) {
            try {
              await notificationService.createNotification({
                user: member.user.toString(),
                type: 'system',
                title: 'Clan War Ended!',
                body: `The war between [${challengerClan.tag}] and [${defenderClan.tag}] is over. ${resultText}`,
                data: { warId: war._id.toString(), clanId: clan._id.toString() },
              });
            } catch (e) {
              // Silently skip individual notification failures
            }
          }
        }

        logger.info(`Clan war ${warId} completed. Winner: ${war.winner}`);
      }

      return war;
    } catch (error) {
      logger.error('checkWarCompletion error:', error);
      throw error;
    }
  }

  /**
   * Get active/pending wars for a clan.
   */
  async getActiveWars(clanId: string): Promise<IClanWarDocument[]> {
    try {
      return ClanWar.find({
        $or: [{ challenger: clanId }, { defender: clanId }],
        status: { $in: ['pending', 'accepted', 'in_progress'] },
      })
        .populate('challenger', 'name tag emoji color')
        .populate('defender', 'name tag emoji color')
        .sort({ createdAt: -1 });
    } catch (error) {
      logger.error('getActiveWars error:', error);
      throw error;
    }
  }

  /**
   * Get war history for a clan.
   */
  async getWarHistory(clanId: string): Promise<IClanWarDocument[]> {
    try {
      return ClanWar.find({
        $or: [{ challenger: clanId }, { defender: clanId }],
        status: { $in: ['completed', 'declined', 'expired'] },
      })
        .populate('challenger', 'name tag emoji color')
        .populate('defender', 'name tag emoji color')
        .sort({ completedAt: -1, createdAt: -1 })
        .limit(50);
    } catch (error) {
      logger.error('getWarHistory error:', error);
      throw error;
    }
  }

  /**
   * Get a single war with details.
   */
  async getWar(warId: string): Promise<IClanWarDocument | null> {
    try {
      return ClanWar.findById(warId)
        .populate('challenger', 'name tag emoji color leader members')
        .populate('defender', 'name tag emoji color leader members')
        .populate('matches.challengerPlayer', 'firstName lastName profilePhoto')
        .populate('matches.defenderPlayer', 'firstName lastName profilePhoto');
    } catch (error) {
      logger.error('getWar error:', error);
      throw error;
    }
  }
  // ─── Activity Feed ──────────────────────────────────────────────────────

  /**
   * Log an activity to the clan's activity feed. Keeps last 50 entries.
   */
  async logActivity(clanId: string, type: string, userId: string, message: string, points?: number): Promise<void> {
    try {
      const entry = {
        type,
        userId: new mongoose.Types.ObjectId(userId),
        message,
        points: points || 0,
        createdAt: new Date(),
      };

      await Clan.findByIdAndUpdate(clanId, {
        $push: {
          activityLog: {
            $each: [entry],
            $slice: -50, // keep last 50
          },
        },
      });
    } catch (error) {
      logger.warn('logActivity error:', error);
    }
  }

  /**
   * Get the activity log for a clan with populated user info.
   */
  async getActivityLog(clanId: string): Promise<any[]> {
    try {
      const clan = await Clan.findById(clanId)
        .select('activityLog')
        .populate('activityLog.userId', 'firstName lastName profilePhoto');
      if (!clan) return [];
      // Return in reverse chronological order
      return (clan.activityLog || []).reverse();
    } catch (error) {
      logger.error('getActivityLog error:', error);
      return [];
    }
  }

  // ─── Clan Weekly Missions ─────────────────────────────────────────────

  /**
   * Generate 3 random weekly missions for a clan.
   */
  async generateWeeklyMissions(clanId: string): Promise<IClanMissionDocument[]> {
    try {
      // Check if missions already exist for current week
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);

      const existing = await ClanMission.find({
        clan: clanId,
        startDate: { $gte: startOfWeek },
        endDate: { $lte: endOfWeek },
      });

      if (existing.length > 0) {
        return existing;
      }

      const missionTemplates = [
        { type: 'points_earned' as const, title: 'Point Collectors', description: 'Earn clan points from member activities', targets: [200, 500, 1000], rewards: [100, 200, 400] },
        { type: 'games_won' as const, title: 'Game Masters', description: 'Win games as a clan', targets: [5, 10, 20], rewards: [75, 150, 300] },
        { type: 'wars_won' as const, title: 'War Champions', description: 'Win clan wars', targets: [1, 2, 3], rewards: [150, 300, 500] },
        { type: 'members_active' as const, title: 'Active Squad', description: 'Have active members contributing this week', targets: [3, 5, 8], rewards: [80, 160, 250] },
        { type: 'challenges_completed' as const, title: 'Challenge Seekers', description: 'Complete challenges as clan members', targets: [5, 10, 15], rewards: [100, 200, 350] },
      ];

      // Pick 3 random unique mission types
      const shuffled = missionTemplates.sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, 3);

      const missions: IClanMissionDocument[] = [];
      for (const template of selected) {
        const difficultyIndex = Math.floor(Math.random() * 3);
        const mission = await ClanMission.create({
          clan: clanId,
          title: template.title,
          description: template.description,
          target: template.targets[difficultyIndex],
          progress: 0,
          reward: template.rewards[difficultyIndex],
          type: template.type,
          startDate: startOfWeek,
          endDate: endOfWeek,
          completed: false,
        });
        missions.push(mission);
      }

      await this.logActivity(clanId, 'missions_generated', clanId, 'New weekly missions are available!');
      logger.info(`Generated ${missions.length} weekly missions for clan ${clanId}`);
      return missions;
    } catch (error) {
      logger.error('generateWeeklyMissions error:', error);
      throw error;
    }
  }

  /**
   * Update mission progress and check for completion.
   */
  async updateMissionProgress(clanId: string, type: string, amount: number): Promise<void> {
    try {
      const now = new Date();
      const missions = await ClanMission.find({
        clan: clanId,
        type,
        completed: false,
        startDate: { $lte: now },
        endDate: { $gte: now },
      });

      for (const mission of missions) {
        mission.progress = Math.min(mission.progress + amount, mission.target);

        if (mission.progress >= mission.target && !mission.completed) {
          mission.completed = true;
          mission.completedAt = new Date();

          // Award clan points
          await this.addClanPoints(clanId, clanId, mission.reward, `Mission completed: ${mission.title}`);

          // Log activity
          await this.logActivity(clanId, 'mission_completed', clanId, `Mission "${mission.title}" completed! +${mission.reward} pts`, mission.reward);

          // Notify all members
          const clan = await Clan.findById(clanId);
          if (clan) {
            for (const member of clan.members) {
              try {
                await notificationService.createNotification({
                  user: member.user.toString(),
                  type: 'achievement',
                  title: 'Mission Completed!',
                  body: `Your clan completed "${mission.title}" and earned ${mission.reward} bonus points!`,
                  data: { clanId: clan._id.toString() },
                });
              } catch (e) {
                // skip individual notification failures
              }
            }
          }

          logger.info(`Clan ${clanId} completed mission: ${mission.title}`);
        }

        await mission.save();
      }
    } catch (error) {
      logger.warn('updateMissionProgress error:', error);
    }
  }

  /**
   * Get active missions for a clan (current week).
   */
  async getActiveMissions(clanId: string): Promise<IClanMissionDocument[]> {
    try {
      const now = new Date();
      return ClanMission.find({
        clan: clanId,
        startDate: { $lte: now },
        endDate: { $gte: now },
      }).sort({ completed: 1, createdAt: 1 });
    } catch (error) {
      logger.error('getActiveMissions error:', error);
      return [];
    }
  }

  // ─── Treasury ─────────────────────────────────────────────────────────

  /**
   * Donate points to clan treasury.
   */
  async donateToTreasury(clanId: string, userId: string, amount: number): Promise<{ treasury: number }> {
    try {
      if (amount < 10) {
        throw new Error('Minimum donation is 10 points.');
      }

      const clan = await Clan.findById(clanId);
      if (!clan) throw new Error('Clan not found.');

      const isMember = clan.members.some((m) => m.user.toString() === userId);
      if (!isMember) throw new Error('You are not a member of this clan.');

      // Deduct from user points
      await pointsService.deductPoints({
        userId,
        amount,
        type: 'spent',
        reason: 'Clan treasury donation',
        metadata: { action: 'clan_donation', clanId },
      });

      // Add to treasury (with multiplier from perks)
      const treasuryMultiplier = this.getTreasuryMultiplier(clan.level);
      const effectiveAmount = Math.round(amount * treasuryMultiplier);
      clan.treasury = (clan.treasury || 0) + effectiveAmount;
      await clan.save();

      // Log activity
      const bonusText = treasuryMultiplier > 1 ? ` (${treasuryMultiplier}x perk bonus!)` : '';
      await this.logActivity(clanId, 'donation', userId, `donated ${effectiveAmount} pts to the treasury${bonusText}`, effectiveAmount);

      // Notify leader
      try {
        await notificationService.createNotification({
          user: clan.leader.toString(),
          type: 'system',
          title: 'Treasury Donation',
          body: `A member donated ${effectiveAmount} points to your clan treasury!`,
          data: { clanId: clan._id.toString() },
        });
      } catch (e) {
        logger.warn('Donation notification error:', e);
      }

      logger.info(`User ${userId} donated ${effectiveAmount} pts to clan ${clan.tag} treasury`);
      return { treasury: clan.treasury };
    } catch (error) {
      logger.error('donateToTreasury error:', error);
      throw error;
    }
  }

  /**
   * Get treasury history (donations from activity log).
   */
  async getTreasuryHistory(clanId: string): Promise<any> {
    try {
      const clan = await Clan.findById(clanId)
        .select('treasury activityLog')
        .populate('activityLog.userId', 'firstName lastName profilePhoto');
      if (!clan) throw new Error('Clan not found.');

      const donations = (clan.activityLog || [])
        .filter((a) => a.type === 'donation')
        .reverse();

      return {
        treasury: clan.treasury || 0,
        donations,
      };
    } catch (error) {
      logger.error('getTreasuryHistory error:', error);
      throw error;
    }
  }

  // ─── Streaks ──────────────────────────────────────────────────────────

  /**
   * Update the clan's activity streak.
   */
  async updateStreak(clanId: string): Promise<void> {
    try {
      const clan = await Clan.findById(clanId);
      if (!clan) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (!clan.streak) {
        clan.streak = { current: 1, best: 1, lastActiveDate: today };
        await clan.save();
        return;
      }

      const lastActive = clan.streak.lastActiveDate ? new Date(clan.streak.lastActiveDate) : null;
      if (lastActive) {
        lastActive.setHours(0, 0, 0, 0);
      }

      if (lastActive && lastActive.getTime() === today.getTime()) {
        // Already active today, no change
        return;
      }

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastActive && lastActive.getTime() === yesterday.getTime()) {
        // Consecutive day
        clan.streak.current += 1;
      } else {
        // Streak broken or first activity
        clan.streak.current = 1;
      }

      clan.streak.lastActiveDate = today;
      if (clan.streak.current > clan.streak.best) {
        clan.streak.best = clan.streak.current;
      }

      await clan.save();

      // Notify on streak milestones
      const milestones = [7, 14, 30];
      if (milestones.includes(clan.streak.current)) {
        await this.logActivity(clanId, 'streak_milestone', clanId, `Reached a ${clan.streak.current}-day activity streak!`);
        for (const member of clan.members) {
          try {
            await notificationService.createNotification({
              user: member.user.toString(),
              type: 'achievement',
              title: 'Streak Milestone!',
              body: `Your clan has a ${clan.streak.current}-day activity streak! ${clan.streak.current >= 14 ? '2x' : '1.5x'} point bonus active!`,
              data: { clanId: clan._id.toString() },
            });
          } catch (e) {
            // skip
          }
        }
      }

      logger.info(`Clan ${clan.tag} streak: ${clan.streak.current} days`);
    } catch (error) {
      logger.warn('updateStreak error:', error);
    }
  }

  // ─── Clan Chat ────────────────────────────────────────────────────────

  /**
   * Get the chat match ID for a clan.
   */
  async getChatMatchId(clanId: string): Promise<string | null> {
    try {
      const clan = await Clan.findById(clanId).select('chatMatchId members leader');
      if (!clan) return null;

      // Generate a real Match document if missing
      if (!clan.chatMatchId || clan.chatMatchId.startsWith('clan_')) {
        const { Match } = await import('../models');
        const leaderId = clan.leader;
        const user1 = clan.members[0]?.user || leaderId;
        const user2 = clan.members.length > 1 ? clan.members[1].user : leaderId;

        try {
          const match = new Match({
            user1,
            user2,
            type: 'match',
            status: 'active',
            matchedAt: new Date(),
          });
          await match.save();

          clan.chatMatchId = match._id.toString();
          await clan.save();
          logger.info(`Created chat match ${match._id} for clan ${clan._id}`);
        } catch (e: any) {
          logger.error('Failed to create clan chat match:', e);
          throw e;
        }
      }

      return clan.chatMatchId;
    } catch (error) {
      logger.error('getChatMatchId error:', error);
      return null;
    }
  }
  // ─── Perks System ───────────────────────────────────────────────────

  /**
   * Level-based perks that unlock automatically.
   */
  static readonly LEVEL_PERKS: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    requiredLevel: number;
    effect: { type: string; value: number };
  }> = [
    { id: 'points_boost_10', name: 'Point Boost I', description: '+10% points from all activities', icon: 'trending-up', requiredLevel: 2, effect: { type: 'points_multiplier', value: 0.10 } },
    { id: 'extra_mission', name: 'Extra Mission', description: '+1 weekly mission slot', icon: 'flag', requiredLevel: 3, effect: { type: 'extra_missions', value: 1 } },
    { id: 'war_bonus_15', name: 'War Bonus', description: '+15% war stake winnings', icon: 'flame', requiredLevel: 5, effect: { type: 'war_bonus', value: 0.15 } },
    { id: 'points_boost_25', name: 'Point Boost II', description: '+25% points from all activities', icon: 'rocket', requiredLevel: 7, effect: { type: 'points_multiplier', value: 0.25 } },
    { id: 'max_members_10', name: 'Expanded Roster', description: '+10 max member slots', icon: 'people', requiredLevel: 8, effect: { type: 'max_members', value: 10 } },
    { id: 'double_treasury', name: 'Treasury Mastery', description: 'Donations worth 2x to treasury', icon: 'diamond', requiredLevel: 10, effect: { type: 'treasury_multiplier', value: 2 } },
  ];

  /**
   * Shop items purchasable with treasury points.
   */
  static readonly SHOP_ITEMS: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    cost: number;
    type: 'boost' | 'cosmetic' | 'upgrade';
    duration?: number; // hours, undefined = permanent
    effect?: { type: string; value: number };
    requiredLevel?: number;
  }> = [
    { id: 'xp_boost_24h', name: 'XP Surge', description: '2x clan points for 24 hours', icon: 'flash', cost: 200, type: 'boost', duration: 24, effect: { type: 'points_multiplier', value: 1.0 } },
    { id: 'war_shield_24h', name: 'War Shield', description: 'Decline wars without penalty for 24h', icon: 'shield-checkmark', cost: 150, type: 'boost', duration: 24, effect: { type: 'war_shield', value: 1 } },
    { id: 'mission_refresh', name: 'Mission Refresh', description: 'Reroll weekly missions (one-time)', icon: 'refresh', cost: 100, type: 'boost', effect: { type: 'mission_refresh', value: 1 } },
    { id: 'member_slots_5', name: '+5 Member Slots', description: 'Permanently increase max members by 5', icon: 'person-add', cost: 500, type: 'upgrade', effect: { type: 'max_members', value: 5 } },
    { id: 'badge_elite', name: 'Elite Badge', description: 'Show the Elite badge on your clan profile', icon: 'ribbon', cost: 800, type: 'cosmetic', requiredLevel: 3 },
    { id: 'badge_legendary', name: 'Legendary Badge', description: 'Show the Legendary badge on your clan profile', icon: 'medal', cost: 1500, type: 'cosmetic', requiredLevel: 5 },
    { id: 'war_slots_extra', name: 'Extra War Slot', description: 'Allow 2 active wars simultaneously', icon: 'git-branch', cost: 1000, type: 'upgrade', requiredLevel: 4, effect: { type: 'extra_war_slots', value: 1 } },
    { id: 'point_rain', name: 'Point Rain', description: 'All members get 50 bonus points', icon: 'gift', cost: 300, type: 'boost', effect: { type: 'point_rain', value: 50 } },
  ];

  /**
   * Get perks unlocked for a clan based on its level.
   */
  getClanPerks(level: number): typeof ClanService.LEVEL_PERKS {
    return ClanService.LEVEL_PERKS.filter(p => p.requiredLevel <= level);
  }

  /**
   * Get all level perks with unlock status for a clan.
   */
  getAllPerksWithStatus(level: number): Array<typeof ClanService.LEVEL_PERKS[number] & { unlocked: boolean }> {
    return ClanService.LEVEL_PERKS.map(p => ({
      ...p,
      unlocked: p.requiredLevel <= level,
    }));
  }

  /**
   * Get shop items available for a clan, with purchased status.
   */
  async getShopItems(clanId: string): Promise<Array<typeof ClanService.SHOP_ITEMS[number] & { purchased: boolean; active: boolean }>> {
    try {
      const clan = await Clan.findById(clanId).select('level purchasedUpgrades');
      if (!clan) throw new Error('Clan not found.');

      const now = new Date();
      return ClanService.SHOP_ITEMS.map(item => {
        const purchase = (clan.purchasedUpgrades || []).find(p => p.itemId === item.id);
        const isPermanent = !item.duration;
        const isActive = purchase ? (isPermanent || (purchase.expiresAt && purchase.expiresAt > now)) : false;
        const meetsLevel = !item.requiredLevel || clan.level >= item.requiredLevel;

        return {
          ...item,
          purchased: !!purchase,
          active: !!isActive,
          locked: !meetsLevel,
        } as any;
      });
    } catch (error) {
      logger.error('getShopItems error:', error);
      throw error;
    }
  }

  /**
   * Purchase a shop item using treasury funds. Leader/co-leader only.
   */
  async purchaseShopItem(
    clanId: string,
    userId: string,
    itemId: string
  ): Promise<{ success: boolean; treasury: number; item: typeof ClanService.SHOP_ITEMS[number] }> {
    try {
      const clan = await Clan.findById(clanId);
      if (!clan) throw new Error('Clan not found.');

      const member = clan.members.find(m => m.user.toString() === userId);
      if (!member || (member.role !== 'leader' && member.role !== 'co-leader')) {
        throw new Error('Only leaders and co-leaders can make purchases.');
      }

      const item = ClanService.SHOP_ITEMS.find(i => i.id === itemId);
      if (!item) throw new Error('Item not found.');

      if (item.requiredLevel && clan.level < item.requiredLevel) {
        throw new Error(`Clan must be level ${item.requiredLevel} to purchase this item.`);
      }

      if ((clan.treasury || 0) < item.cost) {
        throw new Error('Insufficient treasury funds.');
      }

      // Check if already purchased (for permanent items)
      const existingPurchase = (clan.purchasedUpgrades || []).find(p => p.itemId === itemId);
      if (existingPurchase && !item.duration) {
        // Permanent items can only be bought once (except stackable ones like member_slots)
        if (item.id !== 'member_slots_5') {
          throw new Error('This item has already been purchased.');
        }
      }

      // Check if boost is already active
      if (item.duration && existingPurchase?.expiresAt && existingPurchase.expiresAt > new Date()) {
        throw new Error('This boost is still active.');
      }

      // Deduct from treasury
      clan.treasury -= item.cost;

      // Apply the purchase
      const expiresAt = item.duration ? new Date(Date.now() + item.duration * 60 * 60 * 1000) : undefined;

      if (existingPurchase && item.duration) {
        // Renew the boost
        existingPurchase.purchasedAt = new Date();
        existingPurchase.expiresAt = expiresAt;
      } else {
        clan.purchasedUpgrades.push({
          itemId: item.id,
          purchasedAt: new Date(),
          expiresAt,
        });
      }

      // Apply immediate effects
      if (item.effect) {
        switch (item.effect.type) {
          case 'max_members':
            clan.maxMembers += item.effect.value;
            break;
          case 'point_rain':
            // Give all members bonus points
            for (const m of clan.members) {
              await this.addClanPoints(clanId, m.user.toString(), item.effect.value, 'Point Rain bonus');
            }
            break;
          case 'mission_refresh':
            // Delete current missions so new ones can be generated
            const { ClanMission: ClanMissionModel } = await import('../models/ClanMission');
            const now = new Date();
            await ClanMissionModel.deleteMany({
              clan: clanId,
              completed: false,
              startDate: { $lte: now },
              endDate: { $gte: now },
            });
            break;
        }
      }

      // Add badge if cosmetic
      if (item.type === 'cosmetic') {
        const badgeName = item.id.replace('badge_', '');
        if (!clan.badges.includes(badgeName)) {
          clan.badges.push(badgeName);
        }
      }

      await clan.save();

      // Log activity
      await this.logActivity(clanId, 'shop_purchase', userId, `purchased "${item.name}" from the shop`, item.cost);

      logger.info(`Clan ${clan.tag} purchased ${item.name} for ${item.cost} treasury pts`);
      return { success: true, treasury: clan.treasury, item };
    } catch (error) {
      logger.error('purchaseShopItem error:', error);
      throw error;
    }
  }

  /**
   * Get active boost multipliers for a clan (used in point calculations).
   */
  async getActiveBoostMultiplier(clanId: string): Promise<number> {
    try {
      const clan = await Clan.findById(clanId).select('level purchasedUpgrades');
      if (!clan) return 0;

      let bonus = 0;
      const now = new Date();

      // Level perks
      const levelPerks = this.getClanPerks(clan.level);
      for (const perk of levelPerks) {
        if (perk.effect.type === 'points_multiplier') {
          bonus += perk.effect.value;
        }
      }

      // Shop boosts
      for (const purchase of clan.purchasedUpgrades || []) {
        if (purchase.expiresAt && purchase.expiresAt < now) continue;
        const item = ClanService.SHOP_ITEMS.find(i => i.id === purchase.itemId);
        if (item?.effect?.type === 'points_multiplier') {
          bonus += item.effect.value;
        }
      }

      return bonus;
    } catch (error) {
      logger.warn('getActiveBoostMultiplier error:', error);
      return 0;
    }
  }

  /**
   * Get the treasury donation multiplier (from level perks).
   */
  getTreasuryMultiplier(level: number): number {
    const perk = ClanService.LEVEL_PERKS.find(p => p.id === 'double_treasury' && p.requiredLevel <= level);
    return perk ? perk.effect.value : 1;
  }

  // ─── Achievements ──────────────────────────────────────────────────

  static readonly ACHIEVEMENT_DEFS: Array<{
    id: string; name: string; description: string; icon: string;
    check: (clan: IClanDocument) => boolean;
  }> = [
    { id: 'first_war', name: 'First Blood', description: 'Win your first clan war', icon: 'flame', check: (c) => c.warsWon >= 1 },
    { id: 'war_veteran', name: 'War Veteran', description: 'Win 10 clan wars', icon: 'shield', check: (c) => c.warsWon >= 10 },
    { id: 'war_legend', name: 'War Legend', description: 'Win 50 clan wars', icon: 'shield-checkmark', check: (c) => c.warsWon >= 50 },
    { id: 'points_1k', name: 'Rising Star', description: 'Reach 1,000 total points', icon: 'star', check: (c) => c.totalPoints >= 1000 },
    { id: 'points_10k', name: 'Powerhouse', description: 'Reach 10,000 total points', icon: 'star-half', check: (c) => c.totalPoints >= 10000 },
    { id: 'points_50k', name: 'Unstoppable', description: 'Reach 50,000 total points', icon: 'sunny', check: (c) => c.totalPoints >= 50000 },
    { id: 'full_house', name: 'Full House', description: 'Fill your clan to max capacity', icon: 'people', check: (c) => c.members.length >= c.maxMembers },
    { id: 'streak_7', name: 'On Fire', description: 'Reach a 7-day activity streak', icon: 'flash', check: (c) => c.streak?.current >= 7 },
    { id: 'streak_30', name: 'Relentless', description: 'Reach a 30-day activity streak', icon: 'flash-outline', check: (c) => c.streak?.current >= 30 },
    { id: 'level_5', name: 'Established', description: 'Reach clan level 5', icon: 'diamond-outline', check: (c) => c.level >= 5 },
    { id: 'level_10', name: 'Elite Force', description: 'Reach clan level 10', icon: 'diamond', check: (c) => c.level >= 10 },
    { id: 'treasury_5k', name: 'War Chest', description: 'Accumulate 5,000 treasury points', icon: 'wallet', check: (c) => (c.treasury || 0) >= 5000 },
  ];

  async checkAchievements(clanId: string): Promise<string[]> {
    try {
      const clan = await Clan.findById(clanId);
      if (!clan) return [];

      const newAchievements: string[] = [];
      for (const ach of ClanService.ACHIEVEMENT_DEFS) {
        if ((clan.achievements || []).includes(ach.id)) continue;
        if (ach.check(clan)) {
          newAchievements.push(ach.id);
        }
      }

      if (newAchievements.length > 0) {
        clan.achievements = [...(clan.achievements || []), ...newAchievements];
        await clan.save();

        for (const achId of newAchievements) {
          const ach = ClanService.ACHIEVEMENT_DEFS.find(a => a.id === achId)!;
          await this.logActivity(clanId, 'achievement', clanId, `Unlocked "${ach.name}" — ${ach.description}`);
          // Notify all members
          for (const member of clan.members) {
            try {
              await notificationService.createNotification({
                user: member.user.toString(),
                type: 'achievement',
                title: 'Clan Achievement Unlocked!',
                body: `Your clan earned "${ach.name}" — ${ach.description}`,
                data: { clanId: clan._id.toString() },
              });
            } catch {}
          }
        }
        logger.info(`Clan ${clan.tag} unlocked ${newAchievements.length} achievements: ${newAchievements.join(', ')}`);
      }
      return newAchievements;
    } catch (error) {
      logger.warn('checkAchievements error:', error);
      return [];
    }
  }

  getAchievementsWithStatus(clan: IClanDocument): Array<typeof ClanService.ACHIEVEMENT_DEFS[number] & { unlocked: boolean }> {
    return ClanService.ACHIEVEMENT_DEFS.map(a => ({
      ...a,
      check: undefined as any,
      unlocked: (clan.achievements || []).includes(a.id),
    }));
  }

  // ─── Member Contribution Leaderboard ───────────────────────────────

  getMemberLeaderboard(clan: IClanDocument): Array<{
    user: any; role: string; weeklyContribution: number; totalContributed: number; rank: number;
  }> {
    return [...clan.members]
      .sort((a, b) => (b.weeklyContribution || 0) - (a.weeklyContribution || 0))
      .map((m, i) => ({
        user: m.user,
        role: m.role,
        weeklyContribution: m.weeklyContribution || 0,
        totalContributed: m.pointsContributed || 0,
        rank: i + 1,
      }));
  }

  // ─── Head-to-Head History ──────────────────────────────────────────

  async getHeadToHead(clanId: string, opponentClanId: string): Promise<{
    wins: number; losses: number; draws: number; totalWars: number;
  }> {
    try {
      const wars = await ClanWar.find({
        $or: [
          { challenger: clanId, defender: opponentClanId },
          { challenger: opponentClanId, defender: clanId },
        ],
        status: 'completed',
      }).lean();

      let wins = 0, losses = 0, draws = 0;
      for (const war of wars) {
        const isChallenger = war.challenger.toString() === clanId;
        if (war.winner === 'tie') { draws++; }
        else if ((war.winner === 'challenger' && isChallenger) || (war.winner === 'defender' && !isChallenger)) { wins++; }
        else { losses++; }
      }

      return { wins, losses, draws, totalWars: wars.length };
    } catch (error) {
      logger.error('getHeadToHead error:', error);
      return { wins: 0, losses: 0, draws: 0, totalWars: 0 };
    }
  }

  // ─── Announcements ─────────────────────────────────────────────────

  async setAnnouncement(clanId: string, userId: string, text: string): Promise<string> {
    const clan = await Clan.findById(clanId);
    if (!clan) throw new Error('Clan not found.');
    if (clan.leader.toString() !== userId) throw new Error('Only the leader can set announcements.');
    clan.announcement = text.slice(0, 500);
    await clan.save();
    if (text) {
      await this.logActivity(clanId, 'announcement', userId, 'updated the clan announcement');
    }
    return clan.announcement;
  }

  // ─── Seasonal Rankings ─────────────────────────────────────────────

  async resetSeason(): Promise<void> {
    try {
      const topClans = await Clan.find().sort({ 'season.points': -1 }).limit(3);
      const seasonBadges = ['season_gold', 'season_silver', 'season_bronze'];
      const seasonRewards = [3000, 1500, 750];

      for (let i = 0; i < topClans.length; i++) {
        const clan = topClans[i];
        if ((clan.season?.points || 0) <= 0) continue;

        clan.totalPoints += seasonRewards[i];
        if (!clan.badges.includes(seasonBadges[i])) {
          clan.badges.push(seasonBadges[i]);
        }
        await clan.save();

        for (const member of clan.members) {
          try {
            await notificationService.createNotification({
              user: member.user.toString(),
              type: 'achievement',
              title: 'Season Ended!',
              body: `Your clan [${clan.tag}] placed #${i + 1} this season and earned ${seasonRewards[i]} bonus points!`,
              data: { clanId: clan._id.toString() },
            });
          } catch {}
        }
      }

      // Reset season points and increment season number
      const currentSeason = topClans[0]?.season?.number || 1;
      await Clan.updateMany({}, {
        $set: { 'season.points': 0, 'season.number': currentSeason + 1 },
      });

      logger.info(`Season ${currentSeason} completed. New season: ${currentSeason + 1}`);
    } catch (error) {
      logger.error('resetSeason error:', error);
    }
  }

  async getSeasonLeaderboard(limit: number = 50): Promise<IClanDocument[]> {
    return Clan.find()
      .populate('leader', 'firstName lastName profilePhoto')
      .sort({ 'season.points': -1 })
      .limit(limit);
  }
}

export default new ClanService();
