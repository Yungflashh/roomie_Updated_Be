import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { AuthRequest } from '../types';
import clanService from '../services/clan.service';
import logger from '../utils/logger';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ─── Clan Discovery & Leaderboard ──────────────────────────────────────────

/**
 * GET /api/v1/clans
 * List clans for discovery
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, search, sortBy } = req.query;
    const result = await clanService.getClans(
      Number(page),
      Number(limit),
      search as string | undefined,
      sortBy as string | undefined
    );
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch clans';
    res.status(500).json({ success: false, message });
  }
});

/**
 * GET /api/v1/clans/leaderboard
 * Clan leaderboard
 */
router.get('/leaderboard', async (req: AuthRequest, res: Response) => {
  try {
    const { period = 'allTime', limit = 50 } = req.query;
    const clans = await clanService.getLeaderboard(
      period as 'weekly' | 'monthly' | 'allTime',
      Number(limit)
    );
    res.json({ success: true, data: clans });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch leaderboard';
    res.status(500).json({ success: false, message });
  }
});

/**
 * GET /api/v1/clans/my-clan
 * Get the current user's clan
 */
router.get('/my-clan', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const clan = await clanService.getMyClan(userId);
    res.json({ success: true, data: clan });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch your clan';
    res.status(500).json({ success: false, message });
  }
});

// ─── Clan CRUD ─────────────────────────────────────────────────────────────

/**
 * POST /api/v1/clans
 * Create a new clan
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const { name, tag, description, emoji, color, isOpen } = req.body;
    if (!name || !tag) {
      res.status(400).json({ success: false, message: 'Name and tag are required' });
      return;
    }
    if (tag.length < 3 || tag.length > 6) {
      res.status(400).json({ success: false, message: 'Tag must be 3-6 characters' });
      return;
    }

    const clan = await clanService.createClan(userId, { name, tag, description, emoji, color, isOpen });
    res.status(201).json({ success: true, data: clan });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create clan';
    const status = message.includes('already') || message.includes('Insufficient') ? 400 : 500;
    res.status(status).json({ success: false, message });
  }
});

/**
 * GET /api/v1/clans/:clanId
 * Get clan detail
 */
router.get('/:clanId', async (req: AuthRequest, res: Response) => {
  try {
    const clan = await clanService.getClan(req.params.clanId);
    if (!clan) { res.status(404).json({ success: false, message: 'Clan not found' }); return; }
    res.json({ success: true, data: clan });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch clan';
    res.status(500).json({ success: false, message });
  }
});

/**
 * PUT /api/v1/clans/:clanId
 * Update clan settings
 */
router.put('/:clanId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const { name, description, emoji, color, isOpen, banner, settings } = req.body;
    const clan = await clanService.updateClan(userId, req.params.clanId, { name, description, emoji, color, isOpen, banner, settings });
    res.json({ success: true, data: clan });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update clan';
    const status = message.includes('Only') ? 403 : 500;
    res.status(status).json({ success: false, message });
  }
});

/**
 * DELETE /api/v1/clans/:clanId
 * Disband a clan
 */
router.delete('/:clanId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    await clanService.disbandClan(userId, req.params.clanId);
    res.json({ success: true, message: 'Clan disbanded' });
  } catch (error: unknown) {
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
router.post('/:clanId/join', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const clan = await clanService.joinClan(userId, req.params.clanId);
    res.json({ success: true, data: clan });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to join clan';
    const status = message.includes('already') || message.includes('full') || message.includes('invite') ? 400 : 500;
    res.status(status).json({ success: false, message });
  }
});

/**
 * POST /api/v1/clans/join-by-code
 * Join clan by invite code
 */
router.post('/join-by-code', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const { inviteCode } = req.body;
    if (!inviteCode) {
      res.status(400).json({ success: false, message: 'Invite code is required' });
      return;
    }

    const clan = await clanService.joinByInviteCode(userId, inviteCode);
    const isPending = clan.pendingMembers?.some(p => p.user.toString() === userId);
    res.json({ success: true, data: clan, pending: !!isPending });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to join clan';
    const status = message.includes('Invalid') || message.includes('already') || message.includes('full') ? 400 : 500;
    res.status(status).json({ success: false, message });
  }
});

/**
 * POST /api/v1/clans/:clanId/leave
 * Leave a clan
 */
router.post('/:clanId/leave', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const result = await clanService.leaveClan(userId, req.params.clanId);
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to leave clan';
    res.status(500).json({ success: false, message });
  }
});

/**
 * POST /api/v1/clans/:clanId/kick
 * Kick a member
 */
router.post('/:clanId/kick', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const { targetUserId } = req.body;
    if (!targetUserId) {
      res.status(400).json({ success: false, message: 'targetUserId is required' });
      return;
    }

    const clan = await clanService.kickMember(userId, req.params.clanId, targetUserId);
    res.json({ success: true, data: clan });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to kick member';
    const status = message.includes('Only') || message.includes('Cannot') ? 403 : 500;
    res.status(status).json({ success: false, message });
  }
});

/**
 * POST /api/v1/clans/:clanId/promote
 * Promote a member
 */
router.post('/:clanId/promote', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const { targetUserId, role } = req.body;
    if (!targetUserId || !role) {
      res.status(400).json({ success: false, message: 'targetUserId and role are required' });
      return;
    }
    const validRoles = ['co-leader', 'elder', 'officer', 'member'];
    if (!validRoles.includes(role)) {
      res.status(400).json({ success: false, message: `Role must be one of: ${validRoles.join(', ')}` });
      return;
    }

    const clan = await clanService.promoteMember(userId, req.params.clanId, targetUserId, role);
    res.json({ success: true, data: clan });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to promote member';
    const status = message.includes('Only') ? 403 : 500;
    res.status(status).json({ success: false, message });
  }
});

// ─── Transfer Leadership ──────────────────────────────────────────────────

router.post('/:clanId/transfer-leadership', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
    const { targetUserId } = req.body;
    if (!targetUserId) { res.status(400).json({ success: false, message: 'targetUserId is required' }); return; }
    const clan = await clanService.transferLeadership(userId, req.params.clanId, targetUserId);
    res.json({ success: true, data: clan });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to transfer leadership';
    const status = message.includes('Only') || message.includes('already') ? 403 : 500;
    res.status(status).json({ success: false, message });
  }
});

// ─── Claim Leadership ─────────────────────────────────────────────────────

router.post('/:clanId/claim-leadership', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
    const clan = await clanService.claimLeadership(userId, req.params.clanId);
    res.json({ success: true, data: clan });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to claim leadership';
    const status = message.includes('Only') || message.includes('enough') || message.includes('active') ? 400 : 500;
    res.status(status).json({ success: false, message });
  }
});

// ─── Auto-kick Inactive ──────────────────────────────────────────────────

router.post('/:clanId/auto-kick', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
    // Only leader can trigger
    const { Clan: ClanModel } = await import('../models/Clan');
    const clan = await ClanModel.findById(req.params.clanId);
    if (!clan || clan.leader.toString() !== userId) {
      res.status(403).json({ success: false, message: 'Only the clan leader can trigger auto-kick' });
      return;
    }
    const result = await clanService.autoKickInactive(req.params.clanId);
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to auto-kick';
    res.status(500).json({ success: false, message });
  }
});

// ─── Pending Members ──────────────────────────────────────────────────────

router.get('/:clanId/pending', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
    const pending = await clanService.getPendingMembers(req.params.clanId, userId);
    res.set('Cache-Control', 'no-store');
    res.json({ success: true, data: pending });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get pending members';
    res.status(message.includes('need') ? 403 : 500).json({ success: false, message });
  }
});

router.post('/:clanId/pending/:userId/accept', async (req: AuthRequest, res: Response) => {
  try {
    const actorId = req.user?.userId;
    if (!actorId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
    const clan = await clanService.acceptPendingMember(req.params.clanId, actorId, req.params.userId);
    res.json({ success: true, data: clan });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to accept member';
    res.status(message.includes('need') || message.includes('full') ? 400 : 500).json({ success: false, message });
  }
});

router.post('/:clanId/pending/:userId/reject', async (req: AuthRequest, res: Response) => {
  try {
    const actorId = req.user?.userId;
    if (!actorId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
    const clan = await clanService.rejectPendingMember(req.params.clanId, actorId, req.params.userId);
    res.json({ success: true, data: clan });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to reject member';
    res.status(500).json({ success: false, message });
  }
});

// ─── Achievements ─────────────────────────────────────────────────────────

router.get('/:clanId/achievements', async (req: AuthRequest, res: Response) => {
  try {
    const { Clan: ClanModel } = await import('../models/Clan');
    const clan = await ClanModel.findById(req.params.clanId);
    if (!clan) { res.status(404).json({ success: false, message: 'Clan not found' }); return; }
    const achievements = clanService.getAchievementsWithStatus(clan);
    res.json({ success: true, data: achievements });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch achievements';
    res.status(500).json({ success: false, message });
  }
});

// ─── Member Leaderboard ───────────────────────────────────────────────────

router.get('/:clanId/leaderboard/members', async (req: AuthRequest, res: Response) => {
  try {
    const clan = await clanService.getClan(req.params.clanId);
    if (!clan) { res.status(404).json({ success: false, message: 'Clan not found' }); return; }
    const leaderboard = clanService.getMemberLeaderboard(clan);
    res.json({ success: true, data: leaderboard });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch leaderboard';
    res.status(500).json({ success: false, message });
  }
});

// ─── Head-to-Head ─────────────────────────────────────────────────────────

router.get('/:clanId/h2h/:opponentClanId', async (req: AuthRequest, res: Response) => {
  try {
    const result = await clanService.getHeadToHead(req.params.clanId, req.params.opponentClanId);
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch head-to-head';
    res.status(500).json({ success: false, message });
  }
});

// ─── Announcements ────────────────────────────────────────────────────────

router.put('/:clanId/announcement', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
    const { text } = req.body;
    const announcement = await clanService.setAnnouncement(req.params.clanId, userId, text || '');
    res.json({ success: true, data: { announcement } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to set announcement';
    const status = message.includes('Only') ? 403 : 500;
    res.status(status).json({ success: false, message });
  }
});

/**
 * POST /api/v1/clans/:clanId/announcement/send
 * Send announcement as notification to all or selected members
 */
router.post('/:clanId/announcement/send', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const { title, body, memberIds } = req.body;
    if (!title || !body) {
      res.status(400).json({ success: false, message: 'Title and body are required' });
      return;
    }

    const { Clan: ClanModel } = await import('../models/Clan');
    const clan = await ClanModel.findById(req.params.clanId);
    if (!clan) { res.status(404).json({ success: false, message: 'Clan not found' }); return; }

    const { RANK_WEIGHTS } = await import('../models/Clan');
    const member = clan.members.find(m => m.user.toString() === userId);
    if (!member || (RANK_WEIGHTS[member.role as keyof typeof RANK_WEIGHTS] || 0) < 4) {
      res.status(403).json({ success: false, message: 'You need Co-Leader rank or higher to send announcements' });
      return;
    }

    // Sending announcements costs treasury
    const ANNOUNCEMENT_COST = 50;
    if (clan.treasury < ANNOUNCEMENT_COST) {
      res.status(400).json({ success: false, message: `Sending announcements costs ${ANNOUNCEMENT_COST} treasury points. Current balance: ${clan.treasury}.` });
      return;
    }
    clan.treasury -= ANNOUNCEMENT_COST;
    await clan.save();

    const notificationService = (await import('../services/notification.service')).default;
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
      } catch {}
    }

    await clanService.logActivity(clan._id.toString(), 'treasury_spent', userId, `spent ${ANNOUNCEMENT_COST} treasury to send announcement to ${sent} members`);

    res.json({ success: true, data: { sent, total: targets.length, treasuryCost: ANNOUNCEMENT_COST, newBalance: clan.treasury } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send announcement';
    res.status(500).json({ success: false, message });
  }
});

// ─── Season Leaderboard ──────────────────────────────────────────────────

router.get('/season/leaderboard', async (req: AuthRequest, res: Response) => {
  try {
    const clans = await clanService.getSeasonLeaderboard(50);
    res.json({ success: true, data: clans });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch season leaderboard';
    res.status(500).json({ success: false, message });
  }
});

// ─── Activity Feed ─────────────────────────────────────────────────────────

/**
 * GET /api/v1/clans/:clanId/activity
 * Get clan activity feed
 */
router.get('/:clanId/activity', async (req: AuthRequest, res: Response) => {
  try {
    const activity = await clanService.getActivityLog(req.params.clanId);
    res.json({ success: true, data: activity });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch activity';
    res.status(500).json({ success: false, message });
  }
});

// ─── Weekly Missions ───────────────────────────────────────────────────────

/**
 * GET /api/v1/clans/:clanId/missions
 * Get active missions for a clan
 */
router.get('/:clanId/missions', async (req: AuthRequest, res: Response) => {
  try {
    const missions = await clanService.getActiveMissions(req.params.clanId);
    res.json({ success: true, data: missions });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch missions';
    res.status(500).json({ success: false, message });
  }
});

/**
 * POST /api/v1/clans/:clanId/missions/generate
 * Generate weekly missions (auto-generates if none exist for current week)
 */
router.post('/:clanId/missions/generate', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const missions = await clanService.generateWeeklyMissions(req.params.clanId);
    res.json({ success: true, data: missions });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate missions';
    res.status(500).json({ success: false, message });
  }
});

// ─── Treasury ──────────────────────────────────────────────────────────────

/**
 * POST /api/v1/clans/:clanId/treasury/donate
 * Donate points to clan treasury
 */
router.post('/:clanId/treasury/donate', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const { amount } = req.body;
    if (!amount || amount < 10) {
      res.status(400).json({ success: false, message: 'Minimum donation is 10 points' });
      return;
    }

    const result = await clanService.donateToTreasury(req.params.clanId, userId, amount);
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to donate';
    const status = message.includes('Insufficient') || message.includes('Minimum') ? 400 : 500;
    res.status(status).json({ success: false, message });
  }
});

/**
 * GET /api/v1/clans/:clanId/treasury
 * Get treasury info and donation history
 */
router.get('/:clanId/treasury', async (req: AuthRequest, res: Response) => {
  try {
    const result = await clanService.getTreasuryHistory(req.params.clanId);
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch treasury';
    res.status(500).json({ success: false, message });
  }
});

// ─── Clan Chat ─────────────────────────────────────────────────────────────

/**
 * GET /api/v1/clans/:clanId/chat
 * Get the chat match ID for the clan chat
 */
router.get('/:clanId/chat', async (req: AuthRequest, res: Response) => {
  try {
    const chatMatchId = await clanService.getChatMatchId(req.params.clanId);
    if (!chatMatchId) {
      res.status(404).json({ success: false, message: 'Chat not available' });
      return;
    }
    res.json({ success: true, data: { chatMatchId } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get chat';
    res.status(500).json({ success: false, message });
  }
});

// ─── Perks & Shop ─────────────────────────────────────────────────────────

/**
 * GET /api/v1/clans/:clanId/perks
 * Get clan perks (level-based + active boosts)
 */
router.get('/:clanId/perks', async (req: AuthRequest, res: Response) => {
  try {
    const clan = await (await import('../models/Clan')).Clan.findById(req.params.clanId).select('level purchasedUpgrades');
    if (!clan) { res.status(404).json({ success: false, message: 'Clan not found' }); return; }

    const allPerks = clanService.getAllPerksWithStatus(clan.level);
    const boostMultiplier = await clanService.getActiveBoostMultiplier(req.params.clanId);

    res.json({ success: true, data: { perks: allPerks, level: clan.level, activeBoostMultiplier: boostMultiplier } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch perks';
    res.status(500).json({ success: false, message });
  }
});

/**
 * GET /api/v1/clans/:clanId/shop
 * Get shop items with purchase status
 */
router.get('/:clanId/shop', async (req: AuthRequest, res: Response) => {
  try {
    const items = await clanService.getShopItems(req.params.clanId);
    res.json({ success: true, data: items });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch shop';
    res.status(500).json({ success: false, message });
  }
});

/**
 * POST /api/v1/clans/:clanId/shop/purchase
 * Purchase a shop item with treasury
 */
router.post('/:clanId/shop/purchase', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const { itemId } = req.body;
    if (!itemId) {
      res.status(400).json({ success: false, message: 'itemId is required' });
      return;
    }

    const result = await clanService.purchaseShopItem(req.params.clanId, userId, itemId);
    res.json({ success: true, data: result });
  } catch (error: unknown) {
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
router.post('/:clanId/wars', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    // Only leader or co-leader can start wars
    const { Clan: ClanModel, RANK_WEIGHTS } = await import('../models/Clan');
    const clan = await ClanModel.findById(req.params.clanId);
    if (!clan) { res.status(404).json({ success: false, message: 'Clan not found' }); return; }
    const member = clan.members.find((m: any) => m.user.toString() === userId);
    if (!member || (RANK_WEIGHTS[member.role as keyof typeof RANK_WEIGHTS] || 0) < 4) {
      res.status(403).json({ success: false, message: 'Only leaders and co-leaders can start wars.' });
      return;
    }

    const { defenderClanId, warType = 'games', pointsStake = 100 } = req.body;
    if (!defenderClanId) {
      res.status(400).json({ success: false, message: 'defenderClanId is required' });
      return;
    }

    const war = await clanService.startWar(req.params.clanId, defenderClanId, warType, pointsStake);
    res.status(201).json({ success: true, data: war });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to start war';
    const status = message.includes('already') || message.includes('itself') ? 400 : 500;
    res.status(status).json({ success: false, message });
  }
});

/**
 * GET /api/v1/clans/:clanId/wars
 * Get clan's wars (active + history)
 */
router.get('/:clanId/wars', async (req: AuthRequest, res: Response) => {
  try {
    const { type = 'active' } = req.query;
    let wars;
    if (type === 'history') {
      wars = await clanService.getWarHistory(req.params.clanId);
    } else {
      wars = await clanService.getActiveWars(req.params.clanId);
    }
    res.json({ success: true, data: wars });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch wars';
    res.status(500).json({ success: false, message });
  }
});

/**
 * GET /api/v1/clans/wars/:warId
 * Get war detail
 */
router.get('/wars/:warId', async (req: AuthRequest, res: Response) => {
  try {
    const war = await clanService.getWar(req.params.warId);
    if (!war) { res.status(404).json({ success: false, message: 'War not found' }); return; }
    res.json({ success: true, data: war });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch war';
    res.status(500).json({ success: false, message });
  }
});

/**
 * POST /api/v1/clans/wars/:warId/respond
 * Accept or decline a war
 */
router.post('/wars/:warId/respond', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const { clanId, accept } = req.body;
    if (!clanId || accept === undefined) {
      res.status(400).json({ success: false, message: 'clanId and accept are required' });
      return;
    }

    const war = await clanService.respondToWar(clanId, req.params.warId, accept);
    res.json({ success: true, data: war });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to respond to war';
    const status = message.includes('Only') || message.includes('expired') ? 400 : 500;
    res.status(status).json({ success: false, message });
  }
});

/**
 * POST /api/v1/clans/wars/:warId/cancel
 * Cancel a war (costs treasury points or uses War Shield)
 */
router.post('/wars/:warId/cancel', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const { clanId } = req.body;
    if (!clanId) {
      res.status(400).json({ success: false, message: 'clanId is required' });
      return;
    }

    const war = await clanService.cancelWar(clanId, req.params.warId, userId);
    res.json({ success: true, data: war });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to cancel war';
    const status = message.includes('Not enough') || message.includes('Only') || message.includes('already') ? 400 : 500;
    res.status(status).json({ success: false, message });
  }
});

/**
 * POST /api/v1/clans/wars/:warId/start-match
 * Start a game session for a war match
 */
router.post('/wars/:warId/start-match', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const { matchIndex } = req.body;
    if (matchIndex === undefined || matchIndex === null) {
      res.status(400).json({ success: false, message: 'matchIndex is required' });
      return;
    }

    const gameService = (await import('../services/game.service')).default;
    const session = await gameService.createWarGameSession(req.params.warId, matchIndex, userId);
    res.json({ success: true, data: session });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to start war match';
    const status = message.includes('not') || message.includes('Invalid') || message.includes('already') ? 400 : 500;
    res.status(status).json({ success: false, message });
  }
});

/**
 * POST /api/v1/clans/wars/:warId/assign-players
 * Assign players to war matchups
 */
router.post('/wars/:warId/assign-players', async (req: AuthRequest, res: Response) => {
  try {
    const { clanId, playerIds } = req.body;
    if (!clanId || !playerIds || !Array.isArray(playerIds)) {
      res.status(400).json({ success: false, message: 'clanId and playerIds array are required' });
      return;
    }

    const war = await clanService.assignWarPlayers(clanId, req.params.warId, playerIds);
    res.json({ success: true, data: war });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to assign players';
    res.status(500).json({ success: false, message });
  }
});

/**
 * POST /api/v1/clans/wars/:warId/match-result
 * Submit individual match result
 */
router.post('/wars/:warId/match-result', async (req: AuthRequest, res: Response) => {
  try {
    const { matchIndex, winningSide, scores } = req.body;
    if (matchIndex === undefined || !winningSide || !scores) {
      res.status(400).json({ success: false, message: 'matchIndex, winningSide, and scores are required' });
      return;
    }

    const war = await clanService.submitWarMatchResult(
      req.params.warId,
      matchIndex,
      winningSide,
      scores
    );
    res.json({ success: true, data: war });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to submit match result';
    res.status(500).json({ success: false, message });
  }
});

export default router;
