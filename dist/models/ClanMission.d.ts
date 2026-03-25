import mongoose, { Document } from 'mongoose';
export interface IClanMissionDocument extends Document {
    clan: mongoose.Types.ObjectId;
    title: string;
    description: string;
    target: number;
    progress: number;
    reward: number;
    type: 'points_earned' | 'games_won' | 'wars_won' | 'members_active' | 'challenges_completed';
    startDate: Date;
    endDate: Date;
    completed: boolean;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const ClanMission: mongoose.Model<IClanMissionDocument, {}, {}, {}, mongoose.Document<unknown, {}, IClanMissionDocument, {}, mongoose.DefaultSchemaOptions> & IClanMissionDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IClanMissionDocument>;
//# sourceMappingURL=ClanMission.d.ts.map