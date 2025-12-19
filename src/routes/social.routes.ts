// src/routes/social.routes.ts
import { Router } from 'express';
import socialAuthController from '../controllers/social-auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// OAuth initiation routes (require auth to know which user)
router.get('/facebook/auth', authenticate, socialAuthController.initiateFacebookAuth);
router.get('/instagram/auth', authenticate, socialAuthController.initiateInstagramAuth);
router.get('/twitter/auth', authenticate, socialAuthController.initiateTwitterAuth);

// OAuth callback routes (no auth - callback from social platform)
router.get('/facebook/callback', socialAuthController.facebookCallback);
router.get('/instagram/callback', socialAuthController.instagramCallback);

// Protected routes
router.use(authenticate);

// Manual linking (for platforms without OAuth or as fallback)
router.post('/link', socialAuthController.linkManually);

// Unlink social account
router.delete('/unlink/:platform', socialAuthController.unlinkSocial);

// Get social links
router.get('/', socialAuthController.getSocialLinks);

// Verify connection
router.get('/verify/:platform', socialAuthController.verifySocialConnection);

export default router;