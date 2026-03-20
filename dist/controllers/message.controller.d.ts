import { Response } from 'express';
import { AuthRequest } from '../types';
declare class MessageController {
    /**
     * Send message
     */
    sendMessage(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Cancel a pending media upload (within the 4s window)
     */
    cancelPendingUpload(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Clear chat (soft delete all messages for the requesting user)
     */
    clearChat(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get messages
     */
    getMessages(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Mark messages as read
     */
    markAsRead(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Delete message
     */
    deleteMessage(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Add reaction
     */
    addReaction(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Remove reaction
     */
    removeReaction(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get unread count
     */
    getUnreadCount(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Search messages
     */
    searchMessages(req: AuthRequest, res: Response): Promise<void>;
}
declare const _default: MessageController;
export default _default;
//# sourceMappingURL=message.controller.d.ts.map