"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const premium_service_1 = __importDefault(require("../services/premium.service"));
const paystack_service_1 = __importDefault(require("../services/paystack.service"));
const User_1 = require("../models/User");
const logger_1 = __importDefault(require("../utils/logger"));
// Subscription plans
const PLANS = [
    { id: 'premium_monthly', plan: 'premium', months: 1, price: 2000, label: 'Premium Monthly' },
    { id: 'premium_quarterly', plan: 'premium', months: 3, price: 5000, label: 'Premium Quarterly', savings: '17%' },
    { id: 'premium_yearly', plan: 'premium', months: 12, price: 18000, label: 'Premium Yearly', savings: '25%' },
    { id: 'pro_monthly', plan: 'pro', months: 1, price: 2500, label: 'Pro Monthly' },
    { id: 'pro_quarterly', plan: 'pro', months: 3, price: 6500, label: 'Pro Quarterly', savings: '13%' },
    { id: 'pro_yearly', plan: 'pro', months: 12, price: 24000, label: 'Pro Yearly', savings: '20%' },
];
class PremiumController {
    /**
     * Get premium status and available plans
     */
    async getStatus(req, res) {
        try {
            const status = await premium_service_1.default.getPremiumStatus(req.user?.userId);
            res.json({ success: true, data: { ...status, plans: PLANS } });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * Subscribe to a plan via Paystack
     */
    async subscribe(req, res) {
        try {
            const userId = req.user?.userId;
            const { planId } = req.body;
            if (!planId) {
                res.status(400).json({ success: false, message: 'planId is required' });
                return;
            }
            const plan = PLANS.find(p => p.id === planId);
            if (!plan) {
                res.status(400).json({ success: false, message: 'Invalid plan' });
                return;
            }
            const user = await User_1.User.findById(userId).select('email firstName lastName verified');
            if (!user) {
                res.status(404).json({ success: false, message: 'User not found' });
                return;
            }
            if (!user.verified) {
                res.status(403).json({ success: false, message: 'You must be a verified user to subscribe. Please verify your profile first.' });
                return;
            }
            const { Transaction } = require('../models');
            const reference = `sub_${userId}_${Date.now()}`;
            await Transaction.create({
                user: userId,
                type: 'subscription',
                amount: plan.price,
                currency: 'NGN',
                status: 'pending',
                provider: 'paystack',
                providerReference: reference,
                description: `${plan.label} subscription`,
                metadata: { planId: plan.id, plan: plan.plan, months: plan.months },
            });
            const paystack = await paystack_service_1.default.initializeTransaction({
                email: user.email,
                amount: plan.price * 100,
                reference,
                metadata: { userId, planId: plan.id, plan: plan.plan, months: plan.months, type: 'subscription' },
            });
            res.json({
                success: true,
                data: {
                    reference,
                    authorization_url: paystack.authorization_url,
                    plan: plan.plan,
                    months: plan.months,
                    amount: plan.price,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Subscribe error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * Verify subscription payment
     */
    async verifySubscription(req, res) {
        try {
            const userId = req.user?.userId;
            const { reference } = req.body;
            if (!reference) {
                res.status(400).json({ success: false, message: 'reference is required' });
                return;
            }
            const { Transaction } = require('../models');
            const transaction = await Transaction.findOne({ providerReference: reference });
            if (!transaction) {
                res.status(404).json({ success: false, message: 'Transaction not found' });
                return;
            }
            if (transaction.status === 'completed') {
                res.json({ success: true, message: 'Already activated', data: { status: 'completed' } });
                return;
            }
            const paystack = await paystack_service_1.default.verifyTransaction(reference);
            if (paystack.status === 'success') {
                transaction.status = 'completed';
                transaction.providerMetadata = paystack;
                await transaction.save();
                const plan = transaction.metadata?.plan || 'premium';
                const months = transaction.metadata?.months || 1;
                await premium_service_1.default.activateSubscription(userId, plan, months);
                res.json({
                    success: true,
                    message: `${plan.charAt(0).toUpperCase() + plan.slice(1)} activated for ${months} month(s)!`,
                    data: { status: 'completed', plan, months },
                });
            }
            else {
                transaction.status = 'failed';
                transaction.providerMetadata = paystack;
                await transaction.save();
                res.json({ success: false, message: 'Payment failed', data: { status: 'failed' } });
            }
        }
        catch (error) {
            logger_1.default.error('Verify subscription error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * Cancel subscription
     */
    async cancel(req, res) {
        try {
            await premium_service_1.default.cancelSubscription(req.user?.userId);
            res.json({ success: true, message: 'Subscription will not renew' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * Boost profile
     */
    async boost(req, res) {
        try {
            await premium_service_1.default.boostProfile(req.user?.userId);
            res.json({ success: true, message: 'Profile boosted for the next 2 hours!' });
        }
        catch (error) {
            const code = error.message.includes('Premium') ? 403 : 500;
            res.status(code).json({ success: false, message: error.message });
        }
    }
    /**
     * Get profile visitors
     */
    async getVisitors(req, res) {
        try {
            const visitors = await premium_service_1.default.getProfileVisitors(req.user?.userId);
            res.json({ success: true, data: visitors });
        }
        catch (error) {
            const code = error.message.includes('Premium') ? 403 : 500;
            res.status(code).json({ success: false, message: error.message });
        }
    }
    /**
     * Rewind last pass (premium only)
     */
    async rewind(req, res) {
        try {
            const userId = req.user?.userId;
            const user = await User_1.User.findById(userId);
            if (!user) {
                res.status(404).json({ success: false, message: 'User not found' });
                return;
            }
            if (!premium_service_1.default.isPremium(user)) {
                res.status(403).json({ success: false, message: 'Premium required' });
                return;
            }
            // Check last action from metadata
            const lastAction = user.metadata?.lastSwipeAction;
            const lastSwipedUserId = user.metadata?.lastSwipedUserId;
            logger_1.default.info(`Rewind: user ${userId} — lastAction: ${lastAction}, lastSwiped: ${lastSwipedUserId}, passes: ${user.passes?.length || 0}, likes: ${user.likes?.length || 0}`);
            if (!lastSwipedUserId) {
                res.status(400).json({ success: false, message: 'No recent action to rewind' });
                return;
            }
            if (lastAction === 'pass') {
                // Remove from passes
                user.passes = user.passes.filter((p) => p.toString() !== lastSwipedUserId);
            }
            else if (lastAction === 'like') {
                // Remove from likes and refund points if a match wasn't made
                user.likes = user.likes.filter((l) => l.toString() !== lastSwipedUserId);
                // Check if it resulted in a match — if so, delete the match too
                const { Match, Message } = require('../models');
                const match = await Match.findOne({
                    $or: [
                        { user1: userId, user2: lastSwipedUserId },
                        { user1: lastSwipedUserId, user2: userId },
                    ],
                    type: 'match',
                    status: 'active',
                });
                if (match) {
                    // Only delete if no messages were exchanged
                    const msgCount = await Message.countDocuments({ match: match._id });
                    if (msgCount === 0) {
                        await Match.deleteOne({ _id: match._id });
                        logger_1.default.info(`Rewind: deleted match ${match._id} (no messages)`);
                    }
                }
            }
            // Clear last action
            user.metadata = {
                ...user.metadata,
                lastSwipeAction: null,
                lastSwipedUserId: null,
            };
            await user.save();
            const rewindedUser = await User_1.User.findById(lastSwipedUserId)
                .select('firstName lastName profilePhoto bio occupation location interests verified subscription');
            res.json({
                success: true,
                message: `Rewound! ${rewindedUser?.firstName || 'User'} is back in your feed.`,
                data: { user: rewindedUser, action: lastAction },
            });
        }
        catch (error) {
            logger_1.default.error('Rewind error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * Check swipe limit
     */
    async checkSwipeLimit(req, res) {
        try {
            const result = await premium_service_1.default.checkSwipeLimit(req.user?.userId);
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.default = new PremiumController();
//# sourceMappingURL=premium.controller.js.map