"use strict";
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