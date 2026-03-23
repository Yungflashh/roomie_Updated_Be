import mongoose, { Document } from 'mongoose';
export interface IClanMember {
    user: mongoose.Types.ObjectId;
    role: 'leader' | 'co-leader' | 'member';
    joinedAt: Date;
    pointsContributed: number;
}
export interface IClanDocument extends Document {
    name: string;
    tag: string;
    description: string;
    emoji: string;
    color: string;
    leader: mongoose.Types.ObjectId;
    coLeaders: mongoose.Types.ObjectId[];
    members: IClanMember[];
    totalPoints: number;
    weeklyPoints: number;
    monthlyPoints: number;
    warsWon: number;
    warsLost: number;
    warsTied: number;
    level: number;
    maxMembers: number;
    isOpen: boolean;
    inviteCode: string;
    badges: string[];
    createdAt: Date;
    updatedAt: Date;
}
export interface IClanWarMatch {
    challengerPlayer: mongoose.Types.ObjectId;
    defenderPlayer: mongoose.Types.ObjectId;
    gameType: string;
    challengerScore: number;
    defenderScore: number;
    winner: 'challenger' | 'defender' | 'tie' | null;
    status: 'pending' | 'playing' | 'completed';
    completedAt?: Date;
}
export interface IClanWarDocument extends Document {
    challenger: mongoose.Types.ObjectId;
    defender: mongoose.Types.ObjectId;
    status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'declined' | 'expired';
    warType: 'games' | 'study' | 'mixed';
    matches: IClanWarMatch[];
    challengerScore: number;
    defenderScore: number;
    winner: 'challenger' | 'defender' | 'tie' | null;
    pointsStake: number;
    startedAt?: Date;
    expiresAt: Date;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Clan: mongoose.Model<IClanDocument, {}, {}, {}, mongoose.Document<unknown, {}, IClanDocument, {}, mongoose.DefaultSchemaOptions> & IClanDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IClanDocument>;
export declare const ClanWar: mongoose.Model<IClanWarDocument, {}, {}, {}, mongoose.Document<unknown, {}, IClanWarDocument, {}, mongoose.DefaultSchemaOptions> & IClanWarDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IClanWarDocument>;
//# sourceMappingURL=Clan.d.ts.map