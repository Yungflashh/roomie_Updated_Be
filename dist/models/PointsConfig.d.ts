import mongoose, { Document } from 'mongoose';
export interface IPointsConfigDocument extends Document {
    matchRequestCost: number;
    matchRequestFreePerDay: number;
    defaultGameEntryCost: number;
    defaultGameReward: number;
    pointsPerLevel: number;
    baseLevelPoints: number;
    levelMultiplier: number;
    dailyLoginBonus: number;
    weeklyStreakBonus: number;
    profileCompletionBonus: number;
    emailVerificationBonus: number;
    phoneVerificationBonus: number;
    idVerificationBonus: number;
    firstMessageBonus: number;
    firstMatchBonus: number;
    firstGameBonus: number;
    referralBonus: number;
    referralSignupBonus: number;
    premiumMatchDiscount: number;
    premiumGameDiscount: number;
    premiumDailyBonus: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const PointsConfig: mongoose.Model<IPointsConfigDocument, {}, {}, {}, mongoose.Document<unknown, {}, IPointsConfigDocument, {}, mongoose.DefaultSchemaOptions> & IPointsConfigDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IPointsConfigDocument>;
//# sourceMappingURL=PointsConfig.d.ts.map