"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const points_service_1 = __importDefault(require("../services/points.service"));
const logger_1 = __importDefault(require("../utils/logger"));
class PointsController {
    /**
     * Get user points statistics
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
}
exports.default = new PointsController();
//# sourceMappingURL=points.controller.js.map