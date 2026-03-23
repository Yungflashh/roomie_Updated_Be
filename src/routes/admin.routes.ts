import { Router } from 'express';
import adminController from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   POST /api/v1/admin/login
 * @desc    Admin login
 * @access  Public
 */
router.post('/login', adminController.login);

// All routes below require authentication
// router.use(authenticate);

// Dashboard routes
/**
 * @route   GET /api/v1/admin/dashboard/stats
 * @desc    Get dashboard statistics
 * @access  Private (Admin)
 */
router.get('/dashboard/stats', adminController.getDashboardStats);

/**
 * @route   GET /api/v1/admin/dashboard/user-growth
 * @desc    Get user growth data
 * @access  Private (Admin)
 */
router.get('/dashboard/user-growth', adminController.getUserGrowth);

// User management routes
/**
 * @route   GET /api/v1/admin/users
 * @desc    Get all users with pagination and filters
 * @access  Private (Admin)
 */
router.get('/users', adminController.getUsers);

/**
 * @route   GET /api/v1/admin/users/:userId
 * @desc    Get single user details
 * @access  Private (Admin)
 */
router.get('/users/:userId', adminController.getUser);

/**
 * @route   POST /api/v1/admin/users/:userId/verify
 * @desc    Verify a user
 * @access  Private (Admin)
 */
router.post('/users/:userId/verify', adminController.verifyUser);
router.post('/users/:userId/unverify', async (req, res) => {
  try {
    const { User } = await import('../models');
    const { logAudit } = await import('../utils/audit');
    await User.findByIdAndUpdate(req.params.userId, { verified: false });
    res.json({ success: true, message: 'User unverified' });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
});

/**
 * @route   POST /api/v1/admin/users/:userId/suspend
 * @desc    Suspend a user
 * @access  Private (Admin)
 */
router.post('/users/:userId/suspend', adminController.suspendUser);

/**
 * @route   POST /api/v1/admin/users/:userId/unsuspend
 * @desc    Unsuspend a user
 * @access  Private (Admin)
 */
router.post('/users/:userId/unsuspend', adminController.unsuspendUser);

/**
 * @route   DELETE /api/v1/admin/users/:userId
 * @desc    Delete a user
 * @access  Private (Admin)
 */
router.delete('/users/:userId', adminController.deleteUser);

// Match management routes
/**
 * @route   GET /api/v1/admin/matches
 * @desc    Get all matches with pagination
 * @access  Private (Admin)
 */
router.get('/matches', adminController.getMatches);

/**
 * @route   GET /api/v1/admin/matches/:matchId
 * @desc    Get match details
 * @access  Private (Admin)
 */
router.get('/matches/:matchId', adminController.getMatch);

/**
 * @route   DELETE /api/v1/admin/matches/:matchId
 * @desc    Delete a match
 * @access  Private (Admin)
 */
router.delete('/matches/:matchId', adminController.deleteMatch);

// Property management routes
/**
 * @route   GET /api/v1/admin/properties
 * @desc    Get all properties with pagination and filters
 * @access  Private (Admin)
 */
router.get('/properties', adminController.getProperties);

/**
 * @route   GET /api/v1/admin/properties/:propertyId
 * @desc    Get property details
 * @access  Private (Admin)
 */
router.get('/properties/:propertyId', adminController.getProperty);

/**
 * @route   PATCH /api/v1/admin/properties/:propertyId
 * @desc    Update property
 * @access  Private (Admin)
 */
router.patch('/properties/:propertyId', adminController.updateProperty);

/**
 * @route   DELETE /api/v1/admin/properties/:propertyId
 * @desc    Delete property
 * @access  Private (Admin)
 */
router.delete('/properties/:propertyId', adminController.deleteProperty);

/**
 * @route   POST /api/v1/admin/properties/:propertyId/approve
 * @desc    Approve property
 * @access  Private (Admin)
 */
router.post('/properties/:propertyId/approve', adminController.approveProperty);

/**
 * @route   POST /api/v1/admin/properties/:propertyId/reject
 * @desc    Reject property
 * @access  Private (Admin)
 */
router.post('/properties/:propertyId/reject', adminController.rejectProperty);

// Report management routes
router.get('/reports', adminController.getReports);
router.get('/reports/:reportId', adminController.getReport);
router.patch('/reports/:reportId', adminController.updateReport);

// Listing Inquiries (admin)
router.get('/listing-inquiries', async (req, res) => {
  try {
    const { ListingInquiry } = await import('../models');
    const { page = 1, limit = 20, status } = req.query;
    const query: any = {};
    if (status && status !== 'all') query.status = status;
    const inquiries = await ListingInquiry.find(query)
      .populate('seeker', 'firstName lastName email profilePhoto')
      .populate('lister', 'firstName lastName email profilePhoto')
      .populate('property', 'title price photos location')
      .sort({ updatedAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));
    const total = await ListingInquiry.countDocuments(query);
    res.json({ success: true, data: { inquiries, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } } });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
});

// Rental Agreements (admin)
router.get('/rental-agreements', async (req, res) => {
  try {
    const { RentalAgreement } = await import('../models');
    const { page = 1, limit = 20, status } = req.query;
    const query: any = {};
    if (status && status !== 'all') query.status = status;
    const agreements = await RentalAgreement.find(query)
      .populate('landlord.user', 'firstName lastName email profilePhoto')
      .populate('tenant.user', 'firstName lastName email profilePhoto')
      .populate('property', 'title price photos location')
      .sort({ updatedAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));
    const total = await RentalAgreement.countDocuments(query);
    res.json({ success: true, data: { agreements, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } } });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
});

// Reviews (admin)
router.get('/reviews', async (req, res) => {
  try {
    const { Review } = await import('../models');
    const { page = 1, limit = 20 } = req.query;
    const reviews = await Review.find()
      .populate('reviewer', 'firstName lastName email profilePhoto')
      .populate('reviewee', 'firstName lastName email profilePhoto')
      .populate('property', 'title photos')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));
    const total = await Review.countDocuments();
    res.json({ success: true, data: { reviews, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } } });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
});

// Toggle review visibility (admin)
router.put('/reviews/:reviewId/visibility', async (req, res) => {
  try {
    const { Review } = await import('../models');
    const review = await Review.findById(req.params.reviewId);
    if (!review) { res.status(404).json({ success: false, message: 'Review not found' }); return; }
    review.isVisible = !review.isVisible;
    await review.save();
    res.json({ success: true, data: review });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
});

// Pending verification requests (admin)
router.get('/verification-requests', async (req, res) => {
  try {
    const { User } = await import('../models');
    const { page = 1, limit = 20 } = req.query;
    const query = { verified: false, isActive: true, 'metadata.verificationStatus': 'pending' };
    const users = await User.find(query)
      .select('firstName lastName email profilePhoto socialLinks createdAt metadata')
      .sort({ 'metadata.verificationRequestedAt': -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));
    const total = await User.countDocuments(query);
    res.json({ success: true, data: { users, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } } });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
});

// Approve verification (admin)
router.post('/verification-requests/:userId/approve', async (req, res) => {
  try {
    const { User } = await import('../models');
    await User.findByIdAndUpdate(req.params.userId, {
      $set: { verified: true, 'metadata.verificationStatus': 'approved', 'metadata.verificationRequested': false },
    });
    res.json({ success: true, message: 'User verified successfully' });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
});

// Reject verification (admin)
router.post('/verification-requests/:userId/reject', async (req, res) => {
  try {
    const { User } = await import('../models');
    const { reason } = req.body;
    await User.findByIdAndUpdate(req.params.userId, {
      $set: {
        'metadata.verificationStatus': 'rejected',
        'metadata.verificationRejectionReason': reason || 'Documents did not meet requirements',
        'metadata.verificationRequested': false,
      },
    });
    res.json({ success: true, message: 'Verification rejected' });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
});

// Subscription management (admin)
router.get('/subscriptions', async (req, res) => {
  try {
    const { User } = await import('../models');
    const { page = 1, limit = 20, plan } = req.query;
    const query: any = { 'subscription.plan': { $ne: 'free' } };
    if (plan && plan !== 'all') query['subscription.plan'] = plan;
    const users = await User.find(query)
      .select('firstName lastName email profilePhoto subscription createdAt')
      .sort({ 'subscription.startDate': -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));
    const total = await User.countDocuments(query);
    res.json({ success: true, data: { subscribers: users, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } } });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
});

// Grant premium manually (admin)
router.post('/subscriptions/:userId/grant', async (req, res) => {
  try {
    const premiumService = (await import('../services/premium.service')).default;
    const { plan = 'premium', months = 1 } = req.body;
    const user = await premiumService.activateSubscription(req.params.userId, plan, months);
    res.json({ success: true, data: { subscription: user.subscription } });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
});

// Revoke subscription (admin)
router.post('/subscriptions/:userId/revoke', async (req, res) => {
  try {
    const { User } = await import('../models');
    await User.findByIdAndUpdate(req.params.userId, {
      $set: { 'subscription.plan': 'free', 'subscription.endDate': new Date(), 'subscription.autoRenew': false },
    });
    res.json({ success: true, message: 'Subscription revoked' });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
});

// Challenge management (admin)
router.post('/challenges', async (req, res) => {
  try {
    const weeklyChallengeService = (await import('../services/weeklyChallenge.service')).default;
    const challenge = await weeklyChallengeService.createChallenge({ ...req.body, createdBy: (req as any).user?.userId });
    res.status(201).json({ success: true, data: challenge });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
});

router.get('/challenges', async (req, res) => {
  try {
    const { Challenge } = await import('../models');
    const { page = 1, limit = 20, type } = req.query;
    const query: any = {};
    if (type && type !== 'all') query.type = type;
    const challenges = await Challenge.find(query).sort({ createdAt: -1 }).skip((Number(page) - 1) * Number(limit)).limit(Number(limit));
    const total = await Challenge.countDocuments(query);
    res.json({ success: true, data: { challenges, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } } });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
});

router.delete('/challenges/:id', async (req, res) => {
  try {
    const { Challenge } = await import('../models');
    await Challenge.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Challenge deactivated' });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
});

// Notification broadcast (admin)
router.post('/notifications/broadcast', async (req, res) => {
  try {
    const weeklyChallengeService = (await import('../services/weeklyChallenge.service')).default;
    const { title, body, type } = req.body;
    if (!title || !body) { res.status(400).json({ success: false, message: 'Title and body required' }); return; }
    const sent = await weeklyChallengeService.broadcastNotification({ title, body, type });
    res.json({ success: true, message: `Notification sent to ${sent} users`, data: { sent } });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
});

// Send notification to specific user (admin)
router.post('/notifications/send', async (req, res) => {
  try {
    const notificationService = (await import('../services/notification.service')).default;
    const { userId, title, body, type } = req.body;
    if (!userId || !title || !body) { res.status(400).json({ success: false, message: 'userId, title, and body required' }); return; }
    await notificationService.createNotification({ user: userId, type: type || 'system', title, body });
    res.json({ success: true, message: 'Notification sent' });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
});

// Game management routes
router.get('/games', adminController.getGames);
router.get('/games/sessions', adminController.getGameSessions);
router.get('/games/stats', adminController.getGameStats);

// Group management routes
router.get('/groups', adminController.getGroups);
router.get('/groups/:groupId', adminController.getGroup);
router.delete('/groups/:groupId', adminController.deleteGroup);

// Analytics routes
router.get('/analytics', adminController.getAnalytics);
router.get('/dashboard/activity', adminController.getRecentActivity);
router.get('/export/:type', adminController.exportData);

// Points / Purchase management routes
router.get('/points/overview', adminController.getPointsOverview);
router.get('/points/purchases', adminController.getPurchases);
router.post('/points/purchases/:transactionId/approve', adminController.approvePurchase);
router.post('/points/purchases/:transactionId/reject', adminController.rejectPurchase);

// App version management
router.get('/app-version', adminController.getAppVersion);
router.put('/app-version', adminController.updateAppVersion);

// Audit log routes
router.get('/audit-logs', adminController.getAuditLogs);
router.get('/audit-logs/stats', adminController.getAuditStats);
router.get('/audit-logs/user/:userId', adminController.getUserAuditTrail);
router.get('/audit-logs/:logId', adminController.getAuditLog);

// Study Buddy admin routes
router.get('/study-buddy/sessions', adminController.getStudySessions);
router.get('/study-buddy/stats', adminController.getStudyStats);
router.delete('/study-buddy/sessions/:sessionId', adminController.deleteStudySession);
router.get('/study-buddy/categories', adminController.getStudyCategories);
router.post('/study-buddy/categories', adminController.createStudyCategory);
router.post('/study-buddy/categories/:category/questions', adminController.addStudyQuestion);
router.delete('/study-buddy/questions/:questionId', adminController.deleteStudyQuestion);

// Events admin routes
router.post('/events', adminController.createAdminEvent);
router.get('/events', adminController.getAdminEvents);
router.get('/events/stats', adminController.getEventStats);
router.post('/events/:eventId/cancel', adminController.adminCancelEvent);
router.delete('/events/:eventId', adminController.adminDeleteEvent);

// Confessions admin routes
router.get('/confessions', adminController.getAdminConfessions);
router.get('/confessions/stats', adminController.getConfessionStats);
router.post('/confessions/:confessionId/hide', adminController.hideConfession);
router.delete('/confessions/:confessionId', adminController.adminDeleteConfession);

// Clan admin routes
router.get('/clans', async (req, res) => {
  try {
    const { Clan } = await import('../models');
    const { page = 1, limit = 20, search } = req.query;
    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { tag: { $regex: search, $options: 'i' } },
      ];
    }
    const clans = await Clan.find(query)
      .populate('leader', 'firstName lastName email profilePhoto')
      .sort({ totalPoints: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));
    const total = await Clan.countDocuments(query);
    res.json({ success: true, data: { clans, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } } });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
});

router.get('/clans/:clanId', async (req, res) => {
  try {
    const { Clan } = await import('../models');
    const clan = await Clan.findById(req.params.clanId)
      .populate('leader', 'firstName lastName email profilePhoto')
      .populate('coLeaders', 'firstName lastName email profilePhoto')
      .populate('members.user', 'firstName lastName email profilePhoto');
    if (!clan) { res.status(404).json({ success: false, message: 'Clan not found' }); return; }
    res.json({ success: true, data: clan });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
});

router.delete('/clans/:clanId', async (req, res) => {
  try {
    const { Clan, ClanWar } = await import('../models');
    const clan = await Clan.findById(req.params.clanId);
    if (!clan) { res.status(404).json({ success: false, message: 'Clan not found' }); return; }
    await ClanWar.updateMany(
      { $or: [{ challenger: req.params.clanId }, { defender: req.params.clanId }], status: { $in: ['pending', 'accepted', 'in_progress'] } },
      { $set: { status: 'expired' } }
    );
    await Clan.findByIdAndDelete(req.params.clanId);
    res.json({ success: true, message: `Clan ${clan.name} [${clan.tag}] disbanded by admin` });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
});

// Grant points/treasury to a clan (admin)
router.post('/clans/:clanId/grant', async (req, res) => {
  try {
    const { Clan } = await import('../models');
    const { totalPoints, treasury, level } = req.body;
    const clan = await Clan.findById(req.params.clanId);
    if (!clan) { res.status(404).json({ success: false, message: 'Clan not found' }); return; }

    if (totalPoints) {
      clan.totalPoints += totalPoints;
      clan.weeklyPoints += totalPoints;
      clan.monthlyPoints += totalPoints;
    }
    if (treasury) clan.treasury = (clan.treasury || 0) + treasury;
    if (level) {
      clan.level = level;
      clan.maxMembers = 10 + (level - 1) * 5;
    }

    await clan.save();
    res.json({ success: true, data: { name: clan.name, tag: clan.tag, totalPoints: clan.totalPoints, treasury: clan.treasury, level: clan.level } });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
});

router.get('/clan-wars', async (req, res) => {
  try {
    const { ClanWar } = await import('../models');
    const { page = 1, limit = 20, status } = req.query;
    const query: any = {};
    if (status && status !== 'all') query.status = status;
    const wars = await ClanWar.find(query)
      .populate('challenger', 'name tag emoji')
      .populate('defender', 'name tag emoji')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));
    const total = await ClanWar.countDocuments(query);
    res.json({ success: true, data: { wars, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } } });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
});

export default router;