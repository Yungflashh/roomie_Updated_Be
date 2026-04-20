import { Server } from 'socket.io';
/**
 * Attaches Socket.IO to an existing HTTP server, wires the Redis pub/sub adapter
 * for multi-process support, and registers all event handlers.
 * Returns the `Server` instance so callers can store it on `app` if needed.
 */
export declare const initializeSocket: (server: any) => Server;
/** Emits an event to a specific user's personal room. */
export declare const emitToUser: (userId: string, event: string, data: any) => void;
/** Emits an event to all sockets in a chat room. */
export declare const emitToChat: (matchId: string, event: string, data: any) => void;
/** Emits an event to all sockets in a game session room. */
export declare const emitToGameSession: (sessionId: string, event: string, data: any) => void;
/** Delivers a new message event only to the receiver's personal room, not the sender. */
export declare const emitNewMessage: (matchId: string, message: any, senderId: string, receiverId: string) => void;
/** Delivers a game invitation to the invited user. */
export declare const emitGameInvitation: (invitedUserId: string, invitation: any) => void;
/** Notifies the inviting user of the invited user's accept/decline response. */
export declare const emitGameInvitationResponse: (userId: string, response: any) => void;
export declare const emitGameStarted: (sessionId: string, gameData: any) => void;
export declare const emitGameEnded: (sessionId: string, results: any) => void;
export declare const emitScoreUpdate: (sessionId: string, scores: any) => void;
export declare const emitNextQuestion: (sessionId: string, questionData: any) => void;
export declare const emitUnreadUpdate: (userId: string, counts: any) => void;
export declare const emitMatchNotification: (userId: string, match: any) => void;
export declare const emitMatchRequest: (userId: string, request: any) => void;
export declare const emitNotification: (userId: string, notification: any) => void;
export declare const emitNewMatch: (user1Id: string, user2Id: string, matchData: any) => void;
/** Returns whether the given user currently has at least one connected socket. */
export declare const isUserOnline: (userId: string) => Promise<boolean>;
/** Broadcasts a clan war event to each member's personal room. */
export declare const emitClanWarUpdate: (clanMemberUserIds: string[], event: string, data: any) => void;
/** Returns the active Socket.IO server instance, or null before initialisation. */
export declare const getIO: () => Server | null;
//# sourceMappingURL=socket.config.d.ts.map