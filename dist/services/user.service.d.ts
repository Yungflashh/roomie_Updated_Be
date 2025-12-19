import { IUserDocument } from '../models';
declare class UserService {
    /**
     * Get user by ID
     */
    getUserById(userId: string, currentUserId?: string): Promise<IUserDocument>;
    /**
     * Update user profile
     */
    updateProfile(userId: string, updates: any): Promise<IUserDocument>;
    /**
     * Update preferences
     */
    updatePreferences(userId: string, preferences: any): Promise<any>;
    /**
     * Update lifestyle
     */
    updateLifestyle(userId: string, lifestyle: any): Promise<any>;
    /**
     * Update location
     */
    updateLocation(userId: string, latitude: number, longitude: number, address?: string, city?: string, state?: string, country?: string): Promise<any>;
    /**
     * Upload profile photo
     */
    uploadProfilePhoto(userId: string, file: Express.Multer.File, mediaHash: any): Promise<string>;
    /**
     * Add photo to gallery
     */
    addPhoto(userId: string, file: Express.Multer.File, mediaHash: any): Promise<string>;
    /**
     * Remove photo
     */
    removePhoto(userId: string, photoUrl: string): Promise<void>;
    /**
     * Block user
     */
    blockUser(userId: string, targetUserId: string): Promise<void>;
    /**
     * Unblock user
     */
    unblockUser(userId: string, targetUserId: string): Promise<void>;
    /**
     * Report user
     */
    reportUser(userId: string, targetUserId: string, reason: string): Promise<void>;
    /**
     * Add interests
     */
    addInterests(userId: string, interests: string[]): Promise<string[]>;
    /**
     * Remove interest
     */
    removeInterest(userId: string, interest: string): Promise<string[]>;
    /**
     * Search users by location
     */
    searchByLocation(latitude: number, longitude: number, radius?: number, limit?: number): Promise<IUserDocument[]>;
}
declare const _default: UserService;
export default _default;
//# sourceMappingURL=user.service.d.ts.map