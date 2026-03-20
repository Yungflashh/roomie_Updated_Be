import mongoose, { Document } from 'mongoose';
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
export declare const StudyQuestion: mongoose.Model<IStudyQuestionDocument, {}, {}, {}, mongoose.Document<unknown, {}, IStudyQuestionDocument, {}, mongoose.DefaultSchemaOptions> & IStudyQuestionDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IStudyQuestionDocument>;
//# sourceMappingURL=StudyQuestion.d.ts.map