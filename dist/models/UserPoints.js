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
exports.UserPoints = void 0;
// src/models/UserPoints.ts
const mongoose_1 = __importStar(require("mongoose"));
const pointTransactionSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: ['earned', 'spent', 'penalty', 'bonus', 'transfer_received'],
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    reason: {
        type: String,
        required: true,
    },
    relatedChore: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Chore',
    },
    relatedExpense: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'SharedExpense',
    },
    fromUser: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    toUser: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, { _id: true });
const userPointsSchema = new mongoose_1.Schema({
    group: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'RoommateGroup',
        required: true,
    },
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    totalPoints: {
        type: Number,
        default: 0,
    },
    earnedPoints: {
        type: Number,
        default: 0,
    },
    spentPoints: {
        type: Number,
        default: 0,
    },
    penaltyPoints: {
        type: Number,
        default: 0,
    },
    transactions: [pointTransactionSchema],
}, {
    timestamps: true,
});
// Compound index for unique user per group
userPointsSchema.index({ group: 1, user: 1 }, { unique: true });
userPointsSchema.index({ group: 1, totalPoints: -1 }); // For leaderboard
userPointsSchema.set('toJSON', { virtuals: true });
userPointsSchema.set('toObject', { virtuals: true });
exports.UserPoints = mongoose_1.default.model('UserPoints', userPointsSchema);
//# sourceMappingURL=UserPoints.js.map