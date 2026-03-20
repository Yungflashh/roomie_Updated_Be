import mongoose, { Document } from 'mongoose';
export interface IMatchDocument extends Document {
    user1: mongoose.Types.ObjectId;
    user2: mongoose.Types.ObjectId;
    type: 'match' | 'listing_inquiry';
    compatibilityScore: number;
    matchedAt: Date;
    status: 'active' | 'expired' | 'blocked';
    lastMessageAt?: Date;
    unreadCount: {
        user1: number;
        user2: number;
    };
    initiatedBy?: mongoose.Types.ObjectId;
    pointsCost?: number;
    listingId?: mongoose.Types.ObjectId;
}
export declare const Match: mongoose.Model<IMatchDocument, {}, {}, {}, mongoose.Document<unknown, {}, IMatchDocument, {}, mongoose.DefaultSchemaOptions> & IMatchDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IMatchDocument>;
//# sourceMappingURL=Match.d.ts.map