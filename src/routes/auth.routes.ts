import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  registerValidation,
  loginValidation,
  refreshTokenValidation,
} from '../validation/schemas';

const router = Router();

/** @route POST /api/v1/auth/register — Public */
router.post('/register', validate(registerValidation), authController.register);

/** @route POST /api/v1/auth/login — Public */
router.post('/login', validate(loginValidation), authController.login);

/** @route POST /api/v1/auth/refresh-token — Public */
router.post('/refresh-token', validate(refreshTokenValidation), authController.refreshToken);

/** @route POST /api/v1/auth/logout — Private */
router.post('/logout', authenticate, authController.logout);

/** @route GET /api/v1/auth/me — Private */
router.get('/me', authenticate, authController.getMe);

/** @route PUT /api/v1/auth/fcm-token — Private */
router.put('/fcm-token', authenticate, authController.updateFcmToken);

/** @route PUT /api/v1/auth/change-password — Private */
router.put('/change-password', authenticate, authController.changePassword);

/** @route DELETE /api/v1/auth/account — Private */
router.delete('/account', authenticate, authController.deleteAccount);

/** @route GET /api/v1/auth/streak — Private */
router.get('/streak', authenticate, authController.getStreak);

/** @route POST /api/v1/auth/send-verification — Private */
router.post('/send-verification', authenticate, authController.sendVerification);

/** @route POST /api/v1/auth/verify-email — Private */
router.post('/verify-email', authenticate, authController.verifyEmail);

/** @route POST /api/v1/auth/forgot-password — Public */
router.post('/forgot-password', authController.forgotPassword);

/** @route POST /api/v1/auth/verify-reset-code — Public */
router.post('/verify-reset-code', authController.verifyResetCode);

/** @route POST /api/v1/auth/reset-password — Public */
router.post('/reset-password', authController.resetPassword);

/** @route POST /api/v1/auth/google — Public — body: { idToken } */
router.post('/google', authController.googleLogin);

/** @route POST /api/v1/auth/apple — Public — body: { identityToken, authorizationCode, email?, firstName?, lastName? } */
router.post('/apple', authController.appleLogin);

export default router;
