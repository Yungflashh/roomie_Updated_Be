// src/services/match.service.ts - COMPLETE WITH POINTS SYSTEM AND DISTANCE SORTING
import { User, Match, IUserDocument, IMatchDocument, Message } from '../models';
import { PointTransaction } from '../models/PointTransaction';
import { emitNewMatch, emitMatchRequest, emitNotification } from '../config/socket.config';
import compatibilityService from './compatibility.service';
import notificationService from './notification.service';
import pointsService from './points.service';
import premiumService from './premium.service';
import weeklyChallengeService from './weeklyChallenge.service';
import logger from '../utils/logger';

interface PotentialMatch {
  user: any;
  compatibilityScore: number;
  distance?: number; // NEW: Optional distance field
}

class MatchService {
  /**
   * Get potential matches
   */
  async getPotentialMatches(
    userId: string,
    limit: number = 20,
    minCompatibility: number = 0,
    sortBy: 'compatibility' | 'distance' = 'compatibility',
    liveCoords?: [number, number], // [longitude, latitude] from device GPS
    maxDistance?: number // in km — only used when sorting by distance
  ): Promise<PotentialMatch[]> {
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      throw new Error('User not found');
    }

    logger.info(`Getting potential matches for user: ${userId}, sortBy: ${sortBy}, liveCoords: ${liveCoords || 'none'}`);

    // Use live GPS coordinates if provided, otherwise fall back to profile coordinates
    const userCoords = liveCoords || currentUser.location?.coordinates;

    const interactedUserIds = [
      ...currentUser.likes.map(id => id.toString()),
      // passes are no longer excluded — skipped users can reappear
      ...currentUser.blockedUsers.map(id => id.toString()),
    ];

    const potentialMatches = await User.find({
      _id: {
        $ne: userId,
        $nin: interactedUserIds,
      },
      isActive: true,
      blockedUsers: { $ne: userId },
      // Respect profileVisibility: exclude users who only want matches to see them
      $or: [
        { 'privacySettings.profileVisibility': { $ne: 'matches_only' } },
        { 'privacySettings.profileVisibility': { $exists: false } },
      ],
    })
    .select(
      'firstName lastName profilePhoto photos bio occupation gender dateOfBirth ' +
      'location preferences lifestyle interests verified subscription metadata'
    )
    .limit(limit * 2)
    .lean();

    logger.info(`Found ${potentialMatches.length} potential matches before scoring`);

    const matchesWithScores = potentialMatches
      .map((user) => {
        const score = compatibilityService.calculateCompatibility(
          currentUser,
          user as any
        );

        // Calculate distance if both users have coordinates
        let distance: number | undefined;
        if (userCoords && user.location?.coordinates) {
          distance = this.calculateDistance(
            userCoords,
            user.location.coordinates
          );
        }

        return {
          user: {
            id: user._id,
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            profilePhoto: user.profilePhoto,
            photos: user.photos || [],
            bio: user.bio,
            occupation: user.occupation,
            gender: (user as any).gender,
            age: (user as any).dateOfBirth ? Math.floor((Date.now() - new Date((user as any).dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : undefined,
            location: user.location,
            preferences: user.preferences,
            lifestyle: user.lifestyle,
            interests: user.interests || [],
            verified: user.verified,
            subscription: (user as any).subscription,
            metadata: (user as any).metadata,
          },
          compatibilityScore: score,
          distance,
        };
      })
      .filter((match) => match.compatibilityScore >= minCompatibility);

    // Sort based on the sortBy parameter
    if (sortBy === 'distance') {
      // Filter out users without location data, apply max distance, sort closest first
      let matchesWithDistance = matchesWithScores
        .filter(m => m.distance !== undefined);

      if (maxDistance) {
        matchesWithDistance = matchesWithDistance.filter(m => (m.distance || 0) <= maxDistance);
      }

      matchesWithDistance.sort((a, b) => {
        // Boosted/premium users appear first
        const aBoost = this.getUserPriority(a.user);
        const bBoost = this.getUserPriority(b.user);
        if (aBoost !== bBoost) return bBoost - aBoost;
        return (a.distance || 0) - (b.distance || 0);
      });

      logger.info(`Returning ${matchesWithDistance.slice(0, limit).length} matches sorted by distance (max: ${maxDistance || 'unlimited'}km)`);
      return matchesWithDistance.slice(0, limit);
    } else {
      // Sort by compatibility score (highest first) with premium priority
      const sortedMatches = matchesWithScores
        .sort((a, b) => {
          const aBoost = this.getUserPriority(a.user);
          const bBoost = this.getUserPriority(b.user);
          if (aBoost !== bBoost) return bBoost - aBoost;
          return b.compatibilityScore - a.compatibilityScore;
        })
        .slice(0, limit);

      logger.info(`Returning ${sortedMatches.length} matches sorted by compatibility`);
      return sortedMatches;
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * @param coords1 - [longitude, latitude]
   * @param coords2 - [longitude, latitude]
   * @returns Distance in kilometers
   */
  private calculateDistance(coords1: number[], coords2: number[]): number {
    const [lon1, lat1] = coords1;
    const [lon2, lat2] = coords2;

    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
      Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Convert degrees to radians
   */
  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get sent likes
   */
  async getSentLikes(userId: string): Promise<any[]> {
    const currentUser = await User.findById(userId).select('likes');
    if (!currentUser) {
      throw new Error('User not found');
    }

    const matchedUserIds = await this.getMatchedUserIds(userId);

    const pendingLikeIds = currentUser.likes.filter(
      (likeId: any) => !matchedUserIds.includes(likeId.toString())
    );

    const likedUsers = await User.find({
      _id: { $in: pendingLikeIds },
    })
    .select(
      'firstName lastName profilePhoto photos bio occupation ' +
      'location preferences lifestyle interests verified subscription'
    )
    .lean();

    logger.info(`Found ${likedUsers.length} sent likes for ${userId}`);

    return likedUsers.map(user => ({
      id: user._id,
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePhoto: user.profilePhoto,
      photos: user.photos || [],
      bio: user.bio,
      occupation: user.occupation,
      location: user.location,
      preferences: user.preferences,
      lifestyle: user.lifestyle,
      interests: user.interests || [],
      verified: user.verified,
    }));
  }

  /**
   * Check if user can send match request (has enough points)
   */
  async canSendMatchRequest(userId: string): Promise<{
    canSend: boolean;
    reason?: string;
    pointsCost?: number;
    userPoints?: number;
  }> {
    const user = await User.findById(userId).select('gamification subscription');
    if (!user) throw new Error('User not found');

    // Calculate match cost with premium discount
    let pointsCost = await pointsService.calculateMatchCost(userId);
    const limits = premiumService.getLimits(user);
    pointsCost = Math.round(pointsCost * limits.matchCostMultiplier);

    // Check if user has enough points
    if (user.gamification.points < pointsCost) {
      return {
        canSend: false,
        reason: `Requires ${pointsCost} points. You have ${user.gamification.points}`,
        pointsCost,
        userPoints: user.gamification.points,
      };
    }

    return {
      canSend: true,
      pointsCost,
      userPoints: user.gamification.points,
    };
  }

  /**
   * Check daily action limits based on subscription plan.
   */
  private async checkDailyLimit(userId: string, actionType: 'like' | 'match_request'): Promise<void> {
    const user = await User.findById(userId).select('subscription').lean();
    const plan = user?.subscription?.plan || 'free';

    const LIMITS: Record<string, { likes: number; requests: number }> = {
      free: { likes: 13, requests: 4 },
      premium: { likes: 0, requests: 8 }, // 0 = unlimited
      pro: { likes: 0, requests: 0 },
    };

    const limit = LIMITS[plan] || LIMITS.free;
    const maxToday = actionType === 'like' ? limit.likes : limit.requests;

    if (maxToday === 0) return; // unlimited

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const count = await PointTransaction.countDocuments({
      user: userId,
      type: actionType,
      createdAt: { $gte: todayStart },
    });

    if (count >= maxToday) {
      const label = actionType === 'like' ? 'likes' : 'match requests';
      if (plan === 'free') {
        throw new Error(`Daily limit reached (${maxToday} ${label}/day). Upgrade to Premium for more!`);
      } else {
        throw new Error(`Daily limit reached (${maxToday} ${label}/day). Upgrade to Pro for unlimited!`);
      }
    }
  }

  /**
   * Like a user (cheap — 2 pts). Anonymous to recipient unless they're premium.
   * If mutual like → auto-match.
   */
  async likeUser(userId: string, targetUserId: string): Promise<{
    isMatch: boolean;
    match?: any;
    pointsDeducted?: number;
  }> {
    if (userId === targetUserId) throw new Error('Cannot like yourself');

    await this.checkDailyLimit(userId, 'like');

    const [currentUser, targetUser] = await Promise.all([
      User.findById(userId),
      User.findById(targetUserId),
    ]);
    if (!currentUser || !targetUser) throw new Error('User not found');

    // Like costs 2 points
    const LIKE_COST = 2;
    if (currentUser.gamification.points < LIKE_COST) {
      throw new Error(`Requires ${LIKE_COST} points. You have ${currentUser.gamification.points}`);
    }

    await pointsService.deductPoints({
      userId,
      amount: LIKE_COST,
      type: 'like',
      reason: `Liked ${targetUser.firstName}'s profile`,
      metadata: { targetUserId },
    });

    // Add to likes
    if (!currentUser.likes.includes(targetUserId as any)) {
      currentUser.likes.push(targetUserId as any);
    }
    (currentUser as any).metadata = {
      ...(currentUser as any).metadata,
      lastSwipeAction: 'like',
      lastSwipedUserId: targetUserId,
    };
    await currentUser.save();

    // Check for mutual like → auto-match
    const isMutualMatch = targetUser.likes.includes(userId as any);

    if (isMutualMatch) {
      return this._createMatch(userId, targetUserId, currentUser, targetUser, LIKE_COST);
    }

    // Not mutual — anonymous notification
    await notificationService.createNotification({
      user: targetUserId,
      type: 'like',
      title: 'Someone liked your profile!',
      body: 'Upgrade to Premium to see who likes you.',
      data: { type: 'anonymous_like' },
    });

    logger.info(`User ${userId} liked ${targetUserId} (${LIKE_COST} pts)`);
    return { isMatch: false, pointsDeducted: LIKE_COST };
  }

  /**
   * Send a match request (expensive — 15 pts). Recipient can see who sent it.
   * If target already liked you → auto-match.
   */
  async sendMatchRequest(userId: string, targetUserId: string): Promise<{
    isMatch: boolean;
    match?: any;
    pointsDeducted?: number;
  }> {
    if (userId === targetUserId) throw new Error('Cannot send request to yourself');

    await this.checkDailyLimit(userId, 'match_request');

    const [currentUser, targetUser] = await Promise.all([
      User.findById(userId),
      User.findById(targetUserId),
    ]);
    if (!currentUser || !targetUser) throw new Error('User not found');

    // Match request costs 15 points (premium discount applies)
    let requestCost = 15;
    const limits = premiumService.getLimits(currentUser);
    requestCost = Math.round(requestCost * limits.matchCostMultiplier);

    if (currentUser.gamification.points < requestCost) {
      throw new Error(`Requires ${requestCost} points. You have ${currentUser.gamification.points}`);
    }

    await pointsService.deductPoints({
      userId,
      amount: requestCost,
      type: 'match_request',
      reason: `Match request to ${targetUser.firstName}`,
      metadata: { targetUserId, targetUserName: `${targetUser.firstName} ${targetUser.lastName}` },
    });

    // Add to likes if not already
    if (!currentUser.likes.includes(targetUserId as any)) {
      currentUser.likes.push(targetUserId as any);
    }
    (currentUser as any).metadata = {
      ...(currentUser as any).metadata,
      lastSwipeAction: 'like',
      lastSwipedUserId: targetUserId,
    };
    await currentUser.save();

    // Check for mutual like → auto-match
    const isMutualMatch = targetUser.likes.includes(userId as any);

    if (isMutualMatch) {
      return this._createMatch(userId, targetUserId, currentUser, targetUser, requestCost);
    }

    // Not mutual — visible notification with sender info
    try {
      emitMatchRequest(targetUserId, {
        _id: currentUser._id,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        profilePhoto: currentUser.profilePhoto,
      });
    } catch {}

    await notificationService.notifyMatchRequest(userId, targetUserId);

    logger.info(`User ${userId} sent match request to ${targetUserId} (${requestCost} pts)`);
    return { isMatch: false, pointsDeducted: requestCost };
  }

  /**
   * Internal: create a match between two users who mutually like each other.
   */
  private async _createMatch(userId: string, targetUserId: string, currentUser: any, targetUser: any, pointsCost: number) {
    const compatibilityScore = compatibilityService.calculateCompatibility(currentUser, targetUser);

    let match = await Match.findOne({
      $or: [
        { user1: userId, user2: targetUserId },
        { user1: targetUserId, user2: userId },
      ],
    });

    if (!match) {
      match = await Match.create({
        user1: userId,
        user2: targetUserId,
        compatibilityScore,
        matchedAt: new Date(),
        status: 'active',
        initiatedBy: userId,
        pointsCost,
      });

      logger.info(`New match created: ${userId} <-> ${targetUserId}`);

      try {
        await weeklyChallengeService.trackAction(userId, 'match');
        await weeklyChallengeService.trackAction(targetUserId, 'match');
      } catch (e) { logger.warn('Challenge tracking (match) error:', e); }

      const config = await pointsService.getConfig();
      if (config.firstMatchBonus > 0) {
        await pointsService.addPoints({ userId, amount: config.firstMatchBonus, type: 'bonus', reason: `Match with ${targetUser.firstName}!`, metadata: { matchId: match._id, targetUserId } });
      }

      try {
        emitNewMatch(userId, targetUserId, { _id: match._id, matchedAt: match.matchedAt, user: { _id: targetUser._id, firstName: targetUser.firstName, lastName: targetUser.lastName, profilePhoto: targetUser.profilePhoto }, compatibilityScore });
        emitNewMatch(targetUserId, userId, { _id: match._id, matchedAt: match.matchedAt, user: { _id: currentUser._id, firstName: currentUser.firstName, lastName: currentUser.lastName, profilePhoto: currentUser.profilePhoto }, compatibilityScore });
      } catch {}

      await notificationService.notifyMatchAccepted(userId, targetUserId, match._id.toString());
      await notificationService.notifyMatchAccepted(targetUserId, userId, match._id.toString());
    }

    return {
      isMatch: true,
      pointsDeducted: pointsCost,
      match: { id: match._id, user: { id: targetUser._id, firstName: targetUser.firstName, lastName: targetUser.lastName, profilePhoto: targetUser.profilePhoto }, compatibilityScore },
    };
  }

  /**
   * Pass a user — soft skip, does NOT permanently exclude them.
   * The user will reappear in future discover queries.
   * Only used for declining/cancelling explicit match requests.
   */
  async passUser(userId: string, targetUserId: string): Promise<void> {
    // Record the pass for rewind feature
    await User.findByIdAndUpdate(
      userId,
      {
        $pull: { likes: targetUserId },
        $push: { passes: { $each: [targetUserId], $slice: -50 } },
        $set: {
          'metadata.lastSwipeAction': 'pass',
          'metadata.lastSwipedUserId': targetUserId,
        },
      }
    );
    logger.info(`User ${userId} passed ${targetUserId} — recorded for rewind`);
  }

  /**
   * Get user's matches with last message info
   */
  async getMatches(
    userId: string,
    page: number = 1,
    limit: number = 20,
    excludeListingInquiries: boolean = false
  ): Promise<{
    matches: any[];
    pagination: any;
  }> {
    const skip = (page - 1) * limit;

    const matchFilter: any = {
      $or: [{ user1: userId }, { user2: userId }],
      status: 'active',
    };

    // Only exclude listing inquiries if explicitly requested
    if (excludeListingInquiries) {
      matchFilter.type = { $ne: 'listing_inquiry' };
    }

    const matches = await Match.find(matchFilter)
    .sort({ lastMessageAt: -1, matchedAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user1 user2', 'firstName lastName profilePhoto bio occupation isActive lastSeen verified subscription equippedCosmetics')
    .populate('listingId', 'title photos price');

    const total = await Match.countDocuments(matchFilter);

    // Batch-fetch last messages for all matches in ONE query instead of N+1
    const matchIds = matches.map(m => m._id);
    const lastMessages = await Message.aggregate([
      { $match: { match: { $in: matchIds }, deleted: false } },
      { $sort: { createdAt: -1 } },
      { $group: {
        _id: '$match',
        type: { $first: '$type' },
        content: { $first: '$content' },
        sender: { $first: '$sender' },
        createdAt: { $first: '$createdAt' },
        read: { $first: '$read' },
      }},
    ]);
    const lastMessageMap = new Map(lastMessages.map(m => [m._id.toString(), m]));

    // Batch-resolve equipped cosmetics for all users
    let cosmeticMap: Record<string, any> = {};
    try {
      const { Cosmetic } = await import('../models/Cosmetic');
      const allCosmeticIds = matches.flatMap(m => {
        const u1Eq = (m.user1 as any)?.equippedCosmetics || {};
        const u2Eq = (m.user2 as any)?.equippedCosmetics || {};
        return [u1Eq.profileFrame, u1Eq.chatBubble, u1Eq.badge, u1Eq.nameEffect,
                u2Eq.profileFrame, u2Eq.chatBubble, u2Eq.badge, u2Eq.nameEffect].filter(Boolean);
      });
      if (allCosmeticIds.length > 0) {
        const docs = await Cosmetic.find({ _id: { $in: allCosmeticIds } }).select('name type style icon').lean();
        for (const d of docs) cosmeticMap[d._id.toString()] = d;
      }
    } catch {}

    const resolveCosmetics = (eq: any) => {
      if (!eq) return null;
      const r: any = {};
      if (eq.profileFrame && cosmeticMap[eq.profileFrame.toString()]) r.profileFrame = cosmeticMap[eq.profileFrame.toString()];
      if (eq.chatBubble && cosmeticMap[eq.chatBubble.toString()]) r.chatBubble = cosmeticMap[eq.chatBubble.toString()];
      if (eq.badge && cosmeticMap[eq.badge.toString()]) r.badge = cosmeticMap[eq.badge.toString()];
      if (eq.nameEffect && cosmeticMap[eq.nameEffect.toString()]) r.nameEffect = cosmeticMap[eq.nameEffect.toString()];
      return Object.keys(r).length > 0 ? r : null;
    };

    const formattedMatches = matches.map((match) => {
      const otherUser = match.user1._id.toString() === userId
        ? match.user2
        : match.user1;

      const isUser1 = match.user1._id.toString() === userId;
      const lastMessage = lastMessageMap.get(match._id.toString()) || null;
      const cosmetics = resolveCosmetics((otherUser as any)?.equippedCosmetics);

      return {
        _id: match._id,
        id: match._id,
        type: match.type || 'match',
        listingId: match.listingId,
        user: otherUser,
        cosmetics,
        compatibilityScore: match.compatibilityScore,
        matchedAt: match.matchedAt,
        lastMessageAt: match.lastMessageAt || match.matchedAt,
        lastMessage,
        unreadCount: isUser1
          ? match.unreadCount.user1
          : match.unreadCount.user2,
      };
    });

    return {
      matches: formattedMatches,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get match details
   */
  async getMatchDetails(userId: string, matchId: string): Promise<any> {
    const match = await Match.findOne({
      _id: matchId,
      $or: [{ user1: userId }, { user2: userId }],
    }).populate('user1 user2');

    if (!match) {
      throw new Error('Match not found');
    }

    const otherUser = match.user1._id.toString() === userId 
      ? match.user2 
      : match.user1;

    return {
      id: match._id,
      user: otherUser,
      compatibilityScore: match.compatibilityScore,
      matchedAt: match.matchedAt,
      status: match.status,
    };
  }

  /**
   * Unmatch a user
   */
  async unmatch(userId: string, matchId: string): Promise<void> {
    const match = await Match.findOne({
      _id: matchId,
      $or: [{ user1: userId }, { user2: userId }],
    });

    if (!match) {
      throw new Error('Match not found');
    }

    match.status = 'blocked';
    await match.save();

    // Delete all messages
    await Message.deleteMany({ match: matchId });
  }

  /**
   * Get users who liked current user
   */
  /**
   * Get users who liked you.
   * Premium: full profiles. Free: only count + blurred.
   */
  async getLikes(userId: string): Promise<any[]> {
    const matchedUserIds = await this.getMatchedUserIds(userId);

    const usersWhoLiked = await User.find({
      likes: userId,
      _id: {
        $ne: userId,
        $nin: matchedUserIds
      },
    })
    .select(
      'firstName lastName profilePhoto photos bio occupation ' +
      'location preferences lifestyle interests verified subscription'
    )
    .limit(50)
    .lean();

    logger.info(`Found ${usersWhoLiked.length} users who liked ${userId}`);

    // Check if requesting user is premium
    const requestingUser = await User.findById(userId).select('subscription').lean();
    const isPremium = requestingUser?.subscription?.plan === 'premium' || requestingUser?.subscription?.plan === 'pro';

    return usersWhoLiked.map(user => ({
      id: user._id,
      _id: user._id,
      // Free users: hide identity, only show blurred data
      firstName: isPremium ? user.firstName : '???',
      lastName: isPremium ? user.lastName : '',
      profilePhoto: isPremium ? user.profilePhoto : null,
      photos: isPremium ? (user.photos || []) : [],
      bio: isPremium ? user.bio : 'Upgrade to Premium to see who liked you',
      occupation: isPremium ? user.occupation : null,
      location: user.location, // keep location for "X people near you liked you"
      preferences: user.preferences,
      hidden: !isPremium, // flag for frontend to know it's blurred
      lifestyle: user.lifestyle,
      interests: user.interests || [],
      verified: user.verified,
      subscription: user.subscription,
    }));
  }

  /**
   * Find or create a conversation for listing inquiry — not a match, just a chat channel
   */
  async findOrCreateListingInquiry(userId: string, landlordId: string, listingId?: string): Promise<IMatchDocument> {
    if (userId === landlordId) {
      throw new Error('Cannot message yourself');
    }

    // First check if a listing inquiry already exists
    const existingInquiry = await Match.findOne({
      type: 'listing_inquiry',
      $or: [
        { user1: userId, user2: landlordId },
        { user1: landlordId, user2: userId },
      ],
      status: 'active',
    });

    if (existingInquiry) {
      return existingInquiry;
    }

    // Create a new listing inquiry conversation (NOT a match)
    try {
      const conversation = await Match.create({
        user1: userId,
        user2: landlordId,
        type: 'listing_inquiry',
        compatibilityScore: 0,
        matchedAt: new Date(),
        status: 'active',
        listingId: listingId || undefined,
      });

      logger.info(`Listing inquiry created: ${userId} <-> ${landlordId} (id: ${conversation._id}, listing: ${listingId || 'none'})`);
      return conversation;
    } catch (error: any) {
      // If duplicate key error, the old unique index may still exist — find any existing conversation
      if (error.code === 11000) {
        const anyExisting = await Match.findOne({
          $or: [
            { user1: userId, user2: landlordId },
            { user1: landlordId, user2: userId },
          ],
          status: 'active',
        });
        if (anyExisting) {
          return anyExisting;
        }
      }
      throw error;
    }
  }

  /**
   * Calculate user priority for discovery sorting (boosted > premium > free)
   */
  private getUserPriority(user: any): number {
    let priority = 0;
    // Boosted in last 2 hours
    if (user.metadata?.lastBoostAt) {
      const boostAge = Date.now() - new Date(user.metadata.lastBoostAt).getTime();
      if (boostAge < 2 * 60 * 60 * 1000) priority += 10;
    }
    // Premium/Pro users
    if (user.subscription?.plan === 'pro') priority += 5;
    else if (user.subscription?.plan === 'premium') priority += 3;
    return priority;
  }

  /**
   * Get matched user IDs helper
   */
  private async getMatchedUserIds(userId: string): Promise<string[]> {
    const matches = await Match.find({
      $or: [{ user1: userId }, { user2: userId }],
      status: 'active',
      type: { $ne: 'listing_inquiry' },
    }).select('user1 user2');

    return matches.map((match) => 
      match.user1.toString() === userId 
        ? match.user2.toString() 
        : match.user1.toString()
    );
  }
}

export default new MatchService();