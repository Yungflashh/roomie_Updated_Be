import mongoose, { Document } from 'mongoose';
export interface IMessageDocument extends Document {
    match: mongoose.Types.ObjectId;
    sender: mongoose.Types.ObjectId;
    receiver: mongoose.Types.ObjectId;
    type: 'text' | 'image' | 'video' | 'audio' | 'file';
    content?: string;
    mediaUrl?: string;
    mediaHash?: string;
    thumbnailUrl?: string;
    metadata?: {
        size?: number;
        duration?: number;
        dimensions?: {
            width: number;
            height: number;
        };
    };
    read: boolean;
    readAt?: Date;
    deleted: boolean;
    reactions: Array<{
        user: mongoose.Types.ObjectId;
        emoji: string;
    }>;
}
export declare const Message: mongoose.Model<IMessageDocument, {}, {}, {}, mongoose.Document<unknown, {}, IMessageDocument, {}, mongoose.DefaultSchemaOptions> & IMessageDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IMessageDocument>;
//# sourceMappingURL=Message.d.ts.map