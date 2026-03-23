"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Clan_1 = require("../models/Clan");
const notification_service_1 = __importDefault(require("./notification.service"));
const points_service_1 = __importDefault(require("./points.service"));
const logger_1 = __importDefault(require("../utils/logger"));
class ClanService {
    // ─── Clan CRUD ───────────────────────────────────────────────────────────
    /**
     * Create a new clan. Leader must spend 500 points.
     */
    async createClan(userId, data) {
        try {
            // Check user is not already in a clan
            const existing = await Clan_1.Clan.findOne({ 'members.user': userId });
            if (existing) {
                throw new Error('You are already in a clan. Leave your current clan first.');
            }
            // Deduct creation cost
            await points_service_1.default.deductPoints({
                userId,
                amount: 500,
                type: 'spent',
                reason: 'Clan creation cost',
                metadata: { action: 'clan_create' },
            });
            const userOid = new mongoose_1.default.Types.ObjectId(userId);
            const clan = await Clan_1.Clan.create({
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
                        role: 'leader',
                        joinedAt: new Date(),
                        pointsContributed: 0,
                    },
                ],
            });
            logger_1.default.info(`Clan created: ${clan.name} [${clan.tag}] by user ${userId}`);
            return clan;
        }
        catch (error) {
            logger_1.default.error('createClan error:', error);
            throw error;
        }
    }
    /**
     * Get a single clan with populated members.
     */
    async getClan(clanId) {
        try {
            const clan = await Clan_1.Clan.findById(clanId)
                .populate('leader', 'firstName lastName profilePhoto')
                .populate('coLeaders', 'firstName lastName profilePhoto')
                .populate('members.user', 'firstName lastName profilePhoto');
            return clan;
        }
        catch (error) {
            logger_1.default.error('getClan error:', error);
            throw error;
        }
    }
    /**
     * List clans for discovery with pagination and search.
     */
    async getClans(page = 1, limit = 20, search, sortBy = 'totalPoints') {
        try {
            const query = {};
            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { tag: { $regex: search, $options: 'i' } },
                ];
            }
            const sortOptions = {
                totalPoints: { totalPoints: -1 },
                weeklyPoints: { weeklyPoints: -1 },
                level: { level: -1 },
                members: { level: -1 },
                newest: { createdAt: -1 },
            };
            const sort = sortOptions[sortBy] || sortOptions.totalPoints;
            const [clans, total] = await Promise.all([
                Clan_1.Clan.find(query)
                    .populate('leader', 'firstName lastName profilePhoto')
                    .sort(sort)
                    .skip((page - 1) * limit)
                    .limit(limit),
                Clan_1.Clan.countDocuments(query),
            ]);
            return { clans, total, page, pages: Math.ceil(total / limit) };
        }
        catch (error) {
            logger_1.default.error('getClans error:', error);
            throw error;
        }
    }
    /**
     * Clan leaderboard by period.
     */
    async getLeaderboard(period = 'allTime', limit = 50) {
        try {
            const sortField = period === 'weekly' ? 'weeklyPoints' : period === 'monthly' ? 'monthlyPoints' : 'totalPoints';
            return Clan_1.Clan.find()
                .populate('leader', 'firstName lastName profilePhoto')
                .sort({ [sortField]: -1 })
                .limit(limit);
        }
        catch (error) {
            logger_1.default.error('getLeaderboard error:', error);
            throw error;
        }
    }
    /**
     * Join an open clan.
     */
    async joinClan(userId, clanId) {
        try {
            const existing = await Clan_1.Clan.findOne({ 'members.user': userId });
            if (existing) {
                throw new Error('You are already in a clan.');
            }
            const clan = await Clan_1.Clan.findById(clanId);
            if (!clan)
                throw new Error('Clan not found.');
            if (!clan.isOpen)
                throw new Error('This clan is invite-only.');
            if (clan.members.length >= clan.maxMembers)
                throw new Error('Clan is full.');
            clan.members.push({
                user: new mongoose_1.default.Types.ObjectId(userId),
                role: 'member',
                joinedAt: new Date(),
                pointsContributed: 0,
            });
            await clan.save();
            logger_1.default.info(`User ${userId} joined clan ${clan.name}`);
            // Notify leader
            try {
                await notification_service_1.default.createNotification({
                    user: clan.leader.toString(),
                    type: 'system',
                    title: 'New Clan Member',
                    body: `A new member joined your clan [${clan.tag}]!`,
                    data: { clanId: clan._id.toString() },
                });
            }
            catch (e) {
                logger_1.default.warn('Clan join notification error:', e);
            }
            return clan;
        }
        catch (error) {
            logger_1.default.error('joinClan error:', error);
            throw error;
        }
    }
    /**
     * Join a clan by invite code.
     */
    async joinByInviteCode(userId, inviteCode) {
        try {
            const existing = await Clan_1.Clan.findOne({ 'members.user': userId });
            if (existing) {
                throw new Error('You are already in a clan.');
            }
            const clan = await Clan_1.Clan.findOne({ inviteCode: inviteCode.toUpperCase() });
            if (!clan)
                throw new Error('Invalid invite code.');
            if (clan.members.length >= clan.maxMembers)
                throw new Error('Clan is full.');
            clan.members.push({
                user: new mongoose_1.default.Types.ObjectId(userId),
                role: 'member',
                joinedAt: new Date(),
                pointsContributed: 0,
            });
            await clan.save();
            logger_1.default.info(`User ${userId} joined clan ${clan.name} via invite code`);
            try {
                await notification_service_1.default.createNotification({
                    user: clan.leader.toString(),
                    type: 'system',
                    title: 'New Clan Member',
                    body: `A new member joined your clan [${clan.tag}] via invite code!`,
                    data: { clanId: clan._id.toString() },
                });
            }
            catch (e) {
                logger_1.default.warn('Clan join notification error:', e);
            }
            return clan;
        }
        catch (error) {
            logger_1.default.error('joinByInviteCode error:', error);
            throw error;
        }
    }
    /**
     * Leave a clan. If leader, must transfer leadership or disband.
     */
    async leaveClan(userId, clanId) {
        try {
            const clan = await Clan_1.Clan.findById(clanId);
            if (!clan)
                throw new Error('Clan not found.');
            const memberIndex = clan.members.findIndex((m) => m.user.toString() === userId);
            if (memberIndex === -1)
                throw new Error('You are not in this clan.');
            const isLeader = clan.leader.toString() === userId;
            if (isLeader) {
                // Try to transfer leadership to a co-leader, then any member
                const successor = clan.members.find((m) => m.user.toString() !== userId && m.role === 'co-leader') ||
                    clan.members.find((m) => m.user.toString() !== userId);
                if (!successor) {
                    // Last member — disband
                    await Clan_1.Clan.findByIdAndDelete(clanId);
                    logger_1.default.info(`Clan ${clan.name} disbanded (last member left)`);
                    return { disbanded: true };
                }
                successor.role = 'leader';
                clan.leader = successor.user;
                clan.coLeaders = clan.coLeaders.filter((id) => id.toString() !== successor.user.toString());
            }
            clan.members.splice(memberIndex, 1);
            clan.coLeaders = clan.coLeaders.filter((id) => id.toString() !== userId);
            await clan.save();
            logger_1.default.info(`User ${userId} left clan ${clan.name}`);
            return { disbanded: false };
        }
        catch (error) {
            logger_1.default.error('leaveClan error:', error);
            throw error;
        }
    }
    /**
     * Kick a member (leader/co-leader only).
     */
    async kickMember(leaderId, clanId, targetUserId) {
        try {
            const clan = await Clan_1.Clan.findById(clanId);
            if (!clan)
                throw new Error('Clan not found.');
            const kicker = clan.members.find((m) => m.user.toString() === leaderId);
            if (!kicker || (kicker.role !== 'leader' && kicker.role !== 'co-leader')) {
                throw new Error('Only leaders and co-leaders can kick members.');
            }
            const target = clan.members.find((m) => m.user.toString() === targetUserId);
            if (!target)
                throw new Error('User is not in this clan.');
            if (target.role === 'leader')
                throw new Error('Cannot kick the clan leader.');
            if (target.role === 'co-leader' && kicker.role !== 'leader') {
                throw new Error('Only the leader can kick co-leaders.');
            }
            clan.members = clan.members.filter((m) => m.user.toString() !== targetUserId);
            clan.coLeaders = clan.coLeaders.filter((id) => id.toString() !== targetUserId);
            await clan.save();
            logger_1.default.info(`User ${targetUserId} kicked from clan ${clan.name} by ${leaderId}`);
            try {
                await notification_service_1.default.createNotification({
                    user: targetUserId,
                    type: 'system',
                    title: 'Removed from Clan',
                    body: `You have been removed from clan [${clan.tag}].`,
                    data: { clanId: clan._id.toString() },
                });
            }
            catch (e) {
                logger_1.default.warn('Kick notification error:', e);
            }
            return clan;
        }
        catch (error) {
            logger_1.default.error('kickMember error:', error);
            throw error;
        }
    }
    /**
     * Promote a member to co-leader (leader only).
     */
    async promoteMember(leaderId, clanId, targetUserId, role) {
        try {
            const clan = await Clan_1.Clan.findById(clanId);
            if (!clan)
                throw new Error('Clan not found.');
            if (clan.leader.toString() !== leaderId) {
                throw new Error('Only the clan leader can promote members.');
            }
            const member = clan.members.find((m) => m.user.toString() === targetUserId);
            if (!member)
                throw new Error('User is not in this clan.');
            if (member.role === 'leader')
                throw new Error('Cannot change the leader role this way.');
            member.role = role;
            if (role === 'co-leader') {
                if (!clan.coLeaders.some((id) => id.toString() === targetUserId)) {
                    clan.coLeaders.push(new mongoose_1.default.Types.ObjectId(targetUserId));
                }
            }
            else {
                clan.coLeaders = clan.coLeaders.filter((id) => id.toString() !== targetUserId);
            }
            await clan.save();
            logger_1.default.info(`User ${targetUserId} promoted to ${role} in clan ${clan.name}`);
            return clan;
        }
        catch (error) {
            logger_1.default.error('promoteMember error:', error);
            throw error;
        }
    }
    /**
     * Update clan settings (leader only).
     */
    async updateClan(userId, clanId, updates) {
        try {
            const clan = await Clan_1.Clan.findById(clanId);
            if (!clan)
                throw new Error('Clan not found.');
            if (clan.leader.toString() !== userId) {
                throw new Error('Only the clan leader can update settings.');
            }
            if (updates.name !== undefined)
                clan.name = updates.name;
            if (updates.description !== undefined)
                clan.description = updates.description;
            if (updates.emoji !== undefined)
                clan.emoji = updates.emoji;
            if (updates.color !== undefined)
                clan.color = updates.color;
            if (updates.isOpen !== undefined)
                clan.isOpen = updates.isOpen;
            await clan.save();
            logger_1.default.info(`Clan ${clan.tag} updated by ${userId}`);
            return clan;
        }
        catch (error) {
            logger_1.default.error('updateClan error:', error);
            throw error;
        }
    }
    /**
     * Disband (delete) a clan (leader only).
     */
    async disbandClan(userId, clanId) {
        try {
            const clan = await Clan_1.Clan.findById(clanId);
            if (!clan)
                throw new Error('Clan not found.');
            if (clan.leader.toString() !== userId) {
                throw new Error('Only the clan leader can disband the clan.');
            }
            // Cancel active wars
            await Clan_1.ClanWar.updateMany({ $or: [{ challenger: clanId }, { defender: clanId }], status: { $in: ['pending', 'accepted', 'in_progress'] } }, { $set: { status: 'expired' } });
            await Clan_1.Clan.findByIdAndDelete(clanId);
            logger_1.default.info(`Clan ${clan.name} [${clan.tag}] disbanded by leader ${userId}`);
        }
        catch (error) {
            logger_1.default.error('disbandClan error:', error);
            throw error;
        }
    }
    /**
     * Get the clan for a specific user.
     */
    async getMyClan(userId) {
        try {
            return Clan_1.Clan.findOne({ 'members.user': userId })
                .populate('leader', 'firstName lastName profilePhoto')
                .populate('coLeaders', 'firstName lastName profilePhoto')
                .populate('members.user', 'firstName lastName profilePhoto');
        }
        catch (error) {
            logger_1.default.error('getMyClan error:', error);
            throw error;
        }
    }
    /**
     * Add points to a clan from a member's activity.
     */
    async addClanPoints(clanId, userId, points, reason) {
        try {
            await Clan_1.Clan.findOneAndUpdate({ _id: clanId, 'members.user': userId }, {
                $inc: {
                    totalPoints: points,
                    weeklyPoints: points,
                    monthlyPoints: points,
                    'members.$.pointsContributed': points,
                },
            });
            // Level up check: every 1000 total points = 1 level
            const clan = await Clan_1.Clan.findById(clanId);
            if (clan) {
                const newLevel = Math.floor(clan.totalPoints / 1000) + 1;
                if (newLevel > clan.level) {
                    clan.level = newLevel;
                    clan.maxMembers = 10 + (newLevel - 1) * 5; // +5 per level
                    await clan.save();
                    logger_1.default.info(`Clan ${clan.tag} leveled up to ${newLevel}`);
                }
            }
        }
        catch (error) {
            logger_1.default.error('addClanPoints error:', error);
        }
    }
    /**
     * Track a member's activity and add clan points automatically.
     */
    async trackMemberActivity(userId, action, points) {
        try {
            const clan = await Clan_1.Clan.findOne({ 'members.user': userId });
            if (!clan)
                return; // user not in a clan
            await this.addClanPoints(clan._id.toString(), userId, points, action);
        }
        catch (error) {
            logger_1.default.warn('trackMemberActivity error:', error);
        }
    }
    /**
     * Reset weekly points. Called by cron. Award top clans before reset.
     */
    async resetWeeklyPoints() {
        try {
            // Award top 3 weekly clans
            const topClans = await Clan_1.Clan.find().sort({ weeklyPoints: -1 }).limit(3);
            const rewards = [500, 300, 100];
            for (let i = 0; i < topClans.length; i++) {
                const clan = topClans[i];
                if (clan.weeklyPoints <= 0)
                    continue;
                clan.totalPoints += rewards[i];
                if (i === 0 && !clan.badges.includes('weekly_champion')) {
                    clan.badges.push('weekly_champion');
                }
                await clan.save();
                // Notify leader
                try {
                    await notification_service_1.default.createNotification({
                        user: clan.leader.toString(),
                        type: 'achievement',
                        title: 'Weekly Clan Reward!',
                        body: `Your clan [${clan.tag}] placed #${i + 1} this week and earned ${rewards[i]} bonus points!`,
                        data: { clanId: clan._id.toString() },
                    });
                }
                catch (e) {
                    logger_1.default.warn('Weekly reset notification error:', e);
                }
            }
            await Clan_1.Clan.updateMany({}, { $set: { weeklyPoints: 0 } });
            logger_1.default.info('Weekly clan points reset completed');
        }
        catch (error) {
            logger_1.default.error('resetWeeklyPoints error:', error);
        }
    }
    /**
     * Reset monthly points. Called by cron. Award top clans before reset.
     */
    async resetMonthlyPoints() {
        try {
            const topClans = await Clan_1.Clan.find().sort({ monthlyPoints: -1 }).limit(3);
            const rewards = [1500, 800, 400];
            for (let i = 0; i < topClans.length; i++) {
                const clan = topClans[i];
                if (clan.monthlyPoints <= 0)
                    continue;
                clan.totalPoints += rewards[i];
                if (i === 0 && !clan.badges.includes('monthly_champion')) {
                    clan.badges.push('monthly_champion');
                }
                await clan.save();
                try {
                    await notification_service_1.default.createNotification({
                        user: clan.leader.toString(),
                        type: 'achievement',
                        title: 'Monthly Clan Reward!',
                        body: `Your clan [${clan.tag}] placed #${i + 1} this month and earned ${rewards[i]} bonus points!`,
                        data: { clanId: clan._id.toString() },
                    });
                }
                catch (e) {
                    logger_1.default.warn('Monthly reset notification error:', e);
                }
            }
            await Clan_1.Clan.updateMany({}, { $set: { monthlyPoints: 0 } });
            logger_1.default.info('Monthly clan points reset completed');
        }
        catch (error) {
            logger_1.default.error('resetMonthlyPoints error:', error);
        }
    }
    // ─── Clan Wars ───────────────────────────────────────────────────────────
    /**
     * Start a war challenge between two clans.
     */
    async startWar(challengerClanId, defenderClanId, warType, pointsStake) {
        try {
            if (challengerClanId === defenderClanId) {
                throw new Error('A clan cannot war against itself.');
            }
            const [challenger, defender] = await Promise.all([
                Clan_1.Clan.findById(challengerClanId),
                Clan_1.Clan.findById(defenderClanId),
            ]);
            if (!challenger)
                throw new Error('Challenger clan not found.');
            if (!defender)
                throw new Error('Defender clan not found.');
            // Check no active war between these clans
            const activeWar = await Clan_1.ClanWar.findOne({
                $or: [
                    { challenger: challengerClanId, defender: defenderClanId },
                    { challenger: defenderClanId, defender: challengerClanId },
                ],
                status: { $in: ['pending', 'accepted', 'in_progress'] },
            });
            if (activeWar)
                throw new Error('There is already an active war between these clans.');
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24); // 24h to accept
            const war = await Clan_1.ClanWar.create({
                challenger: challengerClanId,
                defender: defenderClanId,
                warType,
                pointsStake,
                expiresAt,
            });
            logger_1.default.info(`Clan war created: [${challenger.tag}] vs [${defender.tag}]`);
            // Notify defender clan leader
            try {
                await notification_service_1.default.createNotification({
                    user: defender.leader.toString(),
                    type: 'system',
                    title: 'Clan War Challenge!',
                    body: `Clan [${challenger.tag}] has challenged your clan to a war! ${pointsStake} points at stake.`,
                    data: { warId: war._id.toString(), clanId: defenderClanId },
                });
            }
            catch (e) {
                logger_1.default.warn('War challenge notification error:', e);
            }
            return war;
        }
        catch (error) {
            logger_1.default.error('startWar error:', error);
            throw error;
        }
    }
    /**
     * Accept or decline a war challenge.
     */
    async respondToWar(clanId, warId, accept) {
        try {
            const war = await Clan_1.ClanWar.findById(warId);
            if (!war)
                throw new Error('War not found.');
            if (war.defender.toString() !== clanId)
                throw new Error('Only the defender clan can respond.');
            if (war.status !== 'pending')
                throw new Error('War is no longer pending.');
            if (war.expiresAt < new Date()) {
                war.status = 'expired';
                await war.save();
                throw new Error('War challenge has expired.');
            }
            if (accept) {
                war.status = 'accepted';
                logger_1.default.info(`Clan war ${warId} accepted`);
                // Notify challenger
                const challenger = await Clan_1.Clan.findById(war.challenger);
                if (challenger) {
                    try {
                        await notification_service_1.default.createNotification({
                            user: challenger.leader.toString(),
                            type: 'system',
                            title: 'War Accepted!',
                            body: `Your clan war challenge has been accepted! Assign your players.`,
                            data: { warId: war._id.toString(), clanId: war.challenger.toString() },
                        });
                    }
                    catch (e) {
                        logger_1.default.warn('War accept notification error:', e);
                    }
                }
            }
            else {
                war.status = 'declined';
                logger_1.default.info(`Clan war ${warId} declined`);
            }
            await war.save();
            return war;
        }
        catch (error) {
            logger_1.default.error('respondToWar error:', error);
            throw error;
        }
    }
    /**
     * Assign players from a clan to war matchups.
     */
    async assignWarPlayers(clanId, warId, playerIds) {
        try {
            const war = await Clan_1.ClanWar.findById(warId);
            if (!war)
                throw new Error('War not found.');
            if (war.status !== 'accepted' && war.status !== 'in_progress') {
                throw new Error('War must be accepted before assigning players.');
            }
            const clan = await Clan_1.Clan.findById(clanId);
            if (!clan)
                throw new Error('Clan not found.');
            // Verify all players are clan members
            for (const pid of playerIds) {
                if (!clan.members.some((m) => m.user.toString() === pid)) {
                    throw new Error(`Player ${pid} is not a member of this clan.`);
                }
            }
            const isChallenger = war.challenger.toString() === clanId;
            const isDefender = war.defender.toString() === clanId;
            if (!isChallenger && !isDefender)
                throw new Error('Clan is not part of this war.');
            // Build or update matches
            const gameTypes = ['speed_math', 'word_scramble', 'emoji_guess', 'memory_match', 'trivia'];
            if (war.matches.length === 0) {
                // First side to assign — create placeholder matches
                const matchCount = Math.min(playerIds.length, 5);
                for (let i = 0; i < matchCount; i++) {
                    const pid = new mongoose_1.default.Types.ObjectId(playerIds[i]);
                    war.matches.push({
                        challengerPlayer: isChallenger ? pid : pid,
                        defenderPlayer: isDefender ? pid : pid,
                        gameType: gameTypes[i % gameTypes.length],
                        challengerScore: 0,
                        defenderScore: 0,
                        winner: null,
                        status: 'pending',
                    });
                }
            }
            else {
                // Second side — fill in their players
                for (let i = 0; i < Math.min(playerIds.length, war.matches.length); i++) {
                    const pid = new mongoose_1.default.Types.ObjectId(playerIds[i]);
                    if (isChallenger) {
                        war.matches[i].challengerPlayer = pid;
                    }
                    else {
                        war.matches[i].defenderPlayer = pid;
                    }
                }
            }
            // If both sides have assigned, start the war
            const challengerAssigned = war.matches.length > 0;
            const defenderAssigned = war.matches.length > 0;
            if (challengerAssigned && defenderAssigned && war.status === 'accepted') {
                war.status = 'in_progress';
                war.startedAt = new Date();
                // Extend expiry for gameplay
                const newExpiry = new Date();
                newExpiry.setHours(newExpiry.getHours() + 48);
                war.expiresAt = newExpiry;
            }
            await war.save();
            logger_1.default.info(`Players assigned for war ${warId} by clan ${clanId}`);
            return war;
        }
        catch (error) {
            logger_1.default.error('assignWarPlayers error:', error);
            throw error;
        }
    }
    /**
     * Submit a result for an individual war match.
     */
    async submitWarMatchResult(warId, matchIndex, winningSide, scores) {
        try {
            const war = await Clan_1.ClanWar.findById(warId);
            if (!war)
                throw new Error('War not found.');
            if (war.status !== 'in_progress')
                throw new Error('War is not in progress.');
            if (matchIndex < 0 || matchIndex >= war.matches.length)
                throw new Error('Invalid match index.');
            const match = war.matches[matchIndex];
            if (match.status === 'completed')
                throw new Error('Match already completed.');
            match.challengerScore = scores.challengerScore;
            match.defenderScore = scores.defenderScore;
            match.winner = winningSide;
            match.status = 'completed';
            match.completedAt = new Date();
            // Update aggregate scores
            if (winningSide === 'challenger') {
                war.challengerScore += 1;
            }
            else if (winningSide === 'defender') {
                war.defenderScore += 1;
            }
            await war.save();
            logger_1.default.info(`War ${warId} match ${matchIndex} completed: ${winningSide}`);
            // Check if war is done
            await this.checkWarCompletion(warId);
            return war;
        }
        catch (error) {
            logger_1.default.error('submitWarMatchResult error:', error);
            throw error;
        }
    }
    /**
     * Check if all matches are complete and determine the war winner.
     */
    async checkWarCompletion(warId) {
        try {
            const war = await Clan_1.ClanWar.findById(warId);
            if (!war || war.status !== 'in_progress')
                return war;
            const allDone = war.matches.every((m) => m.status === 'completed');
            if (!allDone)
                return war;
            // Determine winner
            if (war.challengerScore > war.defenderScore) {
                war.winner = 'challenger';
            }
            else if (war.defenderScore > war.challengerScore) {
                war.winner = 'defender';
            }
            else {
                war.winner = 'tie';
            }
            war.status = 'completed';
            war.completedAt = new Date();
            await war.save();
            // Award points
            const [challengerClan, defenderClan] = await Promise.all([
                Clan_1.Clan.findById(war.challenger),
                Clan_1.Clan.findById(war.defender),
            ]);
            if (challengerClan && defenderClan) {
                if (war.winner === 'challenger') {
                    challengerClan.warsWon += 1;
                    defenderClan.warsLost += 1;
                    challengerClan.totalPoints += war.pointsStake;
                    challengerClan.weeklyPoints += war.pointsStake;
                    challengerClan.monthlyPoints += war.pointsStake;
                }
                else if (war.winner === 'defender') {
                    defenderClan.warsWon += 1;
                    challengerClan.warsLost += 1;
                    defenderClan.totalPoints += war.pointsStake;
                    defenderClan.weeklyPoints += war.pointsStake;
                    defenderClan.monthlyPoints += war.pointsStake;
                }
                else {
                    challengerClan.warsTied += 1;
                    defenderClan.warsTied += 1;
                    // Split stake on tie
                    const half = Math.floor(war.pointsStake / 2);
                    challengerClan.totalPoints += half;
                    defenderClan.totalPoints += half;
                }
                await Promise.all([challengerClan.save(), defenderClan.save()]);
                // Notify both clans
                const winnerTag = war.winner === 'challenger'
                    ? challengerClan.tag
                    : war.winner === 'defender'
                        ? defenderClan.tag
                        : null;
                const resultText = winnerTag ? `[${winnerTag}] won!` : "It's a tie!";
                for (const clan of [challengerClan, defenderClan]) {
                    for (const member of clan.members) {
                        try {
                            await notification_service_1.default.createNotification({
                                user: member.user.toString(),
                                type: 'system',
                                title: 'Clan War Ended!',
                                body: `The war between [${challengerClan.tag}] and [${defenderClan.tag}] is over. ${resultText}`,
                                data: { warId: war._id.toString(), clanId: clan._id.toString() },
                            });
                        }
                        catch (e) {
                            // Silently skip individual notification failures
                        }
                    }
                }
                logger_1.default.info(`Clan war ${warId} completed. Winner: ${war.winner}`);
            }
            return war;
        }
        catch (error) {
            logger_1.default.error('checkWarCompletion error:', error);
            throw error;
        }
    }
    /**
     * Get active/pending wars for a clan.
     */
    async getActiveWars(clanId) {
        try {
            return Clan_1.ClanWar.find({
                $or: [{ challenger: clanId }, { defender: clanId }],
                status: { $in: ['pending', 'accepted', 'in_progress'] },
            })
                .populate('challenger', 'name tag emoji color')
                .populate('defender', 'name tag emoji color')
                .sort({ createdAt: -1 });
        }
        catch (error) {
            logger_1.default.error('getActiveWars error:', error);
            throw error;
        }
    }
    /**
     * Get war history for a clan.
     */
    async getWarHistory(clanId) {
        try {
            return Clan_1.ClanWar.find({
                $or: [{ challenger: clanId }, { defender: clanId }],
                status: { $in: ['completed', 'declined', 'expired'] },
            })
                .populate('challenger', 'name tag emoji color')
                .populate('defender', 'name tag emoji color')
                .sort({ completedAt: -1, createdAt: -1 })
                .limit(50);
        }
        catch (error) {
            logger_1.default.error('getWarHistory error:', error);
            throw error;
        }
    }
    /**
     * Get a single war with details.
     */
    async getWar(warId) {
        try {
            return Clan_1.ClanWar.findById(warId)
                .populate('challenger', 'name tag emoji color leader members')
                .populate('defender', 'name tag emoji color leader members')
                .populate('matches.challengerPlayer', 'firstName lastName profilePhoto')
                .populate('matches.defenderPlayer', 'firstName lastName profilePhoto');
        }
        catch (error) {
            logger_1.default.error('getWar error:', error);
            throw error;
        }
    }
}
exports.default = new ClanService();
//# sourceMappingURL=clan.service.js.map