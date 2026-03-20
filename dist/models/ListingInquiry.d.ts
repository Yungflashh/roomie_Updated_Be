import mongoose, { Document } from 'mongoose';
export interface IViewingDetails {
    requestedDate?: Date;
    requestedTime?: string;
    confirmedDate?: Date;
    confirmedTime?: string;
    notes?: string;
    status: 'none' | 'pending' | 'confirmed' | 'rescheduled' | 'cancelled' | 'completed';
}
export interface IOffer {
    price?: number;
    moveInDate?: Date;
    leaseDuration?: number;
    message?: string;
    respondedAt?: Date;
    response: 'none' | 'pending' | 'accepted' | 'declined' | 'countered';
}
export interface IStatusChange {
    status: string;
    changedBy: mongoose.Types.ObjectId;
    changedAt: Date;
    note?: string;
}
export interface IListingInquiryDocument extends Document {
    seeker: mongoose.Types.ObjectId;
    lister: mongoose.Types.ObjectId;
    property: mongoose.Types.ObjectId;
    match: mongoose.Types.ObjectId;
    status: 'inquiry' | 'viewing_requested' | 'viewing_scheduled' | 'viewed' | 'offer_made' | 'accepted' | 'declined' | 'withdrawn' | 'expired';
    viewing: IViewingDetails;
    offer: IOffer;
    statusHistory: IStatusChange[];
    createdAt: Date;
    updatedAt: Date;
}
export declare const ListingInquiry: mongoose.Model<IListingInquiryDocument, {}, {}, {}, mongoose.Document<unknown, {}, IListingInquiryDocument, {}, mongoose.DefaultSchemaOptions> & IListingInquiryDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IListingInquiryDocument>;
//# sourceMappingURL=ListingInquiry.d.ts.map