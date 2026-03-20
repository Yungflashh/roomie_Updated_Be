import mongoose, { Schema, Document } from 'mongoose';

export interface IStudyQuestionDocument extends Document {
  category: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  createdBy?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const studyQuestionSchema = new Schema<IStudyQuestionDocument>({
  category: { type: String, required: true, index: true },
  question: { type: String, required: true },
  options: { type: [String], required: true },
  correctAnswer: { type: String, required: true },
  explanation: { type: String, default: '' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

studyQuestionSchema.index({ category: 1, isActive: 1 });

export const StudyQuestion = mongoose.model<IStudyQuestionDocument>('StudyQuestion', studyQuestionSchema);
