"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const expo_server_sdk_1 = require("expo-server-sdk");
const models_1 = require("../models");
const logger_1 = __importDefault(require("../utils/logger"));
const expo = new expo_server_sdk_1.Expo();
class PushService {
    /**
     * Send a push notification to a single user.
     * Looks up their Expo push token, sends the notification,
     * and marks the DB record as sent.
     */
    async sendToUser(payload) {
        try {
            const user = await models_1.User.findById(payload.userId).select('fcmToken').lean();
            if (!user?.fcmToken) {
                logger_1.default.warn(`No push token for user ${payload.userId}, skipping push`);
                return false;
            }
            const token = user.fcmToken;
            // Validate it's a valid Expo push token
            if (!expo_server_sdk_1.Expo.isExpoPushToken(token)) {
                logger_1.default.warn(`Invalid Expo push token for user ${payload.userId}: ${token}`);
                // Clear the invalid token
                await models_1.User.findByIdAndUpdate(payload.userId, { $unset: { fcmToken: 1 } });
                return false;
            }
            const message = {
                to: token,
                sound: 'default',
                title: payload.title,
                body: payload.body,
                data: {
                    ...payload.data,
                    notificationId: payload.notificationId,
                },
                channelId: payload.channelId || 'default',
                priority: 'high',
            };
            if (payload.badge !== undefined) {
                message.badge = payload.badge;
            }
            const [ticket] = await expo.sendPushNotificationsAsync([message]);
            if (ticket.status === 'ok') {
                // Mark notification as sent in DB
                await models_1.Notification.findByIdAndUpdate(payload.notificationId, {
                    sent: true,
                    sentAt: new Date(),
                });
                logger_1.default.info(`Push sent to user ${payload.userId} (ticket: ${ticket.id})`);
                // Check receipt after a delay (fire and forget)
                if (ticket.id) {
                    setTimeout(() => this.checkReceipt(ticket.id, payload.userId), 15000);
                }
                return true;
            }
            else {
                // Handle error
                const errorTicket = ticket;
                logger_1.default.error(`Push failed for user ${payload.userId}: ${errorTicket.message}`);
                // If the token is invalid, remove it
                if (errorTicket.details?.error === 'DeviceNotRegistered' ||
                    errorTicket.details?.error === 'InvalidCredentials') {
                    logger_1.default.info(`Removing invalid token for user ${payload.userId}`);
                    await models_1.User.findByIdAndUpdate(payload.userId, { $unset: { fcmToken: 1 } });
                }
                return false;
            }
        }
        catch (error) {
            logger_1.default.error(`Push send error for user ${payload.userId}:`, error);
            return false;
        }
    }
    /**
     * Send push notifications to multiple users at once.
     * Batches them efficiently using Expo's chunking.
     */
    async sendToUsers(userIds, title, body, data, channelId) {
        let sent = 0;
        let failed = 0;
        // Fetch all users' tokens in one query
        const users = await models_1.User.find({ _id: { $in: userIds }, fcmToken: { $exists: true, $ne: '' } }, { _id: 1, fcmToken: 1 }).lean();
        if (users.length === 0)
            return { sent: 0, failed: 0 };
        // Build messages
        const messages = [];
        const tokenToUserId = new Map();
        for (const user of users) {
            const token = user.fcmToken;
            if (!token || !expo_server_sdk_1.Expo.isExpoPushToken(token))
                continue;
            messages.push({
                to: token,
                sound: 'default',
                title,
                body,
                data: data || {},
                channelId: channelId || 'default',
                priority: 'high',
            });
            tokenToUserId.set(token, user._id.toString());
        }
        // Send in chunks (Expo recommends max 100 per request)
        const chunks = expo.chunkPushNotifications(messages);
        for (const chunk of chunks) {
            try {
                const tickets = await expo.sendPushNotificationsAsync(chunk);
                for (const ticket of tickets) {
                    if (ticket.status === 'ok') {
                        sent++;
                    }
                    else {
                        failed++;
                        const errorTicket = ticket;
                        if (errorTicket.details?.error === 'DeviceNotRegistered') {
                            // Find and clear the bad token
                            const badToken = chunk[tickets.indexOf(ticket)]?.to;
                            const badUserId = tokenToUserId.get(badToken);
                            if (badUserId) {
                                await models_1.User.findByIdAndUpdate(badUserId, { $unset: { fcmToken: 1 } });
                            }
                        }
                    }
                }
            }
            catch (error) {
                logger_1.default.error('Push batch send error:', error);
                failed += chunk.length;
            }
        }
        logger_1.default.info(`Batch push: ${sent} sent, ${failed} failed out of ${messages.length}`);
        return { sent, failed };
    }
    /**
     * Check a push receipt to see if it was delivered.
     * Called after a delay to let Expo process the notification.
     */
    async checkReceipt(receiptId, userId) {
        try {
            const receipts = await expo.getPushNotificationReceiptsAsync([receiptId]);
            const receipt = receipts[receiptId];
            if (!receipt)
                return;
            if (receipt.status === 'error') {
                logger_1.default.warn(`Push receipt error for user ${userId}: ${receipt.message}`);
                if (receipt.details?.error === 'DeviceNotRegistered' ||
                    receipt.details?.error === 'InvalidCredentials') {
                    logger_1.default.info(`Removing stale token for user ${userId} (receipt check)`);
                    await models_1.User.findByIdAndUpdate(userId, { $unset: { fcmToken: 1 } });
                }
            }
        }
        catch (error) {
            // Non-critical — just log
            logger_1.default.debug('Receipt check failed:', error);
        }
    }
}
exports.default = new PushService();
//# sourceMappingURL=push.service.js.map