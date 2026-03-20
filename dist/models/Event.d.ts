import mongoose, { Document } from 'mongoose';
export interface IEventDocument extends Document {
    title: string;
    description: string;
    location: {
        type: 'Point';
        coordinates: [number, number];
        address: string;
        city?: string;
        state?: string;
    };
    date: Date;
    endDate?: Date;
    category: string;
    coverImage?: string;
    media?: string[];
    creator: mongoose.Types.ObjectId;
    attendees: Array<{
        user: mongoose.Types.ObjectId;
        status: 'going' | 'interested' | 'not_going';
        respondedAt: Date;
    }>;
    maxAttendees?: number;
    isFree: boolean;
    price?: number;
    currency?: string;
    views: number;
    likes: mongoose.Types.ObjectId[];
    isActive: boolean;
    isCancelled: boolean;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}
export declare const Event: mongoose.Model<IEventDocument, {}, {}, {}, mongoose.Document<unknown, {}, IEventDocument, {}, mongoose.DefaultSchemaOptions> & IEventDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IEventDocument>;
//# sourceMappingURL=Event.d.ts.map