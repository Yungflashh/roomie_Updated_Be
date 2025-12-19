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
interface AuthResponse {
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        profilePhoto?: string;
        subscription: any;
        gamification: any;
    };
    accessToken: string;
    refreshToken: string;
}
declare class AuthService {
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
}
declare const _default: AuthService;
export default _default;
//# sourceMappingURL=auth.service.d.ts.map