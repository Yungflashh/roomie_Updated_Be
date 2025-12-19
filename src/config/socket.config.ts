// src/config/socket.config.ts (Backend - Enhanced with better logging)
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User, GameSession } from '../models';
import logger from '../utils/logger';

let io: Server | null = null;

// Store online users: Map<userId, Set<socketId>>
const onlineUsers = new Map<string, Set<string>>();

// Store user's current game session: Map<userId, sessionId>
const userGameSessions = new Map<string, string>();

export const initializeSocket = (server: any): Server => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const user = await User.findById(decoded.userId).select('_id firstName lastName profilePhoto');

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.data.user = {
        _id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        profilePhoto: user.profilePhoto,
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

    // Track online status
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId)!.add(socket.id);

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
    socket.on('typing:start', (data: { matchId: string; receiverId: string }) => {
      emitToUser(data.receiverId, 'typing:start', {
        matchId: data.matchId,
        userId,
        user: socket.data.user,
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

    // Handle presence check
    socket.on('presence:check', (userIds: string[]) => {
      const statuses = userIds.map((id) => ({
        userId: id,
        isOnline: onlineUsers.has(id) && onlineUsers.get(id)!.size > 0,
      }));
      socket.emit('presence:status', statuses);
    });

    // Handle presence ping
    socket.on('presence:ping', () => {
      socket.emit('presence:pong', { timestamp: Date.now() });
    });

    // ==================== GAME EVENTS ====================

    // Join game session room
    socket.on('game:join', (sessionId: string) => {
      socket.join(`game:${sessionId}`);
      userGameSessions.set(userId, sessionId);
      logger.info(`✅ User ${userId} (${socket.data.user.firstName}) joined game session room: game:${sessionId}`);
      
      // Log room state
      const roomSize = io?.sockets.adapter.rooms.get(`game:${sessionId}`)?.size || 0;
      logger.info(`📊 Room game:${sessionId} now has ${roomSize} socket(s)`);
      
      // Notify other players
      socket.to(`game:${sessionId}`).emit('game:player_joined', {
        sessionId,
        user: socket.data.user,
      });
    });

    // Leave game session room
    socket.on('game:leave', (sessionId: string) => {
      socket.leave(`game:${sessionId}`);
      userGameSessions.delete(userId);
      logger.info(`User ${userId} left game session: ${sessionId}`);
      
      // Notify other players
      socket.to(`game:${sessionId}`).emit('game:player_left', {
        sessionId,
        userId,
      });
    });

    // Player ready - with auto-start logic
    socket.on('game:ready', async (sessionId: string) => {
      try {
        logger.info(`========== GAME:READY EVENT ==========`);
        logger.info(`Player ${userId} (${socket.data.user.firstName}) clicked ready for session ${sessionId}`);
        logger.info(`Socket ID: ${socket.id}`);
        
        // Check room membership
        const roomSize = io?.sockets.adapter.rooms.get(`game:${sessionId}`)?.size || 0;
        const socketsInRoom = Array.from(io?.sockets.adapter.rooms.get(`game:${sessionId}`) || []);
        logger.info(`📊 Room game:${sessionId} has ${roomSize} socket(s): ${socketsInRoom.join(', ')}`);

        // First, let's check the session state BEFORE update
        const beforeSession = await GameSession.findById(sessionId);
        if (beforeSession) {
          logger.info(`BEFORE UPDATE - Session status: ${beforeSession.status}`);
          logger.info(`BEFORE UPDATE - Players: ${JSON.stringify(beforeSession.players.map(p => ({
            userId: p.user.toString(),
            isReady: (p as any).isReady,
            score: p.score
          })))}`);
        } else {
          logger.error(`❌ Session ${sessionId} not found!`);
          socket.emit('game:error', { message: 'Game session not found' });
          return;
        }

        // Check if userId is in players array
        const playerExists = beforeSession.players.some(p => p.user.toString() === userId);
        logger.info(`Player ${userId} exists in session: ${playerExists}`);
        
        if (!playerExists) {
          logger.error(`❌ Player ${userId} is NOT in the players array!`);
          logger.info(`Players in session: ${beforeSession.players.map(p => p.user.toString()).join(', ')}`);
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
          logger.error(`❌ findOneAndUpdate returned null for session: ${sessionId}, userId: ${userId}`);
          socket.emit('game:error', { message: 'Failed to update ready state' });
          return;
        }

        logger.info(`✅ AFTER UPDATE - Session status: ${session.status}`);
        logger.info(`AFTER UPDATE - Players: ${JSON.stringify(session.players.map(p => ({ 
          userId: (p.user as any)._id ? (p.user as any)._id.toString() : p.user.toString(), 
          firstName: (p.user as any).firstName,
          isReady: (p as any).isReady 
        })))}`);

        // Broadcast ready state to all players in the game room
        logger.info(`📡 Broadcasting game:player_ready to room game:${sessionId}`);
        io?.to(`game:${sessionId}`).emit('game:player_ready', {
          sessionId,
          userId,
          user: socket.data.user,
        });

        // Check if all players are ready
        const allReady = session.players.every(p => (p as any).isReady === true);
        const game = session.game as any;
        const minPlayers = game?.minPlayers || 2;

        logger.info(`========== READY CHECK ==========`);
        logger.info(`allReady: ${allReady}`);
        logger.info(`playerCount: ${session.players.length}`);
        logger.info(`minPlayers: ${minPlayers}`);
        logger.info(`status: ${session.status}`);
        logger.info(`Condition check: allReady(${allReady}) && playerCount(${session.players.length}) >= minPlayers(${minPlayers}) && status(${session.status}) === 'waiting'`);
        logger.info(`Result: ${allReady && session.players.length >= minPlayers && session.status === 'waiting'}`);

        if (allReady && session.players.length >= minPlayers && session.status === 'waiting') {
          logger.info(`========== 🎮 STARTING GAME ==========`);
          logger.info(`All conditions met! Starting game ${sessionId}`);

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

          logger.info(`Updated session status: ${updatedSession?.status}`);

          if (updatedSession && updatedSession.status === 'active') {
            const gameStartedData = {
              sessionId,
              game: updatedSession.game,
              players: updatedSession.players,
              gameData: updatedSession.gameData,
              startedAt: updatedSession.startedAt,
            };
            
            logger.info(`📡 Emitting game:started to room game:${sessionId}`);
            logger.info(`gameData has ${updatedSession.gameData?.questions?.length || 0} questions`);
            logger.info(`Broadcasting to ${roomSize} client(s) in room`);
            
            io?.to(`game:${sessionId}`).emit('game:started', gameStartedData);

            logger.info(`✅ Game auto-started and emitted: ${sessionId}`);
          } else {
            logger.info(`⚠️ Game already started by another player or update failed`);
          }
        } else {
          logger.info(`❌ Not all conditions met for starting game`);
          if (!allReady) logger.info(`  ➜ Not all players ready`);
          if (session.players.length < minPlayers) logger.info(`  ➜ Not enough players (${session.players.length}/${minPlayers})`);
          if (session.status !== 'waiting') logger.info(`  ➜ Wrong status (${session.status}, expected 'waiting')`);
        }
        logger.info(`========== END GAME:READY ==========`);
      } catch (error) {
        logger.error('❌ Game ready error:', error);
        socket.emit('game:error', { message: 'Failed to update ready state' });
      }
    });

    // Submit answer (for trivia/quiz games)
    socket.on('game:answer', (data: { sessionId: string; questionIndex: number; answer: string; timeSpent: number }) => {
      // Broadcast to game room that player answered (without revealing answer)
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
    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id}, User: ${userId}, Reason: ${reason}`);

      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          broadcastPresenceUpdate(userId, false);
          
          // Handle game session disconnect
          const sessionId = userGameSessions.get(userId);
          if (sessionId) {
            io?.to(`game:${sessionId}`).emit('game:player_disconnected', {
              sessionId,
              userId,
            });
            userGameSessions.delete(userId);
          }
        }
      }

      // Update last seen
      User.findByIdAndUpdate(userId, { lastSeen: new Date() }).catch((err) =>
        logger.error('Failed to update last seen:', err)
      );
    });
  });

  logger.info('Socket.IO initialized');
  return io;
};

// Broadcast presence update to relevant users
const broadcastPresenceUpdate = (userId: string, isOnline: boolean): void => {
  io?.emit('presence:update', {
    userId,
    isOnline,
    lastSeen: new Date().toISOString(),
  });
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
  const roomSize = io?.sockets.adapter.rooms.get(`game:${sessionId}`)?.size || 0;
  logger.info(`📡 Emitting ${event} to game room ${sessionId} (${roomSize} client(s))`);
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
  logger.info(`Message emitted to receiver ${receiverId} (skipped sender ${senderId})`);
};

// Emit game invitation
export const emitGameInvitation = (
  invitedUserId: string,
  invitation: any
): void => {
  emitToUser(invitedUserId, 'game:invitation', invitation);
  logger.info(`Game invitation sent to ${invitedUserId}`);
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
  logger.info(`✅ Game started event emitted: ${sessionId}`);
};

// Emit game ended
export const emitGameEnded = (sessionId: string, results: any): void => {
  emitToGameSession(sessionId, 'game:ended', results);
  logger.info(`Game ended: ${sessionId}`);
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
}
// Check if user is online
export const isUserOnline = (userId: string): boolean => {
  return onlineUsers.has(userId) && onlineUsers.get(userId)!.size > 0;
};

// Get IO instance
export const getIO = (): Server | null => io;