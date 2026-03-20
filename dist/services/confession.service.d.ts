declare class ConfessionService {
    /**
     * Verify that a user is an active member of a group
     */
    private verifyMembership;
    /**
     * Create an anonymous confession (userId is NOT stored on the document)
     */
    createConfession(groupId: string, userId: string, content: string, category: string): Promise<import("mongoose").Document<unknown, {}, import("../models/Confession").IConfessionDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Confession").IConfessionDocument & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * Get confessions for a group (paginated)
     */
    getGroupConfessions(groupId: string, userId: string, page?: number, limit?: number, category?: string): Promise<{
        confessions: (import("../models/Confession").IConfessionDocument & Required<{
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
     * Add a reaction to a confession
     */
    addReaction(confessionId: string, userId: string, emoji: string): Promise<import("mongoose").Document<unknown, {}, import("../models/Confession").IConfessionDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Confession").IConfessionDocument & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * Add an anonymous reply to a confession
     */
    addReply(confessionId: string, userId: string, content: string): Promise<import("mongoose").Document<unknown, {}, import("../models/Confession").IConfessionDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Confession").IConfessionDocument & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * Add a reaction to a reply
     */
    addReplyReaction(confessionId: string, replyIndex: number, userId: string, emoji: string): Promise<import("mongoose").Document<unknown, {}, import("../models/Confession").IConfessionDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Confession").IConfessionDocument & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * Report a confession
     */
    reportConfession(confessionId: string, userId: string): Promise<import("mongoose").Document<unknown, {}, import("../models/Confession").IConfessionDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Confession").IConfessionDocument & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * Delete a confession (admin only)
     */
    deleteConfession(confessionId: string, userId: string): Promise<{
        deleted: boolean;
    }>;
}
declare const _default: ConfessionService;
export default _default;
//# sourceMappingURL=confession.service.d.ts.map