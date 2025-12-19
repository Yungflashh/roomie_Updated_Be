"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/services/property.service.ts
const models_1 = require("../models");
const logger_1 = __importDefault(require("../utils/logger"));
class PropertyService {
    /**
     * Create property listing
     */
    async createProperty(data) {
        // Determine coordinates - use provided or default to [0, 0]
        const coordinates = data.latitude !== undefined && data.longitude !== undefined
            ? [data.longitude, data.latitude]
            : [0, 0];
        const property = await models_1.Property.create({
            landlord: data.landlord,
            title: data.title,
            description: data.description,
            type: data.type,
            price: data.price,
            currency: data.currency || 'NGN',
            address: data.address || '',
            location: {
                type: 'Point',
                coordinates,
                city: data.city,
                state: data.state,
                country: data.country || 'Nigeria',
                zipCode: data.zipCode,
            },
            photos: data.photos,
            videos: data.videos || [],
            amenities: data.amenities || [],
            bedrooms: data.bedrooms,
            bathrooms: data.bathrooms,
            squareFeet: data.squareFeet,
            availableFrom: data.availableFrom || new Date(),
            leaseDuration: data.leaseDuration || 12,
            petFriendly: data.petFriendly || false,
            smokingAllowed: data.smokingAllowed || false,
            utilitiesIncluded: data.utilitiesIncluded || false,
            furnished: data.furnished || false,
            parkingAvailable: data.parkingAvailable || false,
            status: 'available',
        });
        logger_1.default.info(`Property created: ${property._id} by landlord ${data.landlord}`);
        return property;
    }
    /**
     * Get property by ID
     */
    async getPropertyById(propertyId) {
        const property = await models_1.Property.findById(propertyId)
            .populate('landlord', 'firstName lastName email phoneNumber profilePhoto');
        if (!property) {
            throw new Error('Property not found');
        }
        // Increment view count
        property.views += 1;
        await property.save();
        return property;
    }
    /**
     * Update property
     */
    async updateProperty(propertyId, landlordId, updates) {
        const property = await models_1.Property.findOne({
            _id: propertyId,
            landlord: landlordId,
        });
        if (!property) {
            throw new Error('Property not found or unauthorized');
        }
        // Handle location updates separately
        if (updates.city || updates.state || updates.latitude || updates.longitude) {
            const currentLocation = property.location || {
                type: 'Point',
                coordinates: [0, 0],
                city: '',
                state: '',
                country: 'Nigeria',
            };
            // Build new coordinates
            let newCoordinates = currentLocation.coordinates;
            if (updates.latitude !== undefined && updates.longitude !== undefined) {
                newCoordinates = [updates.longitude, updates.latitude];
            }
            // Update location
            property.location = {
                type: 'Point',
                coordinates: newCoordinates,
                city: updates.city || currentLocation.city,
                state: updates.state || currentLocation.state,
                country: updates.country || currentLocation.country || 'Nigeria',
                zipCode: updates.zipCode || currentLocation.zipCode,
            };
            // Remove from updates to avoid double assignment
            delete updates.city;
            delete updates.state;
            delete updates.country;
            delete updates.zipCode;
            delete updates.latitude;
            delete updates.longitude;
        }
        // Handle address separately (it's at root level, not in location)
        if (updates.address !== undefined) {
            property.address = updates.address;
            delete updates.address;
        }
        // Apply remaining updates
        const allowedUpdates = [
            'title', 'description', 'type', 'price', 'currency',
            'photos', 'videos', 'amenities', 'bedrooms', 'bathrooms',
            'squareFeet', 'availableFrom', 'leaseDuration', 'petFriendly',
            'smokingAllowed', 'utilitiesIncluded', 'furnished', 'parkingAvailable', 'status'
        ];
        allowedUpdates.forEach(field => {
            if (updates[field] !== undefined) {
                property[field] = updates[field];
            }
        });
        await property.save();
        return property;
    }
    /**
     * Delete property (soft delete)
     */
    async deleteProperty(propertyId, landlordId) {
        const result = await models_1.Property.findOneAndUpdate({
            _id: propertyId,
            landlord: landlordId,
        }, { status: 'inactive' });
        if (!result) {
            throw new Error('Property not found or unauthorized');
        }
        logger_1.default.info(`Property deleted: ${propertyId}`);
    }
    /**
     * Search properties
     */
    async searchProperties(filters) {
        const { page = 1, limit = 20, minPrice, maxPrice, type, bedrooms, bathrooms, petFriendly, furnished, city, state, latitude, longitude, radius = 50, } = filters;
        const query = { status: 'available' };
        // Price filter
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice)
                query.price.$gte = Number(minPrice);
            if (maxPrice)
                query.price.$lte = Number(maxPrice);
        }
        // Type filter
        if (type) {
            query.type = type;
        }
        // City filter
        if (city) {
            query['location.city'] = { $regex: city, $options: 'i' };
        }
        // State filter
        if (state) {
            query['location.state'] = { $regex: state, $options: 'i' };
        }
        // Bedrooms filter
        if (bedrooms) {
            query.bedrooms = { $gte: Number(bedrooms) };
        }
        // Bathrooms filter
        if (bathrooms) {
            query.bathrooms = { $gte: Number(bathrooms) };
        }
        // Pet friendly filter
        if (petFriendly !== undefined) {
            query.petFriendly = petFriendly === 'true' || petFriendly === true;
        }
        // Furnished filter
        if (furnished !== undefined) {
            query.furnished = furnished === 'true' || furnished === true;
        }
        // Skip geospatial query if no valid coordinates
        // Location-based search only if coordinates are provided and valid
        const hasValidCoords = latitude && longitude &&
            Number(latitude) !== 0 && Number(longitude) !== 0;
        if (hasValidCoords) {
            query['location.coordinates'] = {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [Number(longitude), Number(latitude)],
                    },
                    $maxDistance: Number(radius) * 1000,
                },
            };
        }
        const skip = (Number(page) - 1) * Number(limit);
        const properties = await models_1.Property.find(query)
            .skip(skip)
            .limit(Number(limit))
            .populate('landlord', 'firstName lastName profilePhoto')
            .sort({ createdAt: -1 });
        const total = await models_1.Property.countDocuments(query);
        return {
            properties,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        };
    }
    /**
     * Get landlord properties
     */
    async getLandlordProperties(landlordId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const properties = await models_1.Property.find({
            landlord: landlordId,
            status: { $ne: 'inactive' }
        })
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });
        const total = await models_1.Property.countDocuments({
            landlord: landlordId,
            status: { $ne: 'inactive' }
        });
        return {
            properties,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }
    /**
     * Like property
     */
    async likeProperty(propertyId, userId) {
        await models_1.Property.findByIdAndUpdate(propertyId, {
            $addToSet: { likes: userId },
        });
    }
    /**
     * Unlike property
     */
    async unlikeProperty(propertyId, userId) {
        await models_1.Property.findByIdAndUpdate(propertyId, {
            $pull: { likes: userId },
        });
    }
    /**
     * Get liked properties
     */
    async getLikedProperties(userId) {
        const properties = await models_1.Property.find({
            likes: userId,
            status: 'available',
        })
            .populate('landlord', 'firstName lastName profilePhoto')
            .sort({ createdAt: -1 });
        return properties;
    }
}
exports.default = new PropertyService();
//# sourceMappingURL=property.service.js.map