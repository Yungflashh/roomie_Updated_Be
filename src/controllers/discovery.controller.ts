// src/controllers/discovery.controller.ts
import { Response } from 'express';
import { AuthRequest } from '../types';
import discoveryService, { DiscoveryFilters } from '../services/discovery.service';
import logger from '../utils/logger';

class DiscoveryController {
  /**
   * Discover users with filters
   */
  async discoverUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      
      // Parse query parameters into filters
      const filters: DiscoveryFilters = {
        // Location
        city: req.query.city as string,
        state: req.query.state as string,
        country: req.query.country as string,
        maxDistance: req.query.maxDistance ? Number(req.query.maxDistance) : undefined,
        
        // Budget
        minBudget: req.query.minBudget ? Number(req.query.minBudget) : undefined,
        maxBudget: req.query.maxBudget ? Number(req.query.maxBudget) : undefined,
        
        // Preferences
        roomType: req.query.roomType as 'private' | 'shared' | 'any',
        petFriendly: req.query.petFriendly === 'true' ? true : req.query.petFriendly === 'false' ? false : undefined,
        smoking: req.query.smoking === 'true' ? true : req.query.smoking === 'false' ? false : undefined,
        
        // Personal
        gender: req.query.gender as 'male' | 'female' | 'other' | 'any',
        minAge: req.query.minAge ? Number(req.query.minAge) : undefined,
        maxAge: req.query.maxAge ? Number(req.query.maxAge) : undefined,
        occupation: req.query.occupation as string,
        
        // Lifestyle
        sleepSchedule: req.query.sleepSchedule as 'early-bird' | 'night-owl' | 'flexible',
        minCleanliness: req.query.minCleanliness ? Number(req.query.minCleanliness) : undefined,
        maxCleanliness: req.query.maxCleanliness ? Number(req.query.maxCleanliness) : undefined,
        minSocialLevel: req.query.minSocialLevel ? Number(req.query.minSocialLevel) : undefined,
        maxSocialLevel: req.query.maxSocialLevel ? Number(req.query.maxSocialLevel) : undefined,
        guestFrequency: req.query.guestFrequency as 'never' | 'rarely' | 'sometimes' | 'often',
        workFromHome: req.query.workFromHome === 'true' ? true : req.query.workFromHome === 'false' ? false : undefined,
        
        // Interests
        interests: req.query.interests ? (req.query.interests as string).split(',') : undefined,
        
        // Verification
        verifiedOnly: req.query.verifiedOnly === 'true',
        
        // Pagination
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
        
        // Sorting
        sortBy: req.query.sortBy as 'compatibility' | 'distance' | 'newest' | 'lastActive',
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      // Handle coordinates for distance search
      if (req.query.longitude && req.query.latitude) {
        filters.coordinates = [
          Number(req.query.longitude),
          Number(req.query.latitude),
        ];
      }

      logger.info(`User ${userId} discovering with filters:`, filters);

      const result = await discoveryService.discoverUsers(userId, filters);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Discover users error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to discover users',
      });
    }
  }

  /**
   * Get filter options for UI
   */
  async getFilterOptions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const options = await discoveryService.getFilterOptions();

      res.status(200).json({
        success: true,
        data: options,
      });
    } catch (error: any) {
      logger.error('Get filter options error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get filter options',
      });
    }
  }

  /**
   * Search users by keyword
   */
  async searchUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const keyword = req.query.q as string;
      const limit = req.query.limit ? Number(req.query.limit) : 20;

      if (!keyword || keyword.length < 2) {
        res.status(400).json({
          success: false,
          message: 'Search keyword must be at least 2 characters',
        });
        return;
      }

      const users = await discoveryService.searchUsers(userId, keyword, limit);

      res.status(200).json({
        success: true,
        data: { users },
      });
    } catch (error: any) {
      logger.error('Search users error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to search users',
      });
    }
  }
}

export default new DiscoveryController();