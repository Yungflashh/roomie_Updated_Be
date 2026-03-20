import mongoose, { Document } from 'mongoose';
export interface IReviewCategories {
    communication?: number;
    cleanliness?: number;
    reliability?: number;
    respectfulness?: number;
}
export interface IReviewDocument extends Document {
    reviewer: mongoose.Types.ObjectId;
    reviewee: mongoose.Types.ObjectId;
    rentalAgreement: mongoose.Types.ObjectId;
    property: mongoose.Types.ObjectId;
    role: 'landlord' | 'tenant';
    rating: number;
    comment?: string;
    categories: IReviewCategories;
    isVisible: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Review: mongoose.Model<IReviewDocument, {}, {}, {}, mongoose.Document<unknown, {}, IReviewDocument, {}, mongoose.DefaultSchemaOptions> & IReviewDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IReviewDocument>;
//# sourceMappingURL=Review.d.ts.map