import { IGameDocument, IGameSessionDocument } from '../models';
declare class GameService {
    private detectGameType;
    getAllGames(): Promise<IGameDocument[]>;
    getGameById(gameId: string): Promise<IGameDocument>;
    getAvailableGamesForUser(userId: string): Promise<{
        available: IGameDocument[];
        locked: Array<IGameDocument & {
            reason: string;
        }>;
    }>;
    canUserPlayGame(userId: string, gameId: string): Promise<{
        canPlay: boolean;
        reason?: string;
        requiredLevel?: number;
        requiredPoints?: number;
        userLevel?: number;
        userPoints?: number;
    }>;
    sendGameInvitation(gameId: string, inviterId: string, invitedUserId: string, matchId: string): Promise<IGameSessionDocument>;
    respondToInvitation(sessionId: string, userId: string, accept: boolean): Promise<IGameSessionDocument>;
    startGameSession(sessionId: string, userId: string): Promise<IGameSessionDocument>;
    submitAnswer(sessionId: string, userId: string, questionIndex: number, answer: string, timeSpent: number): Promise<{
        correct: boolean;
        correctAnswer: string;
        points: number;
    }>;
    submitAllAnswers(sessionId: string, userId: string, answers: Array<{
        questionIndex: number;
        answer: string;
        timeSpent: number;
        correct?: boolean;
        points?: number;
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
    private finalizeGameSession;
    completeGameSession(sessionId: string): Promise<IGameSessionDocument>;
    getActiveGameSession(matchId: string): Promise<IGameSessionDocument | null>;
    getGameSession(sessionId: string): Promise<IGameSessionDocument>;
    cancelInvitation(sessionId: string, userId: string): Promise<void>;
    getUserGameHistory(userId: string, page?: number, limit?: number): Promise<{
        sessions: IGameSessionDocument[];
        pagination: any;
    }>;
    getGameLeaderboard(gameId: string, limit?: number): Promise<any[]>;
    private generateGameData;
    private generateTriviaData;
    private generateWordScrambleData;
    private generateEmojiGuessData;
    private generateSpeedMathData;
    private generateMemoryMatchData;
    private generateGeographyQuizData;
    private generateLogicMasterData;
    private generatePatternMasterData;
    private generateColorChallengeData;
    private generateQuickDrawData;
    private scrambleWord;
    private generateMathQuestion;
}
declare const _default: GameService;
export default _default;
//# sourceMappingURL=game.service.d.ts.map