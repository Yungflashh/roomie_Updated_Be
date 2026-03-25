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
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const clan_service_1 = __importDefault(require("../services/clan.service"));
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
// ─── Clan Discovery & Leaderboard ──────────────────────────────────────────
/**
 * GET /api/v1/clans
 * List clans for discovery
 */
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 20, search, sortBy } = req.query;
        const result = await clan_service_1.default.getClans(Number(page), Number(limit), search, sortBy);
        res.json({ success: true, data: result });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch clans';
        res.status(500).json({ success: false, message });
    }
});
/**
 * GET /api/v1/clans/leaderboard
 * Clan leaderboard
 */
router.get('/leaderboard', async (req, res) => {
    try {
        const { period = 'allTime', limit = 50 } = req.query;
        const clans = await clan_service_1.default.getLeaderboard(period, Number(limit));
        res.json({ success: true, data: clans });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch leaderboard';
        res.status(500).json({ success: false, message });
    }
});
/**
 * GET /api/v1/clans/my-clan
 * Get the current user's clan
 */
router.get('/my-clan', async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const clan = await clan_service_1.default.getMyClan(userId);
        res.json({ success: true, data: clan });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch your clan';
        res.status(500).json({ success: false, message });
    }
});
// ─── Clan CRUD ─────────────────────────────────────────────────────────────
/**
 * POST /api/v1/clans
 * Create a new clan
 */
router.post('/', async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const { name, tag, description, emoji, color, isOpen } = req.body;
        if (!name || !tag) {
            res.status(400).json({ success: false, message: 'Name and tag are required' });
            return;
        }
        if (tag.length < 3 || tag.length > 6) {
            res.status(400).json({ success: false, message: 'Tag must be 3-6 characters' });
            return;
        }
        const clan = await clan_service_1.default.createClan(userId, { name, tag, description, emoji, color, isOpen });
        res.status(201).json({ success: true, data: clan });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create clan';
        const status = message.includes('already') || message.includes('Insufficient') ? 400 : 500;
        res.status(status).json({ success: false, message });
    }
});
/**
 * GET /api/v1/clans/:clanId
 * Get clan detail
 */
router.get('/:clanId', async (req, res) => {
    try {
        const clan = await clan_service_1.default.getClan(req.params.clanId);
        if (!clan) {
            res.status(404).json({ success: false, message: 'Clan not found' });
            return;
        }
        res.json({ success: true, data: clan });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch clan';
        res.status(500).json({ success: false, message });
    }
});
/**
 * PUT /api/v1/clans/:clanId
 * Update clan settings
 */
router.put('/:clanId', async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const { name, description, emoji, color, isOpen } = req.body;
        const clan = await clan_service_1.default.updateClan(userId, req.params.clanId, { name, description, emoji, color, isOpen });
        res.json({ success: true, data: clan });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update clan';
        const status = message.includes('Only') ? 403 : 500;
        res.status(status).json({ success: false, message });
    }
});
/**
 * DELETE /api/v1/clans/:clanId
 * Disband a clan
 */
router.delete('/:clanId', async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        await clan_service_1.default.disbandClan(userId, req.params.clanId);
        res.json({ success: true, message: 'Clan disbanded' });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to disband clan';
        const status = message.includes('Only') ? 403 : 500;
        res.status(status).json({ success: false, message });
    }
});
// ─── Membership ────────────────────────────────────────────────────────────
/**
 * POST /api/v1/clans/:clanId/join
 * Join an open clan
 */
router.post('/:clanId/join', async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const clan = await clan_service_1.default.joinClan(userId, req.params.clanId);
        res.json({ success: true, data: clan });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to join clan';
        const status = message.includes('already') || message.includes('full') || message.includes('invite') ? 400 : 500;
        res.status(status).json({ success: false, message });
    }
});
/**
 * POST /api/v1/clans/join-by-code
 * Join clan by invite code
 */
router.post('/join-by-code', async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const { inviteCode } = req.body;
        if (!inviteCode) {
            res.status(400).json({ success: false, message: 'Invite code is required' });
            return;
        }
        const clan = await clan_service_1.default.joinByInviteCode(userId, inviteCode);
        res.json({ success: true, data: clan });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to join clan';
        const status = message.includes('Invalid') || message.includes('already') || message.includes('full') ? 400 : 500;
        res.status(status).json({ success: false, message });
    }
});
/**
 * POST /api/v1/clans/:clanId/leave
 * Leave a clan
 */
router.post('/:clanId/leave', async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const result = await clan_service_1.default.leaveClan(userId, req.params.clanId);
        res.json({ success: true, data: result });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to leave clan';
        res.status(500).json({ success: false, message });
    }
});
/**
 * POST /api/v1/clans/:clanId/kick
 * Kick a member
 */
router.post('/:clanId/kick', async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const { targetUserId } = req.body;
        if (!targetUserId) {
            res.status(400).json({ success: false, message: 'targetUserId is required' });
            return;
        }
        const clan = await clan_service_1.default.kickMember(userId, req.params.clanId, targetUserId);
        res.json({ success: true, data: clan });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to kick member';
        const status = message.includes('Only') || message.includes('Cannot') ? 403 : 500;
        res.status(status).json({ success: false, message });
    }
});
/**
 * POST /api/v1/clans/:clanId/promote
 * Promote a member
 */
router.post('/:clanId/promote', async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const { targetUserId, role } = req.body;
        if (!targetUserId || !role) {
            res.status(400).json({ success: false, message: 'targetUserId and role are required' });
            return;
        }
        if (role !== 'co-leader' && role !== 'member') {
            res.status(400).json({ success: false, message: 'Role must be co-leader or member' });
            return;
        }
        const clan = await clan_service_1.default.promoteMember(userId, req.params.clanId, targetUserId, role);
        res.json({ success: true, data: clan });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to promote member';
        const status = message.includes('Only') ? 403 : 500;
        res.status(status).json({ success: false, message });
    }
});
// ─── Achievements ─────────────────────────────────────────────────────────
router.get('/:clanId/achievements', async (req, res) => {
    try {
        const { Clan: ClanModel } = await Promise.resolve().then(() => __importStar(require('../models/Clan')));
        const clan = await ClanModel.findById(req.params.clanId);
        if (!clan) {
            res.status(404).json({ success: false, message: 'Clan not found' });
            return;
        }
        const achievements = clan_service_1.default.getAchievementsWithStatus(clan);
        res.json({ success: true, data: achievements });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch achievements';
        res.status(500).json({ success: false, message });
    }
});
// ─── Member Leaderboard ───────────────────────────────────────────────────
router.get('/:clanId/leaderboard/members', async (req, res) => {
    try {
        const clan = await clan_service_1.default.getClan(req.params.clanId);
        if (!clan) {
            res.status(404).json({ success: false, message: 'Clan not found' });
            return;
        }
        const leaderboard = clan_service_1.default.getMemberLeaderboard(clan);
        res.json({ success: true, data: leaderboard });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch leaderboard';
        res.status(500).json({ success: false, message });
    }
});
// ─── Head-to-Head ─────────────────────────────────────────────────────────
router.get('/:clanId/h2h/:opponentClanId', async (req, res) => {
    try {
        const result = await clan_service_1.default.getHeadToHead(req.params.clanId, req.params.opponentClanId);
        res.json({ success: true, data: result });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch head-to-head';
        res.status(500).json({ success: false, message });
    }
});
// ─── Announcements ────────────────────────────────────────────────────────
router.put('/:clanId/announcement', async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const { text } = req.body;
        const announcement = await clan_service_1.default.setAnnouncement(req.params.clanId, userId, text || '');
        res.json({ success: true, data: { announcement } });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to set announcement';
        const status = message.includes('Only') ? 403 : 500;
        res.status(status).json({ success: false, message });
    }
});
/**
 * POST /api/v1/clans/:clanId/announcement/send
 * Send announcement as notification to all or selected members
 */
router.post('/:clanId/announcement/send', async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const { title, body, memberIds } = req.body;
        if (!title || !body) {
            res.status(400).json({ success: false, message: 'Title and body are required' });
            return;
        }
        const { Clan: ClanModel } = await Promise.resolve().then(() => __importStar(require('../models/Clan')));
        const clan = await ClanModel.findById(req.params.clanId);
        if (!clan) {
            res.status(404).json({ success: false, message: 'Clan not found' });
            return;
        }
        const member = clan.members.find(m => m.user.toString() === userId);
        if (!member || (member.role !== 'leader' && member.role !== 'co-leader')) {
            res.status(403).json({ success: false, message: 'Only leaders and co-leaders can send announcements' });
            return;
        }
        const notificationService = (await Promise.resolve().then(() => __importStar(require('../services/notification.service')))).default;
        const targets = memberIds && Array.isArray(memberIds) && memberIds.length > 0
            ? clan.members.filter(m => memberIds.includes(m.user.toString()))
            : clan.members;
        let sent = 0;
        for (const m of targets) {
            try {
                await notificationService.createNotification({
                    user: m.user.toString(),
                    type: 'system',
                    title,
                    body,
                    data: { clanId: clan._id.toString(), type: 'clan_announcement' },
                });
                sent++;
            }
            catch { }
        }
        await clan_service_1.default.logActivity(clan._id.toString(), 'announcement', userId, `sent announcement to ${sent} members`);
        res.json({ success: true, data: { sent, total: targets.length } });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to send announcement';
        res.status(500).json({ success: false, message });
    }
});
// ─── Season Leaderboard ──────────────────────────────────────────────────
router.get('/season/leaderboard', async (req, res) => {
    try {
        const clans = await clan_service_1.default.getSeasonLeaderboard(50);
        res.json({ success: true, data: clans });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch season leaderboard';
        res.status(500).json({ success: false, message });
    }
});
// ─── Activity Feed ─────────────────────────────────────────────────────────
/**
 * GET /api/v1/clans/:clanId/activity
 * Get clan activity feed
 */
router.get('/:clanId/activity', async (req, res) => {
    try {
        const activity = await clan_service_1.default.getActivityLog(req.params.clanId);
        res.json({ success: true, data: activity });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch activity';
        res.status(500).json({ success: false, message });
    }
});
// ─── Weekly Missions ───────────────────────────────────────────────────────
/**
 * GET /api/v1/clans/:clanId/missions
 * Get active missions for a clan
 */
router.get('/:clanId/missions', async (req, res) => {
    try {
        const missions = await clan_service_1.default.getActiveMissions(req.params.clanId);
        res.json({ success: true, data: missions });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch missions';
        res.status(500).json({ success: false, message });
    }
});
/**
 * POST /api/v1/clans/:clanId/missions/generate
 * Generate weekly missions (auto-generates if none exist for current week)
 */
router.post('/:clanId/missions/generate', async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const missions = await clan_service_1.default.generateWeeklyMissions(req.params.clanId);
        res.json({ success: true, data: missions });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to generate missions';
        res.status(500).json({ success: false, message });
    }
});
// ─── Treasury ──────────────────────────────────────────────────────────────
/**
 * POST /api/v1/clans/:clanId/treasury/donate
 * Donate points to clan treasury
 */
router.post('/:clanId/treasury/donate', async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const { amount } = req.body;
        if (!amount || amount < 10) {
            res.status(400).json({ success: false, message: 'Minimum donation is 10 points' });
            return;
        }
        const result = await clan_service_1.default.donateToTreasury(req.params.clanId, userId, amount);
        res.json({ success: true, data: result });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to donate';
        const status = message.includes('Insufficient') || message.includes('Minimum') ? 400 : 500;
        res.status(status).json({ success: false, message });
    }
});
/**
 * GET /api/v1/clans/:clanId/treasury
 * Get treasury info and donation history
 */
router.get('/:clanId/treasury', async (req, res) => {
    try {
        const result = await clan_service_1.default.getTreasuryHistory(req.params.clanId);
        res.json({ success: true, data: result });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch treasury';
        res.status(500).json({ success: false, message });
    }
});
// ─── Clan Chat ─────────────────────────────────────────────────────────────
/**
 * GET /api/v1/clans/:clanId/chat
 * Get the chat match ID for the clan chat
 */
router.get('/:clanId/chat', async (req, res) => {
    try {
        const chatMatchId = await clan_service_1.default.getChatMatchId(req.params.clanId);
        if (!chatMatchId) {
            res.status(404).json({ success: false, message: 'Chat not available' });
            return;
        }
        res.json({ success: true, data: { chatMatchId } });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get chat';
        res.status(500).json({ success: false, message });
    }
});
// ─── Perks & Shop ─────────────────────────────────────────────────────────
/**
 * GET /api/v1/clans/:clanId/perks
 * Get clan perks (level-based + active boosts)
 */
router.get('/:clanId/perks', async (req, res) => {
    try {
        const clan = await (await Promise.resolve().then(() => __importStar(require('../models/Clan')))).Clan.findById(req.params.clanId).select('level purchasedUpgrades');
        if (!clan) {
            res.status(404).json({ success: false, message: 'Clan not found' });
            return;
        }
        const allPerks = clan_service_1.default.getAllPerksWithStatus(clan.level);
        const boostMultiplier = await clan_service_1.default.getActiveBoostMultiplier(req.params.clanId);
        res.json({ success: true, data: { perks: allPerks, level: clan.level, activeBoostMultiplier: boostMultiplier } });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch perks';
        res.status(500).json({ success: false, message });
    }
});
/**
 * GET /api/v1/clans/:clanId/shop
 * Get shop items with purchase status
 */
router.get('/:clanId/shop', async (req, res) => {
    try {
        const items = await clan_service_1.default.getShopItems(req.params.clanId);
        res.json({ success: true, data: items });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch shop';
        res.status(500).json({ success: false, message });
    }
});
/**
 * POST /api/v1/clans/:clanId/shop/purchase
 * Purchase a shop item with treasury
 */
router.post('/:clanId/shop/purchase', async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const { itemId } = req.body;
        if (!itemId) {
            res.status(400).json({ success: false, message: 'itemId is required' });
            return;
        }
        const result = await clan_service_1.default.purchaseShopItem(req.params.clanId, userId, itemId);
        res.json({ success: true, data: result });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to purchase item';
        const status = message.includes('Insufficient') || message.includes('Only') || message.includes('already') || message.includes('still active') || message.includes('must be level') ? 400 : 500;
        res.status(status).json({ success: false, message });
    }
});
// ─── Wars ──────────────────────────────────────────────────────────────────
/**
 * POST /api/v1/clans/:clanId/wars
 * Start a clan war
 */
router.post('/:clanId/wars', async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const { defenderClanId, warType = 'games', pointsStake = 100 } = req.body;
        if (!defenderClanId) {
            res.status(400).json({ success: false, message: 'defenderClanId is required' });
            return;
        }
        const war = await clan_service_1.default.startWar(req.params.clanId, defenderClanId, warType, pointsStake);
        res.status(201).json({ success: true, data: war });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to start war';
        const status = message.includes('already') || message.includes('itself') ? 400 : 500;
        res.status(status).json({ success: false, message });
    }
});
/**
 * GET /api/v1/clans/:clanId/wars
 * Get clan's wars (active + history)
 */
router.get('/:clanId/wars', async (req, res) => {
    try {
        const { type = 'active' } = req.query;
        let wars;
        if (type === 'history') {
            wars = await clan_service_1.default.getWarHistory(req.params.clanId);
        }
        else {
            wars = await clan_service_1.default.getActiveWars(req.params.clanId);
        }
        res.json({ success: true, data: wars });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch wars';
        res.status(500).json({ success: false, message });
    }
});
/**
 * GET /api/v1/clans/wars/:warId
 * Get war detail
 */
router.get('/wars/:warId', async (req, res) => {
    try {
        const war = await clan_service_1.default.getWar(req.params.warId);
        if (!war) {
            res.status(404).json({ success: false, message: 'War not found' });
            return;
        }
        res.json({ success: true, data: war });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch war';
        res.status(500).json({ success: false, message });
    }
});
/**
 * POST /api/v1/clans/wars/:warId/respond
 * Accept or decline a war
 */
router.post('/wars/:warId/respond', async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const { clanId, accept } = req.body;
        if (!clanId || accept === undefined) {
            res.status(400).json({ success: false, message: 'clanId and accept are required' });
            return;
        }
        const war = await clan_service_1.default.respondToWar(clanId, req.params.warId, accept);
        res.json({ success: true, data: war });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to respond to war';
        const status = message.includes('Only') || message.includes('expired') ? 400 : 500;
        res.status(status).json({ success: false, message });
    }
});
/**
 * POST /api/v1/clans/wars/:warId/assign-players
 * Assign players to war matchups
 */
router.post('/wars/:warId/assign-players', async (req, res) => {
    try {
        const { clanId, playerIds } = req.body;
        if (!clanId || !playerIds || !Array.isArray(playerIds)) {
            res.status(400).json({ success: false, message: 'clanId and playerIds array are required' });
            return;
        }
        const war = await clan_service_1.default.assignWarPlayers(clanId, req.params.warId, playerIds);
        res.json({ success: true, data: war });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to assign players';
        res.status(500).json({ success: false, message });
    }
});
/**
 * POST /api/v1/clans/wars/:warId/match-result
 * Submit individual match result
 */
router.post('/wars/:warId/match-result', async (req, res) => {
    try {
        const { matchIndex, winningSide, scores } = req.body;
        if (matchIndex === undefined || !winningSide || !scores) {
            res.status(400).json({ success: false, message: 'matchIndex, winningSide, and scores are required' });
            return;
        }
        const war = await clan_service_1.default.submitWarMatchResult(req.params.warId, matchIndex, winningSide, scores);
        res.json({ success: true, data: war });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to submit match result';
        res.status(500).json({ success: false, message });
    }
});
exports.default = router;
//# sourceMappingURL=clan.routes.js.map