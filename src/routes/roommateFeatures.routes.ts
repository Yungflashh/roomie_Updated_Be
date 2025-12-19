// src/routes/roommateFeatures.routes.ts
import { Router } from 'express';
import roommateFeaturesController from '../controllers/roommateFeatures.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ==================== EXPENSES ====================

/**
 * @route   POST /api/v1/roommate-features/:groupId/expenses
 * @desc    Create a new shared expense
 * @access  Private
 */
router.post('/:groupId/expenses', roommateFeaturesController.createExpense);

/**
 * @route   GET /api/v1/roommate-features/:groupId/expenses
 * @desc    Get all expenses for a group
 * @access  Private
 */
router.get('/:groupId/expenses', roommateFeaturesController.getExpenses);

/**
 * @route   GET /api/v1/roommate-features/:groupId/expenses/summary
 * @desc    Get expense summary (totals, balances)
 * @access  Private
 */
router.get('/:groupId/expenses/summary', roommateFeaturesController.getExpenseSummary);

/**
 * @route   PUT /api/v1/roommate-features/expenses/:expenseId/pay
 * @desc    Mark expense as paid (awaiting verification)
 * @access  Private
 */
router.put('/expenses/:expenseId/pay', roommateFeaturesController.markExpensePaid);

/**
 * @route   PUT /api/v1/roommate-features/expenses/:expenseId/verify
 * @desc    Verify or dispute a payment
 * @access  Private
 */
router.put('/expenses/:expenseId/verify', roommateFeaturesController.verifyExpensePayment);

/**
 * @route   DELETE /api/v1/roommate-features/expenses/:expenseId
 * @desc    Delete an expense
 * @access  Private
 */
router.delete('/expenses/:expenseId', roommateFeaturesController.deleteExpense);

// ==================== CHORES ====================

/**
 * @route   POST /api/v1/roommate-features/:groupId/chores
 * @desc    Create a new chore
 * @access  Private
 */
router.post('/:groupId/chores', roommateFeaturesController.createChore);

/**
 * @route   GET /api/v1/roommate-features/:groupId/chores
 * @desc    Get all chores for a group
 * @access  Private
 */
router.get('/:groupId/chores', roommateFeaturesController.getChores);

/**
 * @route   GET /api/v1/roommate-features/:groupId/chores/stats
 * @desc    Get chore statistics
 * @access  Private
 */
router.get('/:groupId/chores/stats', roommateFeaturesController.getChoreStats);

/**
 * @route   PUT /api/v1/roommate-features/chores/:choreId/complete
 * @desc    Mark chore as done (awaiting verification)
 * @access  Private
 */
router.put('/chores/:choreId/complete', roommateFeaturesController.completeChore);

/**
 * @route   PUT /api/v1/roommate-features/chores/:choreId/verify
 * @desc    Verify or dispute a completed chore
 * @access  Private
 */
router.put('/chores/:choreId/verify', roommateFeaturesController.verifyChore);

/**
 * @route   PUT /api/v1/roommate-features/chores/:choreId/transfer
 * @desc    Transfer chore to specific roommate using points
 * @body    { targetUserId: string }
 * @access  Private
 */
router.put('/chores/:choreId/transfer', roommateFeaturesController.transferChore);

/**
 * @route   PUT /api/v1/roommate-features/chores/:choreId/skip
 * @desc    Skip a chore (with point penalty)
 * @access  Private
 */
router.put('/chores/:choreId/skip', roommateFeaturesController.skipChore);

/**
 * @route   DELETE /api/v1/roommate-features/chores/:choreId
 * @desc    Delete a chore
 * @access  Private
 */
router.delete('/chores/:choreId', roommateFeaturesController.deleteChore);

export default router;