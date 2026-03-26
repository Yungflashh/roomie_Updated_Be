import { IUserDocument } from '../models';
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
declare class AuthService {
    /**
     * Helper to format user response with profile completion
     */
    private formatUserResponse;
    /**
     * Register new user
     */
    register(data: RegisterData): Promise<AuthResponse>;
    /**
     * Login user
     */
    login(data: LoginData): Promise<AuthResponse>;
    /**
     * Refresh access token
     */
    refreshAccessToken(userId: string, refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    /**
     * Logout user
     */
    logout(userId: string): Promise<void>;
    /**
     * Get user profile
     */
    getUserProfile(userId: string): Promise<IUserDocument>;
    /**
     * Get user profile with completion status
     */
    getUserProfileWithCompletion(userId: string): Promise<{
        user: UserResponse;
    }>;
    /**
     * Get profile completion status only
     */
    getProfileCompletion(userId: string): Promise<{
        isComplete: boolean;
        percentage: number;
        missingFields: string[];
        completedFields: string[];
    }>;
    /**
     * Update FCM token
     */
    updateFcmToken(userId: string, fcmToken: string): Promise<void>;
    /**
     * Change password
     */
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
    /**
     * Delete account (soft delete)
     */
    deleteAccount(userId: string, password: string): Promise<void>;
    /**
     * Get user's current streak
     */
    getUserStreak(userId: string): Promise<{
        currentStreak: number;
        lastLoginDate: Date | null;
    }>;
    /**
     * Generate a 6-digit OTP code
     */
    private generateOTP;
    /**
     * Send email verification code
     */
    sendVerificationEmail(userId: string): Promise<void>;
    /**
     * Verify email with OTP code
     */
    verifyEmail(userId: string, code: string): Promise<void>;
    /**
     * Request password reset — sends OTP to email
     */
    forgotPassword(email: string): Promise<void>;
    /**
     * Verify password reset code
     */
    verifyResetCode(email: string, code: string): Promise<string>;
    /**
     * Reset password using the temp reset token
     */
    resetPassword(email: string, resetToken: string, newPassword: string): Promise<void>;
}
declare const _default: AuthService;
export default _default;
//# sourceMappingURL=auth.service.d.ts.map