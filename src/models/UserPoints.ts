// src/models/UserPoints.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IPointTransaction {
  type: 'earned' | 'spent' | 'penalty' | 'bonus' | 'transfer_received';
  amount: number;
  reason: string;
  relatedChore?: mongoose.Types.ObjectId;
  relatedExpense?: mongoose.Types.ObjectId;
  fromUser?: mongoose.Types.ObjectId; // For transfers
  toUser?: mongoose.Types.ObjectId; // For transfers
  createdAt: Date;
}

export interface IUserPoints {
  group: mongoose.Types.ObjectId; // RoommateGroup reference
  user: mongoose.Types.ObjectId;
  totalPoints: number;
  earnedPoints: number;
  spentPoints: number;
  penaltyPoints: number;
  transactions: IPointTransaction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserPointsDocument extends IUserPoints, Document {}

const pointTransactionSchema = new Schema({
  type: {
    type: String,
    enum: ['earned', 'spent', 'penalty', 'bonus', 'transfer_received'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  relatedChore: {
    type: Schema.Types.ObjectId,
    ref: 'Chore',
  },
  relatedExpense: {
    type: Schema.Types.ObjectId,
    ref: 'SharedExpense',
  },
  fromUser: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  toUser: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: true });

const userPointsSchema = new Schema<IUserPointsDocument>(
  {
    group: {
      type: Schema.Types.ObjectId,
      ref: 'RoommateGroup',
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    totalPoints: {
      type: Number,
      default: 0,
    },
    earnedPoints: {
      type: Number,
      default: 0,
    },
    spentPoints: {
      type: Number,
      default: 0,
    },
    penaltyPoints: {
      type: Number,
      default: 0,
    },
    transactions: [pointTransactionSchema],
  },
  {
    timestamps: true,
  }
);

// Compound index for unique user per group
userPointsSchema.index({ group: 1, user: 1 }, { unique: true });
userPointsSchema.index({ group: 1, totalPoints: -1 }); // For leaderboard

userPointsSchema.set('toJSON', { virtuals: true });
userPointsSchema.set('toObject', { virtuals: true });

export const UserPoints = mongoose.model<IUserPointsDocument>('UserPoints', userPointsSchema);