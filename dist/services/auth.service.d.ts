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
    private formatUserResponse;
    /**
     * Creates a new user account, awards the signup bonus, and sends a
     * verification email in the background.
     */
    register(data: RegisterData): Promise<AuthResponse>;
    /**
     * Authenticates a user by email/password and awards the daily login bonus
     * if it has not been claimed yet today.
     */
    login(data: LoginData): Promise<AuthResponse>;
    /**
     * Validates the supplied refresh token and issues a new token pair.
     */
    refreshAccessToken(userId: string, refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    /** Clears the stored refresh token and updates `lastSeen`. */
    logout(userId: string): Promise<void>;
    getUserProfile(userId: string): Promise<IUserDocument>;
    getUserProfileWithCompletion(userId: string): Promise<{
        user: UserResponse;
    }>;
    getProfileCompletion(userId: string): Promise<{
        isComplete: boolean;
        percentage: number;
        missingFields: string[];
        completedFields: string[];
    }>;
    updateFcmToken(userId: string, fcmToken: string): Promise<void>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
    /** Soft-deletes the account after verifying the user's password. */
    deleteAccount(userId: string, password: string): Promise<void>;
    getUserStreak(userId: string): Promise<{
        currentStreak: number;
        lastLoginDate: Date | null;
    }>;
    private generateOTP;
    sendVerificationEmail(userId: string): Promise<void>;
    verifyEmail(userId: string, code: string): Promise<void>;
    /**
     * Sends a 6-digit OTP to the given email address for password reset.
     * Returns silently if no account exists to prevent email enumeration.
     */
    forgotPassword(email: string): Promise<void>;
    /**
     * Validates the OTP and exchanges it for a short-lived reset token.
     * The reset token is stored in `passwordResetCode` to avoid adding a new field.
     */
    verifyResetCode(email: string, code: string): Promise<string>;
    resetPassword(email: string, resetToken: string, newPassword: string): Promise<void>;
    /**
     * Signs in or registers a user via Google id_token.
     * Looks up by provider ID first, then falls back to email to handle accounts
     * that were created with email/password before OAuth was available.
     */
    loginWithGoogle(idToken: string): Promise<AuthResponse>;
    /**
     * Signs in or registers a user via Apple identity token.
     * Uses the same provider-ID-first, email-fallback lookup as `loginWithGoogle`.
     */
    loginWithApple(params: {
        identityToken: string;
        authorizationCode: string;
        email?: string | null;
        firstName?: string | null;
        lastName?: string | null;
    }): Promise<AuthResponse>;
    /**
     * Validates a Google id_token via Google's tokeninfo endpoint.
     * If any GOOGLE_*_CLIENT_ID env vars are set, the token audience is checked
     * against all of them to support both Android and iOS clients.
     */
    private verifyGoogleToken;
    /**
     * Validates an Apple identity token (RS256 JWT) by fetching Apple's public
     * JWKS and verifying the signature with Node's built-in `crypto` module —
     * no third-party JWT library required.
     */
    private verifyAppleToken;
}
declare const _default: AuthService;
export default _default;
//# sourceMappingURL=auth.service.d.ts.map