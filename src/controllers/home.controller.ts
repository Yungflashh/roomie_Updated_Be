// src/controllers/home.controller.ts - WITH REDIS CACHING
import { Response } from 'express';
import { AuthRequest } from '../types';
import propertyService from '../services/property.service';
import discoveryService from '../services/discovery.service';
import matchService from '../services/match.service';
import pointsService from '../services/points.service';
import cacheService from '../services/cache.service';
import logger from '../utils/logger';

class HomeController {
  /**
   * Get aggregated home feed data in a single request
   * GET /api/v1/home/feed
   */
  async getHomeFeed(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { city, lat, lng } = req.query;

      const liveCoords = lat && lng
        ? [parseFloat(lng as string), parseFloat(lat as string)] as [number, number]
        : undefined;

      // Cache the entire home feed for 2 minutes (keyed by city + coords)
      const cacheKey = `home:feed:${userId}:${city || 'all'}:${lat || '0'}:${lng || '0'}`;
      const feedData = await cacheService.getOrSet(
        cacheKey,
        async () => {
          // Run all queries in parallel
          const [
            listingsResult,
            roomiesResult,
            receivedLikes,
            sentLikes,
            likedProperties,
            pointsStats,
          ] = await Promise.allSettled([
            propertyService.searchProperties({
              city: city as string,
              limit: '10',
              ...(liveCoords ? { lng: liveCoords[0].toString(), lat: liveCoords[1].toString(), maxDistance: '50' } : {}),
            }),
            discoveryService.discoverUsers(userId, {
              city: city as string,
              limit: 10,
              ...(liveCoords ? { coordinates: liveCoords, maxDistance: 50 } : {}),
            }),
            matchService.getLikes(userId),
            matchService.getSentLikes(userId),
            propertyService.getLikedProperties(userId),
            pointsService.getUserPointStats(userId),
          ]);

          return {
            nearbyListings: listingsResult.status === 'fulfilled' ? listingsResult.value : { properties: [], pagination: {} },
            nearbyRoomies: roomiesResult.status === 'fulfilled' ? roomiesResult.value : { users: [], pagination: {} },
            receivedLikes: receivedLikes.status === 'fulfilled' ? receivedLikes.value : [],
            sentLikes: sentLikes.status === 'fulfilled' ? sentLikes.value : [],
            likedProperties: likedProperties.status === 'fulfilled' ? likedProperties.value : [],
            pointsStats: pointsStats.status === 'fulfilled' ? pointsStats.value : null,
          };
        },
        120
      );

      res.status(200).json({
        success: true,
        data: feedData,
      });
    } catch (error: any) {
      logger.error('Home feed error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch home feed',
      });
    }
  }
}

export default new HomeController();
