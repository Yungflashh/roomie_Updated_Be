import mongoose, { Document } from 'mongoose';
export interface ITransactionDocument extends Document {
    user: mongoose.Types.ObjectId;
    type: 'subscription' | 'feature' | 'boost' | 'coins';
    amount: number;
    currency: string;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    provider: 'paystack';
    providerReference: string;
    providerMetadata?: any;
    plan?: string;
    description?: string;
    metadata?: any;
}
export interface INotificationDocument extends Document {
    user: mongoose.Types.ObjectId;
    type: 'match' | 'message' | 'like' | 'challenge' | 'achievement' | 'system' | 'location_nearby';
    title: string;
    body: string;
    data?: any;
    imageUrl?: string;
    read: boolean;
    readAt?: Date;
    sent: boolean;
    sentAt?: Date;
}
export declare const Transaction: mongoose.Model<ITransactionDocument, {}, {}, {}, mongoose.Document<unknown, {}, ITransactionDocument, {}, mongoose.DefaultSchemaOptions> & ITransactionDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, ITransactionDocument>;
export declare const Notification: mongoose.Model<INotificationDocument, {}, {}, {}, mongoose.Document<unknown, {}, INotificationDocument, {}, mongoose.DefaultSchemaOptions> & INotificationDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, INotificationDocument>;
//# sourceMappingURL=Transaction.d.ts.map