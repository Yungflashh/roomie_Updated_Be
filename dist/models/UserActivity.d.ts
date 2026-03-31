import mongoose, { Document } from 'mongoose';
export interface IUserActivityDocument extends Document {
    user: mongoose.Types.ObjectId;
    date: string;
    sessions: number;
    totalSeconds: number;
    lastSessionStart?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const UserActivity: mongoose.Model<IUserActivityDocument, {}, {}, {}, mongoose.Document<unknown, {}, IUserActivityDocument, {}, mongoose.DefaultSchemaOptions> & IUserActivityDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IUserActivityDocument>;
//# sourceMappingURL=UserActivity.d.ts.map