"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const models_1 = require("../models");
const AppConfig_1 = require("../models/AppConfig");
const AuditLog_1 = require("../models/AuditLog");
const logger_1 = __importDefault(require("../utils/logger"));
const audit_1 = require("../utils/audit");
// Extract admin info from JWT token (since auth middleware is commented out)
function getAdminInfoFromToken(req) {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            return { userId: decoded.userId || '', email: decoded.email || '' };
        }
    }
    catch { }
    return { userId: '', email: '' };
}
async function getAdminFromToken(req) {
    const info = getAdminInfoFromToken(req);
    if (info.userId) {
        try {
            const admin = await models_1.User.findById(info.userId).select('firstName lastName email');
            if (admin) {
                return { id: info.userId, name: `${admin.firstName} ${admin.lastName}`, email: admin.email };
            }
        }
        catch { }
    }
    return { id: info.userId, name: info.email || 'Admin', email: info.email };
}
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
            await (0, audit_1.logAudit)({
                actor: { id: admin._id.toString(), name: `${admin.firstName} ${admin.lastName}`, email: admin.email },
                actorType: 'admin', action: 'admin_login', category: 'auth',
                details: 'Admin logged in', req, status: 'success'
            });
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
            const { UserActivity } = await Promise.resolve().then(() => __importStar(require('../models/UserActivity')));
            const { GameSession } = await Promise.resolve().then(() => __importStar(require('../models/Game')));
            const todayStr = today.toISOString().slice(0, 10);
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().slice(0, 10);
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            const weekAgoStr = weekAgo.toISOString().slice(0, 10);
            const monthAgo = new Date(today);
            monthAgo.setDate(monthAgo.getDate() - 30);
            const monthAgoStr = monthAgo.toISOString().slice(0, 10);
            const [newUsersToday, matchesToday, dauToday, dauYesterday, wau, mau, avgSessionToday, totalGameSessions,] = await Promise.all([
                models_1.User.countDocuments({ createdAt: { $gte: today } }),
                models_1.Match.countDocuments({ matchedAt: { $gte: today } }),
                UserActivity.countDocuments({ date: todayStr }),
                UserActivity.countDocuments({ date: yesterdayStr }),
                UserActivity.distinct('user', { date: { $gte: weekAgoStr } }).then(u => u.length),
                UserActivity.distinct('user', { date: { $gte: monthAgoStr } }).then(u => u.length),
                UserActivity.aggregate([
                    { $match: { date: todayStr } },
                    { $group: { _id: null, avg: { $avg: '$totalSeconds' } } },
                ]).then(r => Math.round((r[0]?.avg || 0) / 60)),
                GameSession.countDocuments(),
            ]);
            // Retention: users active today who were also active yesterday
            let retentionRate = 0;
            if (dauYesterday > 0) {
                const yesterdayUsers = await UserActivity.distinct('user', { date: yesterdayStr });
                if (yesterdayUsers.length > 0) {
                    const retained = await UserActivity.countDocuments({
                        date: todayStr,
                        user: { $in: yesterdayUsers },
                    });
                    retentionRate = Math.round((retained / yesterdayUsers.length) * 100);
                }
            }
            res.json({
                success: true,
                data: {
                    totalUsers,
                    activeUsers,
                    totalMatches,
                    totalMessages,
                    totalProperties,
                    totalGames: totalGameSessions,
                    newUsersToday,
                    matchesToday,
                    revenueToday: 0,
                    revenueMonth: 0,
                    // New analytics
                    dauToday,
                    dauYesterday,
                    wau,
                    mau,
                    avgSessionMinutes: avgSessionToday,
                    retentionRate,
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
            const { page = 1, limit = 20, search, status, city, state, occupation, gender, verified, subscription } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const query = {};
            if (search) {
                query.$or = [
                    { firstName: { $regex: search, $options: 'i' } },
                    { lastName: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { occupation: { $regex: search, $options: 'i' } },
                    { 'location.city': { $regex: search, $options: 'i' } },
                ];
            }
            if (status && status !== 'all') {
                if (status === 'active')
                    query.isActive = true;
                if (status === 'inactive')
                    query.isActive = false;
                if (status === 'verified')
                    query.verified = true;
                if (status === 'unverified')
                    query.verified = false;
                if (status === 'pending_verification') {
                    query.verified = false;
                    query['metadata.verificationRequested'] = true;
                }
                if (status === 'suspended')
                    query.isActive = false;
            }
            if (city)
                query['location.city'] = { $regex: city, $options: 'i' };
            if (state)
                query['location.state'] = { $regex: state, $options: 'i' };
            if (occupation)
                query.occupation = { $regex: occupation, $options: 'i' };
            if (gender && gender !== 'all')
                query.gender = gender;
            if (verified === 'true')
                query.verified = true;
            if (verified === 'false')
                query.verified = false;
            if (subscription && subscription !== 'all')
                query['subscription.plan'] = subscription;
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
            const targetUser = await models_1.User.findById(userId).select('firstName lastName email profilePhoto');
            await models_1.User.findByIdAndUpdate(userId, { verified: true });
            logger_1.default.info(`User ${userId} verified by admin`);
            await (0, audit_1.logAudit)({
                actor: await getAdminFromToken(req),
                actorType: 'admin', action: 'verify_user', category: 'user_management',
                target: { type: 'user', id: userId, name: targetUser ? `${targetUser.firstName} ${targetUser.lastName}` : userId },
                details: `Verified user ${targetUser ? `${targetUser.firstName} ${targetUser.lastName} (${targetUser.email})` : userId}`, req,
                metadata: { targetUser: targetUser ? { firstName: targetUser.firstName, lastName: targetUser.lastName, email: targetUser.email } : null }
            });
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
            const targetUser = await models_1.User.findById(userId).select('firstName lastName email profilePhoto');
            await models_1.User.findByIdAndUpdate(userId, {
                isActive: false,
            });
            logger_1.default.info(`User ${userId} suspended. Reason: ${reason}`);
            await (0, audit_1.logAudit)({
                actor: await getAdminFromToken(req),
                actorType: 'admin', action: 'suspend_user', category: 'user_management',
                target: { type: 'user', id: userId, name: targetUser ? `${targetUser.firstName} ${targetUser.lastName}` : userId },
                details: `Suspended user ${targetUser ? `${targetUser.firstName} ${targetUser.lastName} (${targetUser.email})` : userId}. Reason: ${reason}`, req,
                metadata: { reason, targetUser: targetUser ? { firstName: targetUser.firstName, lastName: targetUser.lastName, email: targetUser.email } : null }
            });
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
            const targetUser = await models_1.User.findById(userId).select('firstName lastName email');
            await models_1.User.findByIdAndUpdate(userId, {
                isActive: true,
            });
            logger_1.default.info(`User ${userId} unsuspended`);
            await (0, audit_1.logAudit)({
                actor: await getAdminFromToken(req),
                actorType: 'admin', action: 'unsuspend_user', category: 'user_management',
                target: { type: 'user', id: userId, name: targetUser ? `${targetUser.firstName} ${targetUser.lastName}` : userId },
                details: `Unsuspended user ${targetUser ? `${targetUser.firstName} ${targetUser.lastName} (${targetUser.email})` : userId}`, req,
                metadata: { targetUser: targetUser ? { firstName: targetUser.firstName, lastName: targetUser.lastName, email: targetUser.email } : null }
            });
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
            // Fetch user details BEFORE deleting so we have their info for the audit log
            const targetUser = await models_1.User.findById(userId).select('firstName lastName email phoneNumber profilePhoto location occupation');
            await models_1.User.findByIdAndDelete(userId);
            logger_1.default.info(`User ${userId} deleted`);
            await (0, audit_1.logAudit)({
                actor: await getAdminFromToken(req),
                actorType: 'admin', action: 'delete_user', category: 'user_management',
                target: { type: 'user', id: userId, name: targetUser ? `${targetUser.firstName} ${targetUser.lastName}` : userId },
                details: `Deleted user ${targetUser ? `${targetUser.firstName} ${targetUser.lastName} (${targetUser.email})` : userId}`, req,
                metadata: { deletedUser: targetUser ? { firstName: targetUser.firstName, lastName: targetUser.lastName, email: targetUser.email, phoneNumber: targetUser.phoneNumber, occupation: targetUser.occupation, location: targetUser.location } : null }
            });
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
            // Fetch match with user details before deleting
            const match = await models_1.Match.findById(matchId).populate('user1', 'firstName lastName email').populate('user2', 'firstName lastName email');
            await models_1.Match.findByIdAndDelete(matchId);
            const u1 = match?.user1;
            const u2 = match?.user2;
            const matchDesc = u1 && u2 ? `${u1.firstName} ${u1.lastName} & ${u2.firstName} ${u2.lastName}` : matchId;
            logger_1.default.info(`Match ${matchId} deleted`);
            await (0, audit_1.logAudit)({
                actor: await getAdminFromToken(req),
                actorType: 'admin', action: 'delete_match', category: 'match_management',
                target: { type: 'match', id: matchId, name: matchDesc },
                details: `Deleted match between ${matchDesc}`, req,
                metadata: { user1: u1 ? { id: u1._id, firstName: u1.firstName, lastName: u1.lastName, email: u1.email } : null, user2: u2 ? { id: u2._id, firstName: u2.firstName, lastName: u2.lastName, email: u2.email } : null }
            });
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
            logger_1.default.info(`Property ${propertyId} updated`);
            await (0, audit_1.logAudit)({
                actor: await getAdminFromToken(req),
                actorType: 'admin', action: 'update_property', category: 'property_management',
                target: { type: 'property', id: propertyId, name: property.title || propertyId },
                details: `Updated property "${property.title || propertyId}"`, req,
                metadata: { property: { title: property.title, type: property.type, status: property.status, updatedFields: Object.keys(req.body) } }
            });
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
            // Fetch property details before deleting
            const property = await models_1.Property.findById(propertyId).populate('landlord', 'firstName lastName email');
            await models_1.Property.findByIdAndDelete(propertyId);
            const landlord = property?.landlord;
            logger_1.default.info(`Property ${propertyId} deleted`);
            await (0, audit_1.logAudit)({
                actor: await getAdminFromToken(req),
                actorType: 'admin', action: 'delete_property', category: 'property_management',
                target: { type: 'property', id: propertyId, name: property?.title || propertyId },
                details: `Deleted property "${property?.title || propertyId}" owned by ${landlord ? `${landlord.firstName} ${landlord.lastName} (${landlord.email})` : 'unknown'}`, req,
                metadata: { deletedProperty: property ? { title: property.title, type: property.type, landlord: landlord ? { firstName: landlord.firstName, lastName: landlord.lastName, email: landlord.email } : null } : null }
            });
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
            logger_1.default.info(`Property ${propertyId} approved`);
            await (0, audit_1.logAudit)({
                actor: await getAdminFromToken(req),
                actorType: 'admin', action: 'approve_property', category: 'property_management',
                target: { type: 'property', id: propertyId, name: property.title || propertyId },
                details: `Approved property "${property.title || propertyId}"`, req,
                metadata: { property: { title: property.title, type: property.type } }
            });
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
            logger_1.default.info(`Property ${propertyId} rejected. Reason: ${reason}`);
            await (0, audit_1.logAudit)({
                actor: await getAdminFromToken(req),
                actorType: 'admin', action: 'reject_property', category: 'property_management',
                target: { type: 'property', id: propertyId, name: property.title || propertyId },
                details: `Rejected property "${property.title || propertyId}". Reason: ${reason}`, req,
                metadata: { reason, property: { title: property.title, type: property.type } }
            });
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
    // ============ REPORTS ============
    async getReports(req, res) {
        try {
            const { page = 1, limit = 20, status } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const query = { type: { $in: ['system', 'reminder'] } };
            if (status === 'read')
                query.read = true;
            if (status === 'unread')
                query.read = false;
            const [reports, total] = await Promise.all([
                models_1.Notification.find(query)
                    .populate('user', 'firstName lastName email profilePhoto')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(Number(limit)),
                models_1.Notification.countDocuments(query),
            ]);
            res.json({
                success: true,
                data: {
                    reports,
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
            logger_1.default.error('Get reports error:', error);
            res.status(500).json({ success: false, message: error.message || 'Failed to fetch reports' });
        }
    }
    async getReport(req, res) {
        try {
            const { reportId } = req.params;
            const report = await models_1.Notification.findById(reportId)
                .populate('user', 'firstName lastName email profilePhoto');
            if (!report) {
                res.status(404).json({ success: false, message: 'Report not found' });
                return;
            }
            res.json({ success: true, data: { report } });
        }
        catch (error) {
            logger_1.default.error('Get report error:', error);
            res.status(500).json({ success: false, message: error.message || 'Failed to fetch report' });
        }
    }
    async updateReport(req, res) {
        try {
            const { reportId } = req.params;
            const { status } = req.body;
            const report = await models_1.Notification.findByIdAndUpdate(reportId, { read: status === 'resolved' || status === 'reviewed' }, { new: true });
            if (!report) {
                res.status(404).json({ success: false, message: 'Report not found' });
                return;
            }
            logger_1.default.info(`Report ${reportId} updated to ${status}`);
            await (0, audit_1.logAudit)({
                actor: await getAdminFromToken(req),
                actorType: 'admin', action: 'update_report', category: 'report_management',
                target: { type: 'report', id: reportId, name: report.title || `Report #${reportId.slice(-6)}` },
                details: `Updated report #${reportId.slice(-6)} status to "${status}"`, req,
                metadata: { newStatus: status, reportType: report.type }
            });
            res.json({ success: true, message: 'Report updated successfully', data: { report } });
        }
        catch (error) {
            logger_1.default.error('Update report error:', error);
            res.status(500).json({ success: false, message: error.message || 'Failed to update report' });
        }
    }
    // ============ GAMES ============
    async getGames(req, res) {
        try {
            const games = await models_1.Game.find().sort({ createdAt: -1 });
            res.json({ success: true, data: { games } });
        }
        catch (error) {
            logger_1.default.error('Get games error:', error);
            res.status(500).json({ success: false, message: error.message || 'Failed to fetch games' });
        }
    }
    async getGameSessions(req, res) {
        try {
            const { page = 1, limit = 20 } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const [sessions, total] = await Promise.all([
                models_1.GameSession.find()
                    .populate('players.user', 'firstName lastName email profilePhoto')
                    .populate('game', 'name category')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(Number(limit)),
                models_1.GameSession.countDocuments(),
            ]);
            res.json({
                success: true,
                data: {
                    sessions,
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
            logger_1.default.error('Get game sessions error:', error);
            res.status(500).json({ success: false, message: error.message || 'Failed to fetch game sessions' });
        }
    }
    async getGameStats(req, res) {
        try {
            const [totalGames, totalSessions, activeSessions] = await Promise.all([
                models_1.Game.countDocuments(),
                models_1.GameSession.countDocuments(),
                models_1.GameSession.countDocuments({ status: 'in_progress' }),
            ]);
            res.json({
                success: true,
                data: {
                    totalGames,
                    totalSessions,
                    activeSessions,
                    completedSessions: totalSessions - activeSessions,
                }
            });
        }
        catch (error) {
            logger_1.default.error('Get game stats error:', error);
            res.status(500).json({ success: false, message: error.message || 'Failed to fetch game stats' });
        }
    }
    // ============ GROUPS ============
    async getGroups(req, res) {
        try {
            const { page = 1, limit = 20 } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const [groups, total] = await Promise.all([
                models_1.RoommateConnection.find({ status: 'accepted' })
                    .populate('requester', 'firstName lastName email profilePhoto')
                    .populate('recipient', 'firstName lastName email profilePhoto')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(Number(limit)),
                models_1.RoommateConnection.countDocuments({ status: 'accepted' }),
            ]);
            res.json({
                success: true,
                data: {
                    groups,
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
            logger_1.default.error('Get groups error:', error);
            res.status(500).json({ success: false, message: error.message || 'Failed to fetch groups' });
        }
    }
    async getGroup(req, res) {
        try {
            const { groupId } = req.params;
            const group = await models_1.RoommateConnection.findById(groupId)
                .populate('requester', 'firstName lastName email profilePhoto')
                .populate('recipient', 'firstName lastName email profilePhoto');
            if (!group) {
                res.status(404).json({ success: false, message: 'Group not found' });
                return;
            }
            res.json({ success: true, data: { group } });
        }
        catch (error) {
            logger_1.default.error('Get group error:', error);
            res.status(500).json({ success: false, message: error.message || 'Failed to fetch group' });
        }
    }
    async deleteGroup(req, res) {
        try {
            const { groupId } = req.params;
            // Fetch connection details before deleting
            const connection = await models_1.RoommateConnection.findById(groupId).populate('requester', 'firstName lastName email').populate('recipient', 'firstName lastName email');
            await models_1.RoommateConnection.findByIdAndDelete(groupId);
            const requester = connection?.requester;
            const recipient = connection?.recipient;
            const connDesc = requester && recipient ? `${requester.firstName} ${requester.lastName} & ${recipient.firstName} ${recipient.lastName}` : groupId;
            logger_1.default.info(`Group ${groupId} deleted`);
            await (0, audit_1.logAudit)({
                actor: await getAdminFromToken(req),
                actorType: 'admin', action: 'delete_group', category: 'group_management',
                target: { type: 'group', id: groupId, name: connDesc },
                details: `Deleted connection between ${connDesc}`, req,
                metadata: { requester: requester ? { firstName: requester.firstName, lastName: requester.lastName, email: requester.email } : null, recipient: recipient ? { firstName: recipient.firstName, lastName: recipient.lastName, email: recipient.email } : null }
            });
            res.json({ success: true, message: 'Group deleted successfully' });
        }
        catch (error) {
            logger_1.default.error('Delete group error:', error);
            res.status(500).json({ success: false, message: error.message || 'Failed to delete group' });
        }
    }
    // ============ ANALYTICS ============
    async getAnalytics(req, res) {
        try {
            const period = req.query.period || '30d';
            const days = parseInt(period) || 30;
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            const [totalUsers, newUsers, totalMatches, newMatches, totalMessages, totalProperties, activeProperties, totalConnections,] = await Promise.all([
                models_1.User.countDocuments(),
                models_1.User.countDocuments({ createdAt: { $gte: startDate } }),
                models_1.Match.countDocuments(),
                models_1.Match.countDocuments({ matchedAt: { $gte: startDate } }),
                models_1.Message.countDocuments(),
                models_1.Property.countDocuments(),
                models_1.Property.countDocuments({ status: 'available' }),
                models_1.RoommateConnection.countDocuments({ status: 'accepted' }),
            ]);
            // User growth over period
            const userGrowth = [];
            for (let i = days - 1; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                date.setHours(0, 0, 0, 0);
                const nextDate = new Date(date);
                nextDate.setDate(nextDate.getDate() + 1);
                const count = await models_1.User.countDocuments({
                    createdAt: { $gte: date, $lt: nextDate }
                });
                userGrowth.push({ date: date.toISOString().split('T')[0], users: count });
            }
            // Match growth over period
            const matchGrowth = [];
            for (let i = days - 1; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                date.setHours(0, 0, 0, 0);
                const nextDate = new Date(date);
                nextDate.setDate(nextDate.getDate() + 1);
                const count = await models_1.Match.countDocuments({
                    matchedAt: { $gte: date, $lt: nextDate }
                });
                matchGrowth.push({ date: date.toISOString().split('T')[0], matches: count });
            }
            res.json({
                success: true,
                data: {
                    overview: {
                        totalUsers,
                        newUsers,
                        totalMatches,
                        newMatches,
                        totalMessages,
                        totalProperties,
                        activeProperties,
                        totalConnections,
                    },
                    userGrowth,
                    matchGrowth,
                }
            });
        }
        catch (error) {
            logger_1.default.error('Get analytics error:', error);
            res.status(500).json({ success: false, message: error.message || 'Failed to fetch analytics' });
        }
    }
    async getRecentActivity(req, res) {
        try {
            const [recentUsers, recentMatches, recentProperties] = await Promise.all([
                models_1.User.find().select('firstName lastName email createdAt').sort({ createdAt: -1 }).limit(5),
                models_1.Match.find().populate('user1', 'firstName lastName').populate('user2', 'firstName lastName').sort({ matchedAt: -1 }).limit(5),
                models_1.Property.find().populate('landlord', 'firstName lastName').select('title status createdAt').sort({ createdAt: -1 }).limit(5),
            ]);
            const activities = [
                ...recentUsers.map(u => ({
                    type: 'user_joined',
                    message: `${u.firstName} ${u.lastName} joined`,
                    timestamp: u.createdAt,
                })),
                ...recentMatches.map(m => ({
                    type: 'new_match',
                    message: `${m.user1?.firstName || 'User'} matched with ${m.user2?.firstName || 'User'}`,
                    timestamp: m.matchedAt,
                })),
                ...recentProperties.map(p => ({
                    type: 'new_property',
                    message: `Property "${p.title}" listed`,
                    timestamp: p.createdAt,
                })),
            ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);
            res.json({ success: true, data: { activities } });
        }
        catch (error) {
            logger_1.default.error('Get recent activity error:', error);
            res.status(500).json({ success: false, message: error.message || 'Failed to fetch activity' });
        }
    }
    async exportData(req, res) {
        try {
            const { type } = req.params;
            let data;
            let filename;
            switch (type) {
                case 'users':
                    data = await models_1.User.find().select('-password -refreshToken').lean();
                    filename = 'users-export.json';
                    break;
                case 'matches':
                    data = await models_1.Match.find().populate('user1', 'firstName lastName email').populate('user2', 'firstName lastName email').lean();
                    filename = 'matches-export.json';
                    break;
                case 'properties':
                    data = await models_1.Property.find().populate('landlord', 'firstName lastName email').lean();
                    filename = 'properties-export.json';
                    break;
                default:
                    res.status(400).json({ success: false, message: 'Invalid export type' });
                    return;
            }
            await (0, audit_1.logAudit)({
                actor: await getAdminFromToken(req),
                actorType: 'admin', action: 'export_data', category: 'data_management',
                target: { type: 'export', id: type, name: `${type} export` },
                details: `Exported ${type} data (${data.length} records)`, req,
                metadata: { exportType: type, recordCount: data.length }
            });
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
            res.json(data);
        }
        catch (error) {
            logger_1.default.error('Export data error:', error);
            res.status(500).json({ success: false, message: error.message || 'Failed to export data' });
        }
    }
    // ============ POINTS / PURCHASES ============
    async getPurchases(req, res) {
        try {
            const { page = 1, limit = 20, status } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const query = { type: 'coins' };
            if (status && status !== 'all') {
                query.status = status;
            }
            const [purchases, total] = await Promise.all([
                models_1.Transaction.find(query)
                    .populate('user', 'firstName lastName email profilePhoto gamification')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(Number(limit)),
                models_1.Transaction.countDocuments(query),
            ]);
            // Also get summary counts
            const [pendingCount, completedCount, failedCount] = await Promise.all([
                models_1.Transaction.countDocuments({ type: 'coins', status: 'pending' }),
                models_1.Transaction.countDocuments({ type: 'coins', status: 'completed' }),
                models_1.Transaction.countDocuments({ type: 'coins', status: 'failed' }),
            ]);
            res.json({
                success: true,
                data: {
                    purchases,
                    summary: { pendingCount, completedCount, failedCount },
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
            logger_1.default.error('Get purchases error:', error);
            res.status(500).json({ success: false, message: error.message || 'Failed to fetch purchases' });
        }
    }
    async approvePurchase(req, res) {
        try {
            const { transactionId } = req.params;
            const transaction = await models_1.Transaction.findById(transactionId);
            if (!transaction) {
                res.status(404).json({ success: false, message: 'Transaction not found' });
                return;
            }
            if (transaction.status !== 'pending') {
                res.status(400).json({ success: false, message: `Transaction is already ${transaction.status}` });
                return;
            }
            // Get the points amount from metadata
            const pointsAmount = transaction.metadata?.pointsAmount || transaction.amount;
            // Update transaction status
            transaction.status = 'completed';
            await transaction.save();
            // Get user details for audit
            const purchaseUser = await models_1.User.findById(transaction.user).select('firstName lastName email');
            // Add points to the user
            await models_1.User.findByIdAndUpdate(transaction.user, {
                $inc: { 'gamification.points': pointsAmount }
            });
            const userName = purchaseUser ? `${purchaseUser.firstName} ${purchaseUser.lastName}` : transaction.user.toString();
            logger_1.default.info(`Purchase ${transactionId} approved. ${pointsAmount} points added to ${userName}`);
            await (0, audit_1.logAudit)({
                actor: await getAdminFromToken(req),
                actorType: 'admin', action: 'approve_purchase', category: 'points_management',
                target: { type: 'transaction', id: transactionId, name: `${pointsAmount} points for ${userName}` },
                details: `Approved purchase of ${pointsAmount} points for ${userName}${purchaseUser ? ` (${purchaseUser.email})` : ''}. Amount: ₦${transaction.amount}`, req,
                metadata: { pointsAmount, amount: transaction.amount, user: purchaseUser ? { id: transaction.user.toString(), firstName: purchaseUser.firstName, lastName: purchaseUser.lastName, email: purchaseUser.email } : { id: transaction.user.toString() } }
            });
            res.json({
                success: true,
                message: `Purchase approved. ${pointsAmount} points added to user.`,
                data: { transaction }
            });
        }
        catch (error) {
            logger_1.default.error('Approve purchase error:', error);
            res.status(500).json({ success: false, message: error.message || 'Failed to approve purchase' });
        }
    }
    async rejectPurchase(req, res) {
        try {
            const { transactionId } = req.params;
            const { reason } = req.body;
            const transaction = await models_1.Transaction.findById(transactionId);
            if (!transaction) {
                res.status(404).json({ success: false, message: 'Transaction not found' });
                return;
            }
            if (transaction.status !== 'pending') {
                res.status(400).json({ success: false, message: `Transaction is already ${transaction.status}` });
                return;
            }
            // Get user details for audit
            const purchaseUser = await models_1.User.findById(transaction.user).select('firstName lastName email');
            const pointsAmount = transaction.metadata?.pointsAmount || transaction.amount;
            transaction.status = 'failed';
            if (reason) {
                transaction.metadata = { ...transaction.metadata, rejectionReason: reason };
            }
            await transaction.save();
            const userName = purchaseUser ? `${purchaseUser.firstName} ${purchaseUser.lastName}` : transaction.user.toString();
            logger_1.default.info(`Purchase ${transactionId} rejected. Reason: ${reason || 'No reason given'}`);
            await (0, audit_1.logAudit)({
                actor: await getAdminFromToken(req),
                actorType: 'admin', action: 'reject_purchase', category: 'points_management',
                target: { type: 'transaction', id: transactionId, name: `${pointsAmount} points for ${userName}` },
                details: `Rejected purchase of ${pointsAmount} points for ${userName}${purchaseUser ? ` (${purchaseUser.email})` : ''}. Reason: ${reason || 'None'}`, req,
                metadata: { reason, pointsAmount, amount: transaction.amount, user: purchaseUser ? { id: transaction.user.toString(), firstName: purchaseUser.firstName, lastName: purchaseUser.lastName, email: purchaseUser.email } : { id: transaction.user.toString() } }
            });
            res.json({
                success: true,
                message: 'Purchase rejected.',
                data: { transaction }
            });
        }
        catch (error) {
            logger_1.default.error('Reject purchase error:', error);
            res.status(500).json({ success: false, message: error.message || 'Failed to reject purchase' });
        }
    }
    async getPointsOverview(req, res) {
        try {
            // Get total points in the system
            const usersWithPoints = await models_1.User.aggregate([
                { $group: {
                        _id: null,
                        totalPointsInSystem: { $sum: '$gamification.points' },
                        avgPoints: { $avg: '$gamification.points' },
                        maxPoints: { $max: '$gamification.points' },
                    } }
            ]);
            const [totalTransactions, pendingPurchases, totalRevenue] = await Promise.all([
                models_1.Transaction.countDocuments({ type: 'coins' }),
                models_1.Transaction.countDocuments({ type: 'coins', status: 'pending' }),
                models_1.Transaction.aggregate([
                    { $match: { type: 'coins', status: 'completed' } },
                    { $group: { _id: null, total: { $sum: '$amount' } } }
                ]),
            ]);
            res.json({
                success: true,
                data: {
                    totalPointsInSystem: usersWithPoints[0]?.totalPointsInSystem || 0,
                    avgPointsPerUser: Math.round(usersWithPoints[0]?.avgPoints || 0),
                    maxUserPoints: usersWithPoints[0]?.maxPoints || 0,
                    totalTransactions,
                    pendingPurchases,
                    totalRevenue: totalRevenue[0]?.total || 0,
                }
            });
        }
        catch (error) {
            logger_1.default.error('Get points overview error:', error);
            res.status(500).json({ success: false, message: error.message || 'Failed to fetch points overview' });
        }
    }
    // ============ AUDIT LOGS ============
    async getAuditLogs(req, res) {
        try {
            const { page = 1, limit = 30, actorType, category, action, search, targetType, targetId, status, startDate, endDate } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const query = {};
            if (actorType && actorType !== 'all')
                query.actorType = actorType;
            if (category && category !== 'all')
                query.category = category;
            if (action && action !== 'all')
                query.action = action;
            if (status && status !== 'all')
                query.status = status;
            if (targetType)
                query['target.type'] = targetType;
            if (targetId)
                query['target.id'] = targetId;
            if (search) {
                query.$or = [
                    { actorName: { $regex: search, $options: 'i' } },
                    { actorEmail: { $regex: search, $options: 'i' } },
                    { action: { $regex: search, $options: 'i' } },
                    { details: { $regex: search, $options: 'i' } },
                    { 'target.name': { $regex: search, $options: 'i' } },
                ];
            }
            if (startDate || endDate) {
                query.createdAt = {};
                if (startDate)
                    query.createdAt.$gte = new Date(startDate);
                if (endDate)
                    query.createdAt.$lte = new Date(endDate);
            }
            const [logs, total] = await Promise.all([
                AuditLog_1.AuditLog.find(query)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(Number(limit)),
                AuditLog_1.AuditLog.countDocuments(query),
            ]);
            res.json({
                success: true,
                data: {
                    logs,
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
            logger_1.default.error('Get audit logs error:', error);
            res.status(500).json({ success: false, message: error.message || 'Failed to fetch audit logs' });
        }
    }
    async getAuditLog(req, res) {
        try {
            const { logId } = req.params;
            const log = await AuditLog_1.AuditLog.findById(logId);
            if (!log) {
                res.status(404).json({ success: false, message: 'Audit log not found' });
                return;
            }
            res.json({ success: true, data: { log } });
        }
        catch (error) {
            logger_1.default.error('Get audit log error:', error);
            res.status(500).json({ success: false, message: error.message || 'Failed to fetch audit log' });
        }
    }
    async getAuditStats(req, res) {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const [totalLogs, todayLogs, categoryBreakdown, actorTypeBreakdown] = await Promise.all([
                AuditLog_1.AuditLog.countDocuments(),
                AuditLog_1.AuditLog.countDocuments({ createdAt: { $gte: today } }),
                AuditLog_1.AuditLog.aggregate([
                    { $group: { _id: '$category', count: { $sum: 1 } } },
                    { $sort: { count: -1 } },
                    { $limit: 10 },
                ]),
                AuditLog_1.AuditLog.aggregate([
                    { $group: { _id: '$actorType', count: { $sum: 1 } } },
                ]),
            ]);
            res.json({
                success: true,
                data: {
                    totalLogs,
                    todayLogs,
                    categoryBreakdown: categoryBreakdown.map((c) => ({ category: c._id, count: c.count })),
                    actorTypeBreakdown: actorTypeBreakdown.map((a) => ({ type: a._id, count: a.count })),
                }
            });
        }
        catch (error) {
            logger_1.default.error('Get audit stats error:', error);
            res.status(500).json({ success: false, message: error.message || 'Failed to fetch audit stats' });
        }
    }
    async getUserAuditTrail(req, res) {
        try {
            const { userId } = req.params;
            const { page = 1, limit = 30 } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const query = {
                $or: [
                    { actor: userId },
                    { 'target.id': userId, 'target.type': 'user' },
                ]
            };
            const [logs, total] = await Promise.all([
                AuditLog_1.AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
                AuditLog_1.AuditLog.countDocuments(query),
            ]);
            res.json({
                success: true,
                data: {
                    logs,
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
            logger_1.default.error('Get user audit trail error:', error);
            res.status(500).json({ success: false, message: error.message || 'Failed to fetch user audit trail' });
        }
    }
    async getAppVersion(req, res) {
        try {
            const config = await AppConfig_1.AppConfig.findOne({ key: 'app_version' });
            res.json({
                success: true,
                data: config?.value || { currentVersion: '1.0.0', minVersion: '1.0.0', updateUrl: '', forceUpdate: false, updateMessage: '' },
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async updateAppVersion(req, res) {
        try {
            const config = await AppConfig_1.AppConfig.findOneAndUpdate({ key: 'app_version' }, { value: req.body, updatedAt: new Date() }, { upsert: true, new: true });
            res.json({ success: true, data: config.value });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // ==========================================
    // STUDY BUDDY ADMIN
    // ==========================================
    async getStudySessions(req, res) {
        try {
            const { page = 1, limit = 20, category, status } = req.query;
            const query = {};
            if (category)
                query.category = category;
            if (status)
                query.status = status;
            const skip = (Number(page) - 1) * Number(limit);
            const [sessions, total] = await Promise.all([
                models_1.StudySession.find(query)
                    .populate('creator', 'firstName lastName email profilePhoto')
                    .populate('opponent', 'firstName lastName email profilePhoto')
                    .populate('winner', 'firstName lastName')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(Number(limit))
                    .lean(),
                models_1.StudySession.countDocuments(query),
            ]);
            res.json({ success: true, data: { sessions, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } } });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async getStudyStats(req, res) {
        try {
            const [total, active, completed, categories] = await Promise.all([
                models_1.StudySession.countDocuments(),
                models_1.StudySession.countDocuments({ status: 'active' }),
                models_1.StudySession.countDocuments({ status: 'completed' }),
                models_1.StudySession.distinct('category'),
            ]);
            res.json({ success: true, data: { total, active, completed, totalCategories: categories.length } });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async deleteStudySession(req, res) {
        try {
            await models_1.StudySession.findByIdAndDelete(req.params.sessionId);
            res.json({ success: true, message: 'Session deleted' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // ==========================================
    // EVENTS ADMIN
    // ==========================================
    async getAdminEvents(req, res) {
        try {
            const { page = 1, limit = 20, status, category } = req.query;
            const query = {};
            if (status === 'active') {
                query.isActive = true;
                query.isCancelled = false;
            }
            else if (status === 'cancelled') {
                query.isCancelled = true;
            }
            if (category)
                query.category = category;
            const skip = (Number(page) - 1) * Number(limit);
            const [events, total] = await Promise.all([
                models_1.Event.find(query)
                    .populate('creator', 'firstName lastName email profilePhoto')
                    .sort({ date: -1 })
                    .skip(skip)
                    .limit(Number(limit))
                    .lean(),
                models_1.Event.countDocuments(query),
            ]);
            const enriched = events.map((e) => ({
                ...e,
                goingCount: e.attendees?.filter((a) => a.status === 'going').length || 0,
                interestedCount: e.attendees?.filter((a) => a.status === 'interested').length || 0,
            }));
            res.json({ success: true, data: { events: enriched, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } } });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async getEventStats(req, res) {
        try {
            const [total, active, cancelled] = await Promise.all([
                models_1.Event.countDocuments(),
                models_1.Event.countDocuments({ isActive: true, isCancelled: false }),
                models_1.Event.countDocuments({ isCancelled: true }),
            ]);
            const attendeesAgg = await models_1.Event.aggregate([
                { $project: { goingCount: { $size: { $filter: { input: '$attendees', cond: { $eq: ['$$this.status', 'going'] } } } } } },
                { $group: { _id: null, total: { $sum: '$goingCount' } } },
            ]);
            const totalAttendees = attendeesAgg[0]?.total || 0;
            res.json({ success: true, data: { total, active, cancelled, totalAttendees } });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async adminCancelEvent(req, res) {
        try {
            await models_1.Event.findByIdAndUpdate(req.params.eventId, { isCancelled: true });
            res.json({ success: true, message: 'Event cancelled' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async adminDeleteEvent(req, res) {
        try {
            await models_1.Event.findByIdAndDelete(req.params.eventId);
            res.json({ success: true, message: 'Event deleted' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // ==========================================
    // CONFESSIONS ADMIN
    // ==========================================
    async getAdminConfessions(req, res) {
        try {
            const { page = 1, limit = 20, groupId } = req.query;
            const query = { isActive: true };
            if (groupId)
                query.group = groupId;
            const skip = (Number(page) - 1) * Number(limit);
            const [confessions, total] = await Promise.all([
                models_1.Confession.find(query)
                    .populate('group', 'name')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(Number(limit))
                    .lean(),
                models_1.Confession.countDocuments(query),
            ]);
            res.json({ success: true, data: { confessions, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } } });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async getConfessionStats(req, res) {
        try {
            const [total, reported, hidden, repliesAgg] = await Promise.all([
                models_1.Confession.countDocuments({ isActive: true }),
                models_1.Confession.countDocuments({ isActive: true, reportCount: { $gt: 0 } }),
                models_1.Confession.countDocuments({ isHidden: true }),
                models_1.Confession.aggregate([
                    { $project: { replyCount: { $size: '$replies' } } },
                    { $group: { _id: null, total: { $sum: '$replyCount' } } },
                ]),
            ]);
            res.json({ success: true, data: { total, reported, hidden, totalReplies: repliesAgg[0]?.total || 0 } });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async hideConfession(req, res) {
        try {
            await models_1.Confession.findByIdAndUpdate(req.params.confessionId, { isHidden: true });
            res.json({ success: true, message: 'Confession hidden' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async adminDeleteConfession(req, res) {
        try {
            await models_1.Confession.findByIdAndUpdate(req.params.confessionId, { isActive: false });
            res.json({ success: true, message: 'Confession deleted' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // Study Buddy - Category & Question Management
    async getStudyCategories(req, res) {
        try {
            const { StudyQuestion } = require('../models');
            // Get all categories from hardcoded + DB
            const studyBuddyService = require('../services/studyBuddy.service').default;
            const hardcodedCategories = studyBuddyService.getCategories();
            // Count DB questions per category
            const dbCounts = await StudyQuestion.aggregate([
                { $match: { isActive: true } },
                { $group: { _id: '$category', count: { $sum: 1 } } },
            ]);
            const dbCountMap = {};
            dbCounts.forEach((c) => { dbCountMap[c._id] = c.count; });
            // Get DB questions grouped by category
            const dbQuestions = await StudyQuestion.find({ isActive: true }).sort({ createdAt: -1 }).lean();
            const categories = hardcodedCategories.map((cat) => ({
                ...cat,
                questionCount: (dbCountMap[cat.key] || 0),
                questions: dbQuestions.filter((q) => q.category === cat.key),
            }));
            // Also include any DB-only categories not in hardcoded list
            const hardcodedKeys = new Set(hardcodedCategories.map((c) => c.key));
            const extraCategories = Object.keys(dbCountMap)
                .filter(k => !hardcodedKeys.has(k))
                .map(key => ({
                key,
                label: key.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
                icon: 'book',
                questionCount: dbCountMap[key],
                questions: dbQuestions.filter((q) => q.category === key),
            }));
            res.json({ success: true, data: { categories: [...categories, ...extraCategories] } });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async createStudyCategory(req, res) {
        try {
            const { key, label } = req.body;
            if (!key || !label) {
                res.status(400).json({ success: false, message: 'key and label are required' });
                return;
            }
            // Categories are dynamic — just return success. Questions define the category.
            res.json({ success: true, message: 'Category created. Add questions to populate it.', data: { key, label } });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async addStudyQuestion(req, res) {
        try {
            const { category } = req.params;
            const { question, options, correctAnswer, explanation } = req.body;
            if (!question || !options || options.length !== 4 || !correctAnswer) {
                res.status(400).json({ success: false, message: 'question, options (4), and correctAnswer are required' });
                return;
            }
            if (!options.includes(correctAnswer)) {
                res.status(400).json({ success: false, message: 'correctAnswer must be one of the options' });
                return;
            }
            const { StudyQuestion } = require('../models');
            const doc = await StudyQuestion.create({
                category,
                question,
                options,
                correctAnswer,
                explanation: explanation || '',
            });
            res.status(201).json({ success: true, data: { question: doc } });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async deleteStudyQuestion(req, res) {
        try {
            const { StudyQuestion } = require('../models');
            await StudyQuestion.findByIdAndDelete(req.params.questionId);
            res.json({ success: true, message: 'Question deleted' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async createAdminEvent(req, res) {
        try {
            const { title, description, category, date, latitude, longitude, address, city, state, maxAttendees } = req.body;
            if (!title || !description || !category || !date || !latitude || !longitude || !address) {
                res.status(400).json({ success: false, message: 'title, description, category, date, latitude, longitude, and address are required' });
                return;
            }
            const event = await models_1.Event.create({
                title,
                description,
                category,
                date: new Date(date),
                location: {
                    type: 'Point',
                    coordinates: [Number(longitude), Number(latitude)],
                    address,
                    city: city || '',
                    state: state || '',
                },
                creator: req.user?.userId, // admin's user ID
                maxAttendees: maxAttendees ? Number(maxAttendees) : undefined,
                attendees: [],
                isActive: true,
                isCancelled: false,
                tags: [],
            });
            res.status(201).json({ success: true, data: { event } });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.default = new AdminController();
//# sourceMappingURL=admin.controller.js.map