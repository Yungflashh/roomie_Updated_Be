// src/services/match.service.ts
import { User, Match, IUserDocument, IMatchDocument, Message } from '../models';
import { emitNewMatch, emitMatchRequest, emitNotification } from '../config/socket.config';
import compatibilityService from './compatibility.service';
import notificationService from './notification.service';
import logger from '../utils/logger';

interface PotentialMatch {
  user: any;
  compatibilityScore: number;
}

class MatchService {
  /**
   * Get potential matches
   */
  async getPotentialMatches(
    userId: string,
    limit: number = 20,
    minCompatibility: number = 0
  ): Promise<PotentialMatch[]> {
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      throw new Error('User not found');
    }

    logger.info(`Getting potential matches for user: ${userId}`);

    const interactedUserIds = [
      ...currentUser.likes.map(id => id.toString()),
      ...currentUser.passes.map(id => id.toString()),
      ...currentUser.blockedUsers.map(id => id.toString()),
    ];

    const potentialMatches = await User.find({
      _id: { 
        $ne: userId,
        $nin: interactedUserIds,
      },
      isActive: true,
      blockedUsers: { $ne: userId },
    })
    .select(
      'firstName lastName profilePhoto photos bio occupation ' +
      'location preferences lifestyle interests verified'
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
            location: user.location,
            preferences: user.preferences,
            lifestyle: user.lifestyle,
            interests: user.interests || [],
            verified: user.verified,
          },
          compatibilityScore: score,
        };
      })
      .filter((match) => match.compatibilityScore >= minCompatibility)
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
      .slice(0, limit);

    logger.info(`Returning ${matchesWithScores.length} matches with scores >= ${minCompatibility}`);

    return matchesWithScores;
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
      'location preferences lifestyle interests verified'
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
   * Like a user
   */
  async likeUser(userId: string, targetUserId: string): Promise<{
    isMatch: boolean;
    match?: any;
  }> {
    if (userId === targetUserId) {
      throw new Error('Cannot like yourself');
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(userId),
      User.findById(targetUserId),
    ]);

    if (!currentUser || !targetUser) {
      throw new Error('User not found');
    }

    // Add to likes
    if (!currentUser.likes.includes(targetUserId as any)) {
      currentUser.likes.push(targetUserId as any);
      await currentUser.save();
    }

    // Check for mutual match
    const isMutualMatch = targetUser.likes.includes(userId as any);

    if (isMutualMatch) {
      const compatibilityScore = compatibilityService.calculateCompatibility(
        currentUser,
        targetUser
      );

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
        });

        logger.info(`New match created: ${userId} <-> ${targetUserId}`);

        // Emit match event to both users via WebSocket
        try {
          emitNewMatch(userId, targetUserId, {
            _id: match._id,
            matchedAt: match.matchedAt,
            user: {
              _id: targetUser._id,
              firstName: targetUser.firstName,
              lastName: targetUser.lastName,
              profilePhoto: targetUser.profilePhoto,
            },
            compatibilityScore,
          });

          emitNewMatch(targetUserId, userId, {
            _id: match._id,
            matchedAt: match.matchedAt,
            user: {
              _id: currentUser._id,
              firstName: currentUser.firstName,
              lastName: currentUser.lastName,
              profilePhoto: currentUser.profilePhoto,
            },
            compatibilityScore,
          });
        } catch (socketError) {
          logger.warn('Socket emit failed:', socketError);
        }

        // Create notifications
        await notificationService.notifyMatchAccepted(userId, targetUserId, match._id.toString());
        await notificationService.notifyMatchAccepted(targetUserId, userId, match._id.toString());
      }

      return {
        isMatch: true,
        match: {
          id: match._id,
          user: {
            id: targetUser._id,
            firstName: targetUser.firstName,
            lastName: targetUser.lastName,
            profilePhoto: targetUser.profilePhoto,
          },
          compatibilityScore,
        },
      };
    }

    // Not a match yet - emit match request to target user
    try {
      emitMatchRequest(targetUserId, {
        _id: currentUser._id,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        profilePhoto: currentUser.profilePhoto,
      });
    } catch (socketError) {
      logger.warn('Socket emit failed:', socketError);
    }

    // Create notification for like
    await notificationService.notifyLike(userId, targetUserId);

    return { isMatch: false };
  }

  /**
   * Pass a user
   */
  async passUser(userId: string, targetUserId: string): Promise<void> {
    await User.findByIdAndUpdate(
      userId,
      { $addToSet: { passes: targetUserId } }
    );
  }

  /**
   * Get user's matches with last message info
   */
  async getMatches(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    matches: any[];
    pagination: any;
  }> {
    const skip = (page - 1) * limit;

    const matches = await Match.find({
      $or: [{ user1: userId }, { user2: userId }],
      status: 'active',
    })
    .sort({ lastMessageAt: -1, matchedAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user1 user2', 'firstName lastName profilePhoto bio occupation isActive lastSeen');

    const total = await Match.countDocuments({
      $or: [{ user1: userId }, { user2: userId }],
      status: 'active',
    });

    // Get last message for each match
    const formattedMatches = await Promise.all(
      matches.map(async (match) => {
        const otherUser = match.user1._id.toString() === userId 
          ? match.user2 
          : match.user1;

        const isUser1 = match.user1._id.toString() === userId;

        // Get last message
        const lastMessage = await Message.findOne({
          match: match._id,
          deleted: false,
        })
          .sort({ createdAt: -1 })
          .select('type content sender createdAt read')
          .lean();

        return {
          _id: match._id,
          id: match._id,
          user: otherUser,
          compatibilityScore: match.compatibilityScore,
          matchedAt: match.matchedAt,
          lastMessageAt: match.lastMessageAt || match.matchedAt,
          lastMessage,
          unreadCount: isUser1 
            ? match.unreadCount.user1 
            : match.unreadCount.user2,
        };
      })
    );

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
      'location preferences lifestyle interests verified'
    )
    .limit(50)
    .lean();

    logger.info(`Found ${usersWhoLiked.length} users who liked ${userId}`);

    return usersWhoLiked.map(user => ({
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
   * Get matched user IDs helper
   */
  private async getMatchedUserIds(userId: string): Promise<string[]> {
    const matches = await Match.find({
      $or: [{ user1: userId }, { user2: userId }],
      status: 'active',
    }).select('user1 user2');

    return matches.map((match) => 
      match.user1.toString() === userId 
        ? match.user2.toString() 
        : match.user1.toString()
    );
  }
}

export default new MatchService();