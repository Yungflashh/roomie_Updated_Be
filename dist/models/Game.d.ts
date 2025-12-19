import mongoose, { Document } from 'mongoose';
export interface IGameDocument extends Document {
    name: string;
    description: string;
    category: string;
    thumbnail: string;
    minPlayers: number;
    maxPlayers: number;
    difficulty: 'easy' | 'medium' | 'hard';
    pointsReward: number;
    isActive: boolean;
}
export interface IGameSessionDocument extends Document {
    game: mongoose.Types.ObjectId;
    players: Array<{
        user: mongoose.Types.ObjectId;
        score: number;
        rank: number;
    }>;
    winner?: mongoose.Types.ObjectId;
    startedAt: Date;
    endedAt?: Date;
    status: 'waiting' | 'active' | 'completed' | 'cancelled';
}
export declare const Game: mongoose.Model<IGameDocument, {}, {}, {}, mongoose.Document<unknown, {}, IGameDocument, {}, mongoose.DefaultSchemaOptions> & IGameDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IGameDocument>;
export declare const GameSession: mongoose.Model<IGameSessionDocument, {}, {}, {}, mongoose.Document<unknown, {}, IGameSessionDocument, {}, mongoose.DefaultSchemaOptions> & IGameSessionDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IGameSessionDocument>;
//# sourceMappingURL=Game.d.ts.map