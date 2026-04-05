import { User, IUserDocument } from '../models';
import logger from '../utils/logger';
import fs from 'fs';
import path from 'path';
import duplicateDetectionService from './duplicateDetection.service';

class UserService {
    
  async getUserById(userId: string, currentUserId?: string): Promise<any> {
    const user = await User.findById(userId)
      .select(
        'firstName lastName email phoneNumber profilePhoto photos bio occupation ' +
        'gender dateOfBirth location preferences lifestyle interests languages ' +
        'socialLinks verified emailVerified createdAt lastSeen subscription'
      )
      .lean();

    if (!user) {
      throw new Error('User not found');
    }

    // Check blocked status if viewing another user
    if (currentUserId && currentUserId !== userId) {
      const currentUser = await User.findById(currentUserId).select('blockedUsers');
      
      if (currentUser?.blockedUsers?.some((id: any) => id.toString() === userId)) {
        throw new Error('You have blocked this user');
      }

      if ((user as any).blockedUsers?.some((id: any) => id.toString() === currentUserId)) {
        throw new Error('This user has blocked you');
      }
    }

    return {
      id: user._id,
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      profilePhoto: user.profilePhoto,
      photos: user.photos || [],
      bio: user.bio,
      occupation: user.occupation,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
      location: user.location,
      preferences: user.preferences,
      lifestyle: user.lifestyle,
      interests: user.interests || [],
      languages: user.languages || [],
      socialLinks: user.socialLinks || [],
      verified: user.verified,
      emailVerified: user.emailVerified,
      subscription: (user as any).subscription,
      createdAt: (user as any).createdAt,
      clan: await this.getUserClanInfo(userId),
    };
  }

  /**
   * Get clan info for a user (lightweight)
   */
  async getUserClanInfo(userId: string): Promise<any> {
    try {
      const { Clan } = await import('../models/Clan');
      const clan = await Clan.findOne({ 'members.user': userId })
        .select('name tag emoji color level badges')
        .lean();
      if (!clan) return null;
      return { name: clan.name, tag: clan.tag, emoji: clan.emoji, color: clan.color, level: clan.level, badges: clan.badges || [] };
    } catch {
      return null;
    }
  }
  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: any): Promise<IUserDocument> {
    // Remove sensitive fields
    delete updates.email;
    delete updates.password;
    delete updates.provider;
    delete updates.subscription;
    delete updates.gamification;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }


  /**
   * Update user profile
   */
  async updateUser(userId: string, updateData: Partial<IUserDocument>): Promise<any> {
    // Fields that cannot be updated directly
    const forbiddenFields = ['password', 'email', 'refreshToken', 'likes', 'passes', 'blockedUsers', 'reportedBy'];
    
    // Remove forbidden fields
    forbiddenFields.forEach(field => {
      delete (updateData as any)[field];
    });

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user._id,
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      profilePhoto: user.profilePhoto,
      photos: user.photos || [],
      bio: user.bio,
      occupation: user.occupation,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
      location: user.location,
      preferences: user.preferences,
      lifestyle: user.lifestyle,
      interests: user.interests || [],
      languages: user.languages || [],
      socialLinks: user.socialLinks || [],
      verified: user.verified,
    };
  }
  /**
   * Update preferences
   */
  async updatePreferences(userId: string, preferences: any): Promise<any> {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { preferences } },
      { new: true }
    );

    if (!user) {
      throw new Error('User not found');
    }

    return user.preferences;
  }

  /**
   * Update lifestyle
   */
  async updateLifestyle(userId: string, lifestyle: any): Promise<any> {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { lifestyle } },
      { new: true }
    );

    if (!user) {
      throw new Error('User not found');
    }

    return user.lifestyle;
  }

  /**
   * Update location
   */
  async updateLocation(
    userId: string,
    latitude: number,
    longitude: number,
    address?: string,
    city?: string,
    state?: string,
    country?: string
  ): Promise<any> {
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          location: {
            type: 'Point',
            coordinates: [longitude, latitude],
            address,
            city,
            state,
            country,
          },
        },
      },
      { new: true }
    );

    if (!user) {
      throw new Error('User not found');
    }

    return user.location;
  }

  /**
   * Upload profile photo
   */
  async uploadProfilePhoto(
    userId: string,
    file: Express.Multer.File,
    mediaHash: any
  ): Promise<string> {
    const fileUrl = `/uploads/profiles/${file.filename}`;

    // Save hash
    if (mediaHash) {
      await duplicateDetectionService.saveMediaHash(
        userId,
        file.originalname,
        fileUrl,
        'image',
        mediaHash,
        undefined,
        file.size
      );
    }

    // Update user
    await User.findByIdAndUpdate(userId, { $set: { profilePhoto: fileUrl } });

    return fileUrl;
  }

  /**
   * Add photo to gallery
   */
  async addPhoto(
    userId: string,
    file: Express.Multer.File,
    mediaHash: any
  ): Promise<string> {
    const fileUrl = `/uploads/profiles/${file.filename}`;

    // Check max photos limit
    const user = await User.findById(userId);
    const maxPhotos = parseInt(process.env.MAX_PROFILE_PHOTOS || '10');
    
    if (user && user.photos.length >= maxPhotos) {
      throw new Error(`Maximum ${maxPhotos} photos allowed`);
    }

    // Save hash
    if (mediaHash) {
      await duplicateDetectionService.saveMediaHash(
        userId,
        file.originalname,
        fileUrl,
        'image',
        mediaHash,
        undefined,
        file.size
      );
    }

    // Add photo
    await User.findByIdAndUpdate(
      userId,
      { $push: { photos: fileUrl } }
    );

    return fileUrl;
  }

  /**
   * Remove photo
   */
  async removePhoto(userId: string, photoUrl: string): Promise<void> {
    await User.findByIdAndUpdate(
      userId,
      { $pull: { photos: photoUrl } }
    );

    // Delete file
    const filePath = path.join(process.cwd(), 'public', photoUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  /**
   * Block user
   */
  async blockUser(userId: string, targetUserId: string): Promise<void> {
    if (userId === targetUserId) {
      throw new Error('Cannot block yourself');
    }

    await User.findByIdAndUpdate(
      userId,
      { $addToSet: { blockedUsers: targetUserId } }
    );
  }

  /**
   * Unblock user
   */
  async unblockUser(userId: string, targetUserId: string): Promise<void> {
    await User.findByIdAndUpdate(
      userId,
      { $pull: { blockedUsers: targetUserId } }
    );
  }

  /**
   * Report user
   */
  async reportUser(userId: string, targetUserId: string, reason: string): Promise<void> {
    const { Report } = await import('../models/Report');

    // Check for duplicate report
    const existing = await Report.findOne({ reporter: userId, reported: targetUserId, status: 'pending' });
    if (existing) {
      throw new Error('You have already reported this user.');
    }

    await Report.create({ reporter: userId, reported: targetUserId, reason });

    // Also track on user document
    await User.findByIdAndUpdate(targetUserId, { $addToSet: { reportedBy: userId } });

    logger.warn(`User ${userId} reported user ${targetUserId}: ${reason}`);
  }

  /**
   * Add interests
   */
  async addInterests(userId: string, interests: string[]): Promise<string[]> {
    const user = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { interests: { $each: interests } } },
      { new: true }
    );

    if (!user) {
      throw new Error('User not found');
    }

    return user.interests;
  }

  /**
   * Remove interest
   */
  async removeInterest(userId: string, interest: string): Promise<string[]> {
    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { interests: interest } },
      { new: true }
    );

    if (!user) {
      throw new Error('User not found');
    }

    return user.interests;
  }

  /**
   * Search users by location
   */
  async searchByLocation(
    latitude: number,
    longitude: number,
    radius: number = 50,
    limit: number = 20
  ): Promise<IUserDocument[]> {
    const users = await User.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: radius * 1000, // Convert km to meters
        },
      },
      isActive: true,
    })
    .limit(limit)
    .select('-password -refreshToken');

    return users;
  }
}

export default new UserService();
