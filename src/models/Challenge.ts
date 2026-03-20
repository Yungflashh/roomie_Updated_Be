import mongoose, { Schema, Document } from 'mongoose';

export interface IChallengeDocument extends Document {
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly';
  category: string;
  icon?: string;
  startDate: Date;
  endDate: Date;
  pointsReward: number;
  cashReward?: number;
  cashCurrency?: string;
  badgeReward?: string;
  requirements: Array<{
    action: string;
    target: number;
  }>;
  participants: Array<{
    user: mongoose.Types.ObjectId;
    progress: number;
    progressByAction: Map<string, number>;
    completed: boolean;
    completedAt?: Date;
    pointsAwarded?: number;
  }>;
  tierRewards: Array<{
    tier: string;
    minRank: number;
    maxRank: number;
    points: number;
    cash?: number;
    badge?: string;
    title?: string;
  }>;
  maxParticipants?: number;
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
}

const challengeSchema = new Schema<IChallengeDocument>(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['social', 'matching', 'events', 'games', 'chores', 'listings', 'general'],
      default: 'general',
    },
    icon: String,
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },
    pointsReward: {
      type: Number,
      required: true,
      min: 0,
    },
    cashReward: { type: Number, default: 0 },
    cashCurrency: { type: String, default: 'NGN' },
    badgeReward: String,
    requirements: [{
      action: {
        type: String,
        required: true,
      },
      target: {
        type: Number,
        required: true,
        min: 1,
      },
    }],
    participants: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      progress: {
        type: Number,
        default: 0,
        min: 0,
      },
      progressByAction: {
        type: Map,
        of: Number,
        default: {},
      },
      completed: {
        type: Boolean,
        default: false,
      },
      completedAt: Date,
      pointsAwarded: { type: Number, default: 0 },
    }],
    tierRewards: [{
      tier: { type: String, required: true },
      minRank: { type: Number, required: true },
      maxRank: { type: Number, required: true },
      points: { type: Number, default: 0 },
      cash: { type: Number, default: 0 },
      badge: String,
      title: String,
    }],
    maxParticipants: Number,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
challengeSchema.index({ type: 1, isActive: 1 });
challengeSchema.index({ startDate: 1, endDate: 1 });
challengeSchema.index({ 'participants.user': 1 });

export const Challenge = mongoose.model<IChallengeDocument>('Challenge', challengeSchema);
