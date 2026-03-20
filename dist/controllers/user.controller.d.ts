import { Response } from 'express';
import { AuthRequest } from '../types';
declare class UserController {
    /**
      * Get user profile by ID (GET /users/:userId)
      */
    getUserProfile(req: AuthRequest, res: Response): Promise<void>;
    getMyProfile(req: AuthRequest, res: Response): Promise<void>;
    getProfileCompletion(req: AuthRequest, res: Response): Promise<void>;
    updateMyProfile(req: AuthRequest, res: Response): Promise<void>;
    updateProfile(req: AuthRequest, res: Response): Promise<void>;
    updatePreferences(req: AuthRequest, res: Response): Promise<void>;
    updateLifestyle(req: AuthRequest, res: Response): Promise<void>;
    updateLocation(req: AuthRequest, res: Response): Promise<void>;
    uploadProfilePhoto(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Add photo to gallery
     */
    addPhoto(req: AuthRequest, res: Response): Promise<void>;
    removePhoto(req: AuthRequest, res: Response): Promise<void>;
    blockUser(req: AuthRequest, res: Response): Promise<void>;
    unblockUser(req: AuthRequest, res: Response): Promise<void>;
    reportUser(req: AuthRequest, res: Response): Promise<void>;
    addInterests(req: AuthRequest, res: Response): Promise<void>;
    removeInterest(req: AuthRequest, res: Response): Promise<void>;
    getNotificationSettings(req: AuthRequest, res: Response): Promise<void>;
    updateNotificationSettings(req: AuthRequest, res: Response): Promise<void>;
    getPrivacySettings(req: AuthRequest, res: Response): Promise<void>;
    updatePrivacySettings(req: AuthRequest, res: Response): Promise<void>;
    deleteAccount(req: AuthRequest, res: Response): Promise<void>;
}
declare const _default: UserController;
export default _default;
//# sourceMappingURL=user.controller.d.ts.map