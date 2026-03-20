"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.isUserOnline = exports.emitNewMatch = exports.emitNotification = exports.emitMatchRequest = exports.emitMatchNotification = exports.emitUnreadUpdate = exports.emitNextQuestion = exports.emitScoreUpdate = exports.emitGameEnded = exports.emitGameStarted = exports.emitGameInvitationResponse = exports.emitGameInvitation = exports.emitNewMessage = exports.emitToGameSession = exports.emitToChat = exports.emitToUser = exports.initializeSocket = void 0;
// src/config/socket.config.ts (Backend - Enhanced with better logging)
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = __importDefault(require("mongoose"));
const models_1 = require("../models");
const logger_1 = __importDefault(require("../utils/logger"));
let io = null;
// Store online users: Map<userId, Set<socketId>>
const onlineUsers = new Map();
// Store user's current game session: Map<userId, sessionId>
const userGameSessions = new Map();
const initializeSocket = (server) => {
    io = new socket_io_1.Server(server, {
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
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            const user = await models_1.User.findById(decoded.userId).select('_id firstName lastName profilePhoto');
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
        }
        catch (error) {
            logger_1.default.error('Socket auth error:', error);
            next(new Error('Authentication failed'));
        }
    });
    io.on('connection', (socket) => {
        const userId = socket.data.user._id;
        logger_1.default.info(`Socket connected: ${socket.id}, User: ${userId}`);
        // Track online status
        if (!onlineUsers.has(userId)) {
            onlineUsers.set(userId, new Set());
        }
        onlineUsers.get(userId).add(socket.id);
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
        // Handle presence check
        socket.on('presence:check', (userIds) => {
            const statuses = userIds.map((id) => ({
                userId: id,
                isOnline: onlineUsers.has(id) && onlineUsers.get(id).size > 0,
            }));
            socket.emit('presence:status', statuses);
        });
        // Handle presence ping
        socket.on('presence:ping', () => {
            socket.emit('presence:pong', { timestamp: Date.now() });
        });
        // ==================== GAME EVENTS ====================
        // Join game session room
        socket.on('game:join', (sessionId) => {
            socket.join(`game:${sessionId}`);
            userGameSessions.set(userId, sessionId);
            logger_1.default.info(`✅ User ${userId} (${socket.data.user.firstName}) joined game session room: game:${sessionId}`);
            // Log room state
            const roomSize = io?.sockets.adapter.rooms.get(`game:${sessionId}`)?.size || 0;
            logger_1.default.info(`📊 Room game:${sessionId} now has ${roomSize} socket(s)`);
            // Notify other players
            socket.to(`game:${sessionId}`).emit('game:player_joined', {
                sessionId,
                user: socket.data.user,
            });
        });
        // Leave game session room
        socket.on('game:leave', (sessionId) => {
            socket.leave(`game:${sessionId}`);
            userGameSessions.delete(userId);
            logger_1.default.info(`User ${userId} left game session: ${sessionId}`);
            // Notify other players
            socket.to(`game:${sessionId}`).emit('game:player_left', {
                sessionId,
                userId,
            });
        });
        // Player ready - with auto-start logic
        socket.on('game:ready', async (sessionId) => {
            try {
                logger_1.default.info(`========== GAME:READY EVENT ==========`);
                logger_1.default.info(`Player ${userId} (${socket.data.user.firstName}) clicked ready for session ${sessionId}`);
                logger_1.default.info(`Socket ID: ${socket.id}`);
                // Check room membership
                const roomSize = io?.sockets.adapter.rooms.get(`game:${sessionId}`)?.size || 0;
                const socketsInRoom = Array.from(io?.sockets.adapter.rooms.get(`game:${sessionId}`) || []);
                logger_1.default.info(`📊 Room game:${sessionId} has ${roomSize} socket(s): ${socketsInRoom.join(', ')}`);
                // First, let's check the session state BEFORE update
                const beforeSession = await models_1.GameSession.findById(sessionId);
                if (beforeSession) {
                    logger_1.default.info(`BEFORE UPDATE - Session status: ${beforeSession.status}`);
                    logger_1.default.info(`BEFORE UPDATE - Players: ${JSON.stringify(beforeSession.players.map(p => ({
                        userId: p.user.toString(),
                        isReady: p.isReady,
                        score: p.score
                    })))}`);
                }
                else {
                    logger_1.default.error(`❌ Session ${sessionId} not found!`);
                    socket.emit('game:error', { message: 'Game session not found' });
                    return;
                }
                // Check if userId is in players array
                const playerExists = beforeSession.players.some(p => p.user.toString() === userId);
                logger_1.default.info(`Player ${userId} exists in session: ${playerExists}`);
                if (!playerExists) {
                    logger_1.default.error(`❌ Player ${userId} is NOT in the players array!`);
                    logger_1.default.info(`Players in session: ${beforeSession.players.map(p => p.user.toString()).join(', ')}`);
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
                    logger_1.default.error(`❌ findOneAndUpdate returned null for session: ${sessionId}, userId: ${userId}`);
                    socket.emit('game:error', { message: 'Failed to update ready state' });
                    return;
                }
                logger_1.default.info(`✅ AFTER UPDATE - Session status: ${session.status}`);
                logger_1.default.info(`AFTER UPDATE - Players: ${JSON.stringify(session.players.map(p => ({
                    userId: p.user._id ? p.user._id.toString() : p.user.toString(),
                    firstName: p.user.firstName,
                    isReady: p.isReady
                })))}`);
                // Broadcast ready state to all players in the game room
                logger_1.default.info(`📡 Broadcasting game:player_ready to room game:${sessionId}`);
                io?.to(`game:${sessionId}`).emit('game:player_ready', {
                    sessionId,
                    userId,
                    user: socket.data.user,
                });
                // Check if all players are ready
                const allReady = session.players.every(p => p.isReady === true);
                const game = session.game;
                const minPlayers = game?.minPlayers || 2;
                logger_1.default.info(`========== READY CHECK ==========`);
                logger_1.default.info(`allReady: ${allReady}`);
                logger_1.default.info(`playerCount: ${session.players.length}`);
                logger_1.default.info(`minPlayers: ${minPlayers}`);
                logger_1.default.info(`status: ${session.status}`);
                logger_1.default.info(`Condition check: allReady(${allReady}) && playerCount(${session.players.length}) >= minPlayers(${minPlayers}) && status(${session.status}) === 'waiting'`);
                logger_1.default.info(`Result: ${allReady && session.players.length >= minPlayers && session.status === 'waiting'}`);
                if (allReady && session.players.length >= minPlayers && session.status === 'waiting') {
                    logger_1.default.info(`========== 🎮 STARTING GAME ==========`);
                    logger_1.default.info(`All conditions met! Starting game ${sessionId}`);
                    // Auto-start the game with atomic update
                    const updatedSession = await models_1.GameSession.findOneAndUpdate({ _id: sessionId, status: 'waiting' }, {
                        $set: {
                            status: 'active',
                            startedAt: new Date(),
                        }
                    }, { new: true })
                        .populate('game')
                        .populate('players.user', 'firstName lastName profilePhoto');
                    logger_1.default.info(`Updated session status: ${updatedSession?.status}`);
                    if (updatedSession && updatedSession.status === 'active') {
                        const gameStartedData = {
                            sessionId,
                            game: updatedSession.game,
                            players: updatedSession.players,
                            gameData: updatedSession.gameData,
                            startedAt: updatedSession.startedAt,
                        };
                        logger_1.default.info(`📡 Emitting game:started to room game:${sessionId}`);
                        logger_1.default.info(`gameData has ${updatedSession.gameData?.questions?.length || 0} questions`);
                        logger_1.default.info(`Broadcasting to ${roomSize} client(s) in room`);
                        io?.to(`game:${sessionId}`).emit('game:started', gameStartedData);
                        logger_1.default.info(`✅ Game auto-started and emitted: ${sessionId}`);
                    }
                    else {
                        logger_1.default.info(`⚠️ Game already started by another player or update failed`);
                    }
                }
                else {
                    logger_1.default.info(`❌ Not all conditions met for starting game`);
                    if (!allReady)
                        logger_1.default.info(`  ➜ Not all players ready`);
                    if (session.players.length < minPlayers)
                        logger_1.default.info(`  ➜ Not enough players (${session.players.length}/${minPlayers})`);
                    if (session.status !== 'waiting')
                        logger_1.default.info(`  ➜ Wrong status (${session.status}, expected 'waiting')`);
                }
                logger_1.default.info(`========== END GAME:READY ==========`);
            }
            catch (error) {
                logger_1.default.error('❌ Game ready error:', error);
                socket.emit('game:error', { message: 'Failed to update ready state' });
            }
        });
        // Submit answer (for trivia/quiz games)
        socket.on('game:answer', (data) => {
            // Broadcast to game room that player answered (without revealing answer)
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
        socket.on('disconnect', (reason) => {
            logger_1.default.info(`Socket disconnected: ${socket.id}, User: ${userId}, Reason: ${reason}`);
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
            models_1.User.findByIdAndUpdate(userId, { lastSeen: new Date() }).catch((err) => logger_1.default.error('Failed to update last seen:', err));
        });
    });
    logger_1.default.info('Socket.IO initialized');
    return io;
};
exports.initializeSocket = initializeSocket;
// Broadcast presence update to relevant users
const broadcastPresenceUpdate = (userId, isOnline) => {
    io?.emit('presence:update', {
        userId,
        isOnline,
        lastSeen: new Date().toISOString(),
    });
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
    const roomSize = io?.sockets.adapter.rooms.get(`game:${sessionId}`)?.size || 0;
    logger_1.default.info(`📡 Emitting ${event} to game room ${sessionId} (${roomSize} client(s))`);
    io?.to(`game:${sessionId}`).emit(event, data);
};
exports.emitToGameSession = emitToGameSession;
// Emit new message - ONLY to receiver
const emitNewMessage = (matchId, message, senderId, receiverId) => {
    (0, exports.emitToUser)(receiverId, 'message:new', {
        ...message,
        matchId,
    });
    logger_1.default.info(`Message emitted to receiver ${receiverId} (skipped sender ${senderId})`);
};
exports.emitNewMessage = emitNewMessage;
// Emit game invitation
const emitGameInvitation = (invitedUserId, invitation) => {
    (0, exports.emitToUser)(invitedUserId, 'game:invitation', invitation);
    logger_1.default.info(`Game invitation sent to ${invitedUserId}`);
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
    logger_1.default.info(`✅ Game started event emitted: ${sessionId}`);
};
exports.emitGameStarted = emitGameStarted;
// Emit game ended
const emitGameEnded = (sessionId, results) => {
    (0, exports.emitToGameSession)(sessionId, 'game:ended', results);
    logger_1.default.info(`Game ended: ${sessionId}`);
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
// Check if user is online
const isUserOnline = (userId) => {
    return onlineUsers.has(userId) && onlineUsers.get(userId).size > 0;
};
exports.isUserOnline = isUserOnline;
// Get IO instance
const getIO = () => io;
exports.getIO = getIO;
//# sourceMappingURL=socket.config.js.map