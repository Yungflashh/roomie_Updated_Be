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
    getReports(req: AuthRequest, res: Response): Promise<void>;
    getReport(req: AuthRequest, res: Response): Promise<void>;
    updateReport(req: AuthRequest, res: Response): Promise<void>;
    getGames(req: AuthRequest, res: Response): Promise<void>;
    getGameSessions(req: AuthRequest, res: Response): Promise<void>;
    getGameStats(req: AuthRequest, res: Response): Promise<void>;
    getGroups(req: AuthRequest, res: Response): Promise<void>;
    getGroup(req: AuthRequest, res: Response): Promise<void>;
    deleteGroup(req: AuthRequest, res: Response): Promise<void>;
    getAnalytics(req: AuthRequest, res: Response): Promise<void>;
    getRecentActivity(req: AuthRequest, res: Response): Promise<void>;
    exportData(req: AuthRequest, res: Response): Promise<void>;
    getPurchases(req: AuthRequest, res: Response): Promise<void>;
    approvePurchase(req: AuthRequest, res: Response): Promise<void>;
    rejectPurchase(req: AuthRequest, res: Response): Promise<void>;
    getPointsOverview(req: AuthRequest, res: Response): Promise<void>;
    getAuditLogs(req: AuthRequest, res: Response): Promise<void>;
    getAuditLog(req: AuthRequest, res: Response): Promise<void>;
    getAuditStats(req: AuthRequest, res: Response): Promise<void>;
    getUserAuditTrail(req: AuthRequest, res: Response): Promise<void>;
    getAppVersion(req: any, res: Response): Promise<void>;
    updateAppVersion(req: any, res: Response): Promise<void>;
    getStudySessions(req: AuthRequest, res: Response): Promise<void>;
    getStudyStats(req: AuthRequest, res: Response): Promise<void>;
    deleteStudySession(req: AuthRequest, res: Response): Promise<void>;
    getAdminEvents(req: AuthRequest, res: Response): Promise<void>;
    getEventStats(req: AuthRequest, res: Response): Promise<void>;
    adminCancelEvent(req: AuthRequest, res: Response): Promise<void>;
    adminDeleteEvent(req: AuthRequest, res: Response): Promise<void>;
    getAdminConfessions(req: AuthRequest, res: Response): Promise<void>;
    getConfessionStats(req: AuthRequest, res: Response): Promise<void>;
    hideConfession(req: AuthRequest, res: Response): Promise<void>;
    adminDeleteConfession(req: AuthRequest, res: Response): Promise<void>;
    getStudyCategories(req: AuthRequest, res: Response): Promise<void>;
    createStudyCategory(req: AuthRequest, res: Response): Promise<void>;
    addStudyQuestion(req: AuthRequest, res: Response): Promise<void>;
    deleteStudyQuestion(req: AuthRequest, res: Response): Promise<void>;
    createAdminEvent(req: AuthRequest, res: Response): Promise<void>;
}
declare const _default: AdminController;
export default _default;
//# sourceMappingURL=admin.controller.d.ts.map