// src/controllers/match.controller.ts - WITH REDIS CACHING + DISTANCE SORTING
import { Response } from 'express';
import { AuthRequest } from '../types';
import matchService from '../services/match.service';
import cacheService from '../services/cache.service';
import pointsService from '../services/points.service';
import logger from '../utils/logger';
import { logAudit } from '../utils/audit';

class MatchController {
  /**
   * Aggregated matches feed — single endpoint for the Matches screen
   * Returns: forYou, nearYou, received, sent, matches, pointsStats, pointsConfig
   */
  async getMatchesFeed(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { maxDistance = 10, lat, lng } = req.query;

      const liveCoords = lat && lng
        ? [parseFloat(lng as string), parseFloat(lat as string)] as [number, number]
        : undefined;

      const maxDist = parseFloat(maxDistance as string);

      // Build cache keys
      const forYouCacheKey = cacheService.forYouKey(userId);
      const nearYouCacheKey = cacheService.nearYouKey(
        userId,
        maxDist,
        liveCoords ? liveCoords[1] : undefined,
        liveCoords ? liveCoords[0] : undefined,
      );

      // Run all queries in parallel — each individually cached
      const [forYou, nearYou, received, sent, matches, pointsStats, pointsConfig] = await Promise.all([
        cacheService.getOrSet(forYouCacheKey, () => matchService.getPotentialMatches(userId, 20, 0, 'compatibility'), 180),
        cacheService.getOrSet(nearYouCacheKey, () => matchService.getPotentialMatches(userId, 20, 0, 'distance', liveCoords, maxDist), 180),
        cacheService.getOrSet(cacheService.receivedRequestsKey(userId), () => matchService.getLikes(userId), 120),
        cacheService.getOrSet(cacheService.sentRequestsKey(userId), () => matchService.getSentLikes(userId), 120),
        cacheService.getOrSet(cacheService.matchesListKey(userId), () => matchService.getMatches(userId, 1, 50, true), 120),
        cacheService.getOrSet(cacheService.pointsStatsKey(userId), () => pointsService.getUserPointStats(userId), 120),
        cacheService.getOrSet(cacheService.pointsConfigKey(), () => pointsService.getConfig(), 600),
      ]);

      res.status(200).json({
        success: true,
        data: {
          forYou,
          nearYou,
          received,
          sent,
          matches: matches.matches || [],
          matchesPagination: matches.pagination,
          pointsStats,
          pointsConfig,
        },
      });
    } catch (error: any) {
      logger.error('Get matches feed error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch matches feed',
      });
    }
  }

  /**
   * Refresh only Near You data — lightweight endpoint for distance changes
   */
  async refreshNearYou(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { maxDistance = 10, lat, lng } = req.query;

      const liveCoords = lat && lng
        ? [parseFloat(lng as string), parseFloat(lat as string)] as [number, number]
        : undefined;

      const maxDist = parseFloat(maxDistance as string);

      const cacheKey = cacheService.nearYouKey(
        userId,
        maxDist,
        liveCoords ? liveCoords[1] : undefined,
        liveCoords ? liveCoords[0] : undefined,
      );

      const nearYou = await cacheService.getOrSet(
        cacheKey,
        () => matchService.getPotentialMatches(userId, 20, 0, 'distance', liveCoords, maxDist),
        180
      );

      res.status(200).json({
        success: true,
        data: { nearYou },
      });
    } catch (error: any) {
      logger.error('Refresh near you error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to refresh nearby matches',
      });
    }
  }

  /**
   * Get potential matches (with distance sorting support)
   */
  async getPotentialMatches(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const {
        limit = 20,
        minCompatibility = 50,
        sort = 'compatibility',
        lat,
        lng,
        maxDistance,
      } = req.query;

      // If live coordinates provided, use them for distance sorting
      const liveCoords = lat && lng
        ? [parseFloat(lng as string), parseFloat(lat as string)] as [number, number]
        : undefined;

      const sortType = sort as 'compatibility' | 'distance';
      const maxDist = maxDistance ? parseFloat(maxDistance as string) : undefined;

      // Build cache key based on sort type
      const cacheKey = sortType === 'distance'
        ? cacheService.nearYouKey(
            userId,
            maxDist || 0,
            liveCoords ? liveCoords[1] : undefined,
            liveCoords ? liveCoords[0] : undefined,
          )
        : cacheService.forYouKey(userId);

      // 3 min cache for matches
      const matches = await cacheService.getOrSet(
        cacheKey,
        () => matchService.getPotentialMatches(
          userId,
          parseInt(limit as string),
          parseInt(minCompatibility as string),
          sortType,
          liveCoords,
          maxDist
        ),
        180
      );

      res.status(200).json({
        success: true,
        data: {
          matches,
          total: matches.length,
        },
      });
    } catch (error: any) {
      logger.error('Get potential matches error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch potential matches',
      });
    }
  }

  /**
   * Get sent likes (users I have liked)
   */
  async getSentLikes(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const likes = await cacheService.getOrSet(
        cacheService.sentRequestsKey(userId),
        () => matchService.getSentLikes(userId),
        120
      );

      res.status(200).json({
        success: true,
        data: {
          likes,
          total: likes.length,
        },
      });
    } catch (error) {
      logger.error('Get sent likes error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch sent likes',
      });
    }
  }

  /**
   * Like a user
   */
  async likeUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { targetUserId } = req.params;

      const result = await matchService.likeUser(userId, targetUserId);

      // Bust caches for both users after interaction
      await cacheService.onUserInteraction(userId, targetUserId);
      // Points changed due to match request cost
      await cacheService.onPointsChange(userId);

      await logAudit({
        actor: { id: userId, name: '', email: '' },
        actorType: 'user', action: 'like_user', category: 'matching',
        target: { type: 'user', id: targetUserId },
        details: result.isMatch ? 'Liked user - Match created!' : 'Liked user', req,
        metadata: { isMatch: result.isMatch }
      });

      if (result.isMatch) {
        res.status(200).json({
          success: true,
          message: "It's a match!",
          data: result,
        });
      } else {
        res.status(200).json({
          success: true,
          message: 'User liked',
          data: result,
        });
      }
    } catch (error: any) {
      logger.error('Like user error:', error);
      
      const statusCode = error.message.includes('Cannot') ? 400 :
                         error.message.includes('not found') ? 404 : 500;
      
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to like user',
      });
    }
  }

  /**
   * Send a match request (visible, costs more points)
   */
  async sendMatchRequest(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { targetUserId } = req.params;

      const result = await matchService.sendMatchRequest(userId, targetUserId);

      await cacheService.onUserInteraction(userId, targetUserId);
      await cacheService.onPointsChange(userId);

      res.status(200).json({
        success: true,
        message: result.isMatch ? "It's a match!" : 'Match request sent',
        data: result,
      });
    } catch (error: any) {
      logger.error('Send match request error:', error);
      const statusCode = error.message.includes('Cannot') || error.message.includes('yourself') ? 400 :
                         error.message.includes('not found') ? 404 :
                         error.message.includes('Requires') ? 402 : 500;
      res.status(statusCode).json({ success: false, message: error.message || 'Failed to send request' });
    }
  }

  /**
   * Pass a user
   */
  async passUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { targetUserId } = req.params;

      await matchService.passUser(userId, targetUserId);

      // Bust caches after pass/decline
      await cacheService.onUserInteraction(userId, targetUserId);

      await logAudit({
        actor: { id: userId, name: '', email: '' },
        actorType: 'user', action: 'pass_user', category: 'matching',
        target: { type: 'user', id: targetUserId },
        details: `Passed on user ${targetUserId}`, req
      });

      res.status(200).json({
        success: true,
        message: 'User passed',
      });
    } catch (error) {
      logger.error('Pass user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to pass user',
      });
    }
  }

  /**
   * Get user's matches
   */
  async getMatches(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { page = 1, limit = 20 } = req.query;

      // Cache for 30s — reduces DB pressure on free-tier infra
      const cacheKey = `matches:list:${userId}:${page}:${limit}`;
      const result = await cacheService.getOrSet(
        cacheKey,
        () => matchService.getMatches(
          userId,
          parseInt(page as string),
          parseInt(limit as string)
        ),
        30
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Get matches error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch matches',
      });
    }
  }

  /**
   * Get match details
   */
  async getMatchDetails(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { matchId } = req.params;

      const match = await matchService.getMatchDetails(userId, matchId);

      res.status(200).json({
        success: true,
        data: { match },
      });
    } catch (error: any) {
      logger.error('Get match details error:', error);
      
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to fetch match details',
      });
    }
  }

  /**
   * Unmatch a user
   */
  async unmatch(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { matchId } = req.params;

      await matchService.unmatch(userId, matchId);

      // Bust match caches for both users
      await cacheService.invalidatePattern(`matches:*:${userId}*`);
      await cacheService.invalidatePattern(`home:feed:${userId}:*`);

      await logAudit({
        actor: { id: userId, name: '', email: '' },
        actorType: 'user', action: 'unmatch', category: 'matching',
        target: { type: 'match', id: matchId },
        details: `Unmatched from match ${matchId}`, req
      });

      res.status(200).json({
        success: true,
        message: 'Unmatched successfully',
      });
    } catch (error: any) {
      logger.error('Unmatch error:', error);
      
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to unmatch',
      });
    }
  }

  /**
   * Get likes (users who liked current user)
   */
  async getLikes(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const likes = await cacheService.getOrSet(
        cacheService.receivedRequestsKey(userId),
        () => matchService.getLikes(userId),
        120
      );

      res.status(200).json({
        success: true,
        data: {
          likes,
          total: likes.length,
        },
      });
    } catch (error) {
      logger.error('Get likes error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch likes',
      });
    }
  }
  /**
   * Find or create a match for listing inquiry
   * POST /api/v1/matches/listing-inquiry
   */
  async listingInquiry(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { landlordId, listingId } = req.body;

      if (!landlordId) {
        res.status(400).json({ success: false, message: 'landlordId is required' });
        return;
      }

      const match = await matchService.findOrCreateListingInquiry(userId, landlordId, listingId);

      res.status(200).json({
        success: true,
        data: { matchId: match._id.toString() },
      });
    } catch (error: any) {
      logger.error('Listing inquiry error:', error);
      const statusCode = error.message.includes('yourself') ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to create inquiry',
      });
    }
  }
}

export default new MatchController();