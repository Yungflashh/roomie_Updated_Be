// src/models/Game.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IGameDocument extends Document {
  name: string;
  description: string;
  category: string;
  thumbnail: string;
  minPlayers: number;
  maxPlayers: number;
  difficulty: 'easy' | 'medium' | 'hard';
  pointsReward: number;
  isActive: boolean;
}

const gameSchema = new Schema<IGameDocument>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
      required: true,
    },
    minPlayers: {
      type: Number,
      default: 1,
      min: 1,
    },
    maxPlayers: {
      type: Number,
      default: 2,
      min: 1,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'easy',
    },
    pointsReward: {
      type: Number,
      default: 10,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Game Session with invitation support
export interface IGameSessionPlayer {
  user: mongoose.Types.ObjectId;
  score: number;
  rank: number;
  isReady?: boolean;
  completedAt?: Date;
  answers?: Array<{
    questionIndex: number;
    answer: string;
    correct: boolean;
    timeSpent: number;
  }>;
}

export interface IGameSessionDocument extends Document {
  game: mongoose.Types.ObjectId;
  match?: mongoose.Types.ObjectId;
  players: IGameSessionPlayer[];
  invitedBy?: mongoose.Types.ObjectId;
  invitedUser?: mongoose.Types.ObjectId;
  winner?: mongoose.Types.ObjectId;
  startedAt?: Date;
  endedAt?: Date;
  expiresAt?: Date;
  status: 'pending' | 'waiting' | 'active' | 'completed' | 'cancelled' | 'declined' | 'expired';
  gameData?: {
    questions?: Array<{
      question: string;
      options: string[];
      correctAnswer: string;
      category?: string;
    }>;
    words?: Array<{
      scrambled: string;
      hint: string;
      answer: string;
    }>;
    challenges?: Array<{
      emojis: string;
      answer: string;
      hint: string;
    }>;
    cards?: Array<{
      id: number;
      emoji: string;
      flipped: boolean;
      matched: boolean;
    }>;
    currentRound?: number;
    totalRounds?: number;
    timeLimit?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const gameSessionSchema = new Schema<IGameSessionDocument>(
  {
    game: {
      type: Schema.Types.ObjectId,
      ref: 'Game',
      required: true,
      index: true,
    },
    match: {
      type: Schema.Types.ObjectId,
      ref: 'Match',
      index: true,
    },
    players: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      score: {
        type: Number,
        default: 0,
      },
      rank: {
        type: Number,
        default: 0,
      },
      isReady: {
        type: Boolean,
        default: false,
      },
      completedAt: Date,
      answers: [{
        questionIndex: Number,
        answer: String,
        correct: Boolean,
        timeSpent: Number,
      }],
    }],
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    invitedUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    winner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    startedAt: {
      type: Date,
    },
    endedAt: Date,
    expiresAt: Date,
    status: {
      type: String,
      enum: ['pending', 'waiting', 'active', 'completed', 'cancelled', 'declined', 'expired'],
      default: 'waiting',
      index: true,
    },
    gameData: {
      questions: [{
        question: String,
        options: [String],
        correctAnswer: String,
        category: String,
      }],
      words: [{
        scrambled: String,
        hint: String,
        answer: String,
      }],
      challenges: [{
        emojis: String,
        answer: String,
        hint: String,
      }],
      cards: [{
        id: Number,
        emoji: String,
        flipped: Boolean,
        matched: Boolean,
      }],
      currentRound: Number,
      totalRounds: Number,
      timeLimit: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
gameSessionSchema.index({ 'players.user': 1 });
gameSessionSchema.index({ game: 1, status: 1 });
gameSessionSchema.index({ match: 1, status: 1 });
gameSessionSchema.index({ invitedUser: 1, status: 1 });
gameSessionSchema.index({ startedAt: -1 });

export const Game = mongoose.model<IGameDocument>('Game', gameSchema);
export const GameSession = mongoose.model<IGameSessionDocument>('GameSession', gameSessionSchema);