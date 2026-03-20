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
exports.Challenge = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const challengeSchema = new mongoose_1.Schema({
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
    category: {
        type: String,
        enum: ['social', 'matching', 'events', 'games', 'chores', 'listings', 'general'],
        default: 'general',
    },
    icon: String,
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
    cashReward: { type: Number, default: 0 },
    cashCurrency: { type: String, default: 'NGN' },
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
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User',
                required: true,
            },
            progress: {
                type: Number,
                default: 0,
                min: 0,
            },
            progressByAction: {
                type: Map,
                of: Number,
                default: {},
            },
            completed: {
                type: Boolean,
                default: false,
            },
            completedAt: Date,
            pointsAwarded: { type: Number, default: 0 },
        }],
    tierRewards: [{
            tier: { type: String, required: true },
            minRank: { type: Number, required: true },
            maxRank: { type: Number, required: true },
            points: { type: Number, default: 0 },
            cash: { type: Number, default: 0 },
            badge: String,
            title: String,
        }],
    maxParticipants: Number,
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },
}, {
    timestamps: true,
});
// Indexes
challengeSchema.index({ type: 1, isActive: 1 });
challengeSchema.index({ startDate: 1, endDate: 1 });
challengeSchema.index({ 'participants.user': 1 });
exports.Challenge = mongoose_1.default.model('Challenge', challengeSchema);
//# sourceMappingURL=Challenge.js.map