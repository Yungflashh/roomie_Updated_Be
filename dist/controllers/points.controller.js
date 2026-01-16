"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const points_service_1 = __importDefault(require("../services/points.service"));
const User_1 = require("../models/User");
const logger_1 = __importDefault(require("../utils/logger"));
class PointsController {
    /**
     * Get user points statistics
     * GET /api/v1/points/stats
     */
    async getPointsStats(req, res) {
        try {
            const userId = req.user?.userId;
            const stats = await points_service_1.default.getUserPointStats(userId);
            res.status(200).json({
                success: true,
                data: stats,
            });
        }
        catch (error) {
            logger_1.default.error('Get points stats error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch points statistics',
            });
        }
    }
    /**
     * Get transaction history
     * GET /api/v1/points/transactions
     */
    async getTransactionHistory(req, res) {
        try {
            const userId = req.user?.userId;
            const { page = 1, limit = 20, type } = req.query;
            const result = await points_service_1.default.getTransactionHistory(userId, parseInt(page), parseInt(limit), type);
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            logger_1.default.error('Get transaction history error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch transaction history',
            });
        }
    }
    /**
     * Claim daily login bonus
     * POST /api/v1/points/daily-bonus
     */
    async claimDailyBonus(req, res) {
        try {
            const userId = req.user?.userId;
            const result = await points_service_1.default.awardDailyLoginBonus(userId);
            if (result.awarded) {
                res.status(200).json({
                    success: true,
                    message: 'Daily bonus claimed!',
                    data: result,
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    message: 'Daily bonus already claimed today',
                });
            }
        }
        catch (error) {
            logger_1.default.error('Claim daily bonus error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to claim daily bonus',
            });
        }
    }
    /**
     * Get points configuration
     * GET /api/v1/points/config
     */
    async getPointsConfig(req, res) {
        try {
            const config = await points_service_1.default.getConfig();
            res.status(200).json({
                success: true,
                data: { config },
            });
        }
        catch (error) {
            logger_1.default.error('Get points config error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch points configuration',
            });
        }
    }
    /**
     * Check if user can afford action
     * GET /api/v1/points/check-affordability
     */
    async checkAffordability(req, res) {
        try {
            const userId = req.user?.userId;
            const { action, targetId } = req.query;
            let cost = 0;
            let canAfford = false;
            let message = '';
            switch (action) {
                case 'match':
                    cost = await points_service_1.default.calculateMatchCost(userId);
                    canAfford = await points_service_1.default.hasEnoughPoints(userId, cost);
                    message = canAfford ? 'Can send match request' : 'Insufficient points for match request';
                    break;
                case 'game':
                    if (!targetId) {
                        res.status(400).json({
                            success: false,
                            message: 'Game ID required for game affordability check',
                        });
                        return;
                    }
                    cost = await points_service_1.default.calculateGameCost(userId, targetId);
                    canAfford = await points_service_1.default.hasEnoughPoints(userId, cost);
                    message = canAfford ? 'Can play game' : 'Insufficient points for game';
                    break;
                default:
                    res.status(400).json({
                        success: false,
                        message: 'Invalid action type',
                    });
                    return;
            }
            res.status(200).json({
                success: true,
                data: {
                    action,
                    cost,
                    canAfford,
                    message,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Check affordability error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to check affordability',
            });
        }
    }
    /**
     * Set or update points username
     * PUT /api/v1/points/username
     * Body: { username: string }
     */
    async setPointsUsername(req, res) {
        try {
            const userId = req.user?.userId;
            const { username } = req.body;
            if (!username) {
                res.status(400).json({
                    success: false,
                    message: 'Username is required',
                });
                return;
            }
            const cleanUsername = username.toLowerCase().trim();
            // Validation
            if (cleanUsername.length < 3 || cleanUsername.length > 20) {
                res.status(400).json({
                    success: false,
                    message: 'Username must be between 3 and 20 characters',
                });
                return;
            }
            if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
                res.status(400).json({
                    success: false,
                    message: 'Username can only contain lowercase letters, numbers, and underscores',
                });
                return;
            }
            // Reserved usernames
            const reservedUsernames = [
                'admin', 'support', 'help', 'roomie', 'official', 'team',
                'moderator', 'mod', 'system', 'bot', 'service', 'staff',
                'developer', 'dev', 'test', 'user', 'root'
            ];
            if (reservedUsernames.includes(cleanUsername)) {
                res.status(400).json({
                    success: false,
                    message: 'This username is reserved',
                });
                return;
            }
            // Check if username is already taken
            const isAvailable = await points_service_1.default.isUsernameAvailable(cleanUsername, userId);
            if (!isAvailable) {
                res.status(409).json({
                    success: false,
                    message: 'Username is already taken',
                });
                return;
            }
            // Update user
            const user = await User_1.User.findByIdAndUpdate(userId, { pointsUsername: cleanUsername }, { new: true }).select('pointsUsername firstName lastName profilePhoto');
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
                return;
            }
            logger_1.default.info(`User ${userId} set points username to: ${cleanUsername}`);
            res.status(200).json({
                success: true,
                message: 'Username set successfully',
                data: {
                    pointsUsername: user.pointsUsername,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Set points username error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to set username',
            });
        }
    }
    /**
     * Check if points username is available
     * GET /api/v1/points/username/check?username=value
     */
    async checkUsernameAvailability(req, res) {
        try {
            const { username } = req.query;
            const userId = req.user?.userId;
            if (!username || typeof username !== 'string') {
                res.status(400).json({
                    success: false,
                    message: 'Username is required',
                });
                return;
            }
            const cleanUsername = username.toLowerCase().trim();
            // Basic validation
            if (cleanUsername.length < 3 || cleanUsername.length > 20) {
                res.status(200).json({
                    success: true,
                    data: {
                        available: false,
                        reason: 'Username must be between 3 and 20 characters',
                    },
                });
                return;
            }
            if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
                res.status(200).json({
                    success: true,
                    data: {
                        available: false,
                        reason: 'Username can only contain lowercase letters, numbers, and underscores',
                    },
                });
                return;
            }
            // Reserved usernames
            const reservedUsernames = [
                'admin', 'support', 'help', 'roomie', 'official', 'team',
                'moderator', 'mod', 'system', 'bot', 'service', 'staff',
                'developer', 'dev', 'test', 'user', 'root'
            ];
            if (reservedUsernames.includes(cleanUsername)) {
                res.status(200).json({
                    success: true,
                    data: {
                        available: false,
                        reason: 'This username is reserved',
                    },
                });
                return;
            }
            // Check if taken
            const existingUser = await User_1.User.findOne({ pointsUsername: cleanUsername });
            // If it's the current user's username, it's available
            if (existingUser && existingUser._id.toString() === userId) {
                res.status(200).json({
                    success: true,
                    data: {
                        available: true,
                        reason: 'This is your current username',
                    },
                });
                return;
            }
            // Check if taken by someone else
            if (existingUser) {
                res.status(200).json({
                    success: true,
                    data: {
                        available: false,
                        reason: 'Username is already taken',
                    },
                });
                return;
            }
            // Available!
            res.status(200).json({
                success: true,
                data: {
                    available: true,
                    reason: 'Username is available',
                },
            });
        }
        catch (error) {
            logger_1.default.error('Check username availability error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to check username availability',
            });
        }
    }
    /**
     * Search user by points username
     * GET /api/v1/points/username/search?username=value
     */
    async searchByUsername(req, res) {
        try {
            const { username } = req.query;
            if (!username || typeof username !== 'string') {
                res.status(400).json({
                    success: false,
                    message: 'Username is required',
                });
                return;
            }
            const user = await points_service_1.default.findUserByUsername(username);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: {
                    user: {
                        _id: user._id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        profilePhoto: user.profilePhoto,
                        verified: user.verified,
                        pointsUsername: user.pointsUsername,
                        points: user.gamification.points,
                        level: user.gamification.level,
                    },
                },
            });
        }
        catch (error) {
            logger_1.default.error('Search by username error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to search user',
            });
        }
    }
    /**
     * Gift points to user by username
     * POST /api/v1/points/gift
     * Body: { username: string, amount: number, message: string }
     */
    async giftPoints(req, res) {
        try {
            const userId = req.user?.userId;
            const { username, amount, message } = req.body;
            // Validation
            if (!username || !amount || !message) {
                res.status(400).json({
                    success: false,
                    message: 'Username, amount, and message are required',
                });
                return;
            }
            if (amount < 1) {
                res.status(400).json({
                    success: false,
                    message: 'Amount must be at least 1 point',
                });
                return;
            }
            if (amount > 1000) {
                res.status(400).json({
                    success: false,
                    message: 'Cannot gift more than 1000 points at once',
                });
                return;
            }
            const cleanUsername = username.toLowerCase().trim();
            // Check if sender is verified
            const sender = await User_1.User.findById(userId);
            if (!sender) {
                res.status(404).json({
                    success: false,
                    message: 'Sender not found',
                });
                return;
            }
            if (!sender.verified) {
                res.status(403).json({
                    success: false,
                    message: 'Only verified users can gift points',
                });
                return;
            }
            // Find recipient by username
            const recipient = await points_service_1.default.findUserByUsername(cleanUsername);
            if (!recipient) {
                res.status(404).json({
                    success: false,
                    message: 'User not found with that username',
                });
                return;
            }
            // Can't gift to yourself
            if (recipient._id.toString() === userId) {
                res.status(400).json({
                    success: false,
                    message: 'Cannot gift points to yourself',
                });
                return;
            }
            // Check if sender has enough points
            if (sender.gamification.points < amount) {
                res.status(400).json({
                    success: false,
                    message: 'Insufficient points',
                });
                return;
            }
            // Deduct points from sender
            const deductResult = await points_service_1.default.deductPoints({
                userId,
                amount,
                type: 'spent',
                reason: `Gifted ${amount} points to @${recipient.pointsUsername}`,
                metadata: {
                    recipientId: recipient._id.toString(),
                    recipientUsername: recipient.pointsUsername,
                    recipientName: `${recipient.firstName} ${recipient.lastName}`,
                    giftMessage: message,
                },
            });
            // Add points to recipient
            const addResult = await points_service_1.default.addPoints({
                userId: recipient._id.toString(),
                amount,
                type: 'bonus',
                reason: `Received ${amount} points from @${sender.pointsUsername || sender.firstName}`,
                metadata: {
                    senderId: userId,
                    senderUsername: sender.pointsUsername,
                    senderName: `${sender.firstName} ${sender.lastName}`,
                    giftMessage: message,
                },
            });
            logger_1.default.info(`User ${userId} gifted ${amount} points to ${recipient._id} (@${cleanUsername})`);
            res.status(200).json({
                success: true,
                message: `Successfully gifted ${amount} points to @${cleanUsername}!`,
                data: {
                    sender: {
                        newBalance: deductResult.newBalance,
                        transaction: deductResult.transaction,
                    },
                    recipient: {
                        username: recipient.pointsUsername,
                        name: `${recipient.firstName} ${recipient.lastName}`,
                        newBalance: addResult.newBalance,
                    },
                },
            });
        }
        catch (error) {
            logger_1.default.error('Gift points error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to gift points',
            });
        }
    }
}
exports.default = new PointsController();
//# sourceMappingURL=points.controller.js.map