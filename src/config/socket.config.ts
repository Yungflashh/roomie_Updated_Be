// src/config/socket.config.ts (Scaled for 500-1000 concurrent users)
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User, GameSession } from '../models';
import logger from '../utils/logger';
import { redisClient, redisPubClient, redisSubClient } from './redis';

let io: Server | null = null;

// Redis key prefixes for online tracking
const ONLINE_PREFIX = 'online:';
const GAME_SESSION_PREFIX = 'gamesession:';
const ONLINE_TTL = 300; // 5 minutes TTL as safety net

// ==================== REDIS-BASED ONLINE TRACKING ====================

const addOnlineUser = async (userId: string, socketId: string): Promise<void> => {
  await redisClient.sadd(`${ONLINE_PREFIX}${userId}`, socketId);
  await redisClient.expire(`${ONLINE_PREFIX}${userId}`, ONLINE_TTL);
};

const removeOnlineSocket = async (userId: string, socketId: string): Promise<boolean> => {
  await redisClient.srem(`${ONLINE_PREFIX}${userId}`, socketId);
  const remaining = await redisClient.scard(`${ONLINE_PREFIX}${userId}`);
  if (remaining === 0) {
    await redisClient.del(`${ONLINE_PREFIX}${userId}`);
    return true; // user fully offline
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

// ==================== SOCKET INITIALIZATION ====================

export const initializeSocket = (server: any): Server => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Wire up Redis adapter for multi-process support
  io.adapter(createAdapter(redisPubClient, redisSubClient));
  logger.info('Socket.IO Redis adapter connected');

  // Authentication middleware
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

    // Track online status in Redis
    addOnlineUser(userId, socket.id);

    // Join personal room
    socket.join(`user:${userId}`);

    // Broadcast online status
    broadcastPresenceUpdate(userId, true);

    // Handle joining chat room
    socket.on('join:chat', (matchId: string) => {
      socket.join(`chat:${matchId}`);
      logger.info(`User ${userId} joined chat: ${matchId}`);
    });

    // Handle leaving chat room
    socket.on('leave:chat', (matchId: string) => {
      socket.leave(`chat:${matchId}`);
      logger.info(`User ${userId} left chat: ${matchId}`);
    });

    // Handle typing indicators
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

    // Handle message read
    socket.on('message:read', (data: { matchId: string; messageIds: string[] }) => {
      socket.to(`chat:${data.matchId}`).emit('message:read', {
        matchId: data.matchId,
        messageIds: data.messageIds,
        readBy: userId,
        readAt: new Date().toISOString(),
      });
    });

    // Handle presence check (respects privacy settings)
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

    // Handle presence ping
    socket.on('presence:ping', () => {
      socket.emit('presence:pong', { timestamp: Date.now() });
    });

    // ==================== GAME EVENTS ====================

    // Join game session room
    socket.on('game:join', (sessionId: string) => {
      socket.join(`game:${sessionId}`);
      setGameSession(userId, sessionId);
      logger.info(`User ${userId} (${socket.data.user.firstName}) joined game session room: game:${sessionId}`);

      const roomSize = io?.sockets.adapter.rooms.get(`game:${sessionId}`)?.size || 0;
      logger.info(`Room game:${sessionId} now has ${roomSize} socket(s)`);

      socket.to(`game:${sessionId}`).emit('game:player_joined', {
        sessionId,
        user: socket.data.user,
      });
    });

    // Leave game session room
    socket.on('game:leave', (sessionId: string) => {
      socket.leave(`game:${sessionId}`);
      removeGameSession(userId);
      logger.info(`User ${userId} left game session: ${sessionId}`);

      socket.to(`game:${sessionId}`).emit('game:player_left', {
        sessionId,
        userId,
      });
    });

    // Player ready - with auto-start logic
    socket.on('game:ready', async (sessionId: string) => {
      try {
        logger.info(`Player ${userId} clicked ready for session ${sessionId}`);

        const roomSize = io?.sockets.adapter.rooms.get(`game:${sessionId}`)?.size || 0;

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

        // Use findOneAndUpdate with atomic operation to prevent race conditions
        const session = await GameSession.findOneAndUpdate(
          {
            _id: sessionId,
            'players.user': new mongoose.Types.ObjectId(userId),
          },
          {
            $set: { 'players.$.isReady': true }
          },
          { new: true }
        )
          .populate('game')
          .populate('players.user', 'firstName lastName profilePhoto');

        if (!session) {
          socket.emit('game:error', { message: 'Failed to update ready state' });
          return;
        }

        // Broadcast ready state to all players in the game room
        io?.to(`game:${sessionId}`).emit('game:player_ready', {
          sessionId,
          userId,
          user: socket.data.user,
        });

        // Check if all players are ready
        const allReady = session.players.every(p => (p as any).isReady === true);
        const game = session.game as any;
        const minPlayers = game?.minPlayers || 2;

        if (allReady && session.players.length >= minPlayers && session.status === 'waiting') {
          logger.info(`All players ready, starting game ${sessionId}`);

          // Auto-start the game with atomic update
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

    // Submit answer (for trivia/quiz games)
    socket.on('game:answer', (data: { sessionId: string; questionIndex: number; answer: string; timeSpent: number }) => {
      socket.to(`game:${data.sessionId}`).emit('game:player_answered', {
        sessionId: data.sessionId,
        userId,
        questionIndex: data.questionIndex,
      });
    });

    // Game action (generic for different game types)
    socket.on('game:action', (data: { sessionId: string; action: string; payload: any }) => {
      io?.to(`game:${data.sessionId}`).emit('game:action', {
        sessionId: data.sessionId,
        userId,
        user: socket.data.user,
        action: data.action,
        payload: data.payload,
      });
    });

    // Handle disconnect
    socket.on('disconnect', async (reason) => {
      logger.info(`Socket disconnected: ${socket.id}, User: ${userId}, Reason: ${reason}`);

      const fullyOffline = await removeOnlineSocket(userId, socket.id);
      if (fullyOffline) {
        broadcastPresenceUpdate(userId, false);

        // Handle game session disconnect
        const sessionId = await getGameSession(userId);
        if (sessionId) {
          io?.to(`game:${sessionId}`).emit('game:player_disconnected', {
            sessionId,
            userId,
          });
          await removeGameSession(userId);
        }
      }

      // Always update lastSeen internally
      User.findByIdAndUpdate(userId, { lastSeen: new Date() }).catch((err) =>
        logger.error('Failed to update last seen:', err)
      );
    });
  });

  logger.info('Socket.IO initialized with Redis adapter');
  return io;
};

// Broadcast presence update to relevant users (respects privacy settings)
const broadcastPresenceUpdate = async (userId: string, isOnlineStatus: boolean): Promise<void> => {
  try {
    const user = await User.findById(userId).select('privacySettings').lean();
    const showOnline = user?.privacySettings?.showOnlineStatus !== false;
    const showLastSeen = user?.privacySettings?.showLastSeen !== false;

    io?.emit('presence:update', {
      userId,
      isOnline: showOnline ? isOnlineStatus : false,
      lastSeen: showLastSeen ? new Date().toISOString() : null,
    });
  } catch {
    io?.emit('presence:update', { userId, isOnline: false, lastSeen: null });
  }
};

// Emit to specific user's room
export const emitToUser = (userId: string, event: string, data: any): void => {
  io?.to(`user:${userId}`).emit(event, data);
};

// Emit to chat room
export const emitToChat = (matchId: string, event: string, data: any): void => {
  io?.to(`chat:${matchId}`).emit(event, data);
};

// Emit to game session room
export const emitToGameSession = (sessionId: string, event: string, data: any): void => {
  io?.to(`game:${sessionId}`).emit(event, data);
};

// Emit new message - ONLY to receiver
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

// Emit game invitation
export const emitGameInvitation = (
  invitedUserId: string,
  invitation: any
): void => {
  emitToUser(invitedUserId, 'game:invitation', invitation);
};

// Emit game invitation response
export const emitGameInvitationResponse = (
  userId: string,
  response: any
): void => {
  emitToUser(userId, 'game:invitation_response', response);
};

// Emit game started
export const emitGameStarted = (sessionId: string, gameData: any): void => {
  emitToGameSession(sessionId, 'game:started', gameData);
};

// Emit game ended
export const emitGameEnded = (sessionId: string, results: any): void => {
  emitToGameSession(sessionId, 'game:ended', results);
};

// Emit score update
export const emitScoreUpdate = (sessionId: string, scores: any): void => {
  emitToGameSession(sessionId, 'game:score_update', scores);
};

// Emit next question (for trivia games)
export const emitNextQuestion = (sessionId: string, questionData: any): void => {
  emitToGameSession(sessionId, 'game:next_question', questionData);
};

// Emit unread counts update
export const emitUnreadUpdate = (userId: string, counts: any): void => {
  emitToUser(userId, 'unread:update', counts);
};

// Emit match notification
export const emitMatchNotification = (userId: string, match: any): void => {
  emitToUser(userId, 'match:new', match);
};

// Emit match request notification
export const emitMatchRequest = (userId: string, request: any): void => {
  emitToUser(userId, 'match:request', request);
};

// Emit notification
export const emitNotification = (userId: string, notification: any): void => {
  emitToUser(userId, 'notification:new', notification);
};

export const emitNewMatch = (user1Id: string, user2Id: string, matchData: any): void => {
  emitToUser(user1Id, 'match:new', matchData);
  emitToUser(user2Id, 'match:new', matchData);
};

// Check if user is online (async now - uses Redis)
export const isUserOnline = async (userId: string): Promise<boolean> => {
  return isOnline(userId);
};

// Emit clan war update to all members of a clan
export const emitClanWarUpdate = (clanMemberUserIds: string[], event: string, data: any): void => {
  for (const uid of clanMemberUserIds) {
    emitToUser(uid, event, data);
  }
};

// Get IO instance
export const getIO = (): Server | null => io;
