import mongoose, { Document } from 'mongoose';
export interface IPointTransaction {
    type: 'earned' | 'spent' | 'penalty' | 'bonus' | 'transfer_received';
    amount: number;
    reason: string;
    relatedChore?: mongoose.Types.ObjectId;
    relatedExpense?: mongoose.Types.ObjectId;
    fromUser?: mongoose.Types.ObjectId;
    toUser?: mongoose.Types.ObjectId;
    createdAt: Date;
}
export interface IUserPoints {
    group: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    totalPoints: number;
    earnedPoints: number;
    spentPoints: number;
    penaltyPoints: number;
    transactions: IPointTransaction[];
    createdAt: Date;
    updatedAt: Date;
}
export interface IUserPointsDocument extends IUserPoints, Document {
}
export declare const UserPoints: mongoose.Model<IUserPointsDocument, {}, {}, {}, mongoose.Document<unknown, {}, IUserPointsDocument, {}, mongoose.DefaultSchemaOptions> & IUserPointsDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IUserPointsDocument>;
//# sourceMappingURL=UserPoints.d.ts.map