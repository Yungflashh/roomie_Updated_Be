"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const logger_1 = __importDefault(require("../utils/logger"));
class PropertyService {
    /**
     * Create property listing
     */
    async createProperty(data) {
        const property = await models_1.Property.create({
            ...data,
            location: {
                type: 'Point',
                coordinates: [data.longitude, data.latitude],
                city: data.city,
                state: data.state,
                country: data.country,
                zipCode: data.zipCode,
            },
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
            .populate('landlord', 'firstName lastName email phoneNumber');
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
        Object.assign(property, updates);
        await property.save();
        return property;
    }
    /**
     * Delete property
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
        const { page = 1, limit = 20, minPrice, maxPrice, type, bedrooms, bathrooms, petFriendly, furnished, latitude, longitude, radius = 50, // km
         } = filters;
        const query = { status: 'available' };
        // Price filter
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice)
                query.price.$gte = minPrice;
            if (maxPrice)
                query.price.$lte = maxPrice;
        }
        // Type filter
        if (type) {
            query.type = type;
        }
        // Bedrooms filter
        if (bedrooms) {
            query.bedrooms = { $gte: bedrooms };
        }
        // Bathrooms filter
        if (bathrooms) {
            query.bathrooms = { $gte: bathrooms };
        }
        // Pet friendly filter
        if (petFriendly !== undefined) {
            query.petFriendly = petFriendly;
        }
        // Furnished filter
        if (furnished !== undefined) {
            query.furnished = furnished;
        }
        // Location-based search
        if (latitude && longitude) {
            query.location = {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [longitude, latitude],
                    },
                    $maxDistance: radius * 1000, // Convert to meters
                },
            };
        }
        const skip = (page - 1) * limit;
        const properties = await models_1.Property.find(query)
            .skip(skip)
            .limit(limit)
            .populate('landlord', 'firstName lastName profilePhoto')
            .sort({ createdAt: -1 });
        const total = await models_1.Property.countDocuments(query);
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
     * Get landlord properties
     */
    async getLandlordProperties(landlordId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const properties = await models_1.Property.find({ landlord: landlordId })
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });
        const total = await models_1.Property.countDocuments({ landlord: landlordId });
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