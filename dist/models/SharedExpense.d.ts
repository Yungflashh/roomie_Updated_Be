import mongoose, { Document } from 'mongoose';
export interface IExpenseParticipant {
    user: mongoose.Types.ObjectId;
    share: number;
    percentage?: number;
    paid: boolean;
    paidAt?: Date;
    markedPaidAt?: Date;
    verifiedBy?: mongoose.Types.ObjectId;
    verifiedAt?: Date;
    paymentStatus: 'unpaid' | 'pending_verification' | 'verified' | 'disputed';
    paymentProof?: string;
    paymentNote?: string;
}
export interface ISharedExpense {
    group: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    category: 'rent' | 'utilities' | 'groceries' | 'internet' | 'cleaning' | 'furniture' | 'transport' | 'entertainment' | 'other';
    totalAmount: number;
    currency: string;
    splitType: 'equal' | 'percentage' | 'custom' | 'shares';
    splitAmong: 'all' | 'selected';
    participants: IExpenseParticipant[];
    paidBy: mongoose.Types.ObjectId;
    dueDate?: Date;
    recurring?: {
        enabled: boolean;
        frequency: 'weekly' | 'biweekly' | 'monthly' | 'yearly';
        nextDueDate?: Date;
    };
    receipt?: string;
    attachments?: string[];
    status: 'pending' | 'partial' | 'settled';
    settledAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface ISharedExpenseDocument extends ISharedExpense, Document {
}
export declare const SharedExpense: mongoose.Model<ISharedExpenseDocument, {}, {}, {}, mongoose.Document<unknown, {}, ISharedExpenseDocument, {}, mongoose.DefaultSchemaOptions> & ISharedExpenseDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, ISharedExpenseDocument>;
//# sourceMappingURL=SharedExpense.d.ts.map