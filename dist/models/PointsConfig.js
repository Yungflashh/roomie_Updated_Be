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
exports.PointsConfig = void 0;
// src/models/PointsConfig.ts
const mongoose_1 = __importStar(require("mongoose"));
const pointsConfigSchema = new mongoose_1.Schema({
    // Match costs
    matchRequestCost: {
        type: Number,
        default: 10,
        min: 0,
    },
    matchRequestFreePerDay: {
        type: Number,
        default: 5,
        min: 0,
    },
    // Game defaults
    defaultGameEntryCost: {
        type: Number,
        default: 5,
        min: 0,
    },
    defaultGameReward: {
        type: Number,
        default: 10,
        min: 0,
    },
    // Leveling
    pointsPerLevel: {
        type: Number,
        default: 100,
    },
    baseLevelPoints: {
        type: Number,
        default: 0,
    },
    levelMultiplier: {
        type: Number,
        default: 1.5,
    },
    // Daily/Weekly
    dailyLoginBonus: {
        type: Number,
        default: 10,
    },
    weeklyStreakBonus: {
        type: Number,
        default: 50,
    },
    // Activity bonuses
    profileCompletionBonus: {
        type: Number,
        default: 50,
    },
    emailVerificationBonus: {
        type: Number,
        default: 20,
    },
    phoneVerificationBonus: {
        type: Number,
        default: 20,
    },
    idVerificationBonus: {
        type: Number,
        default: 100,
    },
    firstMessageBonus: {
        type: Number,
        default: 5,
    },
    firstMatchBonus: {
        type: Number,
        default: 25,
    },
    firstGameBonus: {
        type: Number,
        default: 15,
    },
    // Premium benefits
    premiumMatchDiscount: {
        type: Number,
        default: 50, // 50% discount
        min: 0,
        max: 100,
    },
    premiumGameDiscount: {
        type: Number,
        default: 30, // 30% discount
        min: 0,
        max: 100,
    },
    premiumDailyBonus: {
        type: Number,
        default: 20,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});
// Ensure only one active config at a time
pointsConfigSchema.index({ isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } });
exports.PointsConfig = mongoose_1.default.model('PointsConfig', pointsConfigSchema);
//# sourceMappingURL=PointsConfig.js.map