// src/controllers/property.controller.ts
import { Response } from 'express';
import { AuthRequest } from '../types';
import propertyService from '../services/property.service';
import weeklyChallengeService from '../services/weeklyChallenge.service';
import logger from '../utils/logger';
import { logAudit } from '../utils/audit';

class PropertyController {
  async createProperty(req: AuthRequest, res: Response): Promise<void> {
    try {
      const landlordId = req.user?.userId!;
      
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
        photos: req.body.photos || (req as any).uploadedPhotos || [],
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

      const property = await propertyService.createProperty(propertyData);

      await logAudit({
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
    } catch (error: any) {
      logger.error('Create property error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create property',
      });
    }
  }

  async getProperty(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { propertyId } = req.params;
      const property = await propertyService.getPropertyById(propertyId);

      // Track challenge progress for property view
      const userId = req.user?.userId;
      if (userId) {
        weeklyChallengeService.trackAction(userId, 'property_view').catch(e => logger.warn('Challenge tracking (property_view) error:', e));
      }

      res.status(200).json({
        success: true,
        data: { property },
      });
    } catch (error: any) {
      logger.error('Get property error:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to fetch property',
      });
    }
  }

  async updateProperty(req: AuthRequest, res: Response): Promise<void> {
    try {
      const landlordId = req.user?.userId!;
      const { propertyId } = req.params;

      const property = await propertyService.updateProperty(
        propertyId,
        landlordId,
        req.body
      );

      await logAudit({
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
    } catch (error: any) {
      logger.error('Update property error:', error);
      const statusCode = error.message.includes('not found') || 
                         error.message.includes('unauthorized') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update property',
      });
    }
  }

  async deleteProperty(req: AuthRequest, res: Response): Promise<void> {
    try {
      const landlordId = req.user?.userId!;
      const { propertyId } = req.params;

      await propertyService.deleteProperty(propertyId, landlordId);

      await logAudit({
        actor: { id: landlordId, name: '', email: '' },
        actorType: 'user', action: 'delete_property', category: 'property',
        target: { type: 'property', id: propertyId },
        details: `Deleted property ${propertyId}`, req
      });

      res.status(200).json({
        success: true,
        message: 'Property deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete property error:', error);
      const statusCode = error.message.includes('not found') || 
                         error.message.includes('unauthorized') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to delete property',
      });
    }
  }

  async searchProperties(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await propertyService.searchProperties(req.query);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Search properties error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search properties',
      });
    }
  }

  async getLandlordProperties(req: AuthRequest, res: Response): Promise<void> {
    try {
      const landlordId = req.user?.userId!;
      const { page = 1, limit = 20 } = req.query;

      const result = await propertyService.getLandlordProperties(
        landlordId,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Get landlord properties error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch properties',
      });
    }
  }

  async likeProperty(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { propertyId } = req.params;

      await propertyService.likeProperty(propertyId, userId);

      await logAudit({
        actor: { id: userId, name: '', email: '' },
        actorType: 'user', action: 'like_property', category: 'property',
        target: { type: 'property', id: propertyId },
        details: `Liked property ${propertyId}`, req
      });

      res.status(200).json({
        success: true,
        message: 'Property liked',
      });
    } catch (error) {
      logger.error('Like property error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to like property',
      });
    }
  }

  async unlikeProperty(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { propertyId } = req.params;

      await propertyService.unlikeProperty(propertyId, userId);

      await logAudit({
        actor: { id: userId, name: '', email: '' },
        actorType: 'user', action: 'unlike_property', category: 'property',
        target: { type: 'property', id: propertyId },
        details: `Unliked property ${propertyId}`, req
      });

      res.status(200).json({
        success: true,
        message: 'Property unliked',
      });
    } catch (error) {
      logger.error('Unlike property error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to unlike property',
      });
    }
  }

  async getLikedProperties(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const properties = await propertyService.getLikedProperties(userId);

      res.status(200).json({
        success: true,
        data: { properties },
      });
    } catch (error) {
      logger.error('Get liked properties error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch liked properties',
      });
    }
  }
}

export default new PropertyController();