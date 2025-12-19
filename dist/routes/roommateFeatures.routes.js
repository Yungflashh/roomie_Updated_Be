"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/roommateFeatures.routes.ts
const express_1 = require("express");
const roommateFeatures_controller_1 = __importDefault(require("../controllers/roommateFeatures.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
// ==================== EXPENSES ====================
/**
 * @route   POST /api/v1/roommate-features/:groupId/expenses
 * @desc    Create a new shared expense
 * @access  Private
 */
router.post('/:groupId/expenses', roommateFeatures_controller_1.default.createExpense);
/**
 * @route   GET /api/v1/roommate-features/:groupId/expenses
 * @desc    Get all expenses for a group
 * @access  Private
 */
router.get('/:groupId/expenses', roommateFeatures_controller_1.default.getExpenses);
/**
 * @route   GET /api/v1/roommate-features/:groupId/expenses/summary
 * @desc    Get expense summary (totals, balances)
 * @access  Private
 */
router.get('/:groupId/expenses/summary', roommateFeatures_controller_1.default.getExpenseSummary);
/**
 * @route   PUT /api/v1/roommate-features/expenses/:expenseId/pay
 * @desc    Mark expense as paid (awaiting verification)
 * @access  Private
 */
router.put('/expenses/:expenseId/pay', roommateFeatures_controller_1.default.markExpensePaid);
/**
 * @route   PUT /api/v1/roommate-features/expenses/:expenseId/verify
 * @desc    Verify or dispute a payment
 * @access  Private
 */
router.put('/expenses/:expenseId/verify', roommateFeatures_controller_1.default.verifyExpensePayment);
/**
 * @route   DELETE /api/v1/roommate-features/expenses/:expenseId
 * @desc    Delete an expense
 * @access  Private
 */
router.delete('/expenses/:expenseId', roommateFeatures_controller_1.default.deleteExpense);
// ==================== CHORES ====================
/**
 * @route   POST /api/v1/roommate-features/:groupId/chores
 * @desc    Create a new chore
 * @access  Private
 */
router.post('/:groupId/chores', roommateFeatures_controller_1.default.createChore);
/**
 * @route   GET /api/v1/roommate-features/:groupId/chores
 * @desc    Get all chores for a group
 * @access  Private
 */
router.get('/:groupId/chores', roommateFeatures_controller_1.default.getChores);
/**
 * @route   GET /api/v1/roommate-features/:groupId/chores/stats
 * @desc    Get chore statistics
 * @access  Private
 */
router.get('/:groupId/chores/stats', roommateFeatures_controller_1.default.getChoreStats);
/**
 * @route   PUT /api/v1/roommate-features/chores/:choreId/complete
 * @desc    Mark chore as done (awaiting verification)
 * @access  Private
 */
router.put('/chores/:choreId/complete', roommateFeatures_controller_1.default.completeChore);
/**
 * @route   PUT /api/v1/roommate-features/chores/:choreId/verify
 * @desc    Verify or dispute a completed chore
 * @access  Private
 */
router.put('/chores/:choreId/verify', roommateFeatures_controller_1.default.verifyChore);
/**
 * @route   PUT /api/v1/roommate-features/chores/:choreId/transfer
 * @desc    Transfer chore to specific roommate using points
 * @body    { targetUserId: string }
 * @access  Private
 */
router.put('/chores/:choreId/transfer', roommateFeatures_controller_1.default.transferChore);
/**
 * @route   PUT /api/v1/roommate-features/chores/:choreId/skip
 * @desc    Skip a chore (with point penalty)
 * @access  Private
 */
router.put('/chores/:choreId/skip', roommateFeatures_controller_1.default.skipChore);
/**
 * @route   DELETE /api/v1/roommate-features/chores/:choreId
 * @desc    Delete a chore
 * @access  Private
 */
router.delete('/chores/:choreId', roommateFeatures_controller_1.default.deleteChore);
exports.default = router;
//# sourceMappingURL=roommateFeatures.routes.js.map