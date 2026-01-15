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
    pointsCost: number;
    levelRequired: number;
    isActive: boolean;
    playCount: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface IGameSessionPlayer {
    user: mongoose.Types.ObjectId;
    score: number;
    rank: number;
    isReady?: boolean;
    completedAt?: Date;
    pointsEarned?: number;
    answers?: Array<{
        questionIndex: number;
        answer: string;
        correct: boolean;
        timeSpent: number;
    }>;
}
export interface IGameSessionDocument extends Document {
    game: mongoose.Types.ObjectId;
    match?: mongoose.Types.ObjectId;
    players: IGameSessionPlayer[];
    invitedBy?: mongoose.Types.ObjectId;
    invitedUser?: mongoose.Types.ObjectId;
    winner?: mongoose.Types.ObjectId;
    startedAt?: Date;
    endedAt?: Date;
    expiresAt?: Date;
    status: 'pending' | 'waiting' | 'active' | 'completed' | 'cancelled' | 'declined' | 'expired';
    pointsCost: number;
    pointsAwarded: number;
    gameData?: {
        questions?: Array<{
            question: string;
            options: string[];
            correctAnswer: string;
            category?: string;
        }>;
        words?: Array<{
            scrambled: string;
            hint: string;
            answer: string;
        }>;
        challenges?: Array<{
            emojis: string;
            answer: string;
            hint: string;
        }>;
        cards?: Array<{
            id: number;
            emoji: string;
            flipped: boolean;
            matched: boolean;
        }>;
        currentRound?: number;
        totalRounds?: number;
        timeLimit?: number;
    };
    createdAt: Date;
    updatedAt: Date;
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