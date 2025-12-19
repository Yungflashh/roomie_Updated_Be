import mongoose, { Document } from 'mongoose';
export interface IChoreAssignment {
    user: mongoose.Types.ObjectId;
    assignedAt: Date;
    completedAt?: Date;
    status: 'pending' | 'done' | 'verified' | 'skipped' | 'disputed' | 'transferred';
    verifiedBy?: mongoose.Types.ObjectId;
    verifiedAt?: Date;
    transferredTo?: mongoose.Types.ObjectId;
    transferredBy?: mongoose.Types.ObjectId;
    transferCost?: number;
    notes?: string;
    proofImage?: string;
}
export interface IChore {
    group: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    icon: string;
    category: 'cleaning' | 'kitchen' | 'bathroom' | 'laundry' | 'trash' | 'shopping' | 'pets' | 'maintenance' | 'other';
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'once';
    rotationType: 'rotate' | 'fixed' | 'volunteer' | 'random';
    assignTo: 'all' | 'selected';
    currentAssignee?: mongoose.Types.ObjectId;
    participants: mongoose.Types.ObjectId[];
    rotationOrder: mongoose.Types.ObjectId[];
    currentRotationIndex: number;
    assignments: IChoreAssignment[];
    nextDueDate?: Date;
    points: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface IChoreDocument extends IChore, Document {
}
export declare const Chore: mongoose.Model<IChoreDocument, {}, {}, {}, mongoose.Document<unknown, {}, IChoreDocument, {}, mongoose.DefaultSchemaOptions> & IChoreDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IChoreDocument>;
//# sourceMappingURL=Chore.d.ts.map