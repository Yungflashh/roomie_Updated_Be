import mongoose, { Document } from 'mongoose';
export interface IMessage {
    match: mongoose.Types.ObjectId;
    sender: mongoose.Types.ObjectId;
    receiver: mongoose.Types.ObjectId;
    type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'game_invite' | 'game_result' | 'system';
    content?: string;
    mediaUrl?: string;
    thumbnail?: string;
    duration?: number;
    fileSize?: number;
    fileName?: string;
    read: boolean;
    readAt?: Date;
    deleted: boolean;
    deletedAt?: Date;
    deletedFor?: mongoose.Types.ObjectId[];
    reactions: Array<{
        user: mongoose.Types.ObjectId;
        emoji: string;
        createdAt: Date;
    }>;
    replyTo?: mongoose.Types.ObjectId;
    gameData?: {
        sessionId: mongoose.Types.ObjectId;
        gameId: mongoose.Types.ObjectId;
        gameName: string;
        gameThumbnail?: string;
        status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'completed' | 'expired';
        winnerId?: mongoose.Types.ObjectId;
        winnerName?: string;
    };
    systemData?: {
        action: string;
        relatedId?: string;
        metadata?: Record<string, any>;
    };
    createdAt: Date;
    updatedAt: Date;
}
export interface IMessageDocument extends IMessage, Document {
}
export declare const Message: mongoose.Model<IMessageDocument, {}, {}, {}, mongoose.Document<unknown, {}, IMessageDocument, {}, mongoose.DefaultSchemaOptions> & IMessageDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IMessageDocument>;
//# sourceMappingURL=Message.d.ts.map