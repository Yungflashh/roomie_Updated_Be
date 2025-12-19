import { IGameDocument, IGameSessionDocument } from '../models';
declare class GameService {
    /**
     * Get all available games
     */
    getAllGames(): Promise<IGameDocument[]>;
    /**
     * Get game by ID
     */
    getGameById(gameId: string): Promise<IGameDocument>;
    /**
     * Create game session
     */
    createGameSession(gameId: string, userId: string): Promise<IGameSessionDocument>;
    /**
     * Join game session
     */
    joinGameSession(sessionId: string, userId: string): Promise<IGameSessionDocument>;
    /**
     * Start game session
     */
    startGameSession(sessionId: string): Promise<IGameSessionDocument>;
    /**
     * Submit game score
     */
    submitScore(sessionId: string, userId: string, score: number): Promise<IGameSessionDocument>;
    /**
     * Complete game session
     */
    completeGameSession(sessionId: string): Promise<IGameSessionDocument>;
    /**
     * Get user game history
     */
    getUserGameHistory(userId: string, page?: number, limit?: number): Promise<{
        sessions: IGameSessionDocument[];
        pagination: any;
    }>;
    /**
     * Get game leaderboard
     */
    getGameLeaderboard(gameId: string, limit?: number): Promise<any[]>;
}
declare const _default: GameService;
export default _default;
//# sourceMappingURL=game.service.d.ts.map