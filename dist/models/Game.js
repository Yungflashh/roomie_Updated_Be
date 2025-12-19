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
    isActive: {
        type: Boolean,
        default: true,
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
        }],
    winner: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    startedAt: {
        type: Date,
        default: Date.now,
    },
    endedAt: Date,
    status: {
        type: String,
        enum: ['waiting', 'active', 'completed', 'cancelled'],
        default: 'waiting',
        index: true,
    },
}, {
    timestamps: true,
});
// Indexes
gameSessionSchema.index({ 'players.user': 1 });
gameSessionSchema.index({ game: 1, status: 1 });
gameSessionSchema.index({ startedAt: -1 });
exports.Game = mongoose_1.default.model('Game', gameSchema);
exports.GameSession = mongoose_1.default.model('GameSession', gameSessionSchema);
//# sourceMappingURL=Game.js.map