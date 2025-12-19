import mongoose from 'mongoose';
import { ISharedExpenseDocument } from '../models/SharedExpense';
import { IChoreDocument } from '../models/Chore';
declare class RoommateFeaturesServiceV2 {
    /**
     * Create a new shared expense with flexible splitting
     */
    createExpense(groupId: string, userId: string, data: {
        title: string;
        description?: string;
        category: string;
        totalAmount: number;
        currency?: string;
        splitType: 'equal' | 'percentage' | 'custom' | 'shares';
        splitAmong: 'all' | 'selected';
        selectedMembers?: string[];
        participantShares?: {
            userId: string;
            share?: number;
            percentage?: number;
        }[];
        paidBy: string;
        dueDate?: Date;
        recurring?: {
            enabled: boolean;
            frequency: string;
        };
        receipt?: string;
    }): Promise<ISharedExpenseDocument>;
    /**
     * Get expenses for a group
     */
    getExpenses(groupId: string, status?: string): Promise<ISharedExpenseDocument[]>;
    /**
     * Mark expense as paid
     */
    markExpensePaid(expenseId: string, userId: string, paymentProof?: string, paymentNote?: string): Promise<ISharedExpenseDocument>;
    /**
     * Verify a payment
     */
    verifyExpensePayment(expenseId: string, verifierId: string, participantId: string, approved: boolean): Promise<ISharedExpenseDocument>;
    /**
     * Delete expense
     */
    deleteExpense(expenseId: string, userId: string): Promise<void>;
    /**
     * Get expense summary
     */
    getExpenseSummary(groupId: string): Promise<{
        totalExpenses: number;
        pendingAmount: number;
        settledAmount: number;
        balances: {
            userId: string;
            owes: number;
            owed: number;
            net: number;
        }[];
    }>;
    /**
     * Create a chore
     */
    createChore(groupId: string, userId: string, data: {
        title: string;
        description?: string;
        icon?: string;
        category: string;
        frequency: string;
        rotationType: 'rotate' | 'fixed' | 'volunteer' | 'random';
        assignTo: 'all' | 'selected';
        selectedMembers?: string[];
        points?: number;
    }): Promise<IChoreDocument>;
    /**
     * Get chores
     */
    getChores(groupId: string, includeInactive?: boolean): Promise<IChoreDocument[]>;
    /**
     * Complete chore
     */
    completeChore(choreId: string, userId: string, proofImage?: string, notes?: string): Promise<IChoreDocument>;
    /**
     * Verify chore
     */
    verifyChore(choreId: string, verifierId: string, approved: boolean): Promise<IChoreDocument>;
    /**
     * Skip chore
     */
    skipChore(choreId: string, userId: string): Promise<IChoreDocument>;
    /**
     * Transfer chore
     */
    transferChore(choreId: string, userId: string, targetUserId: string): Promise<{
        chore: IChoreDocument;
        pointsSpent: number;
    }>;
    /**
     * Delete chore
     */
    deleteChore(choreId: string, userId: string): Promise<void>;
    /**
     * Get chore stats
     */
    getChoreStats(groupId: string): Promise<{
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
    }>;
    getUserPoints(groupId: string, userId: string): Promise<number>;
    addPoints(groupId: string, userId: string, amount: number, type: 'earned' | 'spent' | 'penalty' | 'bonus', reason: string, relatedChoreId?: mongoose.Types.ObjectId): Promise<number>;
    getGroupPoints(groupId: string): Promise<{
        odlpUserId: string;
        totalPoints: number;
        earnedPoints: number;
        spentPoints: number;
        penaltyPoints: number;
    }[]>;
    private calculateNextDueDate;
}
declare const _default: RoommateFeaturesServiceV2;
export default _default;
//# sourceMappingURL=roommateFeatures.service.d.ts.map