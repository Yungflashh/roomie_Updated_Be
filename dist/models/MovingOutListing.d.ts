import mongoose, { Document } from 'mongoose';
export interface IMovingOutListingDocument extends Document {
    mover: mongoose.Types.ObjectId;
    status: 'draft' | 'pending_review' | 'active' | 'in_deal' | 'completed' | 'cancelled' | 'rejected';
    title: string;
    description: string;
    apartmentType: 'self_contain' | 'room_parlour' | '1_bedroom' | '2_bedroom' | '3_bedroom' | 'duplex' | 'other';
    bedrooms: number;
    bathrooms: number;
    address: string;
    location: {
        type: 'Point';
        coordinates: [number, number];
        city: string;
        state: string;
        country: string;
        neighborhood?: string;
    };
    photos: string[];
    videoTour?: string;
    monthlyRent: number;
    annualRent: number;
    currency: string;
    referralFee: number;
    estimatedLegalFee: number;
    estimatedCautionDeposit: number;
    estimatedAgencyFee: number;
    moveOutDate: Date;
    availableFrom: Date;
    monthsRemaining: number;
    reasonForLeaving: string;
    landlordName: string;
    landlordContact?: string;
    landlordConsentStatus: 'not_asked' | 'verbal_agreement' | 'written_consent';
    leaseAgreementDocument?: string;
    landlordConsentDocument?: string;
    amenities: string[];
    houseRules: string[];
    furnished: boolean;
    petFriendly: boolean;
    utilitiesIncluded: boolean;
    parkingAvailable: boolean;
    isVerified: boolean;
    verifiedAt?: Date;
    views: number;
    inquiries: number;
    rejectionReason?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const MovingOutListing: mongoose.Model<IMovingOutListingDocument, {}, {}, {}, mongoose.Document<unknown, {}, IMovingOutListingDocument, {}, mongoose.DefaultSchemaOptions> & IMovingOutListingDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IMovingOutListingDocument>;
//# sourceMappingURL=MovingOutListing.d.ts.map