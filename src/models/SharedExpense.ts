// src/models/SharedExpense.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IExpenseParticipant {
  user: mongoose.Types.ObjectId;
  share: number; // Amount this user owes
  percentage?: number; // If using percentage split
  paid: boolean;
  paidAt?: Date;
  markedPaidAt?: Date; // When user marked as paid
  verifiedBy?: mongoose.Types.ObjectId; // Who verified the payment
  verifiedAt?: Date;
  paymentStatus: 'unpaid' | 'pending_verification' | 'verified' | 'disputed';
  paymentProof?: string;
  paymentNote?: string;
}

export interface ISharedExpense {
  group: mongoose.Types.ObjectId; // RoommateGroup reference
  createdBy: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  category: 'rent' | 'utilities' | 'groceries' | 'internet' | 'cleaning' | 'furniture' | 'transport' | 'entertainment' | 'other';
  totalAmount: number;
  currency: string;
  splitType: 'equal' | 'percentage' | 'custom' | 'shares'; // shares = e.g., 2:1:1
  splitAmong: 'all' | 'selected'; // All group members or selected ones
  participants: IExpenseParticipant[];
  paidBy: mongoose.Types.ObjectId; // Who paid initially
  dueDate?: Date;
  recurring?: {
    enabled: boolean;
    frequency: 'weekly' | 'biweekly' | 'monthly' | 'yearly';
    nextDueDate?: Date;
  };
  receipt?: string;
  attachments?: string[];
  status: 'pending' | 'partial' | 'settled';
  settledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISharedExpenseDocument extends ISharedExpense, Document {}

const expenseParticipantSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  share: {
    type: Number,
    required: true,
    min: 0,
  },
  percentage: {
    type: Number,
    min: 0,
    max: 100,
  },
  paid: {
    type: Boolean,
    default: false,
  },
  paidAt: Date,
  markedPaidAt: Date,
  verifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  verifiedAt: Date,
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'pending_verification', 'verified', 'disputed'],
    default: 'unpaid',
  },
  paymentProof: String,
  paymentNote: String,
}, { _id: true });

const sharedExpenseSchema = new Schema<ISharedExpenseDocument>(
  {
    group: {
      type: Schema.Types.ObjectId,
      ref: 'RoommateGroup',
      required: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    category: {
      type: String,
      enum: ['rent', 'utilities', 'groceries', 'internet', 'cleaning', 'furniture', 'transport', 'entertainment', 'other'],
      default: 'other',
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'NGN',
    },
    splitType: {
      type: String,
      enum: ['equal', 'percentage', 'custom', 'shares'],
      default: 'equal',
    },
    splitAmong: {
      type: String,
      enum: ['all', 'selected'],
      default: 'all',
    },
    participants: [expenseParticipantSchema],
    paidBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    dueDate: Date,
    recurring: {
      enabled: { type: Boolean, default: false },
      frequency: {
        type: String,
        enum: ['weekly', 'biweekly', 'monthly', 'yearly'],
      },
      nextDueDate: Date,
    },
    receipt: String,
    attachments: [String],
    status: {
      type: String,
      enum: ['pending', 'partial', 'settled'],
      default: 'pending',
    },
    settledAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
sharedExpenseSchema.index({ group: 1, createdAt: -1 });
sharedExpenseSchema.index({ group: 1, status: 1 });
sharedExpenseSchema.index({ 'participants.user': 1 });
sharedExpenseSchema.index({ paidBy: 1 });

// Virtual for checking if fully settled
sharedExpenseSchema.virtual('isSettled').get(function() {
  return this.participants.every(p => p.paymentStatus === 'verified');
});

// Virtual for pending amount
sharedExpenseSchema.virtual('pendingAmount').get(function() {
  return this.participants
    .filter(p => p.paymentStatus !== 'verified')
    .reduce((sum, p) => sum + p.share, 0);
});

sharedExpenseSchema.set('toJSON', { virtuals: true });
sharedExpenseSchema.set('toObject', { virtuals: true });

export const SharedExpense = mongoose.model<ISharedExpenseDocument>('SharedExpense', sharedExpenseSchema);