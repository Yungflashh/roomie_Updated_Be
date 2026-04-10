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
const auth_routes_1 = __importDefault(require("./auth.routes"));
const user_routes_1 = __importDefault(require("./user.routes"));
const match_routes_1 = __importDefault(require("./match.routes"));
const message_routes_1 = __importDefault(require("./message.routes"));
const property_routes_1 = __importDefault(require("./property.routes"));
const game_routes_1 = __importDefault(require("./game.routes"));
const challenge_routes_1 = __importDefault(require("./challenge.routes"));
const discovery_routes_1 = __importDefault(require("./discovery.routes"));
const social_routes_1 = __importDefault(require("./social.routes"));
const notification_routes_1 = __importDefault(require("./notification.routes"));
const roommate_routes_1 = __importDefault(require("./roommate.routes"));
const roommateFeatures_routes_1 = __importDefault(require("./roommateFeatures.routes"));
const roommateGroup_routes_1 = __importDefault(require("./roommateGroup.routes"));
const roommateAgreement_routes_1 = __importDefault(require("./roommateAgreement.routes"));
const groupAgreement_routes_1 = __importDefault(require("./groupAgreement.routes"));
const admin_routes_1 = __importDefault(require("./admin.routes"));
const points_routes_1 = __importDefault(require("./points.routes"));
const home_routes_1 = __importDefault(require("./home.routes"));
const roommateSettings_routes_1 = __importDefault(require("./roommateSettings.routes"));
const studyBuddy_routes_1 = __importDefault(require("./studyBuddy.routes"));
const event_routes_1 = __importDefault(require("./event.routes"));
const confession_routes_1 = __importDefault(require("./confession.routes"));
const listingInquiry_routes_1 = __importDefault(require("./listingInquiry.routes"));
const rentalAgreement_routes_1 = __importDefault(require("./rentalAgreement.routes"));
const review_routes_1 = __importDefault(require("./review.routes"));
const roommateReview_routes_1 = __importDefault(require("./roommateReview.routes"));
const premium_routes_1 = __importDefault(require("./premium.routes"));
const ai_routes_1 = __importDefault(require("./ai.routes"));
const clan_routes_1 = __importDefault(require("./clan.routes"));
const cosmetic_routes_1 = __importDefault(require("./cosmetic.routes"));
const movingOut_routes_1 = __importDefault(require("./movingOut.routes"));
// weeklyChallengeRoutes consolidated into challengeRoutes
// import weeklyChallengeRoutes from './weeklyChallenge.routes';
const router = (0, express_1.Router)();
// API v1 routes
const rateLimiter_1 = require("../middleware/rateLimiter");
router.use('/auth', rateLimiter_1.authLimiter, auth_routes_1.default);
router.use('/users', user_routes_1.default);
router.use('/matches', match_routes_1.default);
router.use('/messages', message_routes_1.default);
router.use('/properties', property_routes_1.default);
router.use('/games', game_routes_1.default);
router.use('/challenges', challenge_routes_1.default);
router.use('/discover', discovery_routes_1.default);
router.use('/social', social_routes_1.default);
router.use('/notifications', notification_routes_1.default);
router.use('/roommates', roommate_routes_1.default);
router.use('/roommate-features', roommateFeatures_routes_1.default);
router.use('/roommate-groups', roommateGroup_routes_1.default);
router.use('/roommate-agreements', roommateAgreement_routes_1.default);
router.use('/group-agreements', groupAgreement_routes_1.default);
router.use('/admin', admin_routes_1.default);
router.use('/points', points_routes_1.default);
router.use('/home', home_routes_1.default);
router.use('/roommate-settings', roommateSettings_routes_1.default);
router.use('/study-buddy', studyBuddy_routes_1.default);
router.use('/events', event_routes_1.default);
router.use('/confessions', confession_routes_1.default);
router.use('/listing-inquiries', listingInquiry_routes_1.default);
router.use('/rental-agreements', rentalAgreement_routes_1.default);
router.use('/reviews', review_routes_1.default);
router.use('/roommate-reviews', roommateReview_routes_1.default);
router.use('/premium', premium_routes_1.default);
router.use('/ai', ai_routes_1.default);
router.use('/clans', clan_routes_1.default);
router.use('/cosmetics', cosmetic_routes_1.default);
router.use('/moving-out', movingOut_routes_1.default);
const activity_routes_1 = __importDefault(require("./activity.routes"));
router.use('/activity', activity_routes_1.default);
const clanCompetition_routes_1 = __importDefault(require("./clanCompetition.routes"));
router.use('/clan-competition', clanCompetition_routes_1.default);
// router.use('/challenges', weeklyChallengeRoutes);
// Paystack webhook (no auth — verified by signature)
router.post('/paystack/webhook', async (req, res) => {
    try {
        const paystackService = (await Promise.resolve().then(() => __importStar(require('../services/paystack.service')))).default;
        const signature = req.headers['x-paystack-signature'];
        const rawBody = JSON.stringify(req.body);
        if (!paystackService.validateWebhook(rawBody, signature || '')) {
            res.status(401).json({ message: 'Invalid signature' });
            return;
        }
        const event = req.body;
        if (event.event === 'charge.success') {
            const { reference } = event.data;
            const { Transaction } = await Promise.resolve().then(() => __importStar(require('../models')));
            const { User } = await Promise.resolve().then(() => __importStar(require('../models')));
            const logger = (await Promise.resolve().then(() => __importStar(require('../utils/logger')))).default;
            // Handle Moving Out deal payments — identified by reference prefix
            if (reference.startsWith('ROOMIE_MVO_')) {
                try {
                    const movingOutService = (await Promise.resolve().then(() => __importStar(require('../services/movingOut.service')))).default;
                    await movingOutService.handlePaymentSuccess(reference);
                    logger.info(`Webhook: Moving Out deal payment processed — ref: ${reference}`);
                }
                catch (e) {
                    logger.error(`Webhook: Failed to process moving out payment ${reference}:`, e);
                }
                res.status(200).json({ received: true });
                return;
            }
            const transaction = await Transaction.findOne({ providerReference: reference });
            if (transaction && transaction.status === 'pending') {
                transaction.status = 'completed';
                transaction.providerMetadata = event.data;
                await transaction.save();
                if (transaction.type === 'coins') {
                    // Points purchase — credit points
                    const pointsAmount = transaction.metadata?.pointsAmount || 0;
                    await User.findByIdAndUpdate(transaction.user, {
                        $inc: { 'gamification.points': pointsAmount },
                    });
                    logger.info(`Webhook: ${pointsAmount} pts credited — ref: ${reference}`);
                }
                else if (transaction.type === 'subscription') {
                    // Subscription — activate plan
                    const premiumService = (await Promise.resolve().then(() => __importStar(require('../services/premium.service')))).default;
                    const plan = transaction.metadata?.plan || 'premium';
                    const months = transaction.metadata?.months || 1;
                    await premiumService.activateSubscription(transaction.user.toString(), plan, months);
                    logger.info(`Webhook: ${plan} subscription activated (${months}mo) — ref: ${reference}`);
                }
            }
        }
        res.status(200).json({ received: true });
    }
    catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ message: 'Webhook processing failed' });
    }
});
// Public app version check (no auth required)
router.get('/app/version', async (req, res) => {
    try {
        const { AppConfig } = await Promise.resolve().then(() => __importStar(require('../models/AppConfig')));
        const config = await AppConfig.findOne({ key: 'app_version' });
        res.json({
            success: true,
            data: config?.value || {
                currentVersion: '1.0.0',
                minVersion: '1.0.0',
                updateUrl: '',
                forceUpdate: false,
                updateMessage: '',
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// Health check
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is healthy',
        timestamp: new Date().toISOString(),
    });
});
exports.default = router;
//# sourceMappingURL=index.js.map