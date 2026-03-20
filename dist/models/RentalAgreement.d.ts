import mongoose, { Document } from 'mongoose';
export interface IRentalParty {
    user: mongoose.Types.ObjectId;
    fullName: string;
    signedAt?: Date;
}
export interface IRentalTerms {
    monthlyRent: number;
    currency: string;
    securityDeposit?: number;
    moveInDate: Date;
    leaseEndDate?: Date;
    leaseDuration: number;
    paymentDueDay?: number;
    utilitiesIncluded: boolean;
    additionalTerms?: string;
}
export interface IRentalAgreementDocument extends Document {
    inquiry: mongoose.Types.ObjectId;
    property: mongoose.Types.ObjectId;
    match: mongoose.Types.ObjectId;
    landlord: IRentalParty;
    tenant: IRentalParty;
    status: 'draft' | 'pending' | 'signed' | 'active' | 'terminated';
    terms: IRentalTerms;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const RentalAgreement: mongoose.Model<IRentalAgreementDocument, {}, {}, {}, mongoose.Document<unknown, {}, IRentalAgreementDocument, {}, mongoose.DefaultSchemaOptions> & IRentalAgreementDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IRentalAgreementDocument>;
//# sourceMappingURL=RentalAgreement.d.ts.map