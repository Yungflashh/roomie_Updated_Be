import mongoose, { Document } from 'mongoose';
export interface IGroupMember {
    user: mongoose.Types.ObjectId;
    role: 'admin' | 'member';
    joinedAt: Date;
    invitedBy?: mongoose.Types.ObjectId;
    status: 'active' | 'left' | 'removed';
    leftAt?: Date;
}
export interface IRoommateGroup {
    name: string;
    description?: string;
    coverImage?: string;
    inviteCode: string;
    inviteLink?: string;
    createdBy: mongoose.Types.ObjectId;
    members: IGroupMember[];
    maxMembers: number;
    settings: {
        allowMemberInvites: boolean;
        requireAdminApproval: boolean;
        defaultSplitType: 'equal' | 'custom';
        currency: string;
    };
    isActive: boolean;
    features: {
        locationSharing: boolean;
        emergencyAlerts: boolean;
        personalityBoard: boolean;
    };
    createdAt: Date;
    updatedAt: Date;
}
export interface IRoommateGroupDocument extends IRoommateGroup, Document {
    activeMembers: IGroupMember[];
    memberCount: number;
}
export declare const RoommateGroup: mongoose.Model<IRoommateGroupDocument, {}, {}, {}, mongoose.Document<unknown, {}, IRoommateGroupDocument, {}, mongoose.DefaultSchemaOptions> & IRoommateGroupDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IRoommateGroupDocument>;
//# sourceMappingURL=RoommateGroup.d.ts.map