import mongoose, { Document } from 'mongoose';
export interface IGroupInvite {
    group: mongoose.Types.ObjectId;
    invitedBy: mongoose.Types.ObjectId;
    invitedUser?: mongoose.Types.ObjectId;
    email?: string;
    phone?: string;
    status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
    expiresAt: Date;
    acceptedAt?: Date;
    declinedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface IGroupInviteDocument extends IGroupInvite, Document {
}
export declare const GroupInvite: mongoose.Model<IGroupInviteDocument, {}, {}, {}, mongoose.Document<unknown, {}, IGroupInviteDocument, {}, mongoose.DefaultSchemaOptions> & IGroupInviteDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IGroupInviteDocument>;
//# sourceMappingURL=GroupInvite.d.ts.map