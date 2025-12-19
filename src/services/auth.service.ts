// src/services/auth.service.ts
import { User, IUserDocument } from '../models';
import { generateTokenPair } from '../utils/jwt';
import logger from '../utils/logger';

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
  // Profile completion fields
  isProfileComplete: boolean;
  profileCompletionPercentage: number;
  missingProfileFields: string[];
  age?: number;
}

interface AuthResponse {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
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
      // Profile completion
      isProfileComplete: profileCompletion.isComplete,
      profileCompletionPercentage: profileCompletion.percentage,
      missingProfileFields: profileCompletion.missingFields,
      age: user.age,
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
        points: 100,
        level: 1,
        badges: ['newcomer'],
        achievements: [],
        streak: 0,
      },
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair(
      user._id.toString(),
      user.email
    );

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

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

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair(
      user._id.toString(),
      user.email
    );

    // Update refresh token and last seen
    user.refreshToken = refreshToken;
    user.lastSeen = new Date();
    await user.save();

    logger.info(`User logged in: ${email}`);

    return {
      user: this.formatUserResponse(user),
      accessToken,
      refreshToken,
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
}

export default new AuthService();