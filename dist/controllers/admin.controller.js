"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const models_1 = require("../models");
const logger_1 = __importDefault(require("../utils/logger"));
// Admin login (using User model with admin flag or create separate Admin model)
class AdminController {
    /**
     * Admin login
     */
    async login(req, res) {
        try {
            const { email, password } = req.body;
            console.log("Email: ", email, "Password:", password);
            // Validate input
            if (!email || !password) {
                res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
                return;
            }
            // Find user and explicitly select password field
            const admin = await models_1.User.findOne({ email }).select('+password');
            console.log("An admin det:", admin.password);
            if (!admin) {
                res.status(401).json({
                    success: false,
                    message: 'Invalid email'
                });
                return;
            }
            // Check if password exists (TypeScript safety)
            if (!admin.password) {
                res.status(401).json({
                    success: false,
                    message: 'Invalid password'
                });
                return;
            }
            // Check if user is admin
            // Option 1: Check if email contains 'admin' (simple but not recommended for production)
            // Option 2: Add isAdmin field to User model (recommended)
            // For now using email check - you should add isAdmin field to User model
            const isAdminUser = email.toLowerCase().includes('admin');
            if (!isAdminUser) {
                res.status(403).json({
                    success: false,
                    message: 'Admin access required'
                });
                return;
            }
            // Verify password
            // const isValidPassword = await bcrypt.compare(password, admin.password);
            // if (!isValidPassword) {
            //   res.status(401).json({ 
            //     success: false, 
            //     message: 'Invalid credentials' 
            //   });
            //   return;
            // }
            // Generate JWT token
            const token = jsonwebtoken_1.default.sign({
                userId: admin._id,
                email: admin.email,
                isAdmin: true
            }, process.env.JWT_SECRET, { expiresIn: '7d' });
            res.json({
                success: true,
                data: {
                    token,
                    admin: {
                        id: admin._id,
                        firstName: admin.firstName,
                        lastName: admin.lastName,
                        email: admin.email,
                    }
                }
            });
        }
        catch (error) {
            logger_1.default.error('Admin login error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Login failed'
            });
        }
    }
    /**
     * Get dashboard statistics
     */
    async getDashboardStats(req, res) {
        try {
            const [totalUsers, activeUsers, totalMatches, totalMessages, totalProperties,] = await Promise.all([
                models_1.User.countDocuments(),
                models_1.User.countDocuments({ isActive: true }),
                models_1.Match.countDocuments({ status: 'active' }),
                models_1.Message.countDocuments(),
                models_1.Property.countDocuments(),
            ]);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const [newUsersToday, matchesToday] = await Promise.all([
                models_1.User.countDocuments({ createdAt: { $gte: today } }),
                models_1.Match.countDocuments({ matchedAt: { $gte: today } }),
            ]);
            res.json({
                success: true,
                data: {
                    totalUsers,
                    activeUsers,
                    totalMatches,
                    totalMessages,
                    totalProperties,
                    totalGames: 0,
                    newUsersToday,
                    matchesToday,
                    revenueToday: 0,
                    revenueMonth: 0,
                }
            });
        }
        catch (error) {
            logger_1.default.error('Get dashboard stats error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch dashboard stats'
            });
        }
    }
    /**
     * Get user growth data
     */
    async getUserGrowth(req, res) {
        try {
            const days = parseInt(req.query.days) || 30;
            const data = [];
            for (let i = days - 1; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                date.setHours(0, 0, 0, 0);
                const nextDate = new Date(date);
                nextDate.setDate(nextDate.getDate() + 1);
                const count = await models_1.User.countDocuments({
                    createdAt: { $gte: date, $lt: nextDate }
                });
                data.push({
                    date: date.toISOString().split('T')[0],
                    users: count,
                });
            }
            res.json({ success: true, data });
        }
        catch (error) {
            logger_1.default.error('Get user growth error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch user growth'
            });
        }
    }
    /**
     * Get all users with pagination and filters
     */
    async getUsers(req, res) {
        try {
            const { page = 1, limit = 20, search, status } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const query = {};
            if (search) {
                query.$or = [
                    { firstName: { $regex: search, $options: 'i' } },
                    { lastName: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                ];
            }
            if (status && status !== 'all') {
                if (status === 'active')
                    query.isActive = true;
                if (status === 'inactive')
                    query.isActive = false;
                if (status === 'verified')
                    query.verified = true;
            }
            const [users, total] = await Promise.all([
                models_1.User.find(query)
                    .select('-password -refreshToken')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(Number(limit)),
                models_1.User.countDocuments(query),
            ]);
            res.json({
                success: true,
                data: {
                    users,
                    pagination: {
                        page: Number(page),
                        limit: Number(limit),
                        total,
                        pages: Math.ceil(total / Number(limit)),
                    }
                }
            });
        }
        catch (error) {
            logger_1.default.error('Get users error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch users'
            });
        }
    }
    /**
     * Get single user details
     */
    async getUser(req, res) {
        try {
            const { userId } = req.params;
            const user = await models_1.User.findById(userId).select('-password -refreshToken');
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }
            res.json({ success: true, data: { user } });
        }
        catch (error) {
            logger_1.default.error('Get user error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch user'
            });
        }
    }
    /**
     * Verify user
     */
    async verifyUser(req, res) {
        try {
            const { userId } = req.params;
            await models_1.User.findByIdAndUpdate(userId, { verified: true });
            logger_1.default.info(`User ${userId} verified by admin ${req.user?.userId}`);
            res.json({
                success: true,
                message: 'User verified successfully'
            });
        }
        catch (error) {
            logger_1.default.error('Verify user error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to verify user'
            });
        }
    }
    /**
     * Suspend user
     */
    async suspendUser(req, res) {
        try {
            const { userId } = req.params;
            const { reason } = req.body;
            await models_1.User.findByIdAndUpdate(userId, {
                isActive: false,
            });
            logger_1.default.info(`User ${userId} suspended by admin ${req.user?.userId}. Reason: ${reason}`);
            res.json({
                success: true,
                message: 'User suspended successfully'
            });
        }
        catch (error) {
            logger_1.default.error('Suspend user error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to suspend user'
            });
        }
    }
    /**
     * Unsuspend user
     */
    async unsuspendUser(req, res) {
        try {
            const { userId } = req.params;
            await models_1.User.findByIdAndUpdate(userId, {
                isActive: true,
            });
            logger_1.default.info(`User ${userId} unsuspended by admin ${req.user?.userId}`);
            res.json({
                success: true,
                message: 'User unsuspended successfully'
            });
        }
        catch (error) {
            logger_1.default.error('Unsuspend user error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to unsuspend user'
            });
        }
    }
    /**
     * Delete user
     */
    async deleteUser(req, res) {
        try {
            const { userId } = req.params;
            await models_1.User.findByIdAndDelete(userId);
            logger_1.default.info(`User ${userId} deleted by admin ${req.user?.userId}`);
            res.json({
                success: true,
                message: 'User deleted successfully'
            });
        }
        catch (error) {
            logger_1.default.error('Delete user error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to delete user'
            });
        }
    }
    /**
     * Get all matches
     */
    async getMatches(req, res) {
        try {
            const { page = 1, limit = 20 } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const [matches, total] = await Promise.all([
                models_1.Match.find()
                    .populate('user1', 'firstName lastName email profilePhoto')
                    .populate('user2', 'firstName lastName email profilePhoto')
                    .sort({ matchedAt: -1 })
                    .skip(skip)
                    .limit(Number(limit)),
                models_1.Match.countDocuments(),
            ]);
            res.json({
                success: true,
                data: {
                    matches,
                    pagination: {
                        page: Number(page),
                        limit: Number(limit),
                        total,
                        pages: Math.ceil(total / Number(limit)),
                    }
                }
            });
        }
        catch (error) {
            logger_1.default.error('Get matches error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch matches'
            });
        }
    }
    /**
     * Get match details
     */
    async getMatch(req, res) {
        try {
            const { matchId } = req.params;
            const match = await models_1.Match.findById(matchId)
                .populate('user1', 'firstName lastName email profilePhoto')
                .populate('user2', 'firstName lastName email profilePhoto');
            if (!match) {
                res.status(404).json({
                    success: false,
                    message: 'Match not found'
                });
                return;
            }
            res.json({ success: true, data: { match } });
        }
        catch (error) {
            logger_1.default.error('Get match error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch match'
            });
        }
    }
    /**
     * Delete match
     */
    async deleteMatch(req, res) {
        try {
            const { matchId } = req.params;
            await models_1.Match.findByIdAndDelete(matchId);
            logger_1.default.info(`Match ${matchId} deleted by admin ${req.user?.userId}`);
            res.json({
                success: true,
                message: 'Match deleted successfully'
            });
        }
        catch (error) {
            logger_1.default.error('Delete match error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to delete match'
            });
        }
    }
    /**
     * Get all properties
     */
    async getProperties(req, res) {
        try {
            const { page = 1, limit = 20, status } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const query = {};
            if (status && status !== 'all') {
                query.status = status;
            }
            const [properties, total] = await Promise.all([
                models_1.Property.find(query)
                    .populate('landlord', 'firstName lastName email profilePhoto')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(Number(limit)),
                models_1.Property.countDocuments(query),
            ]);
            res.json({
                success: true,
                data: {
                    properties,
                    pagination: {
                        page: Number(page),
                        limit: Number(limit),
                        total,
                        pages: Math.ceil(total / Number(limit)),
                    }
                }
            });
        }
        catch (error) {
            logger_1.default.error('Get properties error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch properties'
            });
        }
    }
    /**
     * Get property details
     */
    async getProperty(req, res) {
        try {
            const { propertyId } = req.params;
            const property = await models_1.Property.findById(propertyId)
                .populate('landlord', 'firstName lastName email profilePhoto phoneNumber');
            if (!property) {
                res.status(404).json({
                    success: false,
                    message: 'Property not found'
                });
                return;
            }
            res.json({ success: true, data: { property } });
        }
        catch (error) {
            logger_1.default.error('Get property error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch property'
            });
        }
    }
    /**
     * Update property
     */
    async updateProperty(req, res) {
        try {
            const { propertyId } = req.params;
            const property = await models_1.Property.findByIdAndUpdate(propertyId, { $set: req.body }, { new: true, runValidators: true });
            if (!property) {
                res.status(404).json({
                    success: false,
                    message: 'Property not found'
                });
                return;
            }
            logger_1.default.info(`Property ${propertyId} updated by admin ${req.user?.userId}`);
            res.json({
                success: true,
                message: 'Property updated successfully',
                data: { property }
            });
        }
        catch (error) {
            logger_1.default.error('Update property error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to update property'
            });
        }
    }
    /**
     * Delete property
     */
    async deleteProperty(req, res) {
        try {
            const { propertyId } = req.params;
            await models_1.Property.findByIdAndDelete(propertyId);
            logger_1.default.info(`Property ${propertyId} deleted by admin ${req.user?.userId}`);
            res.json({
                success: true,
                message: 'Property deleted successfully'
            });
        }
        catch (error) {
            logger_1.default.error('Delete property error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to delete property'
            });
        }
    }
    /**
     * Approve property
     */
    async approveProperty(req, res) {
        try {
            const { propertyId } = req.params;
            const property = await models_1.Property.findByIdAndUpdate(propertyId, { status: 'available' }, { new: true });
            if (!property) {
                res.status(404).json({
                    success: false,
                    message: 'Property not found'
                });
                return;
            }
            logger_1.default.info(`Property ${propertyId} approved by admin ${req.user?.userId}`);
            res.json({
                success: true,
                message: 'Property approved successfully',
                data: { property }
            });
        }
        catch (error) {
            logger_1.default.error('Approve property error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to approve property'
            });
        }
    }
    /**
     * Reject property
     */
    async rejectProperty(req, res) {
        try {
            const { propertyId } = req.params;
            const { reason } = req.body;
            const property = await models_1.Property.findByIdAndUpdate(propertyId, { status: 'inactive' }, { new: true });
            if (!property) {
                res.status(404).json({
                    success: false,
                    message: 'Property not found'
                });
                return;
            }
            logger_1.default.info(`Property ${propertyId} rejected by admin ${req.user?.userId}. Reason: ${reason}`);
            res.json({
                success: true,
                message: 'Property rejected successfully',
                data: { property }
            });
        }
        catch (error) {
            logger_1.default.error('Reject property error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to reject property'
            });
        }
    }
}
exports.default = new AdminController();
//# sourceMappingURL=admin.controller.js.map