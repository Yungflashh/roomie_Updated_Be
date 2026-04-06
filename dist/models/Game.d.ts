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
    warId?: mongoose.Types.ObjectId;
    warMatchIndex?: number;
    players: IGameSessionPlayer[];
    invitedBy?: mongoose.Types.ObjectId;
    invitedUser?: mongoose.Types.ObjectId;
    invitations?: Array<{
        user: mongoose.Types.ObjectId;
        matchId: mongoose.Types.ObjectId;
        status: 'pending' | 'accepted' | 'declined' | 'expired';
        respondedAt?: Date;
    }>;
    mode?: 'duel' | 'multiplayer';
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
            flag?: string;
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
            flipped?: boolean;
            matched?: boolean;
        }>;
        puzzles?: Array<{
            puzzle: string;
            options: string[];
            correctAnswer: string;
            explanation: string;
        }>;
        patterns?: Array<{
            pattern: string[];
            options: string[];
            correctAnswer: string;
            type: string;
        }>;
        colorChallenges?: Array<{
            colorName: string;
            displayColor: string;
            correctAnswer: string;
        }>;
        colorOptions?: string[];
        drawingPrompts?: Array<{
            prompt: string;
            category: string;
            difficulty: string;
        }>;
        reactionRounds?: Array<{
            round: number;
            delay: number;
            isFake: boolean;
        }>;
        riddles?: Array<{
            riddle: string;
            options: string[];
            correctAnswer: string;
        }>;
        wordChain?: {
            category: string;
            startWord: string;
            examples: string[];
        };
        currentRound?: number;
        totalRounds?: number;
        totalPairs?: number;
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