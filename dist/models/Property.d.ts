import mongoose, { Document } from 'mongoose';
export interface IPropertyDocument extends Document {
    landlord: mongoose.Types.ObjectId;
    title: string;
    description: string;
    type: 'apartment' | 'house' | 'condo' | 'room';
    price: number;
    currency: string;
    address: string;
    location: {
        type: 'Point';
        coordinates: [number, number];
        city: string;
        state: string;
        country: string;
        zipCode?: string;
    };
    photos: string[];
    videos?: string[];
    virtualTour?: {
        enabled: boolean;
        url?: string;
        photos360?: string[];
        floorPlanUrl?: string;
    };
    amenities: string[];
    bedrooms: number;
    bathrooms: number;
    squareFeet?: number;
    availableFrom: Date;
    leaseDuration: number;
    petFriendly: boolean;
    smokingAllowed: boolean;
    utilitiesIncluded: boolean;
    furnished: boolean;
    parkingAvailable: boolean;
    status: 'available' | 'rented' | 'pending' | 'inactive';
    views: number;
    likes: mongoose.Types.ObjectId[];
    isVerified: boolean;
}
export declare const Property: mongoose.Model<IPropertyDocument, {}, {}, {}, mongoose.Document<unknown, {}, IPropertyDocument, {}, mongoose.DefaultSchemaOptions> & IPropertyDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IPropertyDocument>;
//# sourceMappingURL=Property.d.ts.map