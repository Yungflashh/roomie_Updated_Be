import mongoose, { Schema, Document } from 'mongoose';

export interface IClanMissionDocument extends Document {
  clan: mongoose.Types.ObjectId;
  title: string;
  description: string;
  target: number;
  progress: number;
  reward: number;
  type: 'points_earned' | 'games_won' | 'wars_won' | 'members_active' | 'challenges_completed';
  startDate: Date;
  endDate: Date;
  completed: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const clanMissionSchema = new Schema<IClanMissionDocument>(
  {
    clan: { type: Schema.Types.ObjectId, ref: 'Clan', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    target: { type: Number, required: true },
    progress: { type: Number, default: 0 },
    reward: { type: Number, required: true },
    type: {
      type: String,
      enum: ['points_earned', 'games_won', 'wars_won', 'members_active', 'challenges_completed'],
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

clanMissionSchema.index({ clan: 1, endDate: -1 });
clanMissionSchema.index({ clan: 1, completed: 1 });

export const ClanMission = mongoose.model<IClanMissionDocument>('ClanMission', clanMissionSchema);
