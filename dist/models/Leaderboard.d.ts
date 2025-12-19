import mongoose, { Document } from 'mongoose';
export interface ILeaderboardDocument extends Document {
    type: 'daily' | 'weekly' | 'monthly' | 'all-time';
    period: string;
    entries: Array<{
        user: mongoose.Types.ObjectId;
        points: number;
        rank: number;
        change?: number;
    }>;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
}
export declare const Leaderboard: mongoose.Model<ILeaderboardDocument, {}, {}, {}, mongoose.Document<unknown, {}, ILeaderboardDocument, {}, mongoose.DefaultSchemaOptions> & ILeaderboardDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, ILeaderboardDocument>;
//# sourceMappingURL=Leaderboard.d.ts.map