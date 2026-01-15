// src/models/PointTransaction.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IPointTransactionDocument extends Document {
  user: mongoose.Types.ObjectId;
  type: 
    | 'earned' 
    | 'spent' 
    | 'bonus' 
    | 'penalty' 
    | 'refund' 
    | 'daily_login' 
    | 'weekly_streak' 
    | 'level_up'
    | 'verification'
    | 'game_entry'
    | 'game_reward'
    | 'match_request'
    | 'achievement';
  amount: number; // Positive for earned, negative for spent
  balance: number; // User's balance after this transaction
  reason: string;
  metadata?: {
    gameId?: mongoose.Types.ObjectId;
    gameName?: string;
    sessionId?: mongoose.Types.ObjectId;
    matchId?: mongoose.Types.ObjectId;
    targetUserId?: mongoose.Types.ObjectId;
    achievementId?: string;
    verifyType?: 'email' | 'phone' | 'id';
    oldLevel?: number;
    newLevel?: number;
    [key: string]: any;
  };
  createdAt: Date;
}

const pointTransactionSchema = new Schema<IPointTransactionDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'earned',
        'spent',
        'bonus',
        'penalty',
        'refund',
        'daily_login',
        'weekly_streak',
        'level_up',
        'verification',
        'game_entry',
        'game_reward',
        'match_request',
        'achievement',
      ],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    balance: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
pointTransactionSchema.index({ user: 1, createdAt: -1 });
pointTransactionSchema.index({ user: 1, type: 1 });
pointTransactionSchema.index({ createdAt: -1 });
pointTransactionSchema.index({ 'metadata.gameId': 1 });
pointTransactionSchema.index({ 'metadata.sessionId': 1 });

export const PointTransaction = mongoose.model<IPointTransactionDocument>(
  'PointTransaction',
  pointTransactionSchema
);