import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Match, Message, Property, Game, GameSession, Notification, RoommateConnection, Transaction, StudySession, Event, Confession } from '../models';
import { AppConfig } from '../models/AppConfig';
import { AuditLog } from '../models/AuditLog';
import logger from '../utils/logger';
import { logAudit } from '../utils/audit';
import { log } from 'console';

// Extract admin info from JWT token (since auth middleware is commented out)
function getAdminInfoFromToken(req: Request | AuthRequest): { userId: string; email: string } {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      return { userId: decoded.userId || '', email: decoded.email || '' };
    }
  } catch {}
  return { userId: '', email: '' };
}

async function getAdminFromToken(req: Request | AuthRequest): Promise<{ id: string; name: string; email: string }> {
  const info = getAdminInfoFromToken(req);
  if (info.userId) {
    try {
      const admin = await User.findById(info.userId).select('firstName lastName email');
      if (admin) {
        return { id: info.userId, name: `${admin.firstName} ${admin.lastName}`, email: admin.email };
      }
    } catch {}
  }
  return { id: info.userId, name: info.email || 'Admin', email: info.email };
}

// Admin login (using User model with admin flag or create separate Admin model)
class AdminController {
  /**
   * Admin login
   */
  async login(req: Request, res: Response): Promise<void> {
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
      const admin = await User.findOne({ email }).select('+password');
      

      console.log("An admin det:", admin!.password!)
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
      const token = jwt.sign(
        { 
          userId: admin._id, 
          email: admin.email,
          isAdmin: true 
        },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      await logAudit({
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
    } catch (error: any) {
      logger.error('Admin login error:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Login failed' 
      });
    }
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const [
        totalUsers,
        activeUsers,
        totalMatches,
        totalMessages,
        totalProperties,
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isActive: true }),
        Match.countDocuments({ status: 'active' }),
        Message.countDocuments(),
        Property.countDocuments(),
      ]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { UserActivity } = await import('../models/UserActivity');
      const { GameSession } = await import('../models/Game');

      const todayStr = today.toISOString().slice(0, 10);
      const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);
      const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().slice(0, 10);
      const monthAgo = new Date(today); monthAgo.setDate(monthAgo.getDate() - 30);
      const monthAgoStr = monthAgo.toISOString().slice(0, 10);

      const [
        newUsersToday,
        matchesToday,
        dauToday,
        dauYesterday,
        wau,
        mau,
        avgSessionToday,
        totalGameSessions,
      ] = await Promise.all([
        User.countDocuments({ createdAt: { $gte: today } }),
        Match.countDocuments({ matchedAt: { $gte: today } }),
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
    } catch (error: any) {
      logger.error('Get dashboard stats error:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to fetch dashboard stats' 
      });
    }
  }

  /**
   * Get user growth data
   */
  async getUserGrowth(req: AuthRequest, res: Response): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const data = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const count = await User.countDocuments({
          createdAt: { $gte: date, $lt: nextDate }
        });
        
        data.push({
          date: date.toISOString().split('T')[0],
          users: count,
        });
      }

      res.json({ success: true, data });
    } catch (error: any) {
      logger.error('Get user growth error:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to fetch user growth' 
      });
    }
  }

  /**
   * Get all users with pagination and filters
   */
  async getUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20, search, status, city, state, occupation, gender, verified, subscription } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const query: any = {};

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
        if (status === 'active') query.isActive = true;
        if (status === 'inactive') query.isActive = false;
        if (status === 'verified') query.verified = true;
        if (status === 'unverified') query.verified = false;
        if (status === 'pending_verification') { query.verified = false; query['metadata.verificationRequested'] = true; }
        if (status === 'suspended') query.isActive = false;
      }

      if (city) query['location.city'] = { $regex: city, $options: 'i' };
      if (state) query['location.state'] = { $regex: state, $options: 'i' };
      if (occupation) query.occupation = { $regex: occupation, $options: 'i' };
      if (gender && gender !== 'all') query.gender = gender;
      if (verified === 'true') query.verified = true;
      if (verified === 'false') query.verified = false;
      if (subscription && subscription !== 'all') query['subscription.plan'] = subscription;

      const [users, total] = await Promise.all([
        User.find(query)
          .select('-password -refreshToken')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        User.countDocuments(query),
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
    } catch (error: any) {
      logger.error('Get users error:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to fetch users' 
      });
    }
  }

  /**
   * Get single user details
   */
  async getUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      
      const user = await User.findById(userId).select('-password -refreshToken');
      
      if (!user) {
        res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
        return;
      }

      res.json({ success: true, data: { user } });
    } catch (error: any) {
      logger.error('Get user error:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to fetch user' 
      });
    }
  }

  /**
   * Verify user
   */
  async verifyUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const targetUser = await User.findById(userId).select('firstName lastName email profilePhoto');

      await User.findByIdAndUpdate(userId, { verified: true });

      logger.info(`User ${userId} verified by admin`);

      await logAudit({
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
    } catch (error: any) {
      logger.error('Verify user error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to verify user'
      });
    }
  }

  /**
   * Suspend user
   */
  async suspendUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { reason } = req.body;
      const targetUser = await User.findById(userId).select('firstName lastName email profilePhoto');

      await User.findByIdAndUpdate(userId, {
        isActive: false,
      });

      logger.info(`User ${userId} suspended. Reason: ${reason}`);

      await logAudit({
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
    } catch (error: any) {
      logger.error('Suspend user error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to suspend user'
      });
    }
  }

  /**
   * Unsuspend user
   */
  async unsuspendUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const targetUser = await User.findById(userId).select('firstName lastName email');

      await User.findByIdAndUpdate(userId, {
        isActive: true,
      });

      logger.info(`User ${userId} unsuspended`);

      await logAudit({
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
    } catch (error: any) {
      logger.error('Unsuspend user error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to unsuspend user'
      });
    }
  }

  /**
   * Delete user
   */
  async deleteUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      // Fetch user details BEFORE deleting so we have their info for the audit log
      const targetUser = await User.findById(userId).select('firstName lastName email phoneNumber profilePhoto location occupation');

      await User.findByIdAndDelete(userId);

      logger.info(`User ${userId} deleted`);

      await logAudit({
        actor: await getAdminFromToken(req),
        actorType: 'admin', action: 'delete_user', category: 'user_management',
        target: { type: 'user', id: userId, name: targetUser ? `${targetUser.firstName} ${targetUser.lastName}` : userId },
        details: `Deleted user ${targetUser ? `${targetUser.firstName} ${targetUser.lastName} (${targetUser.email})` : userId}`, req,
        metadata: { deletedUser: targetUser ? { firstName: targetUser.firstName, lastName: targetUser.lastName, email: targetUser.email, phoneNumber: (targetUser as any).phoneNumber, occupation: (targetUser as any).occupation, location: (targetUser as any).location } : null }
      });

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error: any) {
      logger.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete user'
      });
    }
  }

  /**
   * Get all matches
   */
  async getMatches(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const [matches, total] = await Promise.all([
        Match.find()
          .populate('user1', 'firstName lastName email profilePhoto')
          .populate('user2', 'firstName lastName email profilePhoto')
          .sort({ matchedAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        Match.countDocuments(),
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
    } catch (error: any) {
      logger.error('Get matches error:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to fetch matches' 
      });
    }
  }

  /**
   * Get match details
   */
  async getMatch(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { matchId } = req.params;
      
      const match = await Match.findById(matchId)
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
    } catch (error: any) {
      logger.error('Get match error:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to fetch match' 
      });
    }
  }

  /**
   * Delete match
   */
  async deleteMatch(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { matchId } = req.params;
      // Fetch match with user details before deleting
      const match = await Match.findById(matchId).populate('user1', 'firstName lastName email').populate('user2', 'firstName lastName email');

      await Match.findByIdAndDelete(matchId);

      const u1 = match?.user1 as any;
      const u2 = match?.user2 as any;
      const matchDesc = u1 && u2 ? `${u1.firstName} ${u1.lastName} & ${u2.firstName} ${u2.lastName}` : matchId;

      logger.info(`Match ${matchId} deleted`);

      await logAudit({
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
    } catch (error: any) {
      logger.error('Delete match error:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to delete match' 
      });
    }
  }

  /**
   * Get all properties
   */
  async getProperties(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const query: any = {};
      if (status && status !== 'all') {
        query.status = status;
      }

      const [properties, total] = await Promise.all([
        Property.find(query)
          .populate('landlord', 'firstName lastName email profilePhoto')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        Property.countDocuments(query),
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
    } catch (error: any) {
      logger.error('Get properties error:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to fetch properties' 
      });
    }
  }

  /**
   * Get property details
   */
  async getProperty(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { propertyId } = req.params;
      
      const property = await Property.findById(propertyId)
        .populate('landlord', 'firstName lastName email profilePhoto phoneNumber');
      
      if (!property) {
        res.status(404).json({ 
          success: false, 
          message: 'Property not found' 
        });
        return;
      }

      res.json({ success: true, data: { property } });
    } catch (error: any) {
      logger.error('Get property error:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to fetch property' 
      });
    }
  }

  /**
   * Update property
   */
  async updateProperty(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { propertyId } = req.params;
      
      const property = await Property.findByIdAndUpdate(
        propertyId,
        { $set: req.body },
        { new: true, runValidators: true }
      );
      
      if (!property) {
        res.status(404).json({ 
          success: false, 
          message: 'Property not found' 
        });
        return;
      }

      logger.info(`Property ${propertyId} updated`);

      await logAudit({
        actor: await getAdminFromToken(req),
        actorType: 'admin', action: 'update_property', category: 'property_management',
        target: { type: 'property', id: propertyId, name: (property as any).title || propertyId },
        details: `Updated property "${(property as any).title || propertyId}"`, req,
        metadata: { property: { title: (property as any).title, type: (property as any).type, status: (property as any).status, updatedFields: Object.keys(req.body) } }
      });

      res.json({
        success: true,
        message: 'Property updated successfully',
        data: { property }
      });
    } catch (error: any) {
      logger.error('Update property error:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to update property' 
      });
    }
  }

  /**
   * Delete property
   */
  async deleteProperty(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { propertyId } = req.params;
      
      // Fetch property details before deleting
      const property = await Property.findById(propertyId).populate('landlord', 'firstName lastName email');
      await Property.findByIdAndDelete(propertyId);

      const landlord = (property as any)?.landlord;
      logger.info(`Property ${propertyId} deleted`);

      await logAudit({
        actor: await getAdminFromToken(req),
        actorType: 'admin', action: 'delete_property', category: 'property_management',
        target: { type: 'property', id: propertyId, name: (property as any)?.title || propertyId },
        details: `Deleted property "${(property as any)?.title || propertyId}" owned by ${landlord ? `${landlord.firstName} ${landlord.lastName} (${landlord.email})` : 'unknown'}`, req,
        metadata: { deletedProperty: property ? { title: (property as any).title, type: (property as any).type, landlord: landlord ? { firstName: landlord.firstName, lastName: landlord.lastName, email: landlord.email } : null } : null }
      });

      res.json({
        success: true,
        message: 'Property deleted successfully'
      });
    } catch (error: any) {
      logger.error('Delete property error:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to delete property' 
      });
    }
  }

  /**
   * Approve property
   */
  async approveProperty(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { propertyId } = req.params;
      
      const property = await Property.findByIdAndUpdate(
        propertyId,
        { status: 'available' },
        { new: true }
      );
      
      if (!property) {
        res.status(404).json({ 
          success: false, 
          message: 'Property not found' 
        });
        return;
      }

      logger.info(`Property ${propertyId} approved`);

      await logAudit({
        actor: await getAdminFromToken(req),
        actorType: 'admin', action: 'approve_property', category: 'property_management',
        target: { type: 'property', id: propertyId, name: (property as any).title || propertyId },
        details: `Approved property "${(property as any).title || propertyId}"`, req,
        metadata: { property: { title: (property as any).title, type: (property as any).type } }
      });

      res.json({
        success: true,
        message: 'Property approved successfully',
        data: { property }
      });
    } catch (error: any) {
      logger.error('Approve property error:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to approve property' 
      });
    }
  }

  /**
   * Reject property
   */
  async rejectProperty(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { propertyId } = req.params;
      const { reason } = req.body;
      
      const property = await Property.findByIdAndUpdate(
        propertyId,
        { status: 'inactive' },
        { new: true }
      );
      
      if (!property) {
        res.status(404).json({ 
          success: false, 
          message: 'Property not found' 
        });
        return;
      }

      logger.info(`Property ${propertyId} rejected. Reason: ${reason}`);

      await logAudit({
        actor: await getAdminFromToken(req),
        actorType: 'admin', action: 'reject_property', category: 'property_management',
        target: { type: 'property', id: propertyId, name: (property as any).title || propertyId },
        details: `Rejected property "${(property as any).title || propertyId}". Reason: ${reason}`, req,
        metadata: { reason, property: { title: (property as any).title, type: (property as any).type } }
      });

      res.json({
        success: true,
        message: 'Property rejected successfully',
        data: { property }
      });
    } catch (error: any) {
      logger.error('Reject property error:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to reject property' 
      });
    }
  }

  // ============ REPORTS ============

  async getReports(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const query: any = { type: { $in: ['system', 'reminder'] } };
      if (status === 'read') query.read = true;
      if (status === 'unread') query.read = false;

      const [reports, total] = await Promise.all([
        Notification.find(query)
          .populate('user', 'firstName lastName email profilePhoto')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        Notification.countDocuments(query),
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
    } catch (error: any) {
      logger.error('Get reports error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch reports' });
    }
  }

  async getReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { reportId } = req.params;
      const report = await Notification.findById(reportId)
        .populate('user', 'firstName lastName email profilePhoto');

      if (!report) {
        res.status(404).json({ success: false, message: 'Report not found' });
        return;
      }

      res.json({ success: true, data: { report } });
    } catch (error: any) {
      logger.error('Get report error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch report' });
    }
  }

  async updateReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { reportId } = req.params;
      const { status } = req.body;

      const report = await Notification.findByIdAndUpdate(
        reportId,
        { read: status === 'resolved' || status === 'reviewed' },
        { new: true }
      );

      if (!report) {
        res.status(404).json({ success: false, message: 'Report not found' });
        return;
      }

      logger.info(`Report ${reportId} updated to ${status}`);

      await logAudit({
        actor: await getAdminFromToken(req),
        actorType: 'admin', action: 'update_report', category: 'report_management',
        target: { type: 'report', id: reportId, name: (report as any).title || `Report #${reportId.slice(-6)}` },
        details: `Updated report #${reportId.slice(-6)} status to "${status}"`, req,
        metadata: { newStatus: status, reportType: (report as any).type }
      });

      res.json({ success: true, message: 'Report updated successfully', data: { report } });
    } catch (error: any) {
      logger.error('Update report error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to update report' });
    }
  }

  // ============ GAMES ============

  async getGames(req: AuthRequest, res: Response): Promise<void> {
    try {
      const games = await Game.find().sort({ createdAt: -1 });
      res.json({ success: true, data: { games } });
    } catch (error: any) {
      logger.error('Get games error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch games' });
    }
  }

  async getGameSessions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const [sessions, total] = await Promise.all([
        GameSession.find()
          .populate('players.user', 'firstName lastName email profilePhoto')
          .populate('game', 'name category')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        GameSession.countDocuments(),
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
    } catch (error: any) {
      logger.error('Get game sessions error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch game sessions' });
    }
  }

  async getGameStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const [totalGames, totalSessions, activeSessions] = await Promise.all([
        Game.countDocuments(),
        GameSession.countDocuments(),
        GameSession.countDocuments({ status: 'in_progress' }),
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
    } catch (error: any) {
      logger.error('Get game stats error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch game stats' });
    }
  }

  // ============ GROUPS ============

  async getGroups(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const [groups, total] = await Promise.all([
        RoommateConnection.find({ status: 'accepted' })
          .populate('requester', 'firstName lastName email profilePhoto')
          .populate('recipient', 'firstName lastName email profilePhoto')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        RoommateConnection.countDocuments({ status: 'accepted' }),
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
    } catch (error: any) {
      logger.error('Get groups error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch groups' });
    }
  }

  async getGroup(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { groupId } = req.params;
      const group = await RoommateConnection.findById(groupId)
        .populate('requester', 'firstName lastName email profilePhoto')
        .populate('recipient', 'firstName lastName email profilePhoto');

      if (!group) {
        res.status(404).json({ success: false, message: 'Group not found' });
        return;
      }

      res.json({ success: true, data: { group } });
    } catch (error: any) {
      logger.error('Get group error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch group' });
    }
  }

  async deleteGroup(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { groupId } = req.params;
      // Fetch connection details before deleting
      const connection = await RoommateConnection.findById(groupId).populate('requester', 'firstName lastName email').populate('recipient', 'firstName lastName email');
      await RoommateConnection.findByIdAndDelete(groupId);

      const requester = (connection as any)?.requester;
      const recipient = (connection as any)?.recipient;
      const connDesc = requester && recipient ? `${requester.firstName} ${requester.lastName} & ${recipient.firstName} ${recipient.lastName}` : groupId;

      logger.info(`Group ${groupId} deleted`);

      await logAudit({
        actor: await getAdminFromToken(req),
        actorType: 'admin', action: 'delete_group', category: 'group_management',
        target: { type: 'group', id: groupId, name: connDesc },
        details: `Deleted connection between ${connDesc}`, req,
        metadata: { requester: requester ? { firstName: requester.firstName, lastName: requester.lastName, email: requester.email } : null, recipient: recipient ? { firstName: recipient.firstName, lastName: recipient.lastName, email: recipient.email } : null }
      });

      res.json({ success: true, message: 'Group deleted successfully' });
    } catch (error: any) {
      logger.error('Delete group error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to delete group' });
    }
  }

  // ============ ANALYTICS ============

  async getAnalytics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const period = (req.query.period as string) || '30d';
      const days = parseInt(period) || 30;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [
        totalUsers,
        newUsers,
        totalMatches,
        newMatches,
        totalMessages,
        totalProperties,
        activeProperties,
        totalConnections,
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ createdAt: { $gte: startDate } }),
        Match.countDocuments(),
        Match.countDocuments({ matchedAt: { $gte: startDate } }),
        Message.countDocuments(),
        Property.countDocuments(),
        Property.countDocuments({ status: 'available' }),
        RoommateConnection.countDocuments({ status: 'accepted' }),
      ]);

      // User growth over period
      const userGrowth = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const count = await User.countDocuments({
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

        const count = await Match.countDocuments({
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
    } catch (error: any) {
      logger.error('Get analytics error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch analytics' });
    }
  }

  async getRecentActivity(req: AuthRequest, res: Response): Promise<void> {
    try {
      const [recentUsers, recentMatches, recentProperties] = await Promise.all([
        User.find().select('firstName lastName email createdAt').sort({ createdAt: -1 }).limit(5),
        Match.find().populate('user1', 'firstName lastName').populate('user2', 'firstName lastName').sort({ matchedAt: -1 }).limit(5),
        Property.find().populate('landlord', 'firstName lastName').select('title status createdAt').sort({ createdAt: -1 }).limit(5),
      ]);

      const activities = [
        ...recentUsers.map(u => ({
          type: 'user_joined',
          message: `${u.firstName} ${u.lastName} joined`,
          timestamp: (u as any).createdAt,
        })),
        ...recentMatches.map(m => ({
          type: 'new_match',
          message: `${(m.user1 as any)?.firstName || 'User'} matched with ${(m.user2 as any)?.firstName || 'User'}`,
          timestamp: (m as any).matchedAt,
        })),
        ...recentProperties.map(p => ({
          type: 'new_property',
          message: `Property "${p.title}" listed`,
          timestamp: (p as any).createdAt,
        })),
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

      res.json({ success: true, data: { activities } });
    } catch (error: any) {
      logger.error('Get recent activity error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch activity' });
    }
  }

  async exportData(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { type } = req.params;

      let data: any[];
      let filename: string;

      switch (type) {
        case 'users':
          data = await User.find().select('-password -refreshToken').lean();
          filename = 'users-export.json';
          break;
        case 'matches':
          data = await Match.find().populate('user1', 'firstName lastName email').populate('user2', 'firstName lastName email').lean();
          filename = 'matches-export.json';
          break;
        case 'properties':
          data = await Property.find().populate('landlord', 'firstName lastName email').lean();
          filename = 'properties-export.json';
          break;
        default:
          res.status(400).json({ success: false, message: 'Invalid export type' });
          return;
      }

      await logAudit({
        actor: await getAdminFromToken(req),
        actorType: 'admin', action: 'export_data', category: 'data_management',
        target: { type: 'export', id: type, name: `${type} export` },
        details: `Exported ${type} data (${data.length} records)`, req,
        metadata: { exportType: type, recordCount: data.length }
      });

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.json(data);
    } catch (error: any) {
      logger.error('Export data error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to export data' });
    }
  }
  // ============ POINTS / PURCHASES ============

  async getPurchases(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const query: any = { type: 'coins' };
      if (status && status !== 'all') {
        query.status = status;
      }

      const [purchases, total] = await Promise.all([
        Transaction.find(query)
          .populate('user', 'firstName lastName email profilePhoto gamification')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        Transaction.countDocuments(query),
      ]);

      // Also get summary counts
      const [pendingCount, completedCount, failedCount] = await Promise.all([
        Transaction.countDocuments({ type: 'coins', status: 'pending' }),
        Transaction.countDocuments({ type: 'coins', status: 'completed' }),
        Transaction.countDocuments({ type: 'coins', status: 'failed' }),
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
    } catch (error: any) {
      logger.error('Get purchases error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch purchases' });
    }
  }

  async approvePurchase(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { transactionId } = req.params;

      const transaction = await Transaction.findById(transactionId);
      if (!transaction) {
        res.status(404).json({ success: false, message: 'Transaction not found' });
        return;
      }

      if (transaction.status !== 'pending') {
        res.status(400).json({ success: false, message: `Transaction is already ${transaction.status}` });
        return;
      }

      // Get the points amount from metadata
      const pointsAmount = (transaction as any).metadata?.pointsAmount || transaction.amount;

      // Update transaction status
      transaction.status = 'completed';
      await transaction.save();

      // Get user details for audit
      const purchaseUser = await User.findById(transaction.user).select('firstName lastName email');

      // Add points to the user
      await User.findByIdAndUpdate(transaction.user, {
        $inc: { 'gamification.points': pointsAmount }
      });

      const userName = purchaseUser ? `${purchaseUser.firstName} ${purchaseUser.lastName}` : transaction.user.toString();
      logger.info(`Purchase ${transactionId} approved. ${pointsAmount} points added to ${userName}`);

      await logAudit({
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
    } catch (error: any) {
      logger.error('Approve purchase error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to approve purchase' });
    }
  }

  async rejectPurchase(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { transactionId } = req.params;
      const { reason } = req.body;

      const transaction = await Transaction.findById(transactionId);
      if (!transaction) {
        res.status(404).json({ success: false, message: 'Transaction not found' });
        return;
      }

      if (transaction.status !== 'pending') {
        res.status(400).json({ success: false, message: `Transaction is already ${transaction.status}` });
        return;
      }

      // Get user details for audit
      const purchaseUser = await User.findById(transaction.user).select('firstName lastName email');
      const pointsAmount = (transaction as any).metadata?.pointsAmount || transaction.amount;

      transaction.status = 'failed';
      if (reason) {
        (transaction as any).metadata = { ...(transaction as any).metadata, rejectionReason: reason };
      }
      await transaction.save();

      const userName = purchaseUser ? `${purchaseUser.firstName} ${purchaseUser.lastName}` : transaction.user.toString();
      logger.info(`Purchase ${transactionId} rejected. Reason: ${reason || 'No reason given'}`);

      await logAudit({
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
    } catch (error: any) {
      logger.error('Reject purchase error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to reject purchase' });
    }
  }

  async getPointsOverview(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Get total points in the system
      const usersWithPoints = await User.aggregate([
        { $group: {
          _id: null,
          totalPointsInSystem: { $sum: '$gamification.points' },
          avgPoints: { $avg: '$gamification.points' },
          maxPoints: { $max: '$gamification.points' },
        }}
      ]);

      const [totalTransactions, pendingPurchases, totalRevenue] = await Promise.all([
        Transaction.countDocuments({ type: 'coins' }),
        Transaction.countDocuments({ type: 'coins', status: 'pending' }),
        Transaction.aggregate([
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
    } catch (error: any) {
      logger.error('Get points overview error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch points overview' });
    }
  }
  // ============ AUDIT LOGS ============

  async getAuditLogs(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        page = 1, limit = 30, actorType, category, action,
        search, targetType, targetId, status, startDate, endDate
      } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const query: any = {};
      if (actorType && actorType !== 'all') query.actorType = actorType;
      if (category && category !== 'all') query.category = category;
      if (action && action !== 'all') query.action = action;
      if (status && status !== 'all') query.status = status;
      if (targetType) query['target.type'] = targetType;
      if (targetId) query['target.id'] = targetId;

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
        if (startDate) query.createdAt.$gte = new Date(startDate as string);
        if (endDate) query.createdAt.$lte = new Date(endDate as string);
      }

      const [logs, total] = await Promise.all([
        AuditLog.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        AuditLog.countDocuments(query),
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
    } catch (error: any) {
      logger.error('Get audit logs error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch audit logs' });
    }
  }

  async getAuditLog(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { logId } = req.params;
      const log = await AuditLog.findById(logId);

      if (!log) {
        res.status(404).json({ success: false, message: 'Audit log not found' });
        return;
      }

      res.json({ success: true, data: { log } });
    } catch (error: any) {
      logger.error('Get audit log error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch audit log' });
    }
  }

  async getAuditStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [totalLogs, todayLogs, categoryBreakdown, actorTypeBreakdown] = await Promise.all([
        AuditLog.countDocuments(),
        AuditLog.countDocuments({ createdAt: { $gte: today } }),
        AuditLog.aggregate([
          { $group: { _id: '$category', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),
        AuditLog.aggregate([
          { $group: { _id: '$actorType', count: { $sum: 1 } } },
        ]),
      ]);

      res.json({
        success: true,
        data: {
          totalLogs,
          todayLogs,
          categoryBreakdown: categoryBreakdown.map((c: any) => ({ category: c._id, count: c.count })),
          actorTypeBreakdown: actorTypeBreakdown.map((a: any) => ({ type: a._id, count: a.count })),
        }
      });
    } catch (error: any) {
      logger.error('Get audit stats error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch audit stats' });
    }
  }

  async getUserAuditTrail(req: AuthRequest, res: Response): Promise<void> {
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
        AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
        AuditLog.countDocuments(query),
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
    } catch (error: any) {
      logger.error('Get user audit trail error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch user audit trail' });
    }
  }

  async getAppVersion(req: any, res: Response): Promise<void> {
    try {
      const config = await AppConfig.findOne({ key: 'app_version' });
      res.json({
        success: true,
        data: config?.value || { currentVersion: '1.0.0', minVersion: '1.0.0', updateUrl: '', forceUpdate: false, updateMessage: '' },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateAppVersion(req: any, res: Response): Promise<void> {
    try {
      const config = await AppConfig.findOneAndUpdate(
        { key: 'app_version' },
        { value: req.body, updatedAt: new Date() },
        { upsert: true, new: true }
      );
      res.json({ success: true, data: config.value });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ==========================================
  // STUDY BUDDY ADMIN
  // ==========================================

  async getStudySessions(req: AuthRequest, res: Response) {
    try {
      const { page = 1, limit = 20, category, status } = req.query;
      const query: any = {};
      if (category) query.category = category;
      if (status) query.status = status;

      const skip = (Number(page) - 1) * Number(limit);
      const [sessions, total] = await Promise.all([
        StudySession.find(query)
          .populate('creator', 'firstName lastName email profilePhoto')
          .populate('opponent', 'firstName lastName email profilePhoto')
          .populate('winner', 'firstName lastName')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        StudySession.countDocuments(query),
      ]);

      res.json({ success: true, data: { sessions, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getStudyStats(req: AuthRequest, res: Response) {
    try {
      const [total, active, completed, categories] = await Promise.all([
        StudySession.countDocuments(),
        StudySession.countDocuments({ status: 'active' }),
        StudySession.countDocuments({ status: 'completed' }),
        StudySession.distinct('category'),
      ]);
      res.json({ success: true, data: { total, active, completed, totalCategories: categories.length } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async deleteStudySession(req: AuthRequest, res: Response) {
    try {
      await StudySession.findByIdAndDelete(req.params.sessionId);
      res.json({ success: true, message: 'Session deleted' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ==========================================
  // EVENTS ADMIN
  // ==========================================

  async getAdminEvents(req: AuthRequest, res: Response) {
    try {
      const { page = 1, limit = 20, status, category } = req.query;
      const query: any = {};
      if (status === 'active') { query.isActive = true; query.isCancelled = false; }
      else if (status === 'cancelled') { query.isCancelled = true; }
      if (category) query.category = category;

      const skip = (Number(page) - 1) * Number(limit);
      const [events, total] = await Promise.all([
        Event.find(query)
          .populate('creator', 'firstName lastName email profilePhoto')
          .sort({ date: -1 })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        Event.countDocuments(query),
      ]);

      const enriched = events.map((e: any) => ({
        ...e,
        goingCount: e.attendees?.filter((a: any) => a.status === 'going').length || 0,
        interestedCount: e.attendees?.filter((a: any) => a.status === 'interested').length || 0,
      }));

      res.json({ success: true, data: { events: enriched, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getEventStats(req: AuthRequest, res: Response) {
    try {
      const [total, active, cancelled] = await Promise.all([
        Event.countDocuments(),
        Event.countDocuments({ isActive: true, isCancelled: false }),
        Event.countDocuments({ isCancelled: true }),
      ]);
      const attendeesAgg = await Event.aggregate([
        { $project: { goingCount: { $size: { $filter: { input: '$attendees', cond: { $eq: ['$$this.status', 'going'] } } } } } },
        { $group: { _id: null, total: { $sum: '$goingCount' } } },
      ]);
      const totalAttendees = attendeesAgg[0]?.total || 0;
      res.json({ success: true, data: { total, active, cancelled, totalAttendees } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async adminCancelEvent(req: AuthRequest, res: Response) {
    try {
      await Event.findByIdAndUpdate(req.params.eventId, { isCancelled: true });
      res.json({ success: true, message: 'Event cancelled' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async adminDeleteEvent(req: AuthRequest, res: Response) {
    try {
      await Event.findByIdAndDelete(req.params.eventId);
      res.json({ success: true, message: 'Event deleted' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ==========================================
  // CONFESSIONS ADMIN
  // ==========================================

  async getAdminConfessions(req: AuthRequest, res: Response) {
    try {
      const { page = 1, limit = 20, groupId } = req.query;
      const query: any = { isActive: true };
      if (groupId) query.group = groupId;

      const skip = (Number(page) - 1) * Number(limit);
      const [confessions, total] = await Promise.all([
        Confession.find(query)
          .populate('group', 'name')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        Confession.countDocuments(query),
      ]);

      res.json({ success: true, data: { confessions, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getConfessionStats(req: AuthRequest, res: Response) {
    try {
      const [total, reported, hidden, repliesAgg] = await Promise.all([
        Confession.countDocuments({ isActive: true }),
        Confession.countDocuments({ isActive: true, reportCount: { $gt: 0 } }),
        Confession.countDocuments({ isHidden: true }),
        Confession.aggregate([
          { $project: { replyCount: { $size: '$replies' } } },
          { $group: { _id: null, total: { $sum: '$replyCount' } } },
        ]),
      ]);
      res.json({ success: true, data: { total, reported, hidden, totalReplies: repliesAgg[0]?.total || 0 } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async hideConfession(req: AuthRequest, res: Response) {
    try {
      await Confession.findByIdAndUpdate(req.params.confessionId, { isHidden: true });
      res.json({ success: true, message: 'Confession hidden' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async adminDeleteConfession(req: AuthRequest, res: Response) {
    try {
      await Confession.findByIdAndUpdate(req.params.confessionId, { isActive: false });
      res.json({ success: true, message: 'Confession deleted' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Study Buddy - Category & Question Management
  async getStudyCategories(req: AuthRequest, res: Response) {
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
      const dbCountMap: Record<string, number> = {};
      dbCounts.forEach((c: any) => { dbCountMap[c._id] = c.count; });

      // Get DB questions grouped by category
      const dbQuestions = await StudyQuestion.find({ isActive: true }).sort({ createdAt: -1 }).lean();

      const categories = hardcodedCategories.map((cat: any) => ({
        ...cat,
        questionCount: (dbCountMap[cat.key] || 0),
        questions: dbQuestions.filter((q: any) => q.category === cat.key),
      }));

      // Also include any DB-only categories not in hardcoded list
      const hardcodedKeys = new Set(hardcodedCategories.map((c: any) => c.key));
      const extraCategories = Object.keys(dbCountMap)
        .filter(k => !hardcodedKeys.has(k))
        .map(key => ({
          key,
          label: key.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
          icon: 'book',
          questionCount: dbCountMap[key],
          questions: dbQuestions.filter((q: any) => q.category === key),
        }));

      res.json({ success: true, data: { categories: [...categories, ...extraCategories] } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async createStudyCategory(req: AuthRequest, res: Response) {
    try {
      const { key, label } = req.body;
      if (!key || !label) {
        res.status(400).json({ success: false, message: 'key and label are required' });
        return;
      }
      // Categories are dynamic — just return success. Questions define the category.
      res.json({ success: true, message: 'Category created. Add questions to populate it.', data: { key, label } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async addStudyQuestion(req: AuthRequest, res: Response) {
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
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async deleteStudyQuestion(req: AuthRequest, res: Response) {
    try {
      const { StudyQuestion } = require('../models');
      await StudyQuestion.findByIdAndDelete(req.params.questionId);
      res.json({ success: true, message: 'Question deleted' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async createAdminEvent(req: AuthRequest, res: Response) {
    try {
      const { title, description, category, date, latitude, longitude, address, city, state, maxAttendees } = req.body;

      if (!title || !description || !category || !date || !latitude || !longitude || !address) {
        res.status(400).json({ success: false, message: 'title, description, category, date, latitude, longitude, and address are required' });
        return;
      }

      const event = await Event.create({
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
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new AdminController();