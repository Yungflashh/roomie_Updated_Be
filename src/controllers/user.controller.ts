import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../types';
import userService from '../services/user.service';
import {User} from "../models/User"
import logger from '../utils/logger';
import { logAudit } from '../utils/audit';
import weeklyChallengeService from '../services/weeklyChallenge.service';
import fs from 'fs';

// Helper to get user actor info for audit logs
async function getActorInfo(userId: string): Promise<{ id: string; name: string; email: string }> {
  try {
    const u = await User.findById(userId).select('firstName lastName email');
    if (u) return { id: userId, name: `${u.firstName} ${u.lastName}`, email: u.email };
  } catch {}
  return { id: userId, name: '', email: '' };
}

class UserController {
  // src/controllers/user.controller.ts
// Update getUserProfile method
 /**
   * Get user profile by ID (GET /users/:userId)
   */
  async getUserProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const currentUserId = req.user?.userId;

      logger.info(`Getting profile for user: ${userId}`);

      const user = await userService.getUserById(userId, currentUserId);

      logger.info(`Profile data for ${userId}: subscription=${JSON.stringify(user?.subscription)}, verified=${user?.verified}`);

      // Record profile visit & notify (in background, don't block response)
      if (currentUserId && currentUserId !== userId) {
        (async () => {
          try {
            const premiumService = require('../services/premium.service').default;
            const isNewVisit = await premiumService.recordProfileVisit(currentUserId, userId);

            // Only notify if this is a new visit (not within last 3 days)
            if (isNewVisit) {
              const { emitToUser } = require('../config/socket.config');
              emitToUser(userId, 'notification', {
                type: 'profile_view',
                title: 'Profile Viewed',
                message: 'Someone viewed your profile',
                data: { viewerId: currentUserId },
              });

              const { Notification } = require('../models');
              await Notification.create({
                user: userId,
                type: 'profile_view',
                title: 'Profile Viewed',
                body: 'Someone viewed your profile',
                data: { viewerId: currentUserId },
              }).catch((err: any) => {
                logger.error('Profile view notification error:', err.message);
              });
            }
          } catch (err) {
            // Silent — don't let visit tracking break profile fetch
          }
        })();
      }

      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error: any) {
      logger.error('Get user profile error:', error);
      const statusCode = error.message.includes('blocked') ? 403 : 
                         error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to fetch user profile',
      });
    }
  }

// src/controllers/user.controller.ts

async getMyProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId!;
    
    const user = await User.findById(userId)
      .populate('blockedUsers', 'firstName lastName profilePhoto');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Get profile completion details
    const profileCompletion = user.getProfileCompletion();

    res.status(200).json({
      success: true,
      data: {
        user: {
          ...user.toJSON(),
          isProfileComplete: profileCompletion.isComplete,
          profileCompletionPercentage: profileCompletion.percentage,
          missingProfileFields: profileCompletion.missingFields,
        },
      },
    });
  } catch (error: any) {
    logger.error('Get my profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch profile',
    });
  }
}


// src/controllers/user.controller.ts - Add this method

async getProfileCompletion(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId!;
    
    const user = await User.findById(userId);
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    const completion = user.getProfileCompletion();

    res.status(200).json({
      success: true,
      data: {
        isComplete: completion.isComplete,
        percentage: completion.percentage,
        missingFields: completion.missingFields,
        completedFields: completion.completedFields,
      },
    });
  } catch (error: any) {
    logger.error('Get profile completion error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get profile completion',
    });
  }
}
  async updateMyProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Not authenticated',
        });
        return;
      }

      logger.info(`Updating profile for current user: ${userId}`);
      
      const user = await userService.updateUser(userId, req.body);

      await logAudit({
        actor: await getActorInfo(userId),
        actorType: 'user', action: 'update_profile', category: 'profile',
        details: 'Updated profile', req
      });

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: { user },
      });
    } catch (error: any) {
      logger.error('Update my profile error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update profile',
      });
    }
  }

  async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      logger.info(`Updating profile for user: ${userId}`);
      
      const user = await userService.updateProfile(userId, req.body);

      await logAudit({
        actor: await getActorInfo(userId),
        actorType: 'user', action: 'update_profile', category: 'profile',
        details: 'Updated profile', req
      });

      // Track challenge progress
      weeklyChallengeService.trackAction(userId, 'profile_update').catch(e => logger.warn('Challenge tracking (profile_update) error:', e));

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: { user },
      });
    } catch (error: any) {
      logger.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update profile',
      });
    }
  }

  async updatePreferences(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      logger.info(`Updating preferences for user: ${userId}`);
      
      const preferences = await userService.updatePreferences(userId, req.body);

      await logAudit({
        actor: await getActorInfo(userId),
        actorType: 'user', action: 'update_preferences', category: 'profile',
        details: 'Updated preferences', req
      });

      res.status(200).json({
        success: true,
        message: 'Preferences updated successfully',
        data: { preferences },
      });
    } catch (error: any) {
      logger.error('Update preferences error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update preferences',
      });
    }
  }

  async updateLifestyle(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      logger.info(`Updating lifestyle for user: ${userId}`);
      
      const lifestyle = await userService.updateLifestyle(userId, req.body);

      await logAudit({
        actor: await getActorInfo(userId),
        actorType: 'user', action: 'update_lifestyle', category: 'profile',
        details: 'Updated lifestyle', req
      });

      res.status(200).json({
        success: true,
        message: 'Lifestyle updated successfully',
        data: { lifestyle },
      });
    } catch (error: any) {
      logger.error('Update lifestyle error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update lifestyle',
      });
    }
  }

  async updateLocation(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { latitude, longitude, address, city, state, country } = req.body;

      logger.info(`Updating location for user: ${userId}`);

      const location = await userService.updateLocation(
        userId,
        latitude,
        longitude,
        address,
        city,
        state,
        country
      );

      await logAudit({
        actor: await getActorInfo(userId),
        actorType: 'user', action: 'update_location', category: 'profile',
        details: 'Updated location', req
      });

      res.status(200).json({
        success: true,
        message: 'Location updated successfully',
        data: { location },
      });
    } catch (error: any) {
      logger.error('Update location error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update location',
      });
    }
  }

  async uploadProfilePhoto(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId!;
    const cloudinaryResult = (req as any).cloudinaryResult;

    if (!cloudinaryResult) {
      res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
      return;
    }

    // Update user with Cloudinary URL
    await User.findByIdAndUpdate(userId, {
      profilePhoto: cloudinaryResult.url,
    });

    logger.info(`Profile photo uploaded for user ${userId}: ${cloudinaryResult.url}`);

    await logAudit({
      actor: await getActorInfo(userId),
      actorType: 'user', action: 'upload_profile_photo', category: 'profile',
      details: 'Uploaded profile photo', req
    });

    res.status(200).json({
      success: true,
      message: 'Profile photo uploaded successfully',
      data: { 
        profilePhoto: cloudinaryResult.url,
        publicId: cloudinaryResult.publicId,
      },
    });
  } catch (error: any) {
    logger.error('Upload profile photo error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload profile photo',
    });
  }
}

/**
 * Add photo to gallery
 */
async addPhoto(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId!;
    const cloudinaryResult = (req as any).cloudinaryResult;

    if (!cloudinaryResult) {
      res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
      return;
    }

    // Check max photos limit
    const user = await User.findById(userId);
    const maxPhotos = parseInt(process.env.MAX_PROFILE_PHOTOS || '10');

    if (user && user.photos.length >= maxPhotos) {
      res.status(400).json({
        success: false,
        message: `Maximum ${maxPhotos} photos allowed`,
      });
      return;
    }

    // Add Cloudinary URL to photos array
    await User.findByIdAndUpdate(userId, {
      $push: { photos: cloudinaryResult.url },
    });

    logger.info(`Photo added for user ${userId}: ${cloudinaryResult.url}`);

    await logAudit({
      actor: await getActorInfo(userId),
      actorType: 'user', action: 'add_photo', category: 'profile',
      details: 'Added photo to gallery', req
    });

    // Track challenge progress
    weeklyChallengeService.trackAction(userId, 'photo_upload').catch(e => logger.warn('Challenge tracking (photo_upload) error:', e));

    res.status(200).json({
      success: true,
      message: 'Photo added successfully',
      data: {
        photoUrl: cloudinaryResult.url,
        publicId: cloudinaryResult.publicId,
      },
    });
  } catch (error: any) {
    logger.error('Add photo error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add photo',
    });
  }
}

  async removePhoto(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { photoUrl } = req.body;
      
      logger.info(`Removing photo for user: ${userId}, url: ${photoUrl}`);
      
      await userService.removePhoto(userId, photoUrl);

      await logAudit({
        actor: await getActorInfo(userId),
        actorType: 'user', action: 'remove_photo', category: 'profile',
        details: 'Removed photo', req
      });

      res.status(200).json({
        success: true,
        message: 'Photo removed successfully',
      });
    } catch (error) {
      logger.error('Remove photo error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove photo',
      });
    }
  }

  async blockUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { targetUserId } = req.params;
      
      logger.info(`User ${userId} blocking user ${targetUserId}`);
      
      await userService.blockUser(userId, targetUserId);

      const targetInfo = await getActorInfo(targetUserId);
      await logAudit({
        actor: await getActorInfo(userId),
        actorType: 'user', action: 'block_user', category: 'user_interaction',
        target: { type: 'user', id: targetUserId, name: targetInfo.name },
        details: `Blocked user ${targetInfo.name} (${targetInfo.email})`, req
      });

      res.status(200).json({
        success: true,
        message: 'User blocked successfully',
      });
    } catch (error: any) {
      logger.error('Block user error:', error);
      const statusCode = error.message.includes('Cannot') ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to block user',
      });
    }
  }

  async unblockUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { targetUserId } = req.params;
      
      logger.info(`User ${userId} unblocking user ${targetUserId}`);
      
      await userService.unblockUser(userId, targetUserId);

      const targetInfo = await getActorInfo(targetUserId);
      await logAudit({
        actor: await getActorInfo(userId),
        actorType: 'user', action: 'unblock_user', category: 'user_interaction',
        target: { type: 'user', id: targetUserId, name: targetInfo.name },
        details: `Unblocked user ${targetInfo.name} (${targetInfo.email})`, req
      });

      res.status(200).json({
        success: true,
        message: 'User unblocked successfully',
      });
    } catch (error) {
      logger.error('Unblock user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to unblock user',
      });
    }
  }

  async reportUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { targetUserId } = req.params;
      const { reason } = req.body;
      
      logger.info(`User ${userId} reporting user ${targetUserId}, reason: ${reason}`);
      
      await userService.reportUser(userId, targetUserId, reason);

      const targetInfo = await getActorInfo(targetUserId);
      await logAudit({
        actor: await getActorInfo(userId),
        actorType: 'user', action: 'report_user', category: 'user_interaction',
        target: { type: 'user', id: targetUserId, name: targetInfo.name },
        details: `Reported user ${targetInfo.name} (${targetInfo.email}). Reason: ${reason}`, req,
        metadata: { reason, reportedUser: { name: targetInfo.name, email: targetInfo.email } }
      });

      res.status(200).json({
        success: true,
        message: 'User reported successfully',
      });
    } catch (error) {
      logger.error('Report user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to report user',
      });
    }
  }

  async addInterests(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { interests } = req.body;
      
      logger.info(`Adding interests for user: ${userId}`);
      
      const updatedInterests = await userService.addInterests(userId, interests);

      await logAudit({
        actor: await getActorInfo(userId),
        actorType: 'user', action: 'add_interests', category: 'profile',
        details: 'Added interests', req
      });

      res.status(200).json({
        success: true,
        message: 'Interests added successfully',
        data: { interests: updatedInterests },
      });
    } catch (error: any) {
      logger.error('Add interests error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to add interests',
      });
    }
  }

  async removeInterest(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { interest } = req.body;
      
      logger.info(`Removing interest for user: ${userId}, interest: ${interest}`);
      
      const updatedInterests = await userService.removeInterest(userId, interest);

      await logAudit({
        actor: await getActorInfo(userId),
        actorType: 'user', action: 'remove_interest', category: 'profile',
        details: `Removed interest: ${interest}`, req
      });

      res.status(200).json({
        success: true,
        message: 'Interest removed successfully',
        data: { interests: updatedInterests },
      });
    } catch (error: any) {
      logger.error('Remove interest error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to remove interest',
      });
    }
  }

  async getNotificationSettings(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const user = await User.findById(userId).select('notificationSettings');
      res.json({ success: true, data: user?.notificationSettings || {} });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateNotificationSettings(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: { notificationSettings: req.body } },
        { new: true }
      ).select('notificationSettings');
      res.json({ success: true, data: user?.notificationSettings });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getPrivacySettings(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const user = await User.findById(userId).select('privacySettings');
      res.json({ success: true, data: user?.privacySettings || {} });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updatePrivacySettings(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: { privacySettings: req.body } },
        { new: true }
      ).select('privacySettings');
      res.json({ success: true, data: user?.privacySettings });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async deleteAccount(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { password } = req.body;

      if (!password) {
        res.status(400).json({ success: false, message: 'Password is required' });
        return;
      }

      const user = await User.findById(userId).select('+password');
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.password as string);
      if (!isMatch) {
        res.status(401).json({ success: false, message: 'Incorrect password' });
        return;
      }

      // Soft delete: deactivate the account
      user.isActive = false;
      await user.save();

      logger.info(`Account deletion requested by user ${userId}`);

      res.json({
        success: true,
        message: 'Account has been deactivated. It will be permanently deleted in 30 days.',
      });
    } catch (error: any) {
      logger.error('Delete account error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to delete account' });
    }
  }
}

export default new UserController();