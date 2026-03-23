import mongoose, { Document } from 'mongoose';
export interface IAIChatDocument extends Document {
    user: mongoose.Types.ObjectId;
    messages: Array<{
        role: 'user' | 'assistant';
        content: string;
        createdAt: Date;
    }>;
    title: string;
    updatedAt: Date;
}
export interface IAIPreferencesDocument extends Document {
    user: mongoose.Types.ObjectId;
    aiName: string;
    colorTheme: string;
    personality: string;
    updatedAt: Date;
}
export declare const AIChat: mongoose.Model<IAIChatDocument, {}, {}, {}, mongoose.Document<unknown, {}, IAIChatDocument, {}, mongoose.DefaultSchemaOptions> & IAIChatDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IAIChatDocument>;
export declare const AIPreferences: mongoose.Model<IAIPreferencesDocument, {}, {}, {}, mongoose.Document<unknown, {}, IAIPreferencesDocument, {}, mongoose.DefaultSchemaOptions> & IAIPreferencesDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IAIPreferencesDocument>;
//# sourceMappingURL=AIChat.d.ts.map