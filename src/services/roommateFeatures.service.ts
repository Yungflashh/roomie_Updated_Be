// src/services/roommateFeaturesV2.service.ts
import mongoose from 'mongoose';
import { SharedExpense, ISharedExpenseDocument } from '../models/SharedExpense';
import { Chore, IChoreDocument } from '../models/Chore';
import { SharedListing, ISharedListingDocument } from '../models/SharedListing';
import { RoommateGroup } from '../models/RoommateGroup';
import { UserPoints } from '../models/UserPoints';
import { emitToUser, getIO } from '../config/socket.config';
import logger from '../utils/logger';

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
  async createExpense(
    groupId: string,
    userId: string,
    data: {
      title: string;
      description?: string;
      category: string;
      totalAmount: number;
      currency?: string;
      splitType: 'equal' | 'percentage' | 'custom' | 'shares';
      splitAmong: 'all' | 'selected';
      selectedMembers?: string[];
      participantShares?: { userId: string; share?: number; percentage?: number }[];
      paidBy: string;
      dueDate?: Date;
      recurring?: { enabled: boolean; frequency: string };
      receipt?: string;
    }
  ): Promise<ISharedExpenseDocument> {
    const group = await RoommateGroup.findById(groupId);
    if (!group || !group.isActive) {
      throw new Error('Group not found');
    }

    const isUserInGroup = group.members.some(
      m => m.user.toString() === userId && m.status === 'active'
    );
    if (!isUserInGroup) {
      throw new Error('You are not a member of this group');
    }

    // Determine participants
    let participantUserIds: string[];
    if (data.splitAmong === 'all') {
      participantUserIds = group.members
        .filter(m => m.status === 'active')
        .map(m => m.user.toString());
    } else if (data.selectedMembers && data.selectedMembers.length > 0) {
      participantUserIds = data.selectedMembers.filter(uid =>
        group.members.some(m => m.user.toString() === uid && m.status === 'active')
      );
      if (participantUserIds.length === 0) {
        throw new Error('No valid members selected');
      }
    } else {
      throw new Error('Please select members to split with');
    }

    // Calculate shares
    let participants: {
      user: mongoose.Types.ObjectId;
      share: number;
      percentage?: number;
      paid: boolean;
      paymentStatus: 'unpaid' | 'pending_verification' | 'verified';
    }[];

    const numParticipants = participantUserIds.length;

    if (data.splitType === 'equal') {
      const sharePerPerson = data.totalAmount / numParticipants;
      const percentagePerPerson = 100 / numParticipants;
      participants = participantUserIds.map(uid => ({
        user: new mongoose.Types.ObjectId(uid),
        share: Math.round(sharePerPerson * 100) / 100,
        percentage: Math.round(percentagePerPerson * 100) / 100,
        paid: uid === data.paidBy,
        paymentStatus: uid === data.paidBy ? 'verified' as const : 'unpaid' as const,
      }));
    } else if (data.splitType === 'custom' && data.participantShares) {
      participants = data.participantShares.map(ps => ({
        user: new mongoose.Types.ObjectId(ps.userId),
        share: ps.share || 0,
        paid: ps.userId === data.paidBy,
        paymentStatus: ps.userId === data.paidBy ? 'verified' as const : 'unpaid' as const,
      }));
    } else {
      const sharePerPerson = data.totalAmount / numParticipants;
      participants = participantUserIds.map(uid => ({
        user: new mongoose.Types.ObjectId(uid),
        share: Math.round(sharePerPerson * 100) / 100,
        paid: uid === data.paidBy,
        paymentStatus: uid === data.paidBy ? 'verified' as const : 'unpaid' as const,
      }));
    }

    const expense = new SharedExpense({
      group: new mongoose.Types.ObjectId(groupId),
      createdBy: new mongoose.Types.ObjectId(userId),
      title: data.title,
      description: data.description,
      category: data.category,
      totalAmount: data.totalAmount,
      currency: data.currency || group.settings.currency || 'NGN',
      splitType: data.splitType,
      splitAmong: data.splitAmong,
      participants,
      paidBy: new mongoose.Types.ObjectId(data.paidBy),
      dueDate: data.dueDate,
      recurring: data.recurring,
      receipt: data.receipt,
      status: 'pending',
    });

    await expense.save();

    const io = getIO();
    if (io) {
      io.to(`group:${groupId}`).emit('expense:new', {
        expense: await expense.populate('createdBy paidBy participants.user'),
      });
    }

    logger.info(`Expense created: ${expense._id} in group ${groupId}`);
    return expense.populate('createdBy paidBy participants.user');
  }

  /**
   * Get expenses for a group
   */
  async getExpenses(groupId: string, status?: string): Promise<ISharedExpenseDocument[]> {
    const query: any = { group: groupId };
    if (status && status !== 'all') {
      query.status = status;
    }

    return SharedExpense.find(query)
      .populate('createdBy', 'firstName lastName profilePhoto')
      .populate('paidBy', 'firstName lastName profilePhoto')
      .populate('participants.user', 'firstName lastName profilePhoto')
      .populate('participants.verifiedBy', 'firstName lastName')
      .sort({ createdAt: -1 });
  }

  /**
   * Mark expense as paid
   */
  async markExpensePaid(
    expenseId: string,
    userId: string,
    paymentProof?: string,
    paymentNote?: string
  ): Promise<ISharedExpenseDocument> {
    const expense = await SharedExpense.findById(expenseId);
    if (!expense) {
      throw new Error('Expense not found');
    }

    const participantIndex = expense.participants.findIndex(
      p => p.user.toString() === userId
    );
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
      emitToUser(payerId, 'expense:paymentPending', {
        expense: await expense.populate('createdBy paidBy participants.user'),
        fromUser: userId,
      });
    }

    logger.info(`Expense payment marked: ${expenseId} by user ${userId}`);
    return expense.populate('createdBy paidBy participants.user');
  }

  /**
   * Verify a payment
   */
  async verifyExpensePayment(
    expenseId: string,
    verifierId: string,
    participantId: string,
    approved: boolean
  ): Promise<ISharedExpenseDocument> {
    const expense = await SharedExpense.findById(expenseId);
    if (!expense) {
      throw new Error('Expense not found');
    }

    if (expense.paidBy.toString() !== verifierId) {
      throw new Error('Only the person who paid can verify payments');
    }

    const participantIndex = expense.participants.findIndex(
      p => p.user.toString() === participantId
    );
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
      expense.participants[participantIndex].verifiedBy = new mongoose.Types.ObjectId(verifierId);
      expense.participants[participantIndex].verifiedAt = new Date();
    } else {
      expense.participants[participantIndex].paymentStatus = 'disputed';
    }

    const allVerified = expense.participants.every(p => p.paymentStatus === 'verified');
    const someVerified = expense.participants.some(p => p.paymentStatus === 'verified');
    expense.status = allVerified ? 'settled' : someVerified ? 'partial' : 'pending';
    if (allVerified) {
      expense.settledAt = new Date();
    }

    await expense.save();

    emitToUser(participantId, 'expense:paymentVerified', {
      expense: await expense.populate('createdBy paidBy participants.user'),
      approved,
    });

    logger.info(`Expense payment ${approved ? 'verified' : 'disputed'}: ${expenseId}`);
    return expense.populate('createdBy paidBy participants.user');
  }

  /**
   * Delete expense
   */
  async deleteExpense(expenseId: string, userId: string): Promise<void> {
    const expense = await SharedExpense.findById(expenseId);
    if (!expense) {
      throw new Error('Expense not found');
    }
    if (expense.createdBy.toString() !== userId) {
      throw new Error('Only the creator can delete this expense');
    }

    await SharedExpense.findByIdAndDelete(expenseId);
    logger.info(`Expense deleted: ${expenseId}`);
  }

  /**
   * Get expense summary
   */
  async getExpenseSummary(groupId: string): Promise<{
    totalExpenses: number;
    pendingAmount: number;
    settledAmount: number;
    balances: { userId: string; owes: number; owed: number; net: number }[];
  }> {
    const expenses = await SharedExpense.find({ group: groupId });

    let totalExpenses = 0;
    let pendingAmount = 0;
    let settledAmount = 0;
    const balanceMap = new Map<string, { owes: number; owed: number }>();

    for (const expense of expenses) {
      totalExpenses += expense.totalAmount;

      if (expense.status === 'settled') {
        settledAmount += expense.totalAmount;
      } else {
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
          balanceMap.get(participantId)!.owes += participant.share;

          if (!balanceMap.has(payerId)) {
            balanceMap.set(payerId, { owes: 0, owed: 0 });
          }
          balanceMap.get(payerId)!.owed += participant.share;
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
  async createChore(
    groupId: string,
    userId: string,
    data: {
      title: string;
      description?: string;
      icon?: string;
      category: string;
      frequency: string;
      rotationType: 'rotate' | 'fixed' | 'volunteer' | 'random';
      assignTo: 'all' | 'selected';
      selectedMembers?: string[];
      points?: number;
    }
  ): Promise<IChoreDocument> {
    const group = await RoommateGroup.findById(groupId);
    if (!group || !group.isActive) {
      throw new Error('Group not found');
    }

    let participantIds: string[];
    if (data.assignTo === 'all') {
      participantIds = group.members
        .filter(m => m.status === 'active')
        .map(m => m.user.toString());
    } else if (data.selectedMembers && data.selectedMembers.length > 0) {
      participantIds = data.selectedMembers.filter(uid =>
        group.members.some(m => m.user.toString() === uid && m.status === 'active')
      );
    } else {
      throw new Error('Please select members for this chore');
    }

    let firstAssignee: string | undefined;
    if (data.rotationType === 'rotate') {
      firstAssignee = participantIds[0];
    } else if (data.rotationType === 'random') {
      firstAssignee = participantIds[Math.floor(Math.random() * participantIds.length)];
    } else if (data.rotationType === 'fixed') {
      firstAssignee = participantIds[0];
    }

    const chore = new Chore({
      group: new mongoose.Types.ObjectId(groupId),
      createdBy: new mongoose.Types.ObjectId(userId),
      title: data.title,
      description: data.description,
      icon: data.icon || '🧹',
      category: data.category,
      frequency: data.frequency,
      rotationType: data.rotationType,
      assignTo: data.assignTo,
      currentAssignee: firstAssignee ? new mongoose.Types.ObjectId(firstAssignee) : undefined,
      participants: participantIds.map(uid => new mongoose.Types.ObjectId(uid)),
      rotationOrder: participantIds.map(uid => new mongoose.Types.ObjectId(uid)),
      currentRotationIndex: 0,
      nextDueDate: this.calculateNextDueDate(data.frequency as any),
      points: data.points || 10,
      isActive: true,
    });

    if (firstAssignee) {
      chore.assignments.push({
        user: new mongoose.Types.ObjectId(firstAssignee),
        assignedAt: new Date(),
        status: 'pending',
      });
    }

    await chore.save();

    const io = getIO();
    if (io) {
      io.to(`group:${groupId}`).emit('chore:new', {
        chore: await chore.populate('createdBy currentAssignee participants'),
      });
    }

    logger.info(`Chore created: ${chore._id} in group ${groupId}`);
    return chore.populate('createdBy currentAssignee participants');
  }

  /**
   * Get chores
   */
  async getChores(groupId: string, includeInactive: boolean = false): Promise<IChoreDocument[]> {
    const query: any = { group: groupId };
    if (!includeInactive) {
      query.isActive = true;
    }

    return Chore.find(query)
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
  async completeChore(
    choreId: string,
    userId: string,
    proofImage?: string,
    notes?: string
  ): Promise<IChoreDocument> {
    const chore = await Chore.findById(choreId);
    if (!chore) {
      throw new Error('Chore not found');
    }

    if (chore.rotationType !== 'volunteer' && chore.currentAssignee?.toString() !== userId) {
      throw new Error('This chore is not assigned to you');
    }

    let assignment = chore.assignments.find(
      a => a.user.toString() === userId && a.status === 'pending'
    );

    if (!assignment && chore.rotationType === 'volunteer') {
      chore.assignments.push({
        user: new mongoose.Types.ObjectId(userId),
        assignedAt: new Date(),
        status: 'done',
        completedAt: new Date(),
        proofImage,
        notes,
      });
    } else if (assignment) {
      assignment.status = 'done';
      assignment.completedAt = new Date();
      assignment.proofImage = proofImage;
      assignment.notes = notes;
    }

    await chore.save();

    const io = getIO();
    if (io) {
      io.to(`group:${chore.group}`).emit('chore:awaitingVerification', {
        chore: await chore.populate('createdBy currentAssignee participants'),
        completedBy: userId,
      });
    }

    logger.info(`Chore marked done: ${choreId} by user ${userId}`);
    return chore.populate('createdBy currentAssignee participants');
  }

  /**
   * Verify chore
   */
  async verifyChore(choreId: string, verifierId: string, approved: boolean): Promise<IChoreDocument> {
    const chore = await Chore.findById(choreId);
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
      assignment.verifiedBy = new mongoose.Types.ObjectId(verifierId);
      assignment.verifiedAt = new Date();

      await this.addPoints(
        chore.group.toString(),
        completedByUserId,
        chore.points,
        'earned',
        `Completed: ${chore.title}`,
        chore._id
      );

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

      const io = getIO();
      if (io) {
        io.to(`group:${chore.group}`).emit('chore:verified', {
          chore: await chore.populate('createdBy currentAssignee participants'),
          verifiedBy: verifierId,
          pointsAwarded: chore.points,
        });
      }

      logger.info(`Chore verified: ${choreId}, +${chore.points} points`);
    } else {
      assignment.status = 'disputed';

      const io = getIO();
      if (io) {
        io.to(`group:${chore.group}`).emit('chore:disputed', {
          chore: await chore.populate('createdBy currentAssignee participants'),
          disputedBy: verifierId,
        });
      }

      logger.info(`Chore disputed: ${choreId}`);
    }

    await chore.save();
    return chore.populate('createdBy currentAssignee participants');
  }

  /**
   * Skip chore
   */
  async skipChore(choreId: string, userId: string): Promise<IChoreDocument> {
    const chore = await Chore.findById(choreId);
    if (!chore) {
      throw new Error('Chore not found');
    }

    if (chore.currentAssignee?.toString() !== userId) {
      throw new Error('This chore is not assigned to you');
    }

    const assignment = chore.assignments.find(
      a => a.user.toString() === userId && a.status === 'pending'
    );
    if (assignment) {
      assignment.status = 'skipped';
      assignment.completedAt = new Date();
    }

    await this.addPoints(
      chore.group.toString(),
      userId,
      -POINTS_CONFIG.SKIP_PENALTY,
      'penalty',
      `Skipped: ${chore.title}`,
      chore._id
    );

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

    const io = getIO();
    if (io) {
      io.to(`group:${chore.group}`).emit('chore:skipped', {
        chore: await chore.populate('createdBy currentAssignee participants'),
        skippedBy: userId,
        pointsDeducted: POINTS_CONFIG.SKIP_PENALTY,
      });
    }

    logger.info(`Chore skipped: ${choreId}, -${POINTS_CONFIG.SKIP_PENALTY} points`);
    return chore.populate('createdBy currentAssignee participants');
  }

  /**
   * Transfer chore
   */
  async transferChore(
    choreId: string,
    userId: string,
    targetUserId: string
  ): Promise<{ chore: IChoreDocument; pointsSpent: number }> {
    const chore = await Chore.findById(choreId);
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

    const assignment = chore.assignments.find(
      a => a.user.toString() === userId && a.status === 'pending'
    );
    if (assignment) {
      assignment.status = 'transferred';
      assignment.completedAt = new Date();
      assignment.transferredTo = new mongoose.Types.ObjectId(targetUserId);
      assignment.transferredBy = new mongoose.Types.ObjectId(userId);
      assignment.transferCost = POINTS_CONFIG.TRANSFER_COST;
    }

    await this.addPoints(
      chore.group.toString(),
      userId,
      -POINTS_CONFIG.TRANSFER_COST,
      'spent',
      `Transfer: ${chore.title}`,
      chore._id
    );

    chore.currentAssignee = new mongoose.Types.ObjectId(targetUserId);
    chore.assignments.push({
      user: new mongoose.Types.ObjectId(targetUserId),
      assignedAt: new Date(),
      status: 'pending',
    });

    await chore.save();

    emitToUser(targetUserId, 'chore:transferred', {
      chore: await chore.populate('createdBy currentAssignee participants'),
      transferredBy: userId,
      pointsSpent: POINTS_CONFIG.TRANSFER_COST,
    });

    logger.info(`Chore transferred: ${choreId} to ${targetUserId}`);
    return {
      chore: await chore.populate('createdBy currentAssignee participants'),
      pointsSpent: POINTS_CONFIG.TRANSFER_COST,
    };
  }

  /**
   * Delete chore
   */
  async deleteChore(choreId: string, userId: string): Promise<void> {
    const chore = await Chore.findById(choreId);
    if (!chore) {
      throw new Error('Chore not found');
    }
    if (chore.createdBy.toString() !== userId) {
      throw new Error('Only the creator can delete this chore');
    }

    await Chore.findByIdAndDelete(choreId);
    logger.info(`Chore deleted: ${choreId}`);
  }

  /**
   * Get chore stats
   */
  async getChoreStats(groupId: string): Promise<{
    totalChores: number;
    completedThisWeek: number;
    pendingVerification: number;
    transferCost: number;
    skipPenalty: number;
    userStats: {
      odlpUserId: string;
      completed: number;
      skipped: number;
      transferred: number;
      points: number;
      earnedPoints: number;
      spentPoints: number;
      penaltyPoints: number;
    }[];
  }> {
    const chores = await Chore.find({ group: groupId });
    const pointsData = await this.getGroupPoints(groupId);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const userStatsMap = new Map<string, { completed: number; skipped: number; transferred: number }>();
    let completedThisWeek = 0;
    let pendingVerification = 0;

    for (const chore of chores) {
      for (const assignment of chore.assignments) {
        const odlpUserId = assignment.user.toString();
        if (!userStatsMap.has(odlpUserId)) {
          userStatsMap.set(odlpUserId, { completed: 0, skipped: 0, transferred: 0 });
        }

        if (assignment.status === 'verified') {
          userStatsMap.get(odlpUserId)!.completed++;
          if (assignment.verifiedAt && assignment.verifiedAt >= weekAgo) {
            completedThisWeek++;
          }
        } else if (assignment.status === 'skipped') {
          userStatsMap.get(odlpUserId)!.skipped++;
        } else if (assignment.status === 'transferred') {
          userStatsMap.get(odlpUserId)!.transferred++;
        } else if (assignment.status === 'done') {
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

  async getUserPoints(groupId: string, userId: string): Promise<number> {
    let userPoints = await UserPoints.findOne({ group: groupId, user: userId });

    if (!userPoints) {
      userPoints = new UserPoints({
        group: new mongoose.Types.ObjectId(groupId),
        user: new mongoose.Types.ObjectId(userId),
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

  async addPoints(
    groupId: string,
    userId: string,
    amount: number,
    type: 'earned' | 'spent' | 'penalty' | 'bonus',
    reason: string,
    relatedChoreId?: mongoose.Types.ObjectId
  ): Promise<number> {
    let userPoints = await UserPoints.findOne({ group: groupId, user: userId });

    if (!userPoints) {
      userPoints = new UserPoints({
        group: new mongoose.Types.ObjectId(groupId),
        user: new mongoose.Types.ObjectId(userId),
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
    } else if (type === 'spent' && amount < 0) {
      userPoints.spentPoints += Math.abs(amount);
    } else if (type === 'penalty' && amount < 0) {
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

  async getGroupPoints(groupId: string): Promise<{
    odlpUserId: string;
    totalPoints: number;
    earnedPoints: number;
    spentPoints: number;
    penaltyPoints: number;
  }[]> {
    const points = await UserPoints.find({ group: groupId });
    return points.map(p => ({
      odlpUserId: p.user.toString(),
      totalPoints: p.totalPoints,
      earnedPoints: p.earnedPoints,
      spentPoints: p.spentPoints,
      penaltyPoints: p.penaltyPoints,
    }));
  }

  // ==================== HELPERS ====================

  private calculateNextDueDate(frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'once'): Date {
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

export default new RoommateFeaturesServiceV2();