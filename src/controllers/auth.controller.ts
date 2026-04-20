import { Response } from 'express';
import { AuthRequest } from '../types';
import authService from '../services/auth.service';
import { verifyRefreshToken } from '../utils/jwt';
import logger from '../utils/logger';
import { logAudit } from '../utils/audit';

class AuthController {
  /**
   * @route   POST /api/v1/auth/register
   * @access  Public
   */
  async register(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await authService.register(req.body);

      await logAudit({
        actor: { id: result.user?.id?.toString() || '', name: `${result.user?.firstName || ''} ${result.user?.lastName || ''}`, email: result.user?.email || '' },
        actorType: 'user', action: 'register', category: 'auth',
        details: 'New user registered', req,
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result,
      });
    } catch (error: any) {
      logger.error('Registration error:', error);
      const statusCode = error.message.includes('already exists') ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Registration failed',
      });
    }
  }

  /**
   * @route   POST /api/v1/auth/login
   * @access  Public
   */
  async login(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await authService.login(req.body);

      let message = 'Login successful';
      if (result.dailyReward?.awarded) {
        const points = result.dailyReward.points || 0;
        const streak = result.dailyReward.streak || 1;
        message = streak >= 7
          ? `Welcome back! +${points} points — ${streak} day streak`
          : `Welcome back! +${points} points`;
      }

      await logAudit({
        actor: { id: result.user?.id?.toString() || '', name: `${result.user?.firstName || ''} ${result.user?.lastName || ''}`, email: result.user?.email || '' },
        actorType: 'user', action: 'login', category: 'auth',
        details: 'User logged in', req,
      });

      res.status(200).json({
        success: true,
        message,
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
        dailyReward: result.dailyReward,
      });
    } catch (error: any) {
      logger.error('Login error:', error);
      const statusCode = error.message.includes('Invalid') ? 401 :
                         error.message.includes('deactivated') ? 403 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Login failed',
      });
    }
  }

  /**
   * @route   POST /api/v1/auth/refresh-token
   * @access  Public
   */
  async refreshToken(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const decoded = verifyRefreshToken(refreshToken);
      const tokens = await authService.refreshAccessToken(decoded.userId, refreshToken);

      res.status(200).json({
        success: true,
        data: tokens,
      });
    } catch (error: any) {
      logger.error('Refresh token error:', error);
      res.status(401).json({
        success: false,
        message: error.message || 'Invalid refresh token',
      });
    }
  }

  /**
   * @route   POST /api/v1/auth/logout
   * @access  Private
   */
  async logout(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (userId) {
        await authService.logout(userId);
      }

      res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed',
      });
    }
  }

  /**
   * @route   GET /api/v1/auth/me
   * @access  Private
   */
  async getMe(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const result = await authService.getUserProfileWithCompletion(userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Get me error:', error);
      res.status(404).json({
        success: false,
        message: error.message || 'User not found',
      });
    }
  }

  /**
   * @route   GET /api/v1/auth/profile-completion
   * @access  Private
   */
  async getProfileCompletion(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const completion = await authService.getProfileCompletion(userId);

      res.status(200).json({
        success: true,
        data: completion,
      });
    } catch (error: any) {
      logger.error('Get profile completion error:', error);
      res.status(404).json({
        success: false,
        message: error.message || 'User not found',
      });
    }
  }

  /**
   * @route   PUT /api/v1/auth/fcm-token
   * @access  Private
   */
  async updateFcmToken(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { fcmToken } = req.body;

      if (fcmToken === undefined) {
        res.status(400).json({
          success: false,
          message: 'fcmToken is required in request body',
        });
        return;
      }

      await authService.updateFcmToken(userId, fcmToken);

      res.status(200).json({
        success: true,
        message: 'FCM token updated',
      });
    } catch (error) {
      logger.error('Update FCM token error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update FCM token',
      });
    }
  }

  /**
   * @route   PUT /api/v1/auth/change-password
   * @access  Private
   */
  async changePassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { currentPassword, newPassword } = req.body;

      await authService.changePassword(userId, currentPassword, newPassword);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error: any) {
      logger.error('Change password error:', error);
      const statusCode = error.message.includes('incorrect') ? 401 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to change password',
      });
    }
  }

  /**
   * @route   DELETE /api/v1/auth/account
   * @access  Private
   */
  async deleteAccount(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { password } = req.body;

      await authService.deleteAccount(userId, password);

      res.status(200).json({
        success: true,
        message: 'Account deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete account error:', error);
      const statusCode = error.message.includes('incorrect') ? 401 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to delete account',
      });
    }
  }

  /**
   * @route   GET /api/v1/auth/streak
   * @access  Private
   */
  async getStreak(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const streak = await authService.getUserStreak(userId);

      res.status(200).json({
        success: true,
        data: streak,
      });
    } catch (error: any) {
      logger.error('Get streak error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get streak',
      });
    }
  }

  /**
   * @route   POST /api/v1/auth/send-verification
   * @access  Private
   */
  async sendVerification(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      await authService.sendVerificationEmail(userId);

      res.status(200).json({
        success: true,
        message: 'Verification code sent to your email',
      });
    } catch (error: any) {
      logger.error('Send verification error:', error);
      const statusCode = error.message.includes('already verified') ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to send verification email',
      });
    }
  }

  /**
   * @route   POST /api/v1/auth/verify-email
   * @access  Private
   */
  async verifyEmail(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { code } = req.body;

      if (!code) {
        res.status(400).json({ success: false, message: 'Verification code is required' });
        return;
      }

      await authService.verifyEmail(userId, code);

      res.status(200).json({
        success: true,
        message: 'Email verified successfully',
      });
    } catch (error: any) {
      logger.error('Verify email error:', error);
      const statusCode = error.message.includes('Invalid') || error.message.includes('expired') ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Verification failed',
      });
    }
  }

  /**
   * @route   POST /api/v1/auth/forgot-password
   * @access  Public
   */
  async forgotPassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ success: false, message: 'Email is required' });
        return;
      }

      await authService.forgotPassword(email);

      // Always return success to prevent email enumeration
      res.status(200).json({
        success: true,
        message: 'If an account exists with that email, a reset code has been sent',
      });
    } catch (error: any) {
      logger.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process request',
      });
    }
  }

  /**
   * @route   POST /api/v1/auth/verify-reset-code
   * @access  Public
   */
  async verifyResetCode(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        res.status(400).json({ success: false, message: 'Email and code are required' });
        return;
      }

      const resetToken = await authService.verifyResetCode(email, code);

      res.status(200).json({
        success: true,
        message: 'Code verified',
        data: { resetToken },
      });
    } catch (error: any) {
      logger.error('Verify reset code error:', error);
      const statusCode = error.message.includes('Invalid') || error.message.includes('expired') ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Verification failed',
      });
    }
  }

  /**
   * @route   POST /api/v1/auth/reset-password
   * @access  Public
   */
  async resetPassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email, resetToken, newPassword } = req.body;

      if (!email || !resetToken || !newPassword) {
        res.status(400).json({ success: false, message: 'Email, reset token, and new password are required' });
        return;
      }

      await authService.resetPassword(email, resetToken, newPassword);

      res.status(200).json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error: any) {
      logger.error('Reset password error:', error);
      const statusCode = error.message.includes('Invalid') || error.message.includes('expired') ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Password reset failed',
      });
    }
  }

  /**
   * @route   POST /api/v1/auth/google
   * @access  Public
   * @body    { idToken: string }
   */
  async googleLogin(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        res.status(400).json({ success: false, message: 'idToken is required' });
        return;
      }

      const result = await authService.loginWithGoogle(idToken);

      res.status(200).json({
        success: true,
        message: 'Google login successful',
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      });
    } catch (error: any) {
      logger.error('Google login error:', error);
      const statusCode = error.message.includes('audience') || error.message.includes('Invalid') ? 401 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Google login failed',
      });
    }
  }

  /**
   * @route   POST /api/v1/auth/apple
   * @access  Public
   * @body    { identityToken, authorizationCode, email?, firstName?, lastName? }
   */
  async appleLogin(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { identityToken, authorizationCode, email, firstName, lastName } = req.body;

      if (!identityToken || !authorizationCode) {
        res.status(400).json({ success: false, message: 'identityToken and authorizationCode are required' });
        return;
      }

      const result = await authService.loginWithApple({
        identityToken,
        authorizationCode,
        email,
        firstName,
        lastName,
      });

      res.status(200).json({
        success: true,
        message: 'Apple login successful',
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      });
    } catch (error: any) {
      logger.error('Apple login error:', error);
      const statusCode = error.message.includes('Invalid') || error.message.includes('key') ? 401 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Apple login failed',
      });
    }
  }
}

export default new AuthController();
