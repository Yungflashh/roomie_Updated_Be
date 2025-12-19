// src/controllers/auth.controller.ts
import { Response } from 'express';
import { AuthRequest } from '../types';
import authService from '../services/auth.service';
import { verifyRefreshToken } from '../utils/jwt';
import logger from '../utils/logger';

class AuthController {
  /**
   * Register new user
   */
  async register(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await authService.register(req.body);

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
   * Login user
   */
  async login(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await authService.login(req.body);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
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
   * Refresh access token
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
   * Logout user
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
   * Get current user profile
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
   * Get profile completion status
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
   * Update FCM token
   */
  async updateFcmToken(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { fcmToken } = req.body;

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
   * Change password
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
   * Delete account
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
}

export default new AuthController();