import { IMessageDocument } from '../models';
interface SendMessageData {
    matchId: string;
    senderId: string;
    receiverId: string;
    type: 'text' | 'image' | 'video' | 'audio' | 'file';
    content?: string;
    mediaUrl?: string;
    mediaHash?: string;
    thumbnailUrl?: string;
    metadata?: any;
}
declare class MessageService {
    /**
     * Send a message
     */
    sendMessage(data: SendMessageData): Promise<IMessageDocument>;
    /**
     * Get messages for a match
     */
    getMessages(matchId: string, userId: string, page?: number, limit?: number): Promise<{
        messages: IMessageDocument[];
        pagination: any;
    }>;
    /**
     * Mark messages as read
     */
    markAsRead(matchId: string, userId: string): Promise<void>;
    /**
     * Delete a message
     */
    deleteMessage(messageId: string, userId: string): Promise<void>;
    /**
     * Add reaction to message
     */
    addReaction(messageId: string, userId: string, emoji: string): Promise<void>;
    /**
     * Remove reaction from message
     */
    removeReaction(messageId: string, userId: string): Promise<void>;
    /**
     * Get unread message count
     */
    getUnreadCount(userId: string): Promise<number>;
    /**
     * Search messages
     */
    searchMessages(matchId: string, userId: string, query: string): Promise<IMessageDocument[]>;
}
declare const _default: MessageService;
export default _default;
//# sourceMappingURL=message.service.d.ts.map