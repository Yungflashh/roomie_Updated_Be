import mongoose, { Document } from 'mongoose';
export interface IChallengeDocument extends Document {
    title: string;
    description: string;
    type: 'daily' | 'weekly' | 'monthly';
    category: string;
    icon?: string;
    startDate: Date;
    endDate: Date;
    pointsReward: number;
    cashReward?: number;
    cashCurrency?: string;
    badgeReward?: string;
    requirements: Array<{
        action: string;
        target: number;
    }>;
    participants: Array<{
        user: mongoose.Types.ObjectId;
        progress: number;
        progressByAction: Map<string, number>;
        completed: boolean;
        completedAt?: Date;
        pointsAwarded?: number;
    }>;
    tierRewards: Array<{
        tier: string;
        minRank: number;
        maxRank: number;
        points: number;
        cash?: number;
        badge?: string;
        title?: string;
    }>;
    maxParticipants?: number;
    isActive: boolean;
    createdBy?: mongoose.Types.ObjectId;
}
export declare const Challenge: mongoose.Model<IChallengeDocument, {}, {}, {}, mongoose.Document<unknown, {}, IChallengeDocument, {}, mongoose.DefaultSchemaOptions> & IChallengeDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IChallengeDocument>;
//# sourceMappingURL=Challenge.d.ts.map