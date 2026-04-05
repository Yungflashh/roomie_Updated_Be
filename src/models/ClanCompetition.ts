import mongoose, { Schema, Document } from 'mongoose';

export interface IClanCompetitorEntry {
  clan: mongoose.Types.ObjectId;
  totalPoints: number;
  gamesPlayed: number;
  studySessions: number;
  memberContributions: Array<{
    user: mongoose.Types.ObjectId;
    points: number;
    gamesWon: number;
    studyWon: number;
  }>;
  rank?: number;
  prizeAmount?: number;
}

export interface IClanCompetitionDocument extends Document {
  month: string; // YYYY-MM
  status: 'registration' | 'active' | 'completed' | 'cancelled';
  competitors: IClanCompetitorEntry[];
  prizeTier: number; // 30000, 50000, or 100000
  prizeDistributed: boolean;
  minMembers: number;
  minClans: number;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const memberContributionSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  points: { type: Number, default: 0 },
  gamesWon: { type: Number, default: 0 },
  studyWon: { type: Number, default: 0 },
}, { _id: false });

const competitorSchema = new Schema({
  clan: { type: Schema.Types.ObjectId, ref: 'Clan', required: true },
  totalPoints: { type: Number, default: 0 },
  gamesPlayed: { type: Number, default: 0 },
  studySessions: { type: Number, default: 0 },
  memberContributions: [memberContributionSchema],
  rank: { type: Number },
  prizeAmount: { type: Number, default: 0 },
}, { _id: false });

const clanCompetitionSchema = new Schema<IClanCompetitionDocument>({
  month: { type: String, required: true, unique: true }, // YYYY-MM
  status: { type: String, enum: ['registration', 'active', 'completed', 'cancelled'], default: 'registration' },
  competitors: [competitorSchema],
  prizeTier: { type: Number, default: 50000 },
  prizeDistributed: { type: Boolean, default: false },
  minMembers: { type: Number, default: 10 },
  minClans: { type: Number, default: 5 },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
}, { timestamps: true });

clanCompetitionSchema.index({ month: 1 }, { unique: true });
clanCompetitionSchema.index({ status: 1 });

export const ClanCompetition = mongoose.model<IClanCompetitionDocument>('ClanCompetition', clanCompetitionSchema);
