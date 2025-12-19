"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const property_service_1 = __importDefault(require("../services/property.service"));
const logger_1 = __importDefault(require("../utils/logger"));
class PropertyController {
    async createProperty(req, res) {
        try {
            const landlordId = req.user?.userId;
            const propertyData = {
                ...req.body,
                landlord: landlordId,
                photos: req.uploadedPhotos || [],
            };
            const property = await property_service_1.default.createProperty(propertyData);
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