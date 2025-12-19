"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/services/roommateFeaturesV2.service.ts
const mongoose_1 = __importDefault(require("mongoose"));
const SharedExpense_1 = require("../models/SharedExpense");
const Chore_1 = require("../models/Chore");
const RoommateGroup_1 = require("../models/RoommateGroup");
const UserPoints_1 = require("../models/UserPoints");
const socket_config_1 = require("../config/socket.config");
const logger_1 = __importDefault(require("../utils/logger"));
// Constants for points system
const POINTS_CONFIG = {
    SKIP_PENALTY: 5,
    TRANSFER_COST: 15,
    MIN_POINTS_FOR_TRANSFER: 15,
};
class RoommateFeaturesServiceV2 {
    // ==================== EXPENSES ====================
    /**
     * Create a new shared expense with flexible splitting
     */
    async createExpense(groupId, userId, data) {
        const group = await RoommateGroup_1.RoommateGroup.findById(groupId);
        if (!group || !group.isActive) {
            throw new Error('Group not found');
        }
        const isUserInGroup = group.members.some(m => m.user.toString() === userId && m.status === 'active');
        if (!isUserInGroup) {
            throw new Error('You are not a member of this group');
        }
        // Determine participants
        let participantUserIds;
        if (data.splitAmong === 'all') {
            participantUserIds = group.members
                .filter(m => m.status === 'active')
                .map(m => m.user.toString());
        }
        else if (data.selectedMembers && data.selectedMembers.length > 0) {
            participantUserIds = data.selectedMembers.filter(uid => group.members.some(m => m.user.toString() === uid && m.status === 'active'));
            if (participantUserIds.length === 0) {
                throw new Error('No valid members selected');
            }
        }
        else {
            throw new Error('Please select members to split with');
        }
        // Calculate shares
        let participants;
        const numParticipants = participantUserIds.length;
        if (data.splitType === 'equal') {
            const sharePerPerson = data.totalAmount / numParticipants;
            const percentagePerPerson = 100 / numParticipants;
            participants = participantUserIds.map(uid => ({
                user: new mongoose_1.default.Types.ObjectId(uid),
                share: Math.round(sharePerPerson * 100) / 100,
                percentage: Math.round(percentagePerPerson * 100) / 100,
                paid: uid === data.paidBy,
                paymentStatus: uid === data.paidBy ? 'verified' : 'unpaid',
            }));
        }
        else if (data.splitType === 'custom' && data.participantShares) {
            participants = data.participantShares.map(ps => ({
                user: new mongoose_1.default.Types.ObjectId(ps.userId),
                share: ps.share || 0,
                paid: ps.userId === data.paidBy,
                paymentStatus: ps.userId === data.paidBy ? 'verified' : 'unpaid',
            }));
        }
        else {
            const sharePerPerson = data.totalAmount / numParticipants;
            participants = participantUserIds.map(uid => ({
                user: new mongoose_1.default.Types.ObjectId(uid),
                share: Math.round(sharePerPerson * 100) / 100,
                paid: uid === data.paidBy,
                paymentStatus: uid === data.paidBy ? 'verified' : 'unpaid',
            }));
        }
        const expense = new SharedExpense_1.SharedExpense({
            group: new mongoose_1.default.Types.ObjectId(groupId),
            createdBy: new mongoose_1.default.Types.ObjectId(userId),
            title: data.title,
            description: data.description,
            category: data.category,
            totalAmount: data.totalAmount,
            currency: data.currency || group.settings.currency || 'NGN',
            splitType: data.splitType,
            splitAmong: data.splitAmong,
            participants,
            paidBy: new mongoose_1.default.Types.ObjectId(data.paidBy),
            dueDate: data.dueDate,
            recurring: data.recurring,
            receipt: data.receipt,
            status: 'pending',
        });
        await expense.save();
        const io = (0, socket_config_1.getIO)();
        if (io) {
            io.to(`group:${groupId}`).emit('expense:new', {
                expense: await expense.populate('createdBy paidBy participants.user'),
            });
        }
        logger_1.default.info(`Expense created: ${expense._id} in group ${groupId}`);
        return expense.populate('createdBy paidBy participants.user');
    }
    /**
     * Get expenses for a group
     */
    async getExpenses(groupId, status) {
        const query = { group: groupId };
        if (status && status !== 'all') {
            query.status = status;
        }
        return SharedExpense_1.SharedExpense.find(query)
            .populate('createdBy', 'firstName lastName profilePhoto')
            .populate('paidBy', 'firstName lastName profilePhoto')
            .populate('participants.user', 'firstName lastName profilePhoto')
            .populate('participants.verifiedBy', 'firstName lastName')
            .sort({ createdAt: -1 });
    }
    /**
     * Mark expense as paid
     */
    async markExpensePaid(expenseId, userId, paymentProof, paymentNote) {
        const expense = await SharedExpense_1.SharedExpense.findById(expenseId);
        if (!expense) {
            throw new Error('Expense not found');
        }
        const participantIndex = expense.participants.findIndex(p => p.user.toString() === userId);
        if (participantIndex === -1) {
            throw new Error('You are not a participant in this expense');
        }
        if (expense.participants[participantIndex].paymentStatus === 'verified') {
            throw new Error('Your payment has already been verified');
        }
        expense.participants[participantIndex].paymentStatus = 'pending_verification';
        expense.participants[participantIndex].markedPaidAt = new Date();
        expense.participants[participantIndex].paymentProof = paymentProof;
        expense.participants[participantIndex].paymentNote = paymentNote;
        await expense.save();
        const payerId = expense.paidBy.toString();
        if (payerId !== userId) {
            (0, socket_config_1.emitToUser)(payerId, 'expense:paymentPending', {
                expense: await expense.populate('createdBy paidBy participants.user'),
                fromUser: userId,
            });
        }
        logger_1.default.info(`Expense payment marked: ${expenseId} by user ${userId}`);
        return expense.populate('createdBy paidBy participants.user');
    }
    /**
     * Verify a payment
     */
    async verifyExpensePayment(expenseId, verifierId, participantId, approved) {
        const expense = await SharedExpense_1.SharedExpense.findById(expenseId);
        if (!expense) {
            throw new Error('Expense not found');
        }
        if (expense.paidBy.toString() !== verifierId) {
            throw new Error('Only the person who paid can verify payments');
        }
        const participantIndex = expense.participants.findIndex(p => p.user.toString() === participantId);
        if (participantIndex === -1) {
            throw new Error('Participant not found');
        }
        if (expense.participants[participantIndex].paymentStatus !== 'pending_verification') {
            throw new Error('This payment is not pending verification');
        }
        if (approved) {
            expense.participants[participantIndex].paymentStatus = 'verified';
            expense.participants[participantIndex].paid = true;
            expense.participants[participantIndex].paidAt = new Date();
            expense.participants[participantIndex].verifiedBy = new mongoose_1.default.Types.ObjectId(verifierId);
            expense.participants[participantIndex].verifiedAt = new Date();
        }
        else {
            expense.participants[participantIndex].paymentStatus = 'disputed';
        }
        const allVerified = expense.participants.every(p => p.paymentStatus === 'verified');
        const someVerified = expense.participants.some(p => p.paymentStatus === 'verified');
        expense.status = allVerified ? 'settled' : someVerified ? 'partial' : 'pending';
        if (allVerified) {
            expense.settledAt = new Date();
        }
        await expense.save();
        (0, socket_config_1.emitToUser)(participantId, 'expense:paymentVerified', {
            expense: await expense.populate('createdBy paidBy participants.user'),
            approved,
        });
        logger_1.default.info(`Expense payment ${approved ? 'verified' : 'disputed'}: ${expenseId}`);
        return expense.populate('createdBy paidBy participants.user');
    }
    /**
     * Delete expense
     */
    async deleteExpense(expenseId, userId) {
        const expense = await SharedExpense_1.SharedExpense.findById(expenseId);
        if (!expense) {
            throw new Error('Expense not found');
        }
        if (expense.createdBy.toString() !== userId) {
            throw new Error('Only the creator can delete this expense');
        }
        await SharedExpense_1.SharedExpense.findByIdAndDelete(expenseId);
        logger_1.default.info(`Expense deleted: ${expenseId}`);
    }
    /**
     * Get expense summary
     */
    async getExpenseSummary(groupId) {
        const expenses = await SharedExpense_1.SharedExpense.find({ group: groupId });
        let totalExpenses = 0;
        let pendingAmount = 0;
        let settledAmount = 0;
        const balanceMap = new Map();
        for (const expense of expenses) {
            totalExpenses += expense.totalAmount;
            if (expense.status === 'settled') {
                settledAmount += expense.totalAmount;
            }
            else {
                for (const p of expense.participants) {
                    if (p.paymentStatus !== 'verified') {
                        pendingAmount += p.share;
                    }
                }
            }
            const payerId = expense.paidBy.toString();
            for (const participant of expense.participants) {
                const participantId = participant.user.toString();
                if (!balanceMap.has(participantId)) {
                    balanceMap.set(participantId, { owes: 0, owed: 0 });
                }
                if (participantId !== payerId && participant.paymentStatus !== 'verified') {
                    balanceMap.get(participantId).owes += participant.share;
                    if (!balanceMap.has(payerId)) {
                        balanceMap.set(payerId, { owes: 0, owed: 0 });
                    }
                    balanceMap.get(payerId).owed += participant.share;
                }
            }
        }
        const balances = Array.from(balanceMap.entries()).map(([odlpUserId, balance]) => ({
            userId: odlpUserId,
            ...balance,
            net: balance.owed - balance.owes,
        }));
        return { totalExpenses, pendingAmount, settledAmount, balances };
    }
    // ==================== CHORES ====================
    /**
     * Create a chore
     */
    async createChore(groupId, userId, data) {
        const group = await RoommateGroup_1.RoommateGroup.findById(groupId);
        if (!group || !group.isActive) {
            throw new Error('Group not found');
        }
        let participantIds;
        if (data.assignTo === 'all') {
            participantIds = group.members
                .filter(m => m.status === 'active')
                .map(m => m.user.toString());
        }
        else if (data.selectedMembers && data.selectedMembers.length > 0) {
            participantIds = data.selectedMembers.filter(uid => group.members.some(m => m.user.toString() === uid && m.status === 'active'));
        }
        else {
            throw new Error('Please select members for this chore');
        }
        let firstAssignee;
        if (data.rotationType === 'rotate') {
            firstAssignee = participantIds[0];
        }
        else if (data.rotationType === 'random') {
            firstAssignee = participantIds[Math.floor(Math.random() * participantIds.length)];
        }
        else if (data.rotationType === 'fixed') {
            firstAssignee = participantIds[0];
        }
        const chore = new Chore_1.Chore({
            group: new mongoose_1.default.Types.ObjectId(groupId),
            createdBy: new mongoose_1.default.Types.ObjectId(userId),
            title: data.title,
            description: data.description,
            icon: data.icon || '🧹',
            category: data.category,
            frequency: data.frequency,
            rotationType: data.rotationType,
            assignTo: data.assignTo,
            currentAssignee: firstAssignee ? new mongoose_1.default.Types.ObjectId(firstAssignee) : undefined,
            participants: participantIds.map(uid => new mongoose_1.default.Types.ObjectId(uid)),
            rotationOrder: participantIds.map(uid => new mongoose_1.default.Types.ObjectId(uid)),
            currentRotationIndex: 0,
            nextDueDate: this.calculateNextDueDate(data.frequency),
            points: data.points || 10,
            isActive: true,
        });
        if (firstAssignee) {
            chore.assignments.push({
                user: new mongoose_1.default.Types.ObjectId(firstAssignee),
                assignedAt: new Date(),
                status: 'pending',
            });
        }
        await chore.save();
        const io = (0, socket_config_1.getIO)();
        if (io) {
            io.to(`group:${groupId}`).emit('chore:new', {
                chore: await chore.populate('createdBy currentAssignee participants'),
            });
        }
        logger_1.default.info(`Chore created: ${chore._id} in group ${groupId}`);
        return chore.populate('createdBy currentAssignee participants');
    }
    /**
     * Get chores
     */
    async getChores(groupId, includeInactive = false) {
        const query = { group: groupId };
        if (!includeInactive) {
            query.isActive = true;
        }
        return Chore_1.Chore.find(query)
            .populate('createdBy', 'firstName lastName profilePhoto')
            .populate('currentAssignee', 'firstName lastName profilePhoto')
            .populate('participants', 'firstName lastName profilePhoto')
            .populate('assignments.user', 'firstName lastName profilePhoto')
            .populate('assignments.verifiedBy', 'firstName lastName')
            .sort({ nextDueDate: 1 });
    }
    /**
     * Complete chore
     */
    async completeChore(choreId, userId, proofImage, notes) {
        const chore = await Chore_1.Chore.findById(choreId);
        if (!chore) {
            throw new Error('Chore not found');
        }
        if (chore.rotationType !== 'volunteer' && chore.currentAssignee?.toString() !== userId) {
            throw new Error('This chore is not assigned to you');
        }
        let assignment = chore.assignments.find(a => a.user.toString() === userId && a.status === 'pending');
        if (!assignment && chore.rotationType === 'volunteer') {
            chore.assignments.push({
                user: new mongoose_1.default.Types.ObjectId(userId),
                assignedAt: new Date(),
                status: 'done',
                completedAt: new Date(),
                proofImage,
                notes,
            });
        }
        else if (assignment) {
            assignment.status = 'done';
            assignment.completedAt = new Date();
            assignment.proofImage = proofImage;
            assignment.notes = notes;
        }
        await chore.save();
        const io = (0, socket_config_1.getIO)();
        if (io) {
            io.to(`group:${chore.group}`).emit('chore:awaitingVerification', {
                chore: await chore.populate('createdBy currentAssignee participants'),
                completedBy: userId,
            });
        }
        logger_1.default.info(`Chore marked done: ${choreId} by user ${userId}`);
        return chore.populate('createdBy currentAssignee participants');
    }
    /**
     * Verify chore
     */
    async verifyChore(choreId, verifierId, approved) {
        const chore = await Chore_1.Chore.findById(choreId);
        if (!chore) {
            throw new Error('Chore not found');
        }
        const assignment = chore.assignments.find(a => a.status === 'done');
        if (!assignment) {
            throw new Error('No chore awaiting verification');
        }
        if (assignment.user.toString() === verifierId) {
            throw new Error('You cannot verify your own chore');
        }
        const completedByUserId = assignment.user.toString();
        if (approved) {
            assignment.status = 'verified';
            assignment.verifiedBy = new mongoose_1.default.Types.ObjectId(verifierId);
            assignment.verifiedAt = new Date();
            await this.addPoints(chore.group.toString(), completedByUserId, chore.points, 'earned', `Completed: ${chore.title}`, chore._id);
            if (chore.rotationType === 'rotate' || chore.rotationType === 'random') {
                chore.currentRotationIndex = (chore.currentRotationIndex + 1) % chore.rotationOrder.length;
                chore.currentAssignee = chore.rotationOrder[chore.currentRotationIndex];
                chore.assignments.push({
                    user: chore.currentAssignee,
                    assignedAt: new Date(),
                    status: 'pending',
                });
            }
            chore.nextDueDate = this.calculateNextDueDate(chore.frequency);
            const io = (0, socket_config_1.getIO)();
            if (io) {
                io.to(`group:${chore.group}`).emit('chore:verified', {
                    chore: await chore.populate('createdBy currentAssignee participants'),
                    verifiedBy: verifierId,
                    pointsAwarded: chore.points,
                });
            }
            logger_1.default.info(`Chore verified: ${choreId}, +${chore.points} points`);
        }
        else {
            assignment.status = 'disputed';
            const io = (0, socket_config_1.getIO)();
            if (io) {
                io.to(`group:${chore.group}`).emit('chore:disputed', {
                    chore: await chore.populate('createdBy currentAssignee participants'),
                    disputedBy: verifierId,
                });
            }
            logger_1.default.info(`Chore disputed: ${choreId}`);
        }
        await chore.save();
        return chore.populate('createdBy currentAssignee participants');
    }
    /**
     * Skip chore
     */
    async skipChore(choreId, userId) {
        const chore = await Chore_1.Chore.findById(choreId);
        if (!chore) {
            throw new Error('Chore not found');
        }
        if (chore.currentAssignee?.toString() !== userId) {
            throw new Error('This chore is not assigned to you');
        }
        const assignment = chore.assignments.find(a => a.user.toString() === userId && a.status === 'pending');
        if (assignment) {
            assignment.status = 'skipped';
            assignment.completedAt = new Date();
        }
        await this.addPoints(chore.group.toString(), userId, -POINTS_CONFIG.SKIP_PENALTY, 'penalty', `Skipped: ${chore.title}`, chore._id);
        if (chore.rotationType === 'rotate' || chore.rotationType === 'random') {
            chore.currentRotationIndex = (chore.currentRotationIndex + 1) % chore.rotationOrder.length;
            chore.currentAssignee = chore.rotationOrder[chore.currentRotationIndex];
            chore.assignments.push({
                user: chore.currentAssignee,
                assignedAt: new Date(),
                status: 'pending',
            });
        }
        chore.nextDueDate = this.calculateNextDueDate(chore.frequency);
        await chore.save();
        const io = (0, socket_config_1.getIO)();
        if (io) {
            io.to(`group:${chore.group}`).emit('chore:skipped', {
                chore: await chore.populate('createdBy currentAssignee participants'),
                skippedBy: userId,
                pointsDeducted: POINTS_CONFIG.SKIP_PENALTY,
            });
        }
        logger_1.default.info(`Chore skipped: ${choreId}, -${POINTS_CONFIG.SKIP_PENALTY} points`);
        return chore.populate('createdBy currentAssignee participants');
    }
    /**
     * Transfer chore
     */
    async transferChore(choreId, userId, targetUserId) {
        const chore = await Chore_1.Chore.findById(choreId);
        if (!chore) {
            throw new Error('Chore not found');
        }
        if (chore.currentAssignee?.toString() !== userId) {
            throw new Error('This chore is not assigned to you');
        }
        if (!chore.participants.some(p => p.toString() === targetUserId)) {
            throw new Error('Target user is not a participant');
        }
        const userPoints = await this.getUserPoints(chore.group.toString(), userId);
        if (userPoints < POINTS_CONFIG.MIN_POINTS_FOR_TRANSFER) {
            throw new Error(`You need at least ${POINTS_CONFIG.MIN_POINTS_FOR_TRANSFER} points. You have ${userPoints}.`);
        }
        const assignment = chore.assignments.find(a => a.user.toString() === userId && a.status === 'pending');
        if (assignment) {
            assignment.status = 'transferred';
            assignment.completedAt = new Date();
            assignment.transferredTo = new mongoose_1.default.Types.ObjectId(targetUserId);
            assignment.transferredBy = new mongoose_1.default.Types.ObjectId(userId);
            assignment.transferCost = POINTS_CONFIG.TRANSFER_COST;
        }
        await this.addPoints(chore.group.toString(), userId, -POINTS_CONFIG.TRANSFER_COST, 'spent', `Transfer: ${chore.title}`, chore._id);
        chore.currentAssignee = new mongoose_1.default.Types.ObjectId(targetUserId);
        chore.assignments.push({
            user: new mongoose_1.default.Types.ObjectId(targetUserId),
            assignedAt: new Date(),
            status: 'pending',
        });
        await chore.save();
        (0, socket_config_1.emitToUser)(targetUserId, 'chore:transferred', {
            chore: await chore.populate('createdBy currentAssignee participants'),
            transferredBy: userId,
            pointsSpent: POINTS_CONFIG.TRANSFER_COST,
        });
        logger_1.default.info(`Chore transferred: ${choreId} to ${targetUserId}`);
        return {
            chore: await chore.populate('createdBy currentAssignee participants'),
            pointsSpent: POINTS_CONFIG.TRANSFER_COST,
        };
    }
    /**
     * Delete chore
     */
    async deleteChore(choreId, userId) {
        const chore = await Chore_1.Chore.findById(choreId);
        if (!chore) {
            throw new Error('Chore not found');
        }
        if (chore.createdBy.toString() !== userId) {
            throw new Error('Only the creator can delete this chore');
        }
        await Chore_1.Chore.findByIdAndDelete(choreId);
        logger_1.default.info(`Chore deleted: ${choreId}`);
    }
    /**
     * Get chore stats
     */
    async getChoreStats(groupId) {
        const chores = await Chore_1.Chore.find({ group: groupId });
        const pointsData = await this.getGroupPoints(groupId);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const userStatsMap = new Map();
        let completedThisWeek = 0;
        let pendingVerification = 0;
        for (const chore of chores) {
            for (const assignment of chore.assignments) {
                const odlpUserId = assignment.user.toString();
                if (!userStatsMap.has(odlpUserId)) {
                    userStatsMap.set(odlpUserId, { completed: 0, skipped: 0, transferred: 0 });
                }
                if (assignment.status === 'verified') {
                    userStatsMap.get(odlpUserId).completed++;
                    if (assignment.verifiedAt && assignment.verifiedAt >= weekAgo) {
                        completedThisWeek++;
                    }
                }
                else if (assignment.status === 'skipped') {
                    userStatsMap.get(odlpUserId).skipped++;
                }
                else if (assignment.status === 'transferred') {
                    userStatsMap.get(odlpUserId).transferred++;
                }
                else if (assignment.status === 'done') {
                    pendingVerification++;
                }
            }
        }
        const userStats = Array.from(userStatsMap.entries()).map(([odlpUserId, stats]) => {
            const points = pointsData.find(p => p.odlpUserId === odlpUserId);
            return {
                odlpUserId,
                ...stats,
                points: points?.totalPoints || 0,
                earnedPoints: points?.earnedPoints || 0,
                spentPoints: points?.spentPoints || 0,
                penaltyPoints: points?.penaltyPoints || 0,
            };
        });
        for (const points of pointsData) {
            if (!userStatsMap.has(points.odlpUserId)) {
                userStats.push({
                    odlpUserId: points.odlpUserId,
                    completed: 0,
                    skipped: 0,
                    transferred: 0,
                    points: points.totalPoints,
                    earnedPoints: points.earnedPoints,
                    spentPoints: points.spentPoints,
                    penaltyPoints: points.penaltyPoints,
                });
            }
        }
        return {
            totalChores: chores.length,
            completedThisWeek,
            pendingVerification,
            transferCost: POINTS_CONFIG.TRANSFER_COST,
            skipPenalty: POINTS_CONFIG.SKIP_PENALTY,
            userStats,
        };
    }
    // ==================== POINTS ====================
    async getUserPoints(groupId, userId) {
        let userPoints = await UserPoints_1.UserPoints.findOne({ group: groupId, user: userId });
        if (!userPoints) {
            userPoints = new UserPoints_1.UserPoints({
                group: new mongoose_1.default.Types.ObjectId(groupId),
                user: new mongoose_1.default.Types.ObjectId(userId),
                totalPoints: 0,
                earnedPoints: 0,
                spentPoints: 0,
                penaltyPoints: 0,
                transactions: [],
            });
            await userPoints.save();
        }
        return userPoints.totalPoints;
    }
    async addPoints(groupId, userId, amount, type, reason, relatedChoreId) {
        let userPoints = await UserPoints_1.UserPoints.findOne({ group: groupId, user: userId });
        if (!userPoints) {
            userPoints = new UserPoints_1.UserPoints({
                group: new mongoose_1.default.Types.ObjectId(groupId),
                user: new mongoose_1.default.Types.ObjectId(userId),
                totalPoints: 0,
                earnedPoints: 0,
                spentPoints: 0,
                penaltyPoints: 0,
                transactions: [],
            });
        }
        userPoints.totalPoints += amount;
        if (type === 'earned' && amount > 0) {
            userPoints.earnedPoints += amount;
        }
        else if (type === 'spent' && amount < 0) {
            userPoints.spentPoints += Math.abs(amount);
        }
        else if (type === 'penalty' && amount < 0) {
            userPoints.penaltyPoints += Math.abs(amount);
        }
        if (userPoints.totalPoints < 0) {
            userPoints.totalPoints = 0;
        }
        userPoints.transactions.push({
            type,
            amount,
            reason,
            relatedChore: relatedChoreId,
            createdAt: new Date(),
        });
        await userPoints.save();
        return userPoints.totalPoints;
    }
    async getGroupPoints(groupId) {
        const points = await UserPoints_1.UserPoints.find({ group: groupId });
        return points.map(p => ({
            odlpUserId: p.user.toString(),
            totalPoints: p.totalPoints,
            earnedPoints: p.earnedPoints,
            spentPoints: p.spentPoints,
            penaltyPoints: p.penaltyPoints,
        }));
    }
    // ==================== HELPERS ====================
    calculateNextDueDate(frequency) {
        const now = new Date();
        switch (frequency) {
            case 'daily':
                now.setDate(now.getDate() + 1);
                break;
            case 'weekly':
                now.setDate(now.getDate() + 7);
                break;
            case 'biweekly':
                now.setDate(now.getDate() + 14);
                break;
            case 'monthly':
                now.setMonth(now.getMonth() + 1);
                break;
            default:
                break;
        }
        return now;
    }
}
exports.default = new RoommateFeaturesServiceV2();
//# sourceMappingURL=roommateFeatures.service.js.map