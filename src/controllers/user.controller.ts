import { Response } from 'express';
import { AuthRequest } from '../types';
import userService from '../services/user.service';
import {User} from "../models/User"
import logger from '../utils/logger';
import fs from 'fs';

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
    
    const user = await User.findById(userId);
    
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
}

export default new UserController();