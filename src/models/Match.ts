import mongoose, { Schema, Document } from 'mongoose';

export interface IMatchDocument extends Document {
  user1: mongoose.Types.ObjectId;
  user2: mongoose.Types.ObjectId;
  compatibilityScore: number;
  matchedAt: Date;
  status: 'active' | 'expired' | 'blocked';
  lastMessageAt?: Date;
  unreadCount: {
    user1: number;
    user2: number;
  };
}

const matchSchema = new Schema<IMatchDocument>(
  {
    user1: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    user2: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    compatibilityScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    matchedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'blocked'],
      default: 'active',
      index: true,
    },
    lastMessageAt: Date,
    unreadCount: {
      user1: {
        type: Number,
        default: 0,
      },
      user2: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
matchSchema.index({ user1: 1, user2: 1 }, { unique: true });
matchSchema.index({ user1: 1, status: 1 });
matchSchema.index({ user2: 1, status: 1 });
matchSchema.index({ matchedAt: -1 });

export const Match = mongoose.model<IMatchDocument>('Match', matchSchema);
