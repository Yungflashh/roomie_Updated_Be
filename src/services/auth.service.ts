// src/services/auth.service.ts - UPDATED TO USE EXISTING POINTS SERVICE
import crypto from 'crypto';
import { User, IUserDocument } from '../models';
import { generateTokenPair } from '../utils/jwt';
import logger from '../utils/logger';
import pointsService from './points.service';
import emailService from './email.service';

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
}

interface LoginData {
  email: string;
  password: string;
}

interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePhoto?: string;
  photos?: string[];
  bio?: string;
  occupation?: string;
  dateOfBirth?: Date;
  gender?: string;
  phoneNumber?: string;
  location?: any;
  preferences?: any;
  lifestyle?: any;
  interests?: string[];
  languages?: string[];
  socialLinks?: any[];
  verified?: boolean;
  emailVerified?: boolean;
  subscription: any;
  gamification: any;
  equippedCosmetics?: any;
  // Profile completion fields
  isProfileComplete: boolean;
  profileCompletionPercentage: number;
  missingProfileFields: string[];
  age?: number;
  metadata?: {
    verificationStatus?: string;
    verificationRejectionReason?: string;
    verificationRequested?: boolean;
  };
}

interface AuthResponse {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
  dailyReward?: {
    awarded: boolean;
    points?: number;
    streak?: number;
    newBalance?: number;
    leveledUp?: boolean;
    newLevel?: number;
  };
}

class AuthService {
  /**
   * Helper to format user response with profile completion
   */
  private formatUserResponse(user: IUserDocument): UserResponse {
    const profileCompletion = user.getProfileCompletion();
    
    return {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePhoto: user.profilePhoto,
      photos: user.photos,
      bio: user.bio,
      occupation: user.occupation,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      phoneNumber: user.phoneNumber,
      location: user.location,
      preferences: user.preferences,
      lifestyle: user.lifestyle,
      interests: user.interests,
      languages: user.languages,
      socialLinks: user.socialLinks,
      verified: user.verified,
      emailVerified: user.emailVerified,
      subscription: user.subscription,
      gamification: user.gamification,
      equippedCosmetics: user.equippedCosmetics,
      // Profile completion
      isProfileComplete: profileCompletion.isComplete,
      profileCompletionPercentage: profileCompletion.percentage,
      missingProfileFields: profileCompletion.missingFields,
      age: user.age,
      metadata: {
        verificationStatus: (user as any).metadata?.verificationStatus || 'none',
        verificationRejectionReason: (user as any).metadata?.verificationRejectionReason,
        verificationRequested: (user as any).metadata?.verificationRequested,
      },
    };
  }

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const { email, password, firstName, lastName, dateOfBirth, gender } = data;

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Create user
    const user = await User.create({
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      provider: 'email',
      gamification: {
        points: 0,
        level: 1,
        badges: ['newcomer'],
        achievements: [],
        streak: 0,
        lastActiveDate: new Date(),
      },
    });

    // Award signup bonus through points service
    try {
      await pointsService.addPoints({
        userId: user._id.toString(),
        amount: 100,
        type: 'bonus',
        reason: 'Welcome bonus for signing up',
        metadata: { source: 'registration' },
      });
      logger.info(`Signup bonus awarded to: ${email}`);
    } catch (error) {
      logger.error('Error awarding signup bonus:', error);
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair(
      user._id.toString(),
      user.email
    );

    // Save refresh token
    user.refreshToken = refreshToken;
    user.lastSeen = new Date();
    await user.save();

    // Send verification email in background
    try {
      const code = this.generateOTP();
      user.emailVerificationCode = code;
      user.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);
      await user.save();
      emailService.sendVerificationCode(email, firstName, code).catch(err => {
        logger.error('Failed to send verification email:', err);
      });
    } catch (err) {
      logger.error('Failed to set verification code:', err);
    }

    logger.info(`New user registered: ${email}`);

    return {
      user: this.formatUserResponse(user),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login user
   */
  async login(data: LoginData): Promise<AuthResponse> {
    const { email, password } = data;

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password +refreshToken');
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if active
    if (!user.isActive) {
      throw new Error('Account has been deactivated');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Award daily login bonus through points service
    let dailyReward: AuthResponse['dailyReward'] = {
      awarded: false,
    };

    try {
      const result = await pointsService.awardDailyLoginBonus(user._id.toString());
      
      if (result.awarded) {
        // Fetch updated user data to get streak and level info
        const updatedUser = await User.findById(user._id);
        
        dailyReward = {
          awarded: true,
          points: result.amount,
          streak: updatedUser?.gamification?.streak || 1,
          newBalance: result.newBalance,
        };

        logger.info(`Daily login bonus awarded to ${email}: ${result.amount} points`);
      }
    } catch (error) {
      logger.error('Error awarding daily login bonus:', error);
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair(
      user._id.toString(),
      user.email
    );

    // Update refresh token and last seen (use findOneAndUpdate to avoid VersionError
    // since awardDailyLoginBonus may have modified the user document already)
    await User.findOneAndUpdate(
      { _id: user._id },
      { $set: { refreshToken, lastSeen: new Date() } }
    );

    // Fetch fresh user data for response
    const freshUser = await User.findById(user._id);
    if (!freshUser) {
      throw new Error('User not found');
    }

    logger.info(`User logged in: ${email}`);

    return {
      user: this.formatUserResponse(freshUser),
      accessToken,
      refreshToken,
      dailyReward,
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(userId: string, refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await User.findById(userId).select('+refreshToken');
    
    if (!user || user.refreshToken !== refreshToken) {
      throw new Error('Invalid refresh token');
    }

    // Generate new tokens
    const tokens = generateTokenPair(user._id.toString(), user.email);

    // Update refresh token
    user.refreshToken = tokens.refreshToken;
    await user.save();

    return tokens;
  }

  /**
   * Logout user
   */
  async logout(userId: string): Promise<void> {
    const user = await User.findById(userId);
    if (user) {
      user.refreshToken = undefined;
      user.lastSeen = new Date();
      await user.save();
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<IUserDocument> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  /**
   * Get user profile with completion status
   */
  async getUserProfileWithCompletion(userId: string): Promise<{ user: UserResponse }> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    return {
      user: this.formatUserResponse(user),
    };
  }

  /**
   * Get profile completion status only
   */
  async getProfileCompletion(userId: string): Promise<{
    isComplete: boolean;
    percentage: number;
    missingFields: string[];
    completedFields: string[];
  }> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    return user.getProfileCompletion();
  }

  /**
   * Update FCM token
   */
  async updateFcmToken(userId: string, fcmToken: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { fcmToken });
  }

  /**
   * Change password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    logger.info(`Password changed for user: ${user.email}`);
  }

  /**
   * Delete account (soft delete)
   */
  async deleteAccount(userId: string, password: string): Promise<void> {
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      throw new Error('User not found');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Password is incorrect');
    }

    // Soft delete
    user.isActive = false;
    await user.save();

    logger.info(`Account deleted for user: ${user.email}`);
  }

  /**
   * Get user's current streak
   */
  async getUserStreak(userId: string): Promise<{
    currentStreak: number;
    lastLoginDate: Date | null;
  }> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      currentStreak: user.gamification?.streak || 0,
      lastLoginDate: user.gamification?.lastActiveDate || user.lastSeen || null,
    };
  }

  /**
   * Generate a 6-digit OTP code
   */
  private generateOTP(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Send email verification code
   */
  async sendVerificationEmail(userId: string): Promise<void> {
    const user = await User.findById(userId).select('+emailVerificationCode +emailVerificationExpires');
    if (!user) throw new Error('User not found');
    if (user.emailVerified) throw new Error('Email already verified');

    const code = this.generateOTP();
    user.emailVerificationCode = code;
    user.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 min
    await user.save();

    await emailService.sendVerificationCode(user.email, user.firstName, code);
    logger.info(`Verification email sent to: ${user.email}`);
  }

  /**
   * Verify email with OTP code
   */
  async verifyEmail(userId: string, code: string): Promise<void> {
    const user = await User.findById(userId).select('+emailVerificationCode +emailVerificationExpires');
    if (!user) throw new Error('User not found');
    if (user.emailVerified) throw new Error('Email already verified');

    if (
      !user.emailVerificationCode ||
      !user.emailVerificationExpires ||
      user.emailVerificationCode !== code
    ) {
      throw new Error('Invalid verification code');
    }

    if (user.emailVerificationExpires < new Date()) {
      throw new Error('Verification code has expired');
    }

    user.emailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    logger.info(`Email verified for: ${user.email}`);
  }

  /**
   * Request password reset — sends OTP to email
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordResetCode +passwordResetExpires');
    if (!user) {
      // Don't reveal whether user exists
      return;
    }

    const code = this.generateOTP();
    user.passwordResetCode = code;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 min
    await user.save();

    await emailService.sendPasswordResetCode(user.email, user.firstName, code);
    logger.info(`Password reset code sent to: ${user.email}`);
  }

  /**
   * Verify password reset code
   */
  async verifyResetCode(email: string, code: string): Promise<string> {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordResetCode +passwordResetExpires');
    if (!user) throw new Error('Invalid reset code');

    if (
      !user.passwordResetCode ||
      !user.passwordResetExpires ||
      user.passwordResetCode !== code
    ) {
      throw new Error('Invalid reset code');
    }

    if (user.passwordResetExpires < new Date()) {
      throw new Error('Reset code has expired');
    }

    // Generate a temporary reset token for the next step
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetCode = resetToken; // Reuse field to store the temp token
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    await user.save();

    return resetToken;
  }

  /**
   * Reset password using the temp reset token
   */
  async resetPassword(email: string, resetToken: string, newPassword: string): Promise<void> {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordResetCode +passwordResetExpires +password');
    if (!user) throw new Error('Invalid request');

    if (
      !user.passwordResetCode ||
      !user.passwordResetExpires ||
      user.passwordResetCode !== resetToken
    ) {
      throw new Error('Invalid or expired reset token');
    }

    if (user.passwordResetExpires < new Date()) {
      throw new Error('Reset token has expired');
    }

    user.password = newPassword;
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    await emailService.sendPasswordResetSuccess(user.email, user.firstName);
    logger.info(`Password reset for: ${user.email}`);
  }
}

export default new AuthService();