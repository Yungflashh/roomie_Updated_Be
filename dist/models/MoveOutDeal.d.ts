import mongoose, { Document } from 'mongoose';
export type DealStatus = 'inquiry_sent' | 'inspection_scheduled' | 'inspection_done' | 'agreed' | 'payment_pending' | 'payment_escrowed' | 'moved_in' | 'dispute_open' | 'completed' | 'cancelled' | 'refunded';
export interface IMoveOutDealDocument extends Document {
    listing: mongoose.Types.ObjectId;
    mover: mongoose.Types.ObjectId;
    seeker: mongoose.Types.ObjectId;
    status: DealStatus;
    referralFeeAmount: number;
    platformFeePercent: number;
    platformFeeAmount: number;
    netToMover: number;
    paystackReference?: string;
    paystackAuthorizationUrl?: string;
    paymentChannel?: string;
    paidAt?: Date;
    payoutRecipientCode?: string;
    payoutReference?: string;
    payoutStatus?: 'pending' | 'success' | 'failed' | 'reversed';
    payoutAt?: Date;
    payoutFailureReason?: string;
    moverBankDetails?: {
        bankCode: string;
        bankName: string;
        accountNumber: string;
        accountName: string;
    };
    moveInConfirmedAt?: Date;
    disputeWindowEndsAt?: Date;
    disputeOpenedBy?: mongoose.Types.ObjectId;
    disputeOpenedAt?: Date;
    disputeReason?: string;
    disputeResolution?: 'refunded' | 'released' | 'partial';
    disputeResolvedAt?: Date;
    disputeNotes?: string;
    cancelledBy?: mongoose.Types.ObjectId;
    cancelledAt?: Date;
    cancellationReason?: string;
    timeline: Array<{
        event: string;
        actor?: mongoose.Types.ObjectId;
        timestamp: Date;
        note?: string;
        metadata?: any;
    }>;
    inspectionScheduledFor?: Date;
    inspectionNotes?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const MoveOutDeal: mongoose.Model<IMoveOutDealDocument, {}, {}, {}, mongoose.Document<unknown, {}, IMoveOutDealDocument, {}, mongoose.DefaultSchemaOptions> & IMoveOutDealDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IMoveOutDealDocument>;
//# sourceMappingURL=MoveOutDeal.d.ts.map