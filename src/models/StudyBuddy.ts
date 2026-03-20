import mongoose, { Schema, Document } from 'mongoose';

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
  creatorAnswers: Array<{ questionIndex: number; answer: string; correct: boolean; timeSpent: number }>;
  opponentAnswers: Array<{ questionIndex: number; answer: string; correct: boolean; timeSpent: number }>;
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

const answerSchema = new Schema({ questionIndex: Number, answer: String, correct: Boolean, timeSpent: Number }, { _id: false });

const studySessionSchema = new Schema<IStudySessionDocument>({
  creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  opponent: { type: Schema.Types.ObjectId, ref: 'User' },
  category: { type: String, required: true },
  mode: { type: String, enum: ['solo', 'challenge'], default: 'solo' },
  status: { type: String, enum: ['pending', 'active', 'completed', 'cancelled', 'declined'], default: 'active' },
  questions: [{ question: String, options: [String], correctAnswer: String, explanation: String }],
  creatorAnswers: [answerSchema],
  opponentAnswers: [answerSchema],
  creatorScore: { type: Number, default: 0 },
  opponentScore: { type: Number, default: 0 },
  winner: { type: Schema.Types.ObjectId, ref: 'User' },
  totalQuestions: { type: Number, default: 10 },
  timeLimit: { type: Number, default: 30 },
  startedAt: Date,
  completedAt: Date,
  expiresAt: Date,
}, { timestamps: true });

studySessionSchema.index({ creator: 1, status: 1 });
studySessionSchema.index({ opponent: 1, status: 1 });
studySessionSchema.index({ category: 1 });
studySessionSchema.index({ createdAt: -1 });

export const StudySession = mongoose.model<IStudySessionDocument>('StudySession', studySessionSchema);
