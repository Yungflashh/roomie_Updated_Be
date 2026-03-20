import mongoose, { Document } from 'mongoose';
export interface IGroupAgreementSignatory {
    user: mongoose.Types.ObjectId;
    fullName: string;
    signedAt?: Date;
}
export interface IGroupAgreement {
    group: mongoose.Types.ObjectId;
    signatories: IGroupAgreementSignatory[];
    status: 'pending' | 'partial' | 'active';
    moveInDate?: string;
    leaseEndDate?: string;
    rentAmount?: string;
    address?: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export interface IGroupAgreementDocument extends IGroupAgreement, Document {
}
export declare const GroupAgreement: mongoose.Model<IGroupAgreementDocument, {}, {}, {}, mongoose.Document<unknown, {}, IGroupAgreementDocument, {}, mongoose.DefaultSchemaOptions> & IGroupAgreementDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IGroupAgreementDocument>;
//# sourceMappingURL=GroupAgreement.d.ts.map