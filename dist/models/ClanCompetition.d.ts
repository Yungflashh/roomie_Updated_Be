import mongoose, { Document } from 'mongoose';
export interface IClanCompetitorEntry {
    clan: mongoose.Types.ObjectId;
    totalPoints: number;
    gamesPlayed: number;
    studySessions: number;
    memberContributions: Array<{
        user: mongoose.Types.ObjectId;
        points: number;
        gamesWon: number;
        studyWon: number;
    }>;
    rank?: number;
    prizeAmount?: number;
}
export interface IClanCompetitionDocument extends Document {
    month: string;
    status: 'registration' | 'active' | 'completed' | 'cancelled';
    competitors: IClanCompetitorEntry[];
    prizeTier: number;
    prizeDistributed: boolean;
    minMembers: number;
    minClans: number;
    startDate: Date;
    endDate: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const ClanCompetition: mongoose.Model<IClanCompetitionDocument, {}, {}, {}, mongoose.Document<unknown, {}, IClanCompetitionDocument, {}, mongoose.DefaultSchemaOptions> & IClanCompetitionDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IClanCompetitionDocument>;
//# sourceMappingURL=ClanCompetition.d.ts.map