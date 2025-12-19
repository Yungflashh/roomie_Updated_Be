import mongoose, { Schema, Document } from 'mongoose';

export interface IChallengeDocument extends Document {
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  pointsReward: number;
  badgeReward?: string;
  requirements: Array<{
    action: string;
    target: number;
  }>;
  participants: Array<{
    user: mongoose.Types.ObjectId;
    progress: number;
    completed: boolean;
    completedAt?: Date;
  }>;
  isActive: boolean;
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
      completed: {
        type: Boolean,
        default: false,
      },
      completedAt: Date,
    }],
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
