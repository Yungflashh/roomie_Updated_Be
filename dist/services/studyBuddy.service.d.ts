declare class StudyBuddyService {
    /**
     * Get all available categories
     */
    getCategories(): {
        key: string;
        label: string;
        icon: string;
    }[];
    /**
     * Find study buddies based on category and user occupation matching
     */
    findStudyBuddies(userId: string, category: string): Promise<(import("../models").IUserDocument & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    /**
     * Create a solo study session
     */
    createSoloSession(userId: string, category: string, questionCount?: number): Promise<import("mongoose").Document<unknown, {}, import("../models").IStudySessionDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../models").IStudySessionDocument & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * Create a challenge session against another user
     */
    createChallengeSession(userId: string, opponentId: string, category: string, questionCount?: number): Promise<import("mongoose").Document<unknown, {}, import("../models").IStudySessionDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../models").IStudySessionDocument & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * Respond to a challenge invitation
     */
    respondToChallenge(sessionId: string, userId: string, accept: boolean): Promise<import("mongoose").Document<unknown, {}, import("../models").IStudySessionDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../models").IStudySessionDocument & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * Submit answers for a session
     */
    submitAnswers(sessionId: string, userId: string, answers: Array<{
        questionIndex: number;
        answer: string;
        timeSpent: number;
    }>): Promise<import("mongoose").Document<unknown, {}, import("../models").IStudySessionDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../models").IStudySessionDocument & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * Get a session by ID with populated fields
     */
    getSession(sessionId: string): Promise<import("mongoose").Document<unknown, {}, import("../models").IStudySessionDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../models").IStudySessionDocument & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * Get user's session history
     */
    getUserHistory(userId: string, page?: number, limit?: number): Promise<{
        sessions: (import("../models").IStudySessionDocument & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    /**
     * Get leaderboard for a category
     */
    getLeaderboard(category: string, limit?: number): Promise<any[]>;
    /**
     * Pick random questions from the question bank
     */
    private getRandomQuestions;
}
declare const _default: StudyBuddyService;
export default _default;
//# sourceMappingURL=studyBuddy.service.d.ts.map