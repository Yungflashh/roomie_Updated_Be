import mongoose, { Document } from 'mongoose';
export interface IConfessionDocument extends Document {
    group: mongoose.Types.ObjectId;
    content: string;
    category: 'funny' | 'serious' | 'rant' | 'appreciation' | 'confession' | 'question';
    reactions: Array<{
        emoji: string;
        count: number;
        reactedHashes: string[];
    }>;
    replies: Array<{
        content: string;
        reactions: Array<{
            emoji: string;
            count: number;
            reactedHashes: string[];
        }>;
        createdAt: Date;
    }>;
    reportCount: number;
    isHidden: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Confession: mongoose.Model<IConfessionDocument, {}, {}, {}, mongoose.Document<unknown, {}, IConfessionDocument, {}, mongoose.DefaultSchemaOptions> & IConfessionDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IConfessionDocument>;
//# sourceMappingURL=Confession.d.ts.map