import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import matchRoutes from './match.routes';
import messageRoutes from './message.routes';
import propertyRoutes from './property.routes';
import gameRoutes from './game.routes';
import challengeRoutes from './challenge.routes';
import discoveryRoutes from './discovery.routes';
import socialRoutes from './social.routes';
import notificationRoutes from './notification.routes';
import roomatesRoutes from './roommate.routes';
import roommateFeaturesRoutes from './roommateFeatures.routes';
import roommateGroupRoutes from './roommateGroup.routes';
import roommateAgreementRoutes from './roommateAgreement.routes';
import groupAgreementRoutes from './groupAgreement.routes';
import adminRoutes from "./admin.routes"
import pointsRoutes from './points.routes';
import homeRoutes from './home.routes';
import roommateSettingsRoutes from './roommateSettings.routes';
import studyBuddyRoutes from './studyBuddy.routes';
import eventRoutes from './event.routes';
import confessionRoutes from './confession.routes';
import listingInquiryRoutes from './listingInquiry.routes';
import rentalAgreementRoutes from './rentalAgreement.routes';
import reviewRoutes from './review.routes';
import roommateReviewRoutes from './roommateReview.routes';
import premiumRoutes from './premium.routes';
import aiRoutes from './ai.routes';
import clanRoutes from './clan.routes';
import cosmeticRoutes from './cosmetic.routes';
import movingOutRoutes from './movingOut.routes';
// weeklyChallengeRoutes consolidated into challengeRoutes
// import weeklyChallengeRoutes from './weeklyChallenge.routes';






const router = Router();

// API v1 routes
import { authLimiter } from '../middleware/rateLimiter';
router.use('/auth', authLimiter, authRoutes);
router.use('/users', userRoutes);
router.use('/matches', matchRoutes);
router.use('/messages', messageRoutes);
router.use('/properties', propertyRoutes);
router.use('/games', gameRoutes);
router.use('/challenges', challengeRoutes);
router.use('/discover', discoveryRoutes);
router.use('/social', socialRoutes);
router.use('/notifications', notificationRoutes);
router.use('/roommates', roomatesRoutes);
router.use('/roommate-features', roommateFeaturesRoutes);
router.use('/roommate-groups', roommateGroupRoutes);
router.use('/roommate-agreements', roommateAgreementRoutes);
router.use('/group-agreements', groupAgreementRoutes);
router.use('/admin', adminRoutes);
router.use('/points', pointsRoutes);
router.use('/home', homeRoutes);
router.use('/roommate-settings', roommateSettingsRoutes);
router.use('/study-buddy', studyBuddyRoutes);
router.use('/events', eventRoutes);
router.use('/confessions', confessionRoutes);
router.use('/listing-inquiries', listingInquiryRoutes);
router.use('/rental-agreements', rentalAgreementRoutes);
router.use('/reviews', reviewRoutes);
router.use('/roommate-reviews', roommateReviewRoutes);
router.use('/premium', premiumRoutes);
router.use('/ai', aiRoutes);
router.use('/clans', clanRoutes);
router.use('/cosmetics', cosmeticRoutes);
router.use('/moving-out', movingOutRoutes);
import activityRoutes from './activity.routes';
router.use('/activity', activityRoutes);
import clanCompetitionRoutes from './clanCompetition.routes';
router.use('/clan-competition', clanCompetitionRoutes);
// router.use('/challenges', weeklyChallengeRoutes);





// Paystack webhook (no auth — verified by signature)
router.post('/paystack/webhook', async (req, res) => {
  try {
    const paystackService = (await import('../services/paystack.service')).default;
    const signature = req.headers['x-paystack-signature'] as string;
    const rawBody = JSON.stringify(req.body);

    if (!paystackService.validateWebhook(rawBody, signature || '')) {
      res.status(401).json({ message: 'Invalid signature' });
      return;
    }

    const event = req.body;
    if (event.event === 'charge.success') {
      const { reference } = event.data;
      const { Transaction } = await import('../models');
      const { User } = await import('../models');
      const logger = (await import('../utils/logger')).default;

      // Handle Moving Out deal payments — identified by reference prefix
      if (reference.startsWith('ROOMIE_MVO_')) {
        try {
          const movingOutService = (await import('../services/movingOut.service')).default;
          await movingOutService.handlePaymentSuccess(reference);
          logger.info(`Webhook: Moving Out deal payment processed — ref: ${reference}`);
        } catch (e: any) {
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
        } else if (transaction.type === 'subscription') {
          // Subscription — activate plan
          const premiumService = (await import('../services/premium.service')).default;
          const plan = transaction.metadata?.plan || 'premium';
          const months = transaction.metadata?.months || 1;
          await premiumService.activateSubscription(transaction.user.toString(), plan, months);
          logger.info(`Webhook: ${plan} subscription activated (${months}mo) — ref: ${reference}`);
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
});

// Public app version check (no auth required)
router.get('/app/version', async (req, res) => {
  try {
    const { AppConfig } = await import('../models/AppConfig');
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
  } catch (error: any) {
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

export default router;
