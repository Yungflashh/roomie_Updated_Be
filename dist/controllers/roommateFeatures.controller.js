"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const roommateFeatures_service_1 = __importDefault(require("../services/roommateFeatures.service"));
const logger_1 = __importDefault(require("../utils/logger"));
class RoommateFeaturesController {
    // ==================== EXPENSES ====================
    createExpense = async (req, res) => {
        try {
            const userId = req.user?.userId;
            const { groupId } = req.params;
            const expense = await roommateFeatures_service_1.default.createExpense(groupId, userId, req.body);
            res.status(201).json({
                success: true,
                message: 'Expense created',
                data: { expense },
            });
        }
        catch (error) {
            logger_1.default.error('Create expense error:', error);
            res.status(error.message.includes('Invalid') || error.message.includes('not found') ? 403 : 500).json({
                success: false,
                message: error.message || 'Failed to create expense',
            });
        }
    };
    getExpenses = async (req, res) => {
        try {
            const { groupId } = req.params;
            const { status } = req.query;
            const expenses = await roommateFeatures_service_1.default.getExpenses(groupId, status);
            res.status(200).json({
                success: true,
                data: { expenses, count: expenses.length },
            });
        }
        catch (error) {
            logger_1.default.error('Get expenses error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get expenses',
            });
        }
    };
    markExpensePaid = async (req, res) => {
        try {
            const userId = req.user?.userId;
            const { expenseId } = req.params;
            const { paymentProof, paymentNote } = req.body;
            const expense = await roommateFeatures_service_1.default.markExpensePaid(expenseId, userId, paymentProof, paymentNote);
            res.status(200).json({
                success: true,
                message: 'Payment marked! Waiting for verification.',
                data: { expense },
            });
        }
        catch (error) {
            logger_1.default.error('Mark expense paid error:', error);
            res.status(error.message.includes('not') ? 404 : 500).json({
                success: false,
                message: error.message || 'Failed to mark expense as paid',
            });
        }
    };
    verifyExpensePayment = async (req, res) => {
        try {
            const userId = req.user?.userId;
            const { expenseId } = req.params;
            const { participantId, approved } = req.body;
            const expense = await roommateFeatures_service_1.default.verifyExpensePayment(expenseId, userId, participantId, approved === true);
            res.status(200).json({
                success: true,
                message: approved ? 'Payment verified! ✓' : 'Payment disputed.',
                data: { expense },
            });
        }
        catch (error) {
            logger_1.default.error('Verify expense payment error:', error);
            res.status(error.message.includes('Only') ? 403 : 500).json({
                success: false,
                message: error.message || 'Failed to verify payment',
            });
        }
    };
    deleteExpense = async (req, res) => {
        try {
            const userId = req.user?.userId;
            const { expenseId } = req.params;
            await roommateFeatures_service_1.default.deleteExpense(expenseId, userId);
            res.status(200).json({
                success: true,
                message: 'Expense deleted',
            });
        }
        catch (error) {
            logger_1.default.error('Delete expense error:', error);
            res.status(error.message.includes('Only') ? 403 : 500).json({
                success: false,
                message: error.message || 'Failed to delete expense',
            });
        }
    };
    getExpenseSummary = async (req, res) => {
        try {
            const { groupId } = req.params;
            const summary = await roommateFeatures_service_1.default.getExpenseSummary(groupId);
            res.status(200).json({
                success: true,
                data: summary,
            });
        }
        catch (error) {
            logger_1.default.error('Get expense summary error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get expense summary',
            });
        }
    };
    // ==================== CHORES ====================
    createChore = async (req, res) => {
        try {
            const userId = req.user?.userId;
            const { groupId } = req.params;
            const chore = await roommateFeatures_service_1.default.createChore(groupId, userId, req.body);
            res.status(201).json({
                success: true,
                message: 'Chore created',
                data: { chore },
            });
        }
        catch (error) {
            logger_1.default.error('Create chore error:', error);
            res.status(error.message.includes('Invalid') || error.message.includes('not found') ? 403 : 500).json({
                success: false,
                message: error.message || 'Failed to create chore',
            });
        }
    };
    getChores = async (req, res) => {
        try {
            const { groupId } = req.params;
            const { includeInactive } = req.query;
            const chores = await roommateFeatures_service_1.default.getChores(groupId, includeInactive === 'true');
            res.status(200).json({
                success: true,
                data: { chores, count: chores.length },
            });
        }
        catch (error) {
            logger_1.default.error('Get chores error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get chores',
            });
        }
    };
    completeChore = async (req, res) => {
        try {
            const userId = req.user?.userId;
            const { choreId } = req.params;
            const { proofImage, notes } = req.body;
            const chore = await roommateFeatures_service_1.default.completeChore(choreId, userId, proofImage, notes);
            res.status(200).json({
                success: true,
                message: 'Chore marked as done! Waiting for roommate to verify.',
                data: { chore },
            });
        }
        catch (error) {
            logger_1.default.error('Complete chore error:', error);
            res.status(error.message.includes('not') ? 403 : 500).json({
                success: false,
                message: error.message || 'Failed to complete chore',
            });
        }
    };
    verifyChore = async (req, res) => {
        try {
            const userId = req.user?.userId;
            const { choreId } = req.params;
            const { approved } = req.body;
            const chore = await roommateFeatures_service_1.default.verifyChore(choreId, userId, approved === true);
            res.status(200).json({
                success: true,
                message: approved ? 'Chore verified. Points awarded.' : 'Chore disputed.',
                data: { chore },
            });
        }
        catch (error) {
            logger_1.default.error('Verify chore error:', error);
            res.status(error.message.includes('cannot') ? 403 : 500).json({
                success: false,
                message: error.message || 'Failed to verify chore',
            });
        }
    };
    transferChore = async (req, res) => {
        try {
            const userId = req.user?.userId;
            const { choreId } = req.params;
            const { targetUserId } = req.body;
            if (!targetUserId) {
                res.status(400).json({
                    success: false,
                    message: 'targetUserId is required',
                });
                return;
            }
            const result = await roommateFeatures_service_1.default.transferChore(choreId, userId, targetUserId);
            res.status(200).json({
                success: true,
                message: `Chore transferred! You spent ${result.pointsSpent} points. ⚡`,
                data: { chore: result.chore, pointsSpent: result.pointsSpent },
            });
        }
        catch (error) {
            logger_1.default.error('Transfer chore error:', error);
            res.status(error.message.includes('need') ? 400 : error.message.includes('not') ? 403 : 500).json({
                success: false,
                message: error.message || 'Failed to transfer chore',
            });
        }
    };
    skipChore = async (req, res) => {
        try {
            const userId = req.user?.userId;
            const { choreId } = req.params;
            const chore = await roommateFeatures_service_1.default.skipChore(choreId, userId);
            res.status(200).json({
                success: true,
                message: 'Chore skipped. -5 points penalty.',
                data: { chore },
            });
        }
        catch (error) {
            logger_1.default.error('Skip chore error:', error);
            res.status(error.message.includes('not') ? 403 : 500).json({
                success: false,
                message: error.message || 'Failed to skip chore',
            });
        }
    };
    deleteChore = async (req, res) => {
        try {
            const userId = req.user?.userId;
            const { choreId } = req.params;
            await roommateFeatures_service_1.default.deleteChore(choreId, userId);
            res.status(200).json({
                success: true,
                message: 'Chore deleted',
            });
        }
        catch (error) {
            logger_1.default.error('Delete chore error:', error);
            res.status(error.message.includes('Only') ? 403 : 500).json({
                success: false,
                message: error.message || 'Failed to delete chore',
            });
        }
    };
    getChoreStats = async (req, res) => {
        try {
            const { groupId } = req.params;
            const stats = await roommateFeatures_service_1.default.getChoreStats(groupId);
            res.status(200).json({
                success: true,
                data: stats,
            });
        }
        catch (error) {
            logger_1.default.error('Get chore stats error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get chore stats',
            });
        }
    };
}
exports.default = new RoommateFeaturesController();
//# sourceMappingURL=roommateFeatures.controller.js.map