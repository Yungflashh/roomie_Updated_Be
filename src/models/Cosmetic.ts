import mongoose, { Schema, Document } from 'mongoose';

export type CosmeticType = 'profile_frame' | 'chat_bubble' | 'badge' | 'name_effect';
export type CosmeticRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type CosmeticCurrency = 'points' | 'money';

export interface ICosmeticDocument extends Document {
  name: string;
  description: string;
  type: CosmeticType;
  rarity: CosmeticRarity;
  icon: string; // Ionicons name
  preview: string; // preview image URL or color/gradient config
  price: number;
  currency: CosmeticCurrency;
  // Style config rendered on the client
  style: {
    borderColor?: string;
    borderWidth?: number;
    glowColor?: string;
    gradient?: string[]; // gradient colors
    animation?: 'none' | 'pulse' | 'shimmer' | 'sparkle';
    textColor?: string; // for name effects
  };
  requiredLevel?: number;
  isLimited: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const cosmeticSchema = new Schema<ICosmeticDocument>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    type: {
      type: String,
      enum: ['profile_frame', 'chat_bubble', 'badge', 'name_effect'],
      required: true,
    },
    rarity: {
      type: String,
      enum: ['common', 'rare', 'epic', 'legendary'],
      default: 'common',
    },
    icon: { type: String, required: true },
    preview: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    currency: {
      type: String,
      enum: ['points', 'money'],
      default: 'points',
    },
    style: {
      borderColor: String,
      borderWidth: Number,
      glowColor: String,
      gradient: [String],
      animation: {
        type: String,
        enum: ['none', 'pulse', 'shimmer', 'sparkle'],
        default: 'none',
      },
      textColor: String,
    },
    requiredLevel: { type: Number, default: 0 },
    isLimited: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

cosmeticSchema.index({ type: 1, isActive: 1 });
cosmeticSchema.index({ rarity: 1 });

export const Cosmetic = mongoose.model<ICosmeticDocument>('Cosmetic', cosmeticSchema);
