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
  pointsCost: number;
  levelRequired: number;
  isActive: boolean;
  playCount: number;
  createdAt: Date;
  updatedAt: Date;
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
    pointsCost: {
      type: Number,
      default: 5,
      min: 0,
      required: true,
    },
    levelRequired: {
      type: Number,
      default: 1,
      min: 1,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    playCount: {
      type: Number,
      default: 0,
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
  pointsEarned?: number;
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
  pointsCost: number;
  pointsAwarded: number;
  gameData?: {
    // Trivia / Speed Math / Geography Quiz
    questions?: Array<{
      question: string;
      options: string[];
      correctAnswer: string;
      category?: string;
      flag?: string; // For Geography Quiz
    }>;
    // Word Scramble
    words?: Array<{
      scrambled: string;
      hint: string;
      answer: string;
    }>;
    // Emoji Guess
    challenges?: Array<{
      emojis: string;
      answer: string;
      hint: string;
    }>;
    // Memory Match
    cards?: Array<{
      id: number;
      emoji: string;
      flipped?: boolean;
      matched?: boolean;
    }>;
    // Logic Master
    puzzles?: Array<{
      puzzle: string;
      options: string[];
      correctAnswer: string;
      explanation: string;
    }>;
    // Pattern Master
    patterns?: Array<{
      pattern: string[];
      options: string[];
      correctAnswer: string;
      type: string;
    }>;
    // Color Challenge
    colorChallenges?: Array<{
      colorName: string;
      displayColor: string;
      correctAnswer: string;
    }>;
    colorOptions?: string[];
    // Quick Draw
    drawingPrompts?: Array<{
      prompt: string;
      category: string;
      difficulty: string;
    }>;
    // Common fields
    currentRound?: number;
    totalRounds?: number;
    totalPairs?: number;
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
      pointsEarned: {
        type: Number,
        default: 0,
      },
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
    pointsCost: {
      type: Number,
      default: 0,
    },
    pointsAwarded: {
      type: Number,
      default: 0,
    },
    gameData: {
      // Trivia / Speed Math / Geography Quiz
      questions: [{
        question: String,
        options: [String],
        correctAnswer: String,
        category: String,
        flag: String,
      }],
      // Word Scramble
      words: [{
        scrambled: String,
        hint: String,
        answer: String,
      }],
      // Emoji Guess
      challenges: [{
        emojis: String,
        answer: String,
        hint: String,
      }],
      // Memory Match
      cards: [{
        id: Number,
        emoji: String,
        flipped: Boolean,
        matched: Boolean,
      }],
      // Logic Master
      puzzles: [{
        puzzle: String,
        options: [String],
        correctAnswer: String,
        explanation: String,
      }],
      // Pattern Master
      patterns: [{
        pattern: [String],
        options: [String],
        correctAnswer: String,
        type: String,
      }],
      // Color Challenge
      colorChallenges: [{
        colorName: String,
        displayColor: String,
        correctAnswer: String,
      }],
      colorOptions: [String],
      // Quick Draw
      drawingPrompts: [{
        prompt: String,
        category: String,
        difficulty: String,
      }],
      // Common fields
      currentRound: Number,
      totalRounds: Number,
      totalPairs: Number,
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