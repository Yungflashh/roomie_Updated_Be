import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User, GameSession, Match } from '../models';
import logger from '../utils/logger';
import { redisClient, redisPubClient, redisSubClient } from './redis';

let io: Server | null = null;

const ONLINE_PREFIX = 'online:';
const GAME_SESSION_PREFIX = 'gamesession:';
const ONLINE_TTL = 300; // 5-minute safety TTL; refreshed on every connection event

const addOnlineUser = async (userId: string, socketId: string): Promise<void> => {
  await redisClient.sadd(`${ONLINE_PREFIX}${userId}`, socketId);
  await redisClient.expire(`${ONLINE_PREFIX}${userId}`, ONLINE_TTL);
};

const removeOnlineSocket = async (userId: string, socketId: string): Promise<boolean> => {
  await redisClient.srem(`${ONLINE_PREFIX}${userId}`, socketId);
  const remaining = await redisClient.scard(`${ONLINE_PREFIX}${userId}`);
  if (remaining === 0) {
    await redisClient.del(`${ONLINE_PREFIX}${userId}`);
    return true;
  }
  return false;
};

const isOnline = async (userId: string): Promise<boolean> => {
  const count = await redisClient.scard(`${ONLINE_PREFIX}${userId}`);
  return count > 0;
};

const setGameSession = async (userId: string, sessionId: string): Promise<void> => {
  await redisClient.set(`${GAME_SESSION_PREFIX}${userId}`, sessionId, 'EX', 3600);
};

const getGameSession = async (userId: string): Promise<string | null> => {
  return redisClient.get(`${GAME_SESSION_PREFIX}${userId}`);
};

const removeGameSession = async (userId: string): Promise<void> => {
  await redisClient.del(`${GAME_SESSION_PREFIX}${userId}`);
};

/**
 * Attaches Socket.IO to an existing HTTP server, wires the Redis pub/sub adapter
 * for multi-process support, and registers all event handlers.
 * Returns the `Server` instance so callers can store it on `app` if needed.
 */
export const initializeSocket = (server: any): Server => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.adapter(createAdapter(redisPubClient, redisSubClient));
  logger.info('Socket.IO initialised with Redis adapter');

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const user = await User.findById(decoded.userId).select('_id firstName lastName profilePhoto privacySettings');

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.data.user = {
        _id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        profilePhoto: user.profilePhoto,
        privacySettings: (user as any).privacySettings,
      };

      next();
    } catch (error) {
      logger.error('Socket auth error:', error);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.user._id;
    logger.info(`Socket connected: ${socket.id}, User: ${userId}`);

    addOnlineUser(userId, socket.id);
    socket.join(`user:${userId}`);
    broadcastPresenceUpdate(userId, true);

    socket.on('join:chat', (matchId: string) => {
      socket.join(`chat:${matchId}`);
    });

    socket.on('leave:chat', (matchId: string) => {
      socket.leave(`chat:${matchId}`);
    });

    socket.on('typing:start', (data: { matchId: string; receiverId: string; activity?: string }) => {
      emitToUser(data.receiverId, 'typing:start', {
        matchId: data.matchId,
        userId,
        user: socket.data.user,
        activity: data.activity || 'typing',
      });
    });

    socket.on('typing:stop', (data: { matchId: string; receiverId: string }) => {
      emitToUser(data.receiverId, 'typing:stop', {
        matchId: data.matchId,
        userId,
      });
    });

    socket.on('message:read', (data: { matchId: string; messageIds: string[] }) => {
      socket.to(`chat:${data.matchId}`).emit('message:read', {
        matchId: data.matchId,
        messageIds: data.messageIds,
        readBy: userId,
        readAt: new Date().toISOString(),
      });
    });

    socket.on('presence:check', async (userIds: string[]) => {
      try {
        const users = await User.find({ _id: { $in: userIds } }).select('privacySettings lastSeen').lean();
        const userMap = new Map(users.map(u => [u._id.toString(), u]));

        const statuses = await Promise.all(userIds.map(async (id) => {
          const u = userMap.get(id);
          const showOnline = u?.privacySettings?.showOnlineStatus !== false;
          const showLastSeen = u?.privacySettings?.showLastSeen !== false;
          return {
            userId: id,
            isOnline: showOnline ? await isOnline(id) : false,
            lastSeen: showLastSeen ? u?.lastSeen : null,
          };
        }));
        socket.emit('presence:status', statuses);
      } catch {
        const statuses = userIds.map(id => ({ userId: id, isOnline: false, lastSeen: null }));
        socket.emit('presence:status', statuses);
      }
    });

    socket.on('presence:ping', () => {
      socket.emit('presence:pong', { timestamp: Date.now() });
    });

    socket.on('game:join', (sessionId: string) => {
      socket.join(`game:${sessionId}`);
      setGameSession(userId, sessionId);

      socket.to(`game:${sessionId}`).emit('game:player_joined', {
        sessionId,
        user: socket.data.user,
      });
    });

    socket.on('game:leave', (sessionId: string) => {
      socket.leave(`game:${sessionId}`);
      removeGameSession(userId);

      socket.to(`game:${sessionId}`).emit('game:player_left', {
        sessionId,
        userId,
      });
    });

    // Uses an atomic findOneAndUpdate to prevent race conditions when multiple
    // players mark themselves ready simultaneously.
    socket.on('game:ready', async (sessionId: string) => {
      try {
        const beforeSession = await GameSession.findById(sessionId);
        if (!beforeSession) {
          socket.emit('game:error', { message: 'Game session not found' });
          return;
        }

        const playerExists = beforeSession.players.some(p => p.user.toString() === userId);
        if (!playerExists) {
          socket.emit('game:error', { message: 'You are not in this game' });
          return;
        }

        const session = await GameSession.findOneAndUpdate(
          {
            _id: sessionId,
            'players.user': new mongoose.Types.ObjectId(userId),
          },
          { $set: { 'players.$.isReady': true } },
          { new: true }
        )
          .populate('game')
          .populate('players.user', 'firstName lastName profilePhoto');

        if (!session) {
          socket.emit('game:error', { message: 'Failed to update ready state' });
          return;
        }

        io?.to(`game:${sessionId}`).emit('game:player_ready', {
          sessionId,
          userId,
          user: socket.data.user,
        });

        const allReady = session.players.every(p => (p as any).isReady === true);
        const game = session.game as any;
        const minPlayers = game?.minPlayers || 2;

        if (allReady && session.players.length >= minPlayers && session.status === 'waiting') {
          const updatedSession = await GameSession.findOneAndUpdate(
            { _id: sessionId, status: 'waiting' },
            {
              $set: {
                status: 'active',
                startedAt: new Date(),
              }
            },
            { new: true }
          )
            .populate('game')
            .populate('players.user', 'firstName lastName profilePhoto');

          if (updatedSession && updatedSession.status === 'active') {
            const gameStartedData = {
              sessionId,
              game: updatedSession.game,
              players: updatedSession.players,
              gameData: updatedSession.gameData,
              startedAt: updatedSession.startedAt,
            };

            io?.to(`game:${sessionId}`).emit('game:started', gameStartedData);
            logger.info(`Game auto-started: ${sessionId}`);
          }
        }
      } catch (error) {
        logger.error('Game ready error:', error);
        socket.emit('game:error', { message: 'Failed to update ready state' });
      }
    });

    socket.on('game:answer', (data: { sessionId: string; questionIndex: number; answer: string; timeSpent: number }) => {
      socket.to(`game:${data.sessionId}`).emit('game:player_answered', {
        sessionId: data.sessionId,
        userId,
        questionIndex: data.questionIndex,
      });
    });

    socket.on('game:action', (data: { sessionId: string; action: string; payload: any }) => {
      io?.to(`game:${data.sessionId}`).emit('game:action', {
        sessionId: data.sessionId,
        userId,
        user: socket.data.user,
        action: data.action,
        payload: data.payload,
      });
    });

    socket.on('disconnect', async (reason) => {
      logger.info(`Socket disconnected: ${socket.id}, User: ${userId}, Reason: ${reason}`);

      const fullyOffline = await removeOnlineSocket(userId, socket.id);
      if (fullyOffline) {
        broadcastPresenceUpdate(userId, false);

        const sessionId = await getGameSession(userId);
        if (sessionId) {
          io?.to(`game:${sessionId}`).emit('game:player_disconnected', {
            sessionId,
            userId,
          });
          await removeGameSession(userId);
        }
      }

      // Update lastSeen regardless of whether the user has other open sockets.
      User.findByIdAndUpdate(userId, { lastSeen: new Date() }).catch((err) =>
        logger.error('Failed to update last seen:', err)
      );
    });
  });

  return io;
};

/**
 * Emits a presence update only to users who have an active match with `userId`.
 * Respects each user's `privacySettings.showOnlineStatus` and `showLastSeen` flags.
 */
const broadcastPresenceUpdate = async (userId: string, isOnlineStatus: boolean): Promise<void> => {
  try {
    const user = await User.findById(userId).select('privacySettings').lean();
    const showOnline = user?.privacySettings?.showOnlineStatus !== false;
    const showLastSeen = user?.privacySettings?.showLastSeen !== false;

    const matches = await Match.find({
      $or: [{ user1: userId }, { user2: userId }],
      status: 'active',
    }).select('user1 user2').lean();

    const payload = {
      userId,
      isOnline: showOnline ? isOnlineStatus : false,
      lastSeen: showLastSeen ? new Date().toISOString() : null,
    };

    for (const match of matches) {
      const otherUserId = match.user1.toString() === userId
        ? match.user2.toString()
        : match.user1.toString();
      io?.to(`user:${otherUserId}`).emit('presence:update', payload);
    }
  } catch {
    // Non-critical — skip on error
  }
};

/** Emits an event to a specific user's personal room. */
export const emitToUser = (userId: string, event: string, data: any): void => {
  io?.to(`user:${userId}`).emit(event, data);
};

/** Emits an event to all sockets in a chat room. */
export const emitToChat = (matchId: string, event: string, data: any): void => {
  io?.to(`chat:${matchId}`).emit(event, data);
};

/** Emits an event to all sockets in a game session room. */
export const emitToGameSession = (sessionId: string, event: string, data: any): void => {
  io?.to(`game:${sessionId}`).emit(event, data);
};

/** Delivers a new message event only to the receiver's personal room, not the sender. */
export const emitNewMessage = (
  matchId: string,
  message: any,
  senderId: string,
  receiverId: string
): void => {
  emitToUser(receiverId, 'message:new', {
    ...message,
    matchId,
  });
};

/** Delivers a game invitation to the invited user. */
export const emitGameInvitation = (invitedUserId: string, invitation: any): void => {
  emitToUser(invitedUserId, 'game:invitation', invitation);
};

/** Notifies the inviting user of the invited user's accept/decline response. */
export const emitGameInvitationResponse = (userId: string, response: any): void => {
  emitToUser(userId, 'game:invitation_response', response);
};

export const emitGameStarted = (sessionId: string, gameData: any): void => {
  emitToGameSession(sessionId, 'game:started', gameData);
};

export const emitGameEnded = (sessionId: string, results: any): void => {
  emitToGameSession(sessionId, 'game:ended', results);
};

export const emitScoreUpdate = (sessionId: string, scores: any): void => {
  emitToGameSession(sessionId, 'game:score_update', scores);
};

export const emitNextQuestion = (sessionId: string, questionData: any): void => {
  emitToGameSession(sessionId, 'game:next_question', questionData);
};

export const emitUnreadUpdate = (userId: string, counts: any): void => {
  emitToUser(userId, 'unread:update', counts);
};

export const emitMatchNotification = (userId: string, match: any): void => {
  emitToUser(userId, 'match:new', match);
};

export const emitMatchRequest = (userId: string, request: any): void => {
  emitToUser(userId, 'match:request', request);
};

export const emitNotification = (userId: string, notification: any): void => {
  emitToUser(userId, 'notification:new', notification);
};

export const emitNewMatch = (user1Id: string, user2Id: string, matchData: any): void => {
  emitToUser(user1Id, 'match:new', matchData);
  emitToUser(user2Id, 'match:new', matchData);
};

/** Returns whether the given user currently has at least one connected socket. */
export const isUserOnline = async (userId: string): Promise<boolean> => {
  return isOnline(userId);
};

/** Broadcasts a clan war event to each member's personal room. */
export const emitClanWarUpdate = (clanMemberUserIds: string[], event: string, data: any): void => {
  for (const uid of clanMemberUserIds) {
    emitToUser(uid, event, data);
  }
};

/** Returns the active Socket.IO server instance, or null before initialisation. */
export const getIO = (): Server | null => io;
