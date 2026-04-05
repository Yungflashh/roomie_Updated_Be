import mongoose, { Document } from 'mongoose';
export interface IReportDocument extends Document {
    reporter: mongoose.Types.ObjectId;
    reported: mongoose.Types.ObjectId;
    reason: string;
    status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
    adminNote?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Report: mongoose.Model<IReportDocument, {}, {}, {}, mongoose.Document<unknown, {}, IReportDocument, {}, mongoose.DefaultSchemaOptions> & IReportDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IReportDocument>;
//# sourceMappingURL=Report.d.ts.map