import mongoose, { Document } from 'mongoose';
export interface IChallengeDocument extends Document {
    title: string;
    description: string;
    type: 'daily' | 'weekly' | 'monthly';
    startDate: Date;
    endDate: Date;
    pointsReward: number;
    badgeReward?: string;
    requirements: Array<{
        action: string;
        target: number;
    }>;
    participants: Array<{
        user: mongoose.Types.ObjectId;
        progress: number;
        completed: boolean;
        completedAt?: Date;
    }>;
    isActive: boolean;
}
export declare const Challenge: mongoose.Model<IChallengeDocument, {}, {}, {}, mongoose.Document<unknown, {}, IChallengeDocument, {}, mongoose.DefaultSchemaOptions> & IChallengeDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IChallengeDocument>;
//# sourceMappingURL=Challenge.d.ts.map