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
const admin_controller_1 = __importDefault(require("../controllers/admin.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/v1/admin/login
 * @desc    Admin login
 * @access  Public (rate limited)
 */
router.post('/login', rateLimiter_1.authLimiter, admin_controller_1.default.login);
// All routes below require authentication
router.use(auth_middleware_1.authenticate);
// Dashboard routes
/**
 * @route   GET /api/v1/admin/dashboard/stats
 * @desc    Get dashboard statistics
 * @access  Private (Admin)
 */
router.get('/dashboard/stats', admin_controller_1.default.getDashboardStats);
/**
 * @route   GET /api/v1/admin/dashboard/user-growth
 * @desc    Get user growth data
 * @access  Private (Admin)
 */
router.get('/dashboard/user-growth', admin_controller_1.default.getUserGrowth);
// DAU/retention chart data
router.get('/dashboard/dau-chart', async (req, res) => {
    try {
        const { UserActivity } = await Promise.resolve().then(() => __importStar(require('../models/UserActivity')));
        const days = parseInt(req.query.days) || 30;
        const results = [];
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().slice(0, 10);
            const [dauCount, avgSession] = await Promise.all([
                UserActivity.countDocuments({ date: dateStr }),
                UserActivity.aggregate([
                    { $match: { date: dateStr } },
                    { $group: { _id: null, avg: { $avg: '$totalSeconds' } } },
                ]).then(r => Math.round((r[0]?.avg || 0) / 60)),
            ]);
            results.push({ date: dateStr, dau: dauCount, avgMinutes: avgSession });
        }
        res.json({ success: true, data: results });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// User management routes
/**
 * @route   GET /api/v1/admin/users
 * @desc    Get all users with pagination and filters
 * @access  Private (Admin)
 */
router.get('/users', admin_controller_1.default.getUsers);
/**
 * @route   GET /api/v1/admin/users/:userId
 * @desc    Get single user details
 * @access  Private (Admin)
 */
router.get('/users/:userId', admin_controller_1.default.getUser);
/**
 * @route   POST /api/v1/admin/users/:userId/verify
 * @desc    Verify a user
 * @access  Private (Admin)
 */
router.post('/users/:userId/verify', admin_controller_1.default.verifyUser);
router.post('/users/:userId/unverify', async (req, res) => {
    try {
        const { User } = await Promise.resolve().then(() => __importStar(require('../models')));
        const { logAudit } = await Promise.resolve().then(() => __importStar(require('../utils/audit')));
        await User.findByIdAndUpdate(req.params.userId, { verified: false });
        res.json({ success: true, message: 'User unverified' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
/**
 * @route   POST /api/v1/admin/users/:userId/suspend
 * @desc    Suspend a user
 * @access  Private (Admin)
 */
router.post('/users/:userId/suspend', admin_controller_1.default.suspendUser);
/**
 * @route   POST /api/v1/admin/users/:userId/unsuspend
 * @desc    Unsuspend a user
 * @access  Private (Admin)
 */
router.post('/users/:userId/unsuspend', admin_controller_1.default.unsuspendUser);
/**
 * @route   POST /api/v1/admin/users/:userId/moderate
 * @desc    Moderate a user (suspend/ban/restrict)
 */
router.post('/users/:userId/moderate', async (req, res) => {
    try {
        const { action, reason, duration } = req.body;
        // action: 'suspend' | 'ban' | 'restrict' | 'lift'
        // duration: for suspend = days (e.g. 7), for ban = hours (e.g. 1)
        const { User } = await Promise.resolve().then(() => __importStar(require('../models')));
        const targetUser = await User.findById(req.params.userId).select('email firstName moderation');
        if (!targetUser) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }
        const adminEmail = req.user?.email || 'admin';
        let suspendedUntil = null;
        let status = 'active';
        if (action === 'suspend') {
            const days = parseInt(duration) || 7;
            suspendedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
            status = 'suspended';
        }
        else if (action === 'ban') {
            const hours = parseInt(duration) || 1;
            suspendedUntil = new Date(Date.now() + hours * 60 * 60 * 1000);
            status = 'banned';
        }
        else if (action === 'restrict') {
            status = 'restricted';
        }
        else if (action === 'lift') {
            status = 'active';
        }
        else {
            res.status(400).json({ success: false, message: 'Invalid action. Use: suspend, ban, restrict, or lift' });
            return;
        }
        await User.findByIdAndUpdate(req.params.userId, {
            'moderation.status': status,
            'moderation.reason': reason || 'Violation of community guidelines',
            'moderation.suspendedUntil': suspendedUntil,
            'moderation.restrictedAt': status === 'restricted' ? new Date() : null,
            'moderation.moderatedBy': adminEmail,
            isActive: status === 'active',
            $push: {
                'moderation.history': {
                    action,
                    reason: reason || 'Violation of community guidelines',
                    duration: duration ? `${duration} ${action === 'ban' ? 'hours' : 'days'}` : null,
                    by: adminEmail,
                    at: new Date(),
                },
            },
        });
        // Send email notification
        try {
            const { Resend } = await Promise.resolve().then(() => __importStar(require('resend')));
            const resend = new Resend(process.env.RESEND_API_KEY);
            const fromEmail = process.env.RESEND_FROM_EMAIL || 'Roomie <support@roomieng.com>';
            const actionLabels = {
                suspend: `suspended for ${duration || 7} days`,
                ban: `temporarily banned for ${duration || 1} hour(s)`,
                restrict: 'permanently restricted',
                lift: 'reactivated',
            };
            await resend.emails.send({
                to: targetUser.email,
                from: fromEmail,
                subject: action === 'lift' ? 'Account Reactivated - Roomie' : 'Account Action Notice - Roomie',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #0d9488;">Roomie</h2>
            <p>Hi ${targetUser.firstName},</p>
            ${action === 'lift' ? `
              <p>Good news! Your Roomie account has been reactivated. You can now log in and use the app normally.</p>
            ` : `
              <p>Your Roomie account has been <strong>${actionLabels[action]}</strong>.</p>
              <p><strong>Reason:</strong> ${reason || 'Violation of community guidelines'}</p>
              ${suspendedUntil ? `<p><strong>Until:</strong> ${suspendedUntil.toLocaleDateString('en-NG', { dateStyle: 'full' })}</p>` : ''}
              ${status === 'restricted' ? '<p>This is a permanent restriction. If you believe this is an error, please contact us.</p>' : ''}
            `}
            <p>If you have questions, contact us at <a href="mailto:support@roomieng.com">support@roomieng.com</a></p>
            <p style="color: #6b7280; font-size: 12px;">— The Roomie Team</p>
          </div>
        `,
            });
        }
        catch (e) {
            console.warn('Moderation email failed:', e);
        }
        // Push real-time moderation event to user via socket
        try {
            const { emitToUser } = await Promise.resolve().then(() => __importStar(require('../config/socket.config')));
            if (action !== 'lift') {
                const actionLabels = {
                    suspend: `Your account has been suspended for ${duration || 7} days.`,
                    ban: `Your account has been temporarily banned for ${duration || 1} hour(s).`,
                    restrict: 'Your account has been permanently restricted.',
                };
                emitToUser(req.params.userId, 'account:moderated', {
                    status,
                    reason: reason || 'Violation of community guidelines',
                    message: actionLabels[action] || 'Your account status has changed.',
                    suspendedUntil,
                });
            }
        }
        catch { }
        res.json({ success: true, message: `User ${action === 'lift' ? 'reactivated' : action + 'ed'} successfully` });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
/**
 * @route   DELETE /api/v1/admin/users/:userId
 * @desc    Delete a user
 * @access  Private (Admin)
 */
router.delete('/users/:userId', admin_controller_1.default.deleteUser);
// Match management routes
/**
 * @route   GET /api/v1/admin/matches
 * @desc    Get all matches with pagination
 * @access  Private (Admin)
 */
router.get('/matches', admin_controller_1.default.getMatches);
/**
 * @route   GET /api/v1/admin/matches/:matchId
 * @desc    Get match details
 * @access  Private (Admin)
 */
router.get('/matches/:matchId', admin_controller_1.default.getMatch);
/**
 * @route   DELETE /api/v1/admin/matches/:matchId
 * @desc    Delete a match
 * @access  Private (Admin)
 */
router.delete('/matches/:matchId', admin_controller_1.default.deleteMatch);
// Property management routes
/**
 * @route   GET /api/v1/admin/properties
 * @desc    Get all properties with pagination and filters
 * @access  Private (Admin)
 */
router.get('/properties', admin_controller_1.default.getProperties);
/**
 * @route   GET /api/v1/admin/properties/:propertyId
 * @desc    Get property details
 * @access  Private (Admin)
 */
router.get('/properties/:propertyId', admin_controller_1.default.getProperty);
/**
 * @route   PATCH /api/v1/admin/properties/:propertyId
 * @desc    Update property
 * @access  Private (Admin)
 */
router.patch('/properties/:propertyId', admin_controller_1.default.updateProperty);
/**
 * @route   DELETE /api/v1/admin/properties/:propertyId
 * @desc    Delete property
 * @access  Private (Admin)
 */
router.delete('/properties/:propertyId', admin_controller_1.default.deleteProperty);
/**
 * @route   POST /api/v1/admin/properties/:propertyId/approve
 * @desc    Approve property
 * @access  Private (Admin)
 */
router.post('/properties/:propertyId/approve', admin_controller_1.default.approveProperty);
/**
 * @route   POST /api/v1/admin/properties/:propertyId/reject
 * @desc    Reject property
 * @access  Private (Admin)
 */
router.post('/properties/:propertyId/reject', admin_controller_1.default.rejectProperty);
// Report management routes
router.get('/reports', admin_controller_1.default.getReports);
router.get('/reports/:reportId', admin_controller_1.default.getReport);
router.patch('/reports/:reportId', admin_controller_1.default.updateReport);
// Listing Inquiries (admin)
router.get('/listing-inquiries', async (req, res) => {
    try {
        const { ListingInquiry } = await Promise.resolve().then(() => __importStar(require('../models')));
        const { page = 1, limit = 20, status } = req.query;
        const query = {};
        if (status && status !== 'all')
            query.status = status;
        const inquiries = await ListingInquiry.find(query)
            .populate('seeker', 'firstName lastName email profilePhoto')
            .populate('lister', 'firstName lastName email profilePhoto')
            .populate('property', 'title price photos location')
            .sort({ updatedAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));
        const total = await ListingInquiry.countDocuments(query);
        res.json({ success: true, data: { inquiries, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// Rental Agreements (admin)
router.get('/rental-agreements', async (req, res) => {
    try {
        const { RentalAgreement } = await Promise.resolve().then(() => __importStar(require('../models')));
        const { page = 1, limit = 20, status } = req.query;
        const query = {};
        if (status && status !== 'all')
            query.status = status;
        const agreements = await RentalAgreement.find(query)
            .populate('landlord.user', 'firstName lastName email profilePhoto')
            .populate('tenant.user', 'firstName lastName email profilePhoto')
            .populate('property', 'title price photos location')
            .sort({ updatedAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));
        const total = await RentalAgreement.countDocuments(query);
        res.json({ success: true, data: { agreements, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// Reviews (admin)
router.get('/reviews', async (req, res) => {
    try {
        const { Review } = await Promise.resolve().then(() => __importStar(require('../models')));
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// Toggle review visibility (admin)
router.put('/reviews/:reviewId/visibility', async (req, res) => {
    try {
        const { Review } = await Promise.resolve().then(() => __importStar(require('../models')));
        const review = await Review.findById(req.params.reviewId);
        if (!review) {
            res.status(404).json({ success: false, message: 'Review not found' });
            return;
        }
        review.isVisible = !review.isVisible;
        await review.save();
        res.json({ success: true, data: review });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// Pending verification requests (admin)
router.get('/verification-requests', async (req, res) => {
    try {
        const { User } = await Promise.resolve().then(() => __importStar(require('../models')));
        const { page = 1, limit = 20 } = req.query;
        const query = { verified: false, isActive: true, 'metadata.verificationStatus': 'pending' };
        const users = await User.find(query)
            .select('firstName lastName email profilePhoto socialLinks createdAt metadata')
            .sort({ 'metadata.verificationRequestedAt': -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));
        const total = await User.countDocuments(query);
        res.json({ success: true, data: { users, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// Approve verification (admin)
router.post('/verification-requests/:userId/approve', async (req, res) => {
    try {
        const { User } = await Promise.resolve().then(() => __importStar(require('../models')));
        await User.findByIdAndUpdate(req.params.userId, {
            $set: { verified: true, 'metadata.verificationStatus': 'approved', 'metadata.verificationRequested': false },
        });
        res.json({ success: true, message: 'User verified successfully' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// Reject verification (admin)
router.post('/verification-requests/:userId/reject', async (req, res) => {
    try {
        const { User } = await Promise.resolve().then(() => __importStar(require('../models')));
        const { reason } = req.body;
        await User.findByIdAndUpdate(req.params.userId, {
            $set: {
                'metadata.verificationStatus': 'rejected',
                'metadata.verificationRejectionReason': reason || 'Documents did not meet requirements',
                'metadata.verificationRequested': false,
            },
        });
        res.json({ success: true, message: 'Verification rejected' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// Subscription management (admin)
router.get('/subscriptions', async (req, res) => {
    try {
        const { User } = await Promise.resolve().then(() => __importStar(require('../models')));
        const { page = 1, limit = 20, plan } = req.query;
        const query = { 'subscription.plan': { $ne: 'free' } };
        if (plan && plan !== 'all')
            query['subscription.plan'] = plan;
        const users = await User.find(query)
            .select('firstName lastName email profilePhoto subscription createdAt')
            .sort({ 'subscription.startDate': -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));
        const total = await User.countDocuments(query);
        res.json({ success: true, data: { subscribers: users, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// Grant premium manually (admin)
router.post('/subscriptions/:userId/grant', async (req, res) => {
    try {
        const premiumService = (await Promise.resolve().then(() => __importStar(require('../services/premium.service')))).default;
        const { plan = 'premium', months = 1 } = req.body;
        const user = await premiumService.activateSubscription(req.params.userId, plan, months);
        res.json({ success: true, data: { subscription: user.subscription } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// Revoke subscription (admin)
router.post('/subscriptions/:userId/revoke', async (req, res) => {
    try {
        const { User } = await Promise.resolve().then(() => __importStar(require('../models')));
        await User.findByIdAndUpdate(req.params.userId, {
            $set: { 'subscription.plan': 'free', 'subscription.endDate': new Date(), 'subscription.autoRenew': false },
        });
        res.json({ success: true, message: 'Subscription revoked' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// Gift points to user (admin)
router.post('/users/:userId/gift-points', async (req, res) => {
    try {
        const pointsService = (await Promise.resolve().then(() => __importStar(require('../services/points.service')))).default;
        const { amount, reason } = req.body;
        if (!amount || amount < 1) {
            res.status(400).json({ success: false, message: 'Amount must be at least 1' });
            return;
        }
        const result = await pointsService.addPoints({
            userId: req.params.userId,
            amount: Math.floor(amount),
            type: 'bonus',
            reason: reason || 'Admin gift',
            metadata: { giftedBy: 'admin' },
        });
        res.json({ success: true, data: { newBalance: result.newBalance, leveledUp: result.leveledUp, newLevel: result.newLevel } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// Challenge management (admin)
router.post('/challenges', async (req, res) => {
    try {
        const weeklyChallengeService = (await Promise.resolve().then(() => __importStar(require('../services/weeklyChallenge.service')))).default;
        const challenge = await weeklyChallengeService.createChallenge({ ...req.body, createdBy: req.user?.userId });
        res.status(201).json({ success: true, data: challenge });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
router.get('/challenges', async (req, res) => {
    try {
        const { Challenge } = await Promise.resolve().then(() => __importStar(require('../models')));
        const { page = 1, limit = 20, type } = req.query;
        const query = {};
        if (type && type !== 'all')
            query.type = type;
        const challenges = await Challenge.find(query).sort({ createdAt: -1 }).skip((Number(page) - 1) * Number(limit)).limit(Number(limit));
        const total = await Challenge.countDocuments(query);
        res.json({ success: true, data: { challenges, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
router.delete('/challenges/:id', async (req, res) => {
    try {
        const { Challenge } = await Promise.resolve().then(() => __importStar(require('../models')));
        await Challenge.findByIdAndUpdate(req.params.id, { isActive: false });
        res.json({ success: true, message: 'Challenge deactivated' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// Notification broadcast (admin)
router.post('/notifications/broadcast', async (req, res) => {
    try {
        const weeklyChallengeService = (await Promise.resolve().then(() => __importStar(require('../services/weeklyChallenge.service')))).default;
        const { title, body, type } = req.body;
        if (!title || !body) {
            res.status(400).json({ success: false, message: 'Title and body required' });
            return;
        }
        const sent = await weeklyChallengeService.broadcastNotification({ title, body, type });
        res.json({ success: true, message: `Notification sent to ${sent} users`, data: { sent } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// Send notification to specific user (admin)
router.post('/notifications/send', async (req, res) => {
    try {
        const notificationService = (await Promise.resolve().then(() => __importStar(require('../services/notification.service')))).default;
        const { userId, title, body, type } = req.body;
        if (!userId || !title || !body) {
            res.status(400).json({ success: false, message: 'userId, title, and body required' });
            return;
        }
        await notificationService.createNotification({ user: userId, type: type || 'system', title, body });
        res.json({ success: true, message: 'Notification sent' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// Notification history (admin)
router.get('/notifications/history', async (req, res) => {
    try {
        const { Notification } = await Promise.resolve().then(() => __importStar(require('../models')));
        const { page = 1, limit = 20, type } = req.query;
        const query = {};
        if (type && type !== 'all')
            query.type = type;
        const [notifications, total] = await Promise.all([
            Notification.find(query)
                .populate('user', 'firstName lastName email profilePhoto')
                .sort({ createdAt: -1 })
                .skip((Number(page) - 1) * Number(limit))
                .limit(Number(limit))
                .lean(),
            Notification.countDocuments(query),
        ]);
        const stats = await Notification.aggregate([
            { $group: { _id: null, total: { $sum: 1 }, sent: { $sum: { $cond: ['$sent', 1, 0] } }, read: { $sum: { $cond: ['$read', 1, 0] } } } },
        ]);
        res.json({
            success: true,
            data: {
                notifications,
                pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
                stats: stats[0] || { total: 0, sent: 0, read: 0 },
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// Send notification to a segment of users (admin)
router.post('/notifications/segment', async (req, res) => {
    try {
        const notificationService = (await Promise.resolve().then(() => __importStar(require('../services/notification.service')))).default;
        const { User } = await Promise.resolve().then(() => __importStar(require('../models')));
        const { title, body, type, segment } = req.body;
        if (!title || !body || !segment) {
            res.status(400).json({ success: false, message: 'title, body, and segment required' });
            return;
        }
        // Build query based on segment
        const query = { isActive: true };
        switch (segment) {
            case 'verified':
                query.verified = true;
                break;
            case 'unverified':
                query.verified = { $ne: true };
                break;
            case 'premium':
                query['subscription.plan'] = { $in: ['premium', 'pro'] };
                break;
            case 'with_matches': break; // all active users — matches checked differently
            case 'inactive_7d':
                query.lastActive = { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
                break;
            case 'inactive_30d':
                query.lastActive = { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
                break;
            default: break; // 'all' — no filter
        }
        const users = await User.find(query).select('_id').lean();
        let sent = 0;
        for (const user of users) {
            try {
                await notificationService.createNotification({
                    user: user._id.toString(),
                    type: type || 'system',
                    title,
                    body,
                });
                sent++;
            }
            catch { }
        }
        res.json({ success: true, message: `Notification sent to ${sent} users`, data: { sent, segment } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// Game management routes
router.get('/games', admin_controller_1.default.getGames);
router.get('/games/sessions', admin_controller_1.default.getGameSessions);
router.get('/games/stats', admin_controller_1.default.getGameStats);
// Group management routes
router.get('/groups', admin_controller_1.default.getGroups);
router.get('/groups/:groupId', admin_controller_1.default.getGroup);
router.delete('/groups/:groupId', admin_controller_1.default.deleteGroup);
// Analytics routes
router.get('/analytics', admin_controller_1.default.getAnalytics);
router.get('/dashboard/activity', admin_controller_1.default.getRecentActivity);
router.get('/export/:type', admin_controller_1.default.exportData);
// Points / Purchase management routes
router.get('/points/overview', admin_controller_1.default.getPointsOverview);
router.get('/points/purchases', admin_controller_1.default.getPurchases);
router.post('/points/purchases/:transactionId/approve', admin_controller_1.default.approvePurchase);
router.post('/points/purchases/:transactionId/reject', admin_controller_1.default.rejectPurchase);
// App version management
router.get('/app-version', admin_controller_1.default.getAppVersion);
router.put('/app-version', admin_controller_1.default.updateAppVersion);
// Audit log routes
router.get('/audit-logs', admin_controller_1.default.getAuditLogs);
router.get('/audit-logs/stats', admin_controller_1.default.getAuditStats);
router.get('/audit-logs/user/:userId', admin_controller_1.default.getUserAuditTrail);
router.get('/audit-logs/:logId', admin_controller_1.default.getAuditLog);
// Study Buddy admin routes
router.get('/study-buddy/sessions', admin_controller_1.default.getStudySessions);
router.get('/study-buddy/stats', admin_controller_1.default.getStudyStats);
router.delete('/study-buddy/sessions/:sessionId', admin_controller_1.default.deleteStudySession);
router.get('/study-buddy/categories', admin_controller_1.default.getStudyCategories);
router.post('/study-buddy/categories', admin_controller_1.default.createStudyCategory);
router.post('/study-buddy/categories/:category/questions', admin_controller_1.default.addStudyQuestion);
router.delete('/study-buddy/questions/:questionId', admin_controller_1.default.deleteStudyQuestion);
// Events admin routes
router.post('/events', admin_controller_1.default.createAdminEvent);
router.get('/events', admin_controller_1.default.getAdminEvents);
router.get('/events/stats', admin_controller_1.default.getEventStats);
router.post('/events/:eventId/cancel', admin_controller_1.default.adminCancelEvent);
router.delete('/events/:eventId', admin_controller_1.default.adminDeleteEvent);
// Confessions admin routes
router.get('/confessions', admin_controller_1.default.getAdminConfessions);
router.get('/confessions/stats', admin_controller_1.default.getConfessionStats);
router.post('/confessions/:confessionId/hide', admin_controller_1.default.hideConfession);
router.delete('/confessions/:confessionId', admin_controller_1.default.adminDeleteConfession);
// Clan admin routes
router.get('/clans', async (req, res) => {
    try {
        const { Clan } = await Promise.resolve().then(() => __importStar(require('../models')));
        const { page = 1, limit = 20, search } = req.query;
        const query = {};
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
router.get('/clans/:clanId', async (req, res) => {
    try {
        const { Clan } = await Promise.resolve().then(() => __importStar(require('../models')));
        const clan = await Clan.findById(req.params.clanId)
            .populate('leader', 'firstName lastName email profilePhoto')
            .populate('coLeaders', 'firstName lastName email profilePhoto')
            .populate('members.user', 'firstName lastName email profilePhoto');
        if (!clan) {
            res.status(404).json({ success: false, message: 'Clan not found' });
            return;
        }
        res.json({ success: true, data: clan });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
router.delete('/clans/:clanId', async (req, res) => {
    try {
        const { Clan, ClanWar } = await Promise.resolve().then(() => __importStar(require('../models')));
        const clan = await Clan.findById(req.params.clanId);
        if (!clan) {
            res.status(404).json({ success: false, message: 'Clan not found' });
            return;
        }
        await ClanWar.updateMany({ $or: [{ challenger: req.params.clanId }, { defender: req.params.clanId }], status: { $in: ['pending', 'accepted', 'in_progress'] } }, { $set: { status: 'expired' } });
        await Clan.findByIdAndDelete(req.params.clanId);
        res.json({ success: true, message: `Clan ${clan.name} [${clan.tag}] disbanded by admin` });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// Grant points/treasury to a clan (admin)
router.post('/clans/:clanId/grant', async (req, res) => {
    try {
        const { Clan } = await Promise.resolve().then(() => __importStar(require('../models')));
        const { totalPoints, treasury, level } = req.body;
        const clan = await Clan.findById(req.params.clanId);
        if (!clan) {
            res.status(404).json({ success: false, message: 'Clan not found' });
            return;
        }
        if (totalPoints) {
            clan.totalPoints += totalPoints;
            clan.weeklyPoints += totalPoints;
            clan.monthlyPoints += totalPoints;
        }
        if (treasury)
            clan.treasury = (clan.treasury || 0) + treasury;
        if (level) {
            clan.level = level;
            clan.maxMembers = 10 + (level - 1) * 5;
        }
        await clan.save();
        res.json({ success: true, data: { name: clan.name, tag: clan.tag, totalPoints: clan.totalPoints, treasury: clan.treasury, level: clan.level } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
router.get('/clan-wars', async (req, res) => {
    try {
        const { ClanWar } = await Promise.resolve().then(() => __importStar(require('../models')));
        const { page = 1, limit = 20, status } = req.query;
        const query = {};
        if (status && status !== 'all')
            query.status = status;
        const wars = await ClanWar.find(query)
            .populate('challenger', 'name tag emoji')
            .populate('defender', 'name tag emoji')
            .sort({ createdAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));
        const total = await ClanWar.countDocuments(query);
        res.json({ success: true, data: { wars, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=admin.routes.js.map