import { IPropertyDocument } from '../models';
interface CreatePropertyData {
    landlord: string;
    title: string;
    description: string;
    type: 'apartment' | 'house' | 'condo' | 'room';
    price: number;
    currency?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    city: string;
    state: string;
    country?: string;
    zipCode?: string;
    photos: string[];
    videos?: string[];
    amenities?: string[];
    bedrooms: number;
    bathrooms: number;
    squareFeet?: number;
    availableFrom?: Date;
    leaseDuration?: number;
    petFriendly?: boolean;
    smokingAllowed?: boolean;
    utilitiesIncluded?: boolean;
    furnished?: boolean;
    parkingAvailable?: boolean;
}
declare class PropertyService {
    /**
     * Create property listing
     */
    createProperty(data: CreatePropertyData): Promise<IPropertyDocument>;
    /**
     * Get property by ID
     */
    getPropertyById(propertyId: string): Promise<IPropertyDocument>;
    /**
     * Update property
     */
    updateProperty(propertyId: string, landlordId: string, updates: any): Promise<IPropertyDocument>;
    /**
     * Delete property (soft delete)
     */
    deleteProperty(propertyId: string, landlordId: string): Promise<void>;
    /**
     * Search properties
     */
    searchProperties(filters: any): Promise<{
        properties: IPropertyDocument[];
        pagination: any;
    }>;
    /**
     * Get landlord properties
     */
    getLandlordProperties(landlordId: string, page?: number, limit?: number): Promise<{
        properties: IPropertyDocument[];
        pagination: any;
    }>;
    /**
     * Like property
     */
    likeProperty(propertyId: string, userId: string): Promise<void>;
    /**
     * Unlike property
     */
    unlikeProperty(propertyId: string, userId: string): Promise<void>;
    /**
     * Get liked properties
     */
    getLikedProperties(userId: string): Promise<IPropertyDocument[]>;
}
declare const _default: PropertyService;
export default _default;
//# sourceMappingURL=property.service.d.ts.map