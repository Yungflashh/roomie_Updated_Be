import mongoose, { Document } from 'mongoose';
export interface IRoommateConnectionDocument extends Document {
    match: mongoose.Types.ObjectId;
    requester: mongoose.Types.ObjectId;
    recipient: mongoose.Types.ObjectId;
    status: 'pending' | 'accepted' | 'declined' | 'cancelled';
    requestedAt: Date;
    respondedAt?: Date;
    connectedAt?: Date;
    features: {
        sharedExpenses: boolean;
        sharedCalendar: boolean;
        roommateAgreement: boolean;
        choreManagement: boolean;
        sharedListings: boolean;
    };
    metadata: {
        requestMessage?: string;
        declineReason?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}
export declare const RoommateConnection: mongoose.Model<IRoommateConnectionDocument, {}, {}, {}, mongoose.Document<unknown, {}, IRoommateConnectionDocument, {}, mongoose.DefaultSchemaOptions> & IRoommateConnectionDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IRoommateConnectionDocument>;
//# sourceMappingURL=RoommateConnection.d.ts.map