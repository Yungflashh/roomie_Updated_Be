import { Request, Response } from 'express';
import { AuthRequest } from '../types';
declare class AdminController {
    /**
     * Admin login
     */
    login(req: Request, res: Response): Promise<void>;
    /**
     * Get dashboard statistics
     */
    getDashboardStats(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get user growth data
     */
    getUserGrowth(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get all users with pagination and filters
     */
    getUsers(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get single user details
     */
    getUser(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Verify user
     */
    verifyUser(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Suspend user
     */
    suspendUser(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Unsuspend user
     */
    unsuspendUser(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Delete user
     */
    deleteUser(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get all matches
     */
    getMatches(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get match details
     */
    getMatch(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Delete match
     */
    deleteMatch(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get all properties
     */
    getProperties(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get property details
     */
    getProperty(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Update property
     */
    updateProperty(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Delete property
     */
    deleteProperty(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Approve property
     */
    approveProperty(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Reject property
     */
    rejectProperty(req: AuthRequest, res: Response): Promise<void>;
}
declare const _default: AdminController;
export default _default;
//# sourceMappingURL=admin.controller.d.ts.map