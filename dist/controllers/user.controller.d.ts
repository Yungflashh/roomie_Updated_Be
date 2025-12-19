import { Response } from 'express';
import { AuthRequest } from '../types';
declare class UserController {
    getUserProfile(req: AuthRequest, res: Response): Promise<void>;
    updateProfile(req: AuthRequest, res: Response): Promise<void>;
    updatePreferences(req: AuthRequest, res: Response): Promise<void>;
    updateLifestyle(req: AuthRequest, res: Response): Promise<void>;
    updateLocation(req: AuthRequest, res: Response): Promise<void>;
    uploadProfilePhoto(req: AuthRequest, res: Response): Promise<void>;
    addPhoto(req: AuthRequest, res: Response): Promise<void>;
    removePhoto(req: AuthRequest, res: Response): Promise<void>;
    blockUser(req: AuthRequest, res: Response): Promise<void>;
    unblockUser(req: AuthRequest, res: Response): Promise<void>;
    reportUser(req: AuthRequest, res: Response): Promise<void>;
    addInterests(req: AuthRequest, res: Response): Promise<void>;
    removeInterest(req: AuthRequest, res: Response): Promise<void>;
}
declare const _default: UserController;
export default _default;
//# sourceMappingURL=user.controller.d.ts.map