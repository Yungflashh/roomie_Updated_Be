import mongoose, { Document } from 'mongoose';
export interface IRoommateAgreementParty {
    user: mongoose.Types.ObjectId;
    fullName: string;
    signedAt?: Date;
}
export interface IRoommateAgreement {
    match: mongoose.Types.ObjectId;
    party1: IRoommateAgreementParty;
    party2: IRoommateAgreementParty;
    status: 'pending' | 'signed' | 'active';
    moveInDate?: string;
    leaseEndDate?: string;
    rentAmount?: string;
    address?: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export interface IRoommateAgreementDocument extends IRoommateAgreement, Document {
}
export declare const RoommateAgreement: mongoose.Model<IRoommateAgreementDocument, {}, {}, {}, mongoose.Document<unknown, {}, IRoommateAgreementDocument, {}, mongoose.DefaultSchemaOptions> & IRoommateAgreementDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IRoommateAgreementDocument>;
//# sourceMappingURL=RoommateAgreement.d.ts.map