"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.emitClanWarUpdate = exports.isUserOnline = exports.emitNewMatch = exports.emitNotification = exports.emitMatchRequest = exports.emitMatchNotification = exports.emitUnreadUpdate = exports.emitNextQuestion = exports.emitScoreUpdate = exports.emitGameEnded = exports.emitGameStarted = exports.emitGameInvitationResponse = exports.emitGameInvitation = exports.emitNewMessage = exports.emitToGameSession = exports.emitToChat = exports.emitToUser = exports.initializeSocket = void 0;
// src/config/socket.config.ts (Scaled for 500-1000 concurrent users)
const socket_io_1 = require("socket.io");
const redis_adapter_1 = require("@socket.io/redis-adapter");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = __importDefault(require("mongoose"));
const models_1 = require("../models");
const logger_1 = __importDefault(require("../utils/logger"));
const redis_1 = require("./redis");
let io = null;
// Redis key prefixes for online tracking
const ONLINE_PREFIX = 'online:';
const GAME_SESSION_PREFIX = 'gamesession:';
const ONLINE_TTL = 300; // 5 minutes TTL as safety net
// ==================== REDIS-BASED ONLINE TRACKING ====================
const addOnlineUser = async (userId, socketId) => {
    await redis_1.redisClient.sadd(`${ONLINE_PREFIX}${userId}`, socketId);
    await redis_1.redisClient.expire(`${ONLINE_PREFIX}${userId}`, ONLINE_TTL);
};
const removeOnlineSocket = async (userId, socketId) => {
    await redis_1.redisClient.srem(`${ONLINE_PREFIX}${userId}`, socketId);
    const remaining = await redis_1.redisClient.scard(`${ONLINE_PREFIX}${userId}`);
    if (remaining === 0) {
        await redis_1.redisClient.del(`${ONLINE_PREFIX}${userId}`);
        return true; // user fully offline
    }
    return false;
};
const isOnline = async (userId) => {
    const count = await redis_1.redisClient.scard(`${ONLINE_PREFIX}${userId}`);
    return count > 0;
};
const setGameSession = async (userId, sessionId) => {
    await redis_1.redisClient.set(`${GAME_SESSION_PREFIX}${userId}`, sessionId, 'EX', 3600);
};
const getGameSession = async (userId) => {
    return redis_1.redisClient.get(`${GAME_SESSION_PREFIX}${userId}`);
};
const removeGameSession = async (userId) => {
    await redis_1.redisClient.del(`${GAME_SESSION_PREFIX}${userId}`);
};
// ==================== SOCKET INITIALIZATION ====================
const initializeSocket = (server) => {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || '*',
            methods: ['GET', 'POST'],
        },
        pingTimeout: 60000,
        pingInterval: 25000,
    });
    // Wire up Redis adapter for multi-process support
    io.adapter((0, redis_adapter_1.createAdapter)(redis_1.redisPubClient, redis_1.redisSubClient));
    logger_1.default.info('Socket.IO Redis adapter connected');
    // Authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication required'));
            }
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            const user = await models_1.User.findById(decoded.userId).select('_id firstName lastName profilePhoto privacySettings');
            if (!user) {
                return next(new Error('User not found'));
            }
            socket.data.user = {
                _id: user._id.toString(),
                firstName: user.firstName,
                lastName: user.lastName,
                profilePhoto: user.profilePhoto,
                privacySettings: user.privacySettings,
            };
            next();
        }
        catch (error) {
            logger_1.default.error('Socket auth error:', error);
            next(new Error('Authentication failed'));
        }
    });
    io.on('connection', (socket) => {
        const userId = socket.data.user._id;
        logger_1.default.info(`Socket connected: ${socket.id}, User: ${userId}`);
        // Track online status in Redis
        addOnlineUser(userId, socket.id);
        // Join personal room
        socket.join(`user:${userId}`);
        // Broadcast online status
        broadcastPresenceUpdate(userId, true);
        // Handle joining chat room
        socket.on('join:chat', (matchId) => {
            socket.join(`chat:${matchId}`);
            logger_1.default.info(`User ${userId} joined chat: ${matchId}`);
        });
        // Handle leaving chat room
        socket.on('leave:chat', (matchId) => {
            socket.leave(`chat:${matchId}`);
            logger_1.default.info(`User ${userId} left chat: ${matchId}`);
        });
        // Handle typing indicators
        socket.on('typing:start', (data) => {
            (0, exports.emitToUser)(data.receiverId, 'typing:start', {
                matchId: data.matchId,
                userId,
                user: socket.data.user,
                activity: data.activity || 'typing',
            });
        });
        socket.on('typing:stop', (data) => {
            (0, exports.emitToUser)(data.receiverId, 'typing:stop', {
                matchId: data.matchId,
                userId,
            });
        });
        // Handle message read
        socket.on('message:read', (data) => {
            socket.to(`chat:${data.matchId}`).emit('message:read', {
                matchId: data.matchId,
                messageIds: data.messageIds,
                readBy: userId,
                readAt: new Date().toISOString(),
            });
        });
        // Handle presence check (respects privacy settings)
        socket.on('presence:check', async (userIds) => {
            try {
                const users = await models_1.User.find({ _id: { $in: userIds } }).select('privacySettings lastSeen').lean();
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
            }
            catch {
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
        socket.on('game:join', (sessionId) => {
            socket.join(`game:${sessionId}`);
            setGameSession(userId, sessionId);
            logger_1.default.info(`User ${userId} (${socket.data.user.firstName}) joined game session room: game:${sessionId}`);
            const roomSize = io?.sockets.adapter.rooms.get(`game:${sessionId}`)?.size || 0;
            logger_1.default.info(`Room game:${sessionId} now has ${roomSize} socket(s)`);
            socket.to(`game:${sessionId}`).emit('game:player_joined', {
                sessionId,
                user: socket.data.user,
            });
        });
        // Leave game session room
        socket.on('game:leave', (sessionId) => {
            socket.leave(`game:${sessionId}`);
            removeGameSession(userId);
            logger_1.default.info(`User ${userId} left game session: ${sessionId}`);
            socket.to(`game:${sessionId}`).emit('game:player_left', {
                sessionId,
                userId,
            });
        });
        // Player ready - with auto-start logic
        socket.on('game:ready', async (sessionId) => {
            try {
                logger_1.default.info(`Player ${userId} clicked ready for session ${sessionId}`);
                const roomSize = io?.sockets.adapter.rooms.get(`game:${sessionId}`)?.size || 0;
                const beforeSession = await models_1.GameSession.findById(sessionId);
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
                const session = await models_1.GameSession.findOneAndUpdate({
                    _id: sessionId,
                    'players.user': new mongoose_1.default.Types.ObjectId(userId),
                }, {
                    $set: { 'players.$.isReady': true }
                }, { new: true })
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
                const allReady = session.players.every(p => p.isReady === true);
                const game = session.game;
                const minPlayers = game?.minPlayers || 2;
                if (allReady && session.players.length >= minPlayers && session.status === 'waiting') {
                    logger_1.default.info(`All players ready, starting game ${sessionId}`);
                    // Auto-start the game with atomic update
                    const updatedSession = await models_1.GameSession.findOneAndUpdate({ _id: sessionId, status: 'waiting' }, {
                        $set: {
                            status: 'active',
                            startedAt: new Date(),
                        }
                    }, { new: true })
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
                        logger_1.default.info(`Game auto-started: ${sessionId}`);
                    }
                }
            }
            catch (error) {
                logger_1.default.error('Game ready error:', error);
                socket.emit('game:error', { message: 'Failed to update ready state' });
            }
        });
        // Submit answer (for trivia/quiz games)
        socket.on('game:answer', (data) => {
            socket.to(`game:${data.sessionId}`).emit('game:player_answered', {
                sessionId: data.sessionId,
                userId,
                questionIndex: data.questionIndex,
            });
        });
        // Game action (generic for different game types)
        socket.on('game:action', (data) => {
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
            logger_1.default.info(`Socket disconnected: ${socket.id}, User: ${userId}, Reason: ${reason}`);
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
            models_1.User.findByIdAndUpdate(userId, { lastSeen: new Date() }).catch((err) => logger_1.default.error('Failed to update last seen:', err));
        });
    });
    logger_1.default.info('Socket.IO initialized with Redis adapter');
    return io;
};
exports.initializeSocket = initializeSocket;
// Broadcast presence update only to matched users (respects privacy settings)
const broadcastPresenceUpdate = async (userId, isOnlineStatus) => {
    try {
        const user = await models_1.User.findById(userId).select('privacySettings').lean();
        const showOnline = user?.privacySettings?.showOnlineStatus !== false;
        const showLastSeen = user?.privacySettings?.showLastSeen !== false;
        // Only notify users who are matched with this user, not everyone
        const matches = await models_1.Match.find({
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
    }
    catch {
        // Non-critical — skip on error
    }
};
// Emit to specific user's room
const emitToUser = (userId, event, data) => {
    io?.to(`user:${userId}`).emit(event, data);
};
exports.emitToUser = emitToUser;
// Emit to chat room
const emitToChat = (matchId, event, data) => {
    io?.to(`chat:${matchId}`).emit(event, data);
};
exports.emitToChat = emitToChat;
// Emit to game session room
const emitToGameSession = (sessionId, event, data) => {
    io?.to(`game:${sessionId}`).emit(event, data);
};
exports.emitToGameSession = emitToGameSession;
// Emit new message - ONLY to receiver
const emitNewMessage = (matchId, message, senderId, receiverId) => {
    (0, exports.emitToUser)(receiverId, 'message:new', {
        ...message,
        matchId,
    });
};
exports.emitNewMessage = emitNewMessage;
// Emit game invitation
const emitGameInvitation = (invitedUserId, invitation) => {
    (0, exports.emitToUser)(invitedUserId, 'game:invitation', invitation);
};
exports.emitGameInvitation = emitGameInvitation;
// Emit game invitation response
const emitGameInvitationResponse = (userId, response) => {
    (0, exports.emitToUser)(userId, 'game:invitation_response', response);
};
exports.emitGameInvitationResponse = emitGameInvitationResponse;
// Emit game started
const emitGameStarted = (sessionId, gameData) => {
    (0, exports.emitToGameSession)(sessionId, 'game:started', gameData);
};
exports.emitGameStarted = emitGameStarted;
// Emit game ended
const emitGameEnded = (sessionId, results) => {
    (0, exports.emitToGameSession)(sessionId, 'game:ended', results);
};
exports.emitGameEnded = emitGameEnded;
// Emit score update
const emitScoreUpdate = (sessionId, scores) => {
    (0, exports.emitToGameSession)(sessionId, 'game:score_update', scores);
};
exports.emitScoreUpdate = emitScoreUpdate;
// Emit next question (for trivia games)
const emitNextQuestion = (sessionId, questionData) => {
    (0, exports.emitToGameSession)(sessionId, 'game:next_question', questionData);
};
exports.emitNextQuestion = emitNextQuestion;
// Emit unread counts update
const emitUnreadUpdate = (userId, counts) => {
    (0, exports.emitToUser)(userId, 'unread:update', counts);
};
exports.emitUnreadUpdate = emitUnreadUpdate;
// Emit match notification
const emitMatchNotification = (userId, match) => {
    (0, exports.emitToUser)(userId, 'match:new', match);
};
exports.emitMatchNotification = emitMatchNotification;
// Emit match request notification
const emitMatchRequest = (userId, request) => {
    (0, exports.emitToUser)(userId, 'match:request', request);
};
exports.emitMatchRequest = emitMatchRequest;
// Emit notification
const emitNotification = (userId, notification) => {
    (0, exports.emitToUser)(userId, 'notification:new', notification);
};
exports.emitNotification = emitNotification;
const emitNewMatch = (user1Id, user2Id, matchData) => {
    (0, exports.emitToUser)(user1Id, 'match:new', matchData);
    (0, exports.emitToUser)(user2Id, 'match:new', matchData);
};
exports.emitNewMatch = emitNewMatch;
// Check if user is online (async now - uses Redis)
const isUserOnline = async (userId) => {
    return isOnline(userId);
};
exports.isUserOnline = isUserOnline;
// Emit clan war update to all members of a clan
const emitClanWarUpdate = (clanMemberUserIds, event, data) => {
    for (const uid of clanMemberUserIds) {
        (0, exports.emitToUser)(uid, event, data);
    }
};
exports.emitClanWarUpdate = emitClanWarUpdate;
// Get IO instance
const getIO = () => io;
exports.getIO = getIO;
//# sourceMappingURL=socket.config.js.map