// src/models/PointsConfig.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IPointsConfigDocument extends Document {
  // Match-related costs
  matchRequestCost: number; // Points required to send a match request
  matchRequestFreePerDay: number; // Free match requests per day
  
  // Game-related (default values, can be overridden per game)
  defaultGameEntryCost: number;
  defaultGameReward: number;
  
  // Level-related
  pointsPerLevel: number; // Points needed to level up
  baseLevelPoints: number; // Base points for level 1
  levelMultiplier: number; // Multiplier for each level
  
  // Daily/Weekly rewards
  dailyLoginBonus: number;
  weeklyStreakBonus: number;
  
  // Activity bonuses
  profileCompletionBonus: number;
  emailVerificationBonus: number;
  phoneVerificationBonus: number;
  idVerificationBonus: number;
  firstMessageBonus: number;
  firstMatchBonus: number;
  firstGameBonus: number;
  
  // Premium benefits
  premiumMatchDiscount: number; // Percentage discount on match costs
  premiumGameDiscount: number; // Percentage discount on game costs
  premiumDailyBonus: number; // Extra daily bonus for premium users
  
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const pointsConfigSchema = new Schema<IPointsConfigDocument>(
  {
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
  },
  {
    timestamps: true,
  }
);

// Ensure only one active config at a time
pointsConfigSchema.index({ isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

export const PointsConfig = mongoose.model<IPointsConfigDocument>('PointsConfig', pointsConfigSchema);