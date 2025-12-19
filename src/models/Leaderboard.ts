import mongoose, { Schema, Document } from 'mongoose';

export interface ILeaderboardDocument extends Document {
  type: 'daily' | 'weekly' | 'monthly' | 'all-time';
  period: string; // e.g., "2024-W01", "2024-01", "2024-01-15"
  entries: Array<{
    user: mongoose.Types.ObjectId;
    points: number;
    rank: number;
    change?: number; // change from previous period
  }>;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

const leaderboardSchema = new Schema<ILeaderboardDocument>(
  {
    type: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'all-time'],
      required: true,
      index: true,
    },
    period: {
      type: String,
      required: true,
      index: true,
    },
    entries: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      points: {
        type: Number,
        required: true,
        default: 0,
      },
      rank: {
        type: Number,
        required: true,
      },
      change: Number,
    }],
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
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

// Compound indexes
leaderboardSchema.index({ type: 1, period: 1 }, { unique: true });
leaderboardSchema.index({ type: 1, isActive: 1 });
leaderboardSchema.index({ 'entries.user': 1 });

export const Leaderboard = mongoose.model<ILeaderboardDocument>('Leaderboard', leaderboardSchema);
