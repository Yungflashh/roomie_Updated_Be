import mongoose, { Document } from 'mongoose';
export interface IListingVote {
    user: mongoose.Types.ObjectId;
    vote: 'like' | 'dislike' | 'maybe';
    comment?: string;
    votedAt: Date;
}
export interface IListingNote {
    user: mongoose.Types.ObjectId;
    content: string;
    createdAt: Date;
}
export interface ISharedListing {
    connection: mongoose.Types.ObjectId;
    property?: mongoose.Types.ObjectId;
    addedBy: mongoose.Types.ObjectId;
    externalUrl?: string;
    title: string;
    address?: string;
    city?: string;
    state?: string;
    price: number;
    currency: string;
    bedrooms?: number;
    bathrooms?: number;
    photos: string[];
    amenities: string[];
    description?: string;
    votes: IListingVote[];
    notes: IListingNote[];
    pros: string[];
    cons: string[];
    status: 'saved' | 'viewing_scheduled' | 'applied' | 'rejected' | 'accepted';
    viewingDate?: Date;
    priority: 'low' | 'medium' | 'high';
    isArchived: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface ISharedListingDocument extends ISharedListing, Document {
}
export declare const SharedListing: mongoose.Model<ISharedListingDocument, {}, {}, {}, mongoose.Document<unknown, {}, ISharedListingDocument, {}, mongoose.DefaultSchemaOptions> & ISharedListingDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, ISharedListingDocument>;
//# sourceMappingURL=SharedListing.d.ts.map