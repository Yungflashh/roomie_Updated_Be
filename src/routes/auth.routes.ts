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




/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', validate(registerValidation), authController.register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', validate(loginValidation), authController.login);

/**
 * @route   POST /api/v1/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh-token', validate(refreshTokenValidation), authController.refreshToken);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authenticate, authController.getMe);

/**
 * @route   PUT /api/v1/auth/fcm-token
 * @desc    Update FCM token
 * @access  Private
 */
router.put('/fcm-token', authenticate, authController.updateFcmToken);

/**
 * @route   PUT /api/v1/auth/change-password
 * @desc    Change password
 * @access  Private
 */
router.put('/change-password', authenticate, authController.changePassword);

/**
 * @route   DELETE /api/v1/auth/account
 * @desc    Delete account
 * @access  Private
 */
router.delete('/account', authenticate, authController.deleteAccount);



router.get('/streak', authenticate, authController.getStreak);

/**
 * @route   POST /api/v1/auth/send-verification
 * @desc    Send email verification OTP
 * @access  Private
 */
router.post('/send-verification', authenticate, authController.sendVerification);

/**
 * @route   POST /api/v1/auth/verify-email
 * @desc    Verify email with OTP code
 * @access  Private
 */
router.post('/verify-email', authenticate, authController.verifyEmail);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Request password reset code
 * @access  Public
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * @route   POST /api/v1/auth/verify-reset-code
 * @desc    Verify password reset OTP
 * @access  Public
 */
router.post('/verify-reset-code', authController.verifyResetCode);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', authController.resetPassword);

export default router;
