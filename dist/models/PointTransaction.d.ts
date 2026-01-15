import mongoose, { Document } from 'mongoose';
export interface IPointTransactionDocument extends Document {
    user: mongoose.Types.ObjectId;
    type: 'earned' | 'spent' | 'bonus' | 'penalty' | 'refund' | 'daily_login' | 'weekly_streak' | 'level_up' | 'verification' | 'game_entry' | 'game_reward' | 'match_request' | 'achievement';
    amount: number;
    balance: number;
    reason: string;
    metadata?: {
        gameId?: mongoose.Types.ObjectId;
        gameName?: string;
        sessionId?: mongoose.Types.ObjectId;
        matchId?: mongoose.Types.ObjectId;
        targetUserId?: mongoose.Types.ObjectId;
        achievementId?: string;
        verifyType?: 'email' | 'phone' | 'id';
        oldLevel?: number;
        newLevel?: number;
        [key: string]: any;
    };
    createdAt: Date;
}
export declare const PointTransaction: mongoose.Model<IPointTransactionDocument, {}, {}, {}, mongoose.Document<unknown, {}, IPointTransactionDocument, {}, mongoose.DefaultSchemaOptions> & IPointTransactionDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IPointTransactionDocument>;
//# sourceMappingURL=PointTransaction.d.ts.map