import mongoose, { Schema, Document } from 'mongoose';

// ─── Clan ────────────────────────────────────────────────────────────────────

export interface IClanMember {
  user: mongoose.Types.ObjectId;
  role: 'leader' | 'co-leader' | 'member';
  joinedAt: Date;
  pointsContributed: number;
  weeklyContribution?: number;
}

export interface IClanActivityLog {
  type: string;
  userId: mongoose.Types.ObjectId;
  message: string;
  points?: number;
  createdAt: Date;
}

export interface IClanStreak {
  current: number;
  best: number;
  lastActiveDate: Date;
}

export interface IClanPurchasedUpgrade {
  itemId: string;
  purchasedAt: Date;
  expiresAt?: Date;
}

export interface IClanDocument extends Document {
  name: string;
  tag: string;
  description: string;
  emoji: string;
  color: string;
  leader: mongoose.Types.ObjectId;
  coLeaders: mongoose.Types.ObjectId[];
  members: IClanMember[];
  totalPoints: number;
  weeklyPoints: number;
  monthlyPoints: number;
  warsWon: number;
  warsLost: number;
  warsTied: number;
  level: number;
  maxMembers: number;
  isOpen: boolean;
  inviteCode: string;
  badges: string[];
  activityLog: IClanActivityLog[];
  treasury: number;
  streak: IClanStreak;
  chatMatchId: string;
  activePerks: string[];
  purchasedUpgrades: IClanPurchasedUpgrade[];
  announcement: string;
  achievements: string[];
  season: { number: number; points: number };
  createdAt: Date;
  updatedAt: Date;
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const clanMemberSchema = new Schema<IClanMember>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['leader', 'co-leader', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
    pointsContributed: { type: Number, default: 0 },
    weeklyContribution: { type: Number, default: 0 },
  },
  { _id: false }
);

const clanSchema = new Schema<IClanDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 30 },
    tag: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 6,
      match: /^[A-Z0-9]{3,6}$/,
    },
    description: { type: String, default: '', maxlength: 300 },
    emoji: { type: String, default: '🏠' },
    color: { type: String, default: '#6C63FF', match: /^#[0-9A-Fa-f]{6}$/ },
    leader: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    coLeaders: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    members: [clanMemberSchema],
    totalPoints: { type: Number, default: 0 },
    weeklyPoints: { type: Number, default: 0 },
    monthlyPoints: { type: Number, default: 0 },
    warsWon: { type: Number, default: 0 },
    warsLost: { type: Number, default: 0 },
    warsTied: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    maxMembers: { type: Number, default: 10 },
    isOpen: { type: Boolean, default: true },
    inviteCode: { type: String, unique: true, default: generateInviteCode },
    badges: [{ type: String }],
    activityLog: [
      {
        type: { type: String, required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        message: { type: String, required: true },
        points: { type: Number, default: 0 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    treasury: { type: Number, default: 0 },
    streak: {
      current: { type: Number, default: 0 },
      best: { type: Number, default: 0 },
      lastActiveDate: { type: Date },
    },
    chatMatchId: { type: String, unique: true, sparse: true },
    announcement: { type: String, default: '', maxlength: 500 },
    achievements: [{ type: String }],
    season: {
      number: { type: Number, default: 1 },
      points: { type: Number, default: 0 },
    },
    activePerks: [{ type: String }],
    purchasedUpgrades: [
      {
        itemId: { type: String, required: true },
        purchasedAt: { type: Date, default: Date.now },
        expiresAt: { type: Date },
      },
    ],
  },
  { timestamps: true }
);

clanSchema.index({ name: 1 });
clanSchema.index({ tag: 1 }, { unique: true });
clanSchema.index({ inviteCode: 1 }, { unique: true });
clanSchema.index({ leader: 1 });
clanSchema.index({ 'members.user': 1 });
clanSchema.index({ totalPoints: -1 });
clanSchema.index({ weeklyPoints: -1 });
clanSchema.index({ monthlyPoints: -1 });
clanSchema.index({ level: -1 });

// ─── Clan War ────────────────────────────────────────────────────────────────

export interface IClanWarMatch {
  challengerPlayer: mongoose.Types.ObjectId;
  defenderPlayer: mongoose.Types.ObjectId;
  gameType: string;
  challengerScore: number;
  defenderScore: number;
  winner: 'challenger' | 'defender' | 'tie' | null;
  status: 'pending' | 'playing' | 'completed';
  completedAt?: Date;
}

export interface IClanWarDocument extends Document {
  challenger: mongoose.Types.ObjectId;
  defender: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'declined' | 'expired';
  warType: 'games' | 'study' | 'mixed';
  matches: IClanWarMatch[];
  challengerScore: number;
  defenderScore: number;
  winner: 'challenger' | 'defender' | 'tie' | null;
  pointsStake: number;
  startedAt?: Date;
  expiresAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const clanWarMatchSchema = new Schema<IClanWarMatch>(
  {
    challengerPlayer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    defenderPlayer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    gameType: { type: String, required: true },
    challengerScore: { type: Number, default: 0 },
    defenderScore: { type: Number, default: 0 },
    winner: { type: String, enum: ['challenger', 'defender', 'tie', null], default: null },
    status: { type: String, enum: ['pending', 'playing', 'completed'], default: 'pending' },
    completedAt: { type: Date },
  },
  { _id: false }
);

const clanWarSchema = new Schema<IClanWarDocument>(
  {
    challenger: { type: Schema.Types.ObjectId, ref: 'Clan', required: true },
    defender: { type: Schema.Types.ObjectId, ref: 'Clan', required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'in_progress', 'completed', 'declined', 'expired'],
      default: 'pending',
    },
    warType: { type: String, enum: ['games', 'study', 'mixed'], default: 'games' },
    matches: [clanWarMatchSchema],
    challengerScore: { type: Number, default: 0 },
    defenderScore: { type: Number, default: 0 },
    winner: { type: String, enum: ['challenger', 'defender', 'tie', null], default: null },
    pointsStake: { type: Number, default: 0 },
    startedAt: { type: Date },
    expiresAt: { type: Date, required: true },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

clanWarSchema.index({ challenger: 1, status: 1 });
clanWarSchema.index({ defender: 1, status: 1 });
clanWarSchema.index({ status: 1 });
clanWarSchema.index({ expiresAt: 1 });

export const Clan = mongoose.model<IClanDocument>('Clan', clanSchema);
export const ClanWar = mongoose.model<IClanWarDocument>('ClanWar', clanWarSchema);
