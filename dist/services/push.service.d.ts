interface PushPayload {
    userId: string;
    notificationId: string;
    title: string;
    body: string;
    data?: Record<string, any>;
    channelId?: string;
    badge?: number;
}
declare class PushService {
    /**
     * Send a push notification to a single user.
     * Looks up their Expo push token, sends the notification,
     * and marks the DB record as sent.
     */
    sendToUser(payload: PushPayload): Promise<boolean>;
    /**
     * Send push notifications to multiple users at once.
     * Batches them efficiently using Expo's chunking.
     */
    sendToUsers(userIds: string[], title: string, body: string, data?: Record<string, any>, channelId?: string): Promise<{
        sent: number;
        failed: number;
    }>;
    /**
     * Check a push receipt to see if it was delivered.
     * Called after a delay to let Expo process the notification.
     */
    private checkReceipt;
}
declare const _default: PushService;
export default _default;
//# sourceMappingURL=push.service.d.ts.map