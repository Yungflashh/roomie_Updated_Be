import mongoose, { Document } from 'mongoose';
export interface IStudySessionDocument extends Document {
    creator: mongoose.Types.ObjectId;
    opponent?: mongoose.Types.ObjectId;
    category: string;
    mode: 'solo' | 'challenge';
    status: 'pending' | 'active' | 'completed' | 'cancelled' | 'declined';
    questions: Array<{
        question: string;
        options: string[];
        correctAnswer: string;
        explanation?: string;
    }>;
    creatorAnswers: Array<{
        questionIndex: number;
        answer: string;
        correct: boolean;
        timeSpent: number;
    }>;
    opponentAnswers: Array<{
        questionIndex: number;
        answer: string;
        correct: boolean;
        timeSpent: number;
    }>;
    creatorScore: number;
    opponentScore: number;
    winner?: mongoose.Types.ObjectId;
    totalQuestions: number;
    timeLimit: number;
    startedAt?: Date;
    completedAt?: Date;
    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const StudySession: mongoose.Model<IStudySessionDocument, {}, {}, {}, mongoose.Document<unknown, {}, IStudySessionDocument, {}, mongoose.DefaultSchemaOptions> & IStudySessionDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IStudySessionDocument>;
//# sourceMappingURL=StudyBuddy.d.ts.map