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
     * Get games available for user (based on level)
     */
    getAvailableGamesForUser(userId: string): Promise<{
        available: IGameDocument[];
        locked: Array<IGameDocument & {
            reason: string;
        }>;
    }>;
    /**
     * Check if user can play game (level + points)
     */
    canUserPlayGame(userId: string, gameId: string): Promise<{
        canPlay: boolean;
        reason?: string;
        requiredLevel?: number;
        requiredPoints?: number;
        userLevel?: number;
        userPoints?: number;
    }>;
    /**
     * Send game invitation (with points check)
     */
    sendGameInvitation(gameId: string, inviterId: string, invitedUserId: string, matchId: string): Promise<IGameSessionDocument>;
    /**
     * Respond to game invitation
     */
    respondToInvitation(sessionId: string, userId: string, accept: boolean): Promise<IGameSessionDocument>;
    /**
     * Start game session (deduct points from both players)
     */
    startGameSession(sessionId: string, userId: string): Promise<IGameSessionDocument>;
    /**
     * Submit game answer (for trivia-type games)
     */
    submitAnswer(sessionId: string, userId: string, questionIndex: number, answer: string, timeSpent: number): Promise<{
        correct: boolean;
        correctAnswer: string;
        points: number;
    }>;
    /**
     * Submit all answers at once when player completes
     */
    submitAllAnswers(sessionId: string, userId: string, answers: Array<{
        questionIndex: number;
        answer: string;
        timeSpent: number;
    }>): Promise<{
        score: number;
        correctCount: number;
        results: Array<{
            questionIndex: number;
            correct: boolean;
            correctAnswer: string;
            points: number;
        }>;
    }>;
    /**
     * Finalize game session (award points to winner)
     */
    private finalizeGameSession;
    /**
     * Complete game session
     */
    completeGameSession(sessionId: string): Promise<IGameSessionDocument>;
    /**
     * Get active game session for a match
     */
    getActiveGameSession(matchId: string): Promise<IGameSessionDocument | null>;
    /**
     * Get game session by ID
     */
    getGameSession(sessionId: string): Promise<IGameSessionDocument>;
    /**
     * Cancel game invitation
     */
    cancelInvitation(sessionId: string, userId: string): Promise<void>;
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
    /**
     * Generate game data based on game type
     */
    private generateGameData;
    private scrambleWord;
    private generateMathQuestion;
}
declare const _default: GameService;
export default _default;
//# sourceMappingURL=game.service.d.ts.map