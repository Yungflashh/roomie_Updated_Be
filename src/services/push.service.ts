import { Expo, ExpoPushMessage, ExpoPushTicket, ExpoPushReceiptId } from 'expo-server-sdk';
import { User, Notification } from '../models';
import logger from '../utils/logger';

const expo = new Expo();

interface PushPayload {
  userId: string;
  notificationId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  channelId?: string;
  badge?: number;
}

class PushService {
  /**
   * Send a push notification to a single user.
   * Looks up their Expo push token, sends the notification,
   * and marks the DB record as sent.
   */
  async sendToUser(payload: PushPayload): Promise<boolean> {
    try {
      const user = await User.findById(payload.userId).select('fcmToken').lean();
      if (!user?.fcmToken) {
        logger.warn(`No push token for user ${payload.userId}, skipping push`);
        return false;
      }

      const token = user.fcmToken;

      // Validate it's a valid Expo push token
      if (!Expo.isExpoPushToken(token)) {
        logger.warn(`Invalid Expo push token for user ${payload.userId}: ${token}`);
        // Clear the invalid token
        await User.findByIdAndUpdate(payload.userId, { $unset: { fcmToken: 1 } });
        return false;
      }

      const message: ExpoPushMessage = {
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
        await Notification.findByIdAndUpdate(payload.notificationId, {
          sent: true,
          sentAt: new Date(),
        });
        logger.info(`Push sent to user ${payload.userId} (ticket: ${ticket.id})`);

        // Check receipt after a delay (fire and forget)
        if (ticket.id) {
          setTimeout(() => this.checkReceipt(ticket.id!, payload.userId), 15000);
        }

        return true;
      } else {
        // Handle error
        const errorTicket = ticket as any;
        logger.error(`Push failed for user ${payload.userId}: ${errorTicket.message}`);

        // If the token is invalid, remove it
        if (
          errorTicket.details?.error === 'DeviceNotRegistered' ||
          errorTicket.details?.error === 'InvalidCredentials'
        ) {
          logger.info(`Removing invalid token for user ${payload.userId}`);
          await User.findByIdAndUpdate(payload.userId, { $unset: { fcmToken: 1 } });
        }

        return false;
      }
    } catch (error) {
      logger.error(`Push send error for user ${payload.userId}:`, error);
      return false;
    }
  }

  /**
   * Send push notifications to multiple users at once.
   * Batches them efficiently using Expo's chunking.
   */
  async sendToUsers(
    userIds: string[],
    title: string,
    body: string,
    data?: Record<string, any>,
    channelId?: string
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    // Fetch all users' tokens in one query
    const users = await User.find(
      { _id: { $in: userIds }, fcmToken: { $exists: true, $ne: '' } },
      { _id: 1, fcmToken: 1 }
    ).lean();

    if (users.length === 0) return { sent: 0, failed: 0 };

    // Build messages
    const messages: ExpoPushMessage[] = [];
    const tokenToUserId = new Map<string, string>();

    for (const user of users) {
      const token = user.fcmToken;
      if (!token || !Expo.isExpoPushToken(token)) continue;

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
          } else {
            failed++;
            const errorTicket = ticket as any;
            if (errorTicket.details?.error === 'DeviceNotRegistered') {
              // Find and clear the bad token
              const badToken = (chunk[tickets.indexOf(ticket)] as any)?.to;
              const badUserId = tokenToUserId.get(badToken);
              if (badUserId) {
                await User.findByIdAndUpdate(badUserId, { $unset: { fcmToken: 1 } });
              }
            }
          }
        }
      } catch (error) {
        logger.error('Push batch send error:', error);
        failed += chunk.length;
      }
    }

    logger.info(`Batch push: ${sent} sent, ${failed} failed out of ${messages.length}`);
    return { sent, failed };
  }

  /**
   * Check a push receipt to see if it was delivered.
   * Called after a delay to let Expo process the notification.
   */
  private async checkReceipt(receiptId: string, userId: string): Promise<void> {
    try {
      const receipts = await expo.getPushNotificationReceiptsAsync([receiptId]);
      const receipt = receipts[receiptId];

      if (!receipt) return;

      if (receipt.status === 'error') {
        logger.warn(`Push receipt error for user ${userId}: ${receipt.message}`);

        if (
          receipt.details?.error === 'DeviceNotRegistered' ||
          receipt.details?.error === 'InvalidCredentials'
        ) {
          logger.info(`Removing stale token for user ${userId} (receipt check)`);
          await User.findByIdAndUpdate(userId, { $unset: { fcmToken: 1 } });
        }
      }
    } catch (error) {
      // Non-critical — just log
      logger.debug('Receipt check failed:', error);
    }
  }
}

export default new PushService();
