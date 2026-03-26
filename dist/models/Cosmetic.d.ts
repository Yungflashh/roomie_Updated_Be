import mongoose, { Document } from 'mongoose';
export type CosmeticType = 'profile_frame' | 'chat_bubble' | 'badge' | 'name_effect';
export type CosmeticRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type CosmeticCurrency = 'points' | 'money';
export interface ICosmeticDocument extends Document {
    name: string;
    description: string;
    type: CosmeticType;
    rarity: CosmeticRarity;
    icon: string;
    preview: string;
    price: number;
    currency: CosmeticCurrency;
    style: {
        borderColor?: string;
        borderWidth?: number;
        glowColor?: string;
        gradient?: string[];
        animation?: 'none' | 'pulse' | 'shimmer' | 'sparkle';
        textColor?: string;
    };
    requiredLevel?: number;
    isLimited: boolean;
    isActive: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Cosmetic: mongoose.Model<ICosmeticDocument, {}, {}, {}, mongoose.Document<unknown, {}, ICosmeticDocument, {}, mongoose.DefaultSchemaOptions> & ICosmeticDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, ICosmeticDocument>;
//# sourceMappingURL=Cosmetic.d.ts.map