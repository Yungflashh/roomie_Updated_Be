"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameSession = exports.Game = void 0;
// src/models/Game.ts
const mongoose_1 = __importStar(require("mongoose"));
const gameSchema = new mongoose_1.Schema({
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
}, {
    timestamps: true,
});
const gameSessionSchema = new mongoose_1.Schema({
    game: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Game',
        required: true,
        index: true,
    },
    match: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Match',
        index: true,
    },
    players: [{
            user: {
                type: mongoose_1.Schema.Types.ObjectId,
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    invitedUser: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    winner: {
        type: mongoose_1.Schema.Types.ObjectId,
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
}, {
    timestamps: true,
});
// Indexes
gameSessionSchema.index({ 'players.user': 1 });
gameSessionSchema.index({ game: 1, status: 1 });
gameSessionSchema.index({ match: 1, status: 1 });
gameSessionSchema.index({ invitedUser: 1, status: 1 });
gameSessionSchema.index({ startedAt: -1 });
exports.Game = mongoose_1.default.model('Game', gameSchema);
exports.GameSession = mongoose_1.default.model('GameSession', gameSessionSchema);
//# sourceMappingURL=Game.js.map