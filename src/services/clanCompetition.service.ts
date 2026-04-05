import mongoose from 'mongoose';
import { ClanCompetition, IClanCompetitionDocument } from '../models/ClanCompetition';
import { Clan } from '../models/Clan';
import notificationService from './notification.service';
import logger from '../utils/logger';

class ClanCompetitionService {
  /**
   * Get or create the current month's competition.
   */
  async getCurrentCompetition(): Promise<IClanCompetitionDocument> {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    let competition = await ClanCompetition.findOne({ month });
    if (!competition) {
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      competition = await ClanCompetition.create({
        month,
        status: 'registration',
        competitors: [],
        startDate,
        endDate,
        minMembers: 10,
        minClans: 5,
        prizeTier: 50000,
      });
      logger.info(`Created competition for ${month}`);
    } else {
      // Always recalculate prize tier based on current competitors
      const newTier = this.calculatePrizeTier(competition.competitors.length);
      if (newTier !== competition.prizeTier) {
        competition.prizeTier = newTier;
        await competition.save();
      }
    }

    return competition;
  }

  /**
   * Register a clan for the monthly competition.
   */
  async registerClan(clanId: string, userId: string): Promise<IClanCompetitionDocument> {
    const clan = await Clan.findById(clanId);
    if (!clan) throw new Error('Clan not found.');

    // Check caller is leader or co-leader
    const member = clan.members.find(m => m.user.toString() === userId);
    if (!member || (member.role !== 'leader' && member.role !== 'co-leader')) {
      throw new Error('Only leaders and co-leaders can register for competitions.');
    }

    // Check minimum members
    if (clan.members.length < 10) {
      throw new Error(`Your clan needs at least 10 members to compete. You have ${clan.members.length}.`);
    }

    const competition = await this.getCurrentCompetition();

    if (competition.status === 'completed') {
      throw new Error('This month\'s competition has ended. Wait for next month.');
    }

    // Check if already registered
    if (competition.competitors.some(c => c.clan.toString() === clanId)) {
      throw new Error('Your clan is already registered for this competition.');
    }

    // Build member contributions array
    const memberContributions = clan.members.map(m => ({
      user: m.user,
      points: 0,
      gamesWon: 0,
      studyWon: 0,
    }));

    competition.competitors.push({
      clan: new mongoose.Types.ObjectId(clanId),
      totalPoints: 0,
      gamesPlayed: 0,
      studySessions: 0,
      memberContributions,
    } as any);

    // Update prize tier based on number of competitors
    competition.prizeTier = this.calculatePrizeTier(competition.competitors.length);

    // Activate if enough clans
    if (competition.status === 'registration' && competition.competitors.length >= competition.minClans) {
      competition.status = 'active';
      logger.info(`Competition ${competition.month} activated with ${competition.competitors.length} clans`);
    }

    await competition.save();

    // Notify clan members
    for (const m of clan.members) {
      try {
        await notificationService.createNotification({
          user: m.user.toString(),
          type: 'system',
          title: 'Clan Competition!',
          body: `Your clan [${clan.tag}] has entered the monthly competition! Play games and study sessions to earn points.`,
          data: { type: 'clan_competition', clanId },
        });
      } catch {}
    }

    logger.info(`Clan ${clan.tag} registered for competition ${competition.month}`);
    return competition;
  }

  /**
   * Record points from a game or study session between competing clan members.
   * Called after game/study completion.
   */
  async recordCompetitionPoints(
    userId: string,
    clanId: string,
    points: number,
    type: 'game' | 'study'
  ): Promise<void> {
    try {
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const competition = await ClanCompetition.findOne({
        month,
        status: { $in: ['active', 'registration'] },
        'competitors.clan': clanId,
      });

      if (!competition) return; // Clan not in competition

      const competitor = competition.competitors.find(c => c.clan.toString() === clanId);
      if (!competitor) return;

      // Update clan totals
      competitor.totalPoints += points;
      if (type === 'game') competitor.gamesPlayed += 1;
      if (type === 'study') competitor.studySessions += 1;

      // Update individual member contribution
      let memberEntry = competitor.memberContributions.find(m => m.user.toString() === userId);
      if (!memberEntry) {
        competitor.memberContributions.push({
          user: new mongoose.Types.ObjectId(userId),
          points: 0,
          gamesWon: 0,
          studyWon: 0,
        });
        memberEntry = competitor.memberContributions[competitor.memberContributions.length - 1];
      }
      memberEntry.points += points;
      if (type === 'game') memberEntry.gamesWon += 1;
      if (type === 'study') memberEntry.studyWon += 1;

      await competition.save();
    } catch (e) {
      logger.warn('Competition point recording error:', e);
    }
  }

  /**
   * Finalize the competition at month end. Rank clans, distribute prizes.
   */
  async finalizeCompetition(month?: string): Promise<any> {
    const targetMonth = month || (() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    })();

    const competition = await ClanCompetition.findOne({ month: targetMonth });
    if (!competition) throw new Error('Competition not found.');
    if (competition.status === 'completed') throw new Error('Competition already finalized.');

    // Need minimum clans
    if (competition.competitors.length < competition.minClans) {
      competition.status = 'cancelled';
      await competition.save();
      logger.info(`Competition ${targetMonth} cancelled — only ${competition.competitors.length} clans (need ${competition.minClans})`);
      return { status: 'cancelled', reason: 'Not enough clans' };
    }

    // Rank clans by total points
    const sorted = [...competition.competitors].sort((a, b) => b.totalPoints - a.totalPoints);
    sorted.forEach((c, i) => {
      const comp = competition.competitors.find(x => x.clan.toString() === c.clan.toString());
      if (comp) comp.rank = i + 1;
    });

    // Prize distribution scales with tier
    const prize = competition.prizeTier;
    let prizeDistribution: { rank: number; percent: number }[];

    if (prize >= 250000) {
      // 20+ clans: 1st 60%, 2nd 26%, 3rd 14%
      prizeDistribution = [{ rank: 1, percent: 60 }, { rank: 2, percent: 26 }, { rank: 3, percent: 14 }];
    } else if (prize >= 150000) {
      // 15-19 clans: 1st 60%, 2nd 27%, 3rd 13%
      prizeDistribution = [{ rank: 1, percent: 60 }, { rank: 2, percent: 27 }, { rank: 3, percent: 13 }];
    } else if (prize >= 100000) {
      // 10-14 clans: 1st 70%, 2nd 30%
      prizeDistribution = [{ rank: 1, percent: 70 }, { rank: 2, percent: 30 }];
    } else {
      // 5-9 clans: winner takes all
      prizeDistribution = [{ rank: 1, percent: 100 }];
    }

    for (const dist of prizeDistribution) {
      const winner = competition.competitors.find(c => c.rank === dist.rank);
      if (winner) {
        winner.prizeAmount = Math.floor(prize * (dist.percent / 100));
        await this.distributeClanPrize(winner.clan.toString(), winner, winner.prizeAmount);
      }
    }

    competition.status = 'completed';
    competition.prizeDistributed = true;
    await competition.save();

    logger.info(`Competition ${targetMonth} finalized. Prize: ₦${prize.toLocaleString()}`);
    return {
      status: 'completed',
      prize,
      results: sorted.slice(0, 10).map(c => ({
        clan: c.clan,
        rank: c.rank,
        totalPoints: c.totalPoints,
        prizeAmount: c.prizeAmount,
      })),
    };
  }

  /**
   * Distribute prize money within a winning clan based on contribution.
   * MVP 40%, #2 25%, #3 15%, #4-5 10% split, rest to treasury.
   */
  private async distributeClanPrize(clanId: string, competitor: any, totalPrize: number): Promise<void> {
    const clan = await Clan.findById(clanId);
    if (!clan) return;

    // Sort members by contribution
    const sortedMembers = [...competitor.memberContributions]
      .filter(m => m.points > 0)
      .sort((a: any, b: any) => b.points - a.points);

    const splits = [
      { rank: 1, percent: 40 },
      { rank: 2, percent: 25 },
      { rank: 3, percent: 15 },
      { rank: 4, percent: 5 },
      { rank: 5, percent: 5 },
    ];

    let distributed = 0;

    for (const split of splits) {
      const member = sortedMembers[split.rank - 1];
      if (!member) continue;

      const amount = Math.floor(totalPrize * (split.percent / 100));
      distributed += amount;

      // Notify the winner
      try {
        const { User } = await import('../models');
        const memberUser = await User.findById(member.user).select('firstName');
        const rankLabel = split.rank === 1 ? 'MVP' : `#${split.rank}`;

        await notificationService.createNotification({
          user: member.user.toString(),
          type: 'achievement',
          title: `🏆 Competition ${rankLabel}!`,
          body: `Your clan [${clan.tag}] won the monthly competition! You earned ₦${amount.toLocaleString()} as ${rankLabel} contributor.`,
          data: { type: 'competition_prize', clanId, amount, rank: split.rank },
        });

        logger.info(`Competition prize: ₦${amount} to ${memberUser?.firstName} (${rankLabel}) in clan ${clan.tag}`);
      } catch (e) {
        logger.warn('Prize notification error:', e);
      }
    }

    // Remainder goes to clan treasury
    const treasuryAmount = totalPrize - distributed;
    if (treasuryAmount > 0) {
      await Clan.findByIdAndUpdate(clanId, { $inc: { treasury: treasuryAmount } });
      logger.info(`Competition treasury bonus: ${treasuryAmount} pts to clan ${clan.tag}`);
    }

    // Notify all clan members about the win
    for (const m of clan.members) {
      try {
        await notificationService.createNotification({
          user: m.user.toString(),
          type: 'system',
          title: `🎉 Clan [${clan.tag}] Won!`,
          body: `Your clan won ₦${totalPrize.toLocaleString()} in the monthly competition! Check the results.`,
          data: { type: 'competition_result', clanId },
        });
      } catch {}
    }
  }

  /**
   * Get competition leaderboard for the current month.
   */
  async getLeaderboard(): Promise<any> {
    const competition = await this.getCurrentCompetition();

    const populated = await ClanCompetition.findById(competition._id)
      .populate('competitors.clan', 'name tag emoji color level members')
      .populate('competitors.memberContributions.user', 'firstName lastName profilePhoto');

    if (!populated) return { competition: null, leaderboard: [] };

    const leaderboard = [...populated.competitors]
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((c, i) => ({
        rank: c.rank || i + 1,
        clan: c.clan,
        totalPoints: c.totalPoints,
        gamesPlayed: c.gamesPlayed,
        studySessions: c.studySessions,
        prizeAmount: c.prizeAmount,
        topContributors: [...c.memberContributions]
          .sort((a: any, b: any) => b.points - a.points)
          .slice(0, 3)
          .map(m => ({
            user: m.user,
            points: m.points,
            gamesWon: m.gamesWon,
            studyWon: m.studyWon,
          })),
      }));

    return {
      month: populated.month,
      status: populated.status,
      prizeTier: populated.prizeTier,
      competitorCount: populated.competitors.length,
      minClans: populated.minClans,
      minMembers: populated.minMembers,
      startDate: populated.startDate,
      endDate: populated.endDate,
      leaderboard,
    };
  }

  private calculatePrizeTier(clanCount: number): number {
    if (clanCount >= 20) return 250000;
    if (clanCount >= 15) return 150000;
    if (clanCount >= 10) return 100000;
    return 50000;
  }
}

export default new ClanCompetitionService();
