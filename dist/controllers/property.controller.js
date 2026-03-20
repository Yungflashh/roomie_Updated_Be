"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const property_service_1 = __importDefault(require("../services/property.service"));
const weeklyChallenge_service_1 = __importDefault(require("../services/weeklyChallenge.service"));
const logger_1 = __importDefault(require("../utils/logger"));
const audit_1 = require("../utils/audit");
class PropertyController {
    async createProperty(req, res) {
        try {
            const landlordId = req.user?.userId;
            const propertyData = {
                landlord: landlordId,
                title: req.body.title,
                description: req.body.description,
                type: req.body.type,
                price: Number(req.body.price),
                currency: req.body.currency || 'NGN',
                address: req.body.address,
                city: req.body.city,
                state: req.body.state,
                country: req.body.country || 'Nigeria',
                zipCode: req.body.zipCode,
                // Only include lat/lng if provided
                ...(req.body.latitude && req.body.longitude && {
                    latitude: Number(req.body.latitude),
                    longitude: Number(req.body.longitude),
                }),
                photos: req.body.photos || req.uploadedPhotos || [],
                videos: req.body.videos || [],
                amenities: req.body.amenities || [],
                bedrooms: Number(req.body.bedrooms),
                bathrooms: Number(req.body.bathrooms),
                squareFeet: req.body.squareFeet ? Number(req.body.squareFeet) : undefined,
                availableFrom: req.body.availableFrom ? new Date(req.body.availableFrom) : new Date(),
                leaseDuration: req.body.leaseDuration ? Number(req.body.leaseDuration) : 12,
                petFriendly: req.body.petFriendly === true || req.body.petFriendly === 'true',
                smokingAllowed: req.body.smokingAllowed === true || req.body.smokingAllowed === 'true',
                utilitiesIncluded: req.body.utilitiesIncluded === true || req.body.utilitiesIncluded === 'true',
                furnished: req.body.furnished === true || req.body.furnished === 'true',
                parkingAvailable: req.body.parkingAvailable === true || req.body.parkingAvailable === 'true',
            };
            const property = await property_service_1.default.createProperty(propertyData);
            await (0, audit_1.logAudit)({
                actor: { id: landlordId, name: '', email: '' },
                actorType: 'user', action: 'create_property', category: 'property',
                target: { type: 'property', id: property._id.toString(), name: property.title },
                details: `Listed property "${property.title}"`, req
            });
            res.status(201).json({
                success: true,
                message: 'Property created successfully',
                data: { property },
            });
        }
        catch (error) {
            logger_1.default.error('Create property error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to create property',
            });
        }
    }
    async getProperty(req, res) {
        try {
            const { propertyId } = req.params;
            const property = await property_service_1.default.getPropertyById(propertyId);
            // Track challenge progress for property view
            const userId = req.user?.userId;
            if (userId) {
                weeklyChallenge_service_1.default.trackAction(userId, 'property_view').catch(e => logger_1.default.warn('Challenge tracking (property_view) error:', e));
            }
            res.status(200).json({
                success: true,
                data: { property },
            });
        }
        catch (error) {
            logger_1.default.error('Get property error:', error);
            const statusCode = error.message.includes('not found') ? 404 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Failed to fetch property',
            });
        }
    }
    async updateProperty(req, res) {
        try {
            const landlordId = req.user?.userId;
            const { propertyId } = req.params;
            const property = await property_service_1.default.updateProperty(propertyId, landlordId, req.body);
            await (0, audit_1.logAudit)({
                actor: { id: landlordId, name: '', email: '' },
                actorType: 'user', action: 'update_property', category: 'property',
                target: { type: 'property', id: propertyId },
                details: `Updated property ${propertyId}`, req
            });
            res.status(200).json({
                success: true,
                message: 'Property updated successfully',
                data: { property },
            });
        }
        catch (error) {
            logger_1.default.error('Update property error:', error);
            const statusCode = error.message.includes('not found') ||
                error.message.includes('unauthorized') ? 404 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Failed to update property',
            });
        }
    }
    async deleteProperty(req, res) {
        try {
            const landlordId = req.user?.userId;
            const { propertyId } = req.params;
            await property_service_1.default.deleteProperty(propertyId, landlordId);
            await (0, audit_1.logAudit)({
                actor: { id: landlordId, name: '', email: '' },
                actorType: 'user', action: 'delete_property', category: 'property',
                target: { type: 'property', id: propertyId },
                details: `Deleted property ${propertyId}`, req
            });
            res.status(200).json({
                success: true,
                message: 'Property deleted successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Delete property error:', error);
            const statusCode = error.message.includes('not found') ||
                error.message.includes('unauthorized') ? 404 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Failed to delete property',
            });
        }
    }
    async searchProperties(req, res) {
        try {
            const result = await property_service_1.default.searchProperties(req.query);
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            logger_1.default.error('Search properties error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to search properties',
            });
        }
    }
    async getLandlordProperties(req, res) {
        try {
            const landlordId = req.user?.userId;
            const { page = 1, limit = 20 } = req.query;
            const result = await property_service_1.default.getLandlordProperties(landlordId, parseInt(page), parseInt(limit));
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            logger_1.default.error('Get landlord properties error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch properties',
            });
        }
    }
    async likeProperty(req, res) {
        try {
            const userId = req.user?.userId;
            const { propertyId } = req.params;
            await property_service_1.default.likeProperty(propertyId, userId);
            await (0, audit_1.logAudit)({
                actor: { id: userId, name: '', email: '' },
                actorType: 'user', action: 'like_property', category: 'property',
                target: { type: 'property', id: propertyId },
                details: `Liked property ${propertyId}`, req
            });
            res.status(200).json({
                success: true,
                message: 'Property liked',
            });
        }
        catch (error) {
            logger_1.default.error('Like property error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to like property',
            });
        }
    }
    async unlikeProperty(req, res) {
        try {
            const userId = req.user?.userId;
            const { propertyId } = req.params;
            await property_service_1.default.unlikeProperty(propertyId, userId);
            await (0, audit_1.logAudit)({
                actor: { id: userId, name: '', email: '' },
                actorType: 'user', action: 'unlike_property', category: 'property',
                target: { type: 'property', id: propertyId },
                details: `Unliked property ${propertyId}`, req
            });
            res.status(200).json({
                success: true,
                message: 'Property unliked',
            });
        }
        catch (error) {
            logger_1.default.error('Unlike property error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to unlike property',
            });
        }
    }
    async getLikedProperties(req, res) {
        try {
            const userId = req.user?.userId;
            const properties = await property_service_1.default.getLikedProperties(userId);
            res.status(200).json({
                success: true,
                data: { properties },
            });
        }
        catch (error) {
            logger_1.default.error('Get liked properties error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch liked properties',
            });
        }
    }
}
exports.default = new PropertyController();
//# sourceMappingURL=property.controller.js.map