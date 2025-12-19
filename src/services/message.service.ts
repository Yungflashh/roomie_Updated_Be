// src/services/message.service.ts
import { Message, Match, IMessageDocument } from '../models';
import { emitNewMessage, emitUnreadUpdate } from '../config/socket.config';
import notificationService from './notification.service';
import logger from '../utils/logger';
import fs from 'fs';

interface SendMessageData {
  matchId: string;
  senderId: string;
  receiverId: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'file';
  content?: string;
  mediaUrl?: string;
  thumbnail?: string;
  metadata?: {
    duration?: number;
    fileSize?: number;
    fileName?: string;
  };
}

class MessageService {
  /**
   * Send a message
   */
  async sendMessage(data: SendMessageData): Promise<IMessageDocument> {
    const { matchId, senderId, receiverId, type, content, mediaUrl, thumbnail, metadata } = data;

    // Verify match exists and user is part of it
    const match = await Match.findOne({
      _id: matchId,
      $or: [
        { user1: senderId, user2: receiverId },
        { user1: receiverId, user2: senderId },
      ],
      status: 'active',
    });

    if (!match) {
      throw new Error('Match not found or inactive');
    }

    // Create message
    const message = await Message.create({
      match: matchId,
      sender: senderId,
      receiver: receiverId,
      type,
      content,
      mediaUrl,
      thumbnail,
      duration: metadata?.duration,
      fileSize: metadata?.fileSize,
      fileName: metadata?.fileName,
      read: false,
    });

    // Populate sender info
    await message.populate('sender', 'firstName lastName profilePhoto');

    // Update match last message time and unread count
    const isUser1 = match.user1.toString() === senderId;
    const unreadField = isUser1 ? 'unreadCount.user2' : 'unreadCount.user1';

    await Match.findByIdAndUpdate(matchId, {
      lastMessageAt: new Date(),
      $inc: { [unreadField]: 1 },
    });

    // Emit real-time message via WebSocket
    try {
      emitNewMessage(matchId, message.toObject(), senderId, receiverId);
      
      // Get updated unread counts
      const totalUnreadMessages = await this.getUnreadCount(receiverId);
      const unreadNotifications = await notificationService.getUnreadCount(receiverId);
      
      emitUnreadUpdate(receiverId, {
        messages: totalUnreadMessages,
        notifications: unreadNotifications,
        requests: 0,
      });
    } catch (socketError) {
      logger.warn('Socket emit failed (user may be offline):', socketError);
    }

    // Create notification
    await notificationService.notifyNewMessage(senderId, receiverId, content || `Sent a ${type}`);

    logger.info(`Message sent: ${senderId} -> ${receiverId}`);

    return message;
  }

  /**
   * Get messages for a match
   */
  async getMessages(
    matchId: string,
    userId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{
    messages: IMessageDocument[];
    pagination: any;
  }> {
    const match = await Match.findOne({
      _id: matchId,
      $or: [{ user1: userId }, { user2: userId }],
    });

    if (!match) {
      throw new Error('Match not found');
    }

    const skip = (page - 1) * limit;

    const messages = await Message.find({
      match: matchId,
      deleted: false,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender receiver', 'firstName lastName profilePhoto');

    const total = await Message.countDocuments({
      match: matchId,
      deleted: false,
    });

    return {
      messages: messages.reverse(),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Mark messages as read
   */
  async markAsRead(matchId: string, userId: string): Promise<void> {
    await Message.updateMany(
      {
        match: matchId,
        receiver: userId,
        read: false,
      },
      {
        read: true,
        readAt: new Date(),
      }
    );

    const match = await Match.findById(matchId);
    if (match) {
      const isUser1 = match.user1.toString() === userId;
      const unreadField = isUser1 ? 'unreadCount.user1' : 'unreadCount.user2';
      
      await Match.findByIdAndUpdate(matchId, {
        [unreadField]: 0,
      });
    }

    logger.info(`Messages marked as read for match ${matchId} by user ${userId}`);
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await Message.findOne({
      _id: messageId,
      sender: userId,
    });

    if (!message) {
      throw new Error('Message not found or unauthorized');
    }

    message.deleted = true;
    await message.save();

    if (message.mediaUrl) {
      const filePath = `./public${message.mediaUrl}`;
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    logger.info(`Message deleted: ${messageId}`);
  }

  /**
   * Add reaction to message
   */
  async addReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    await Message.findByIdAndUpdate(messageId, {
      $pull: { reactions: { user: userId } },
    });

    await Message.findByIdAndUpdate(messageId, {
      $push: {
        reactions: {
          user: userId,
          emoji,
        },
      },
    });
  }

  /**
   * Remove reaction from message
   */
  async removeReaction(messageId: string, userId: string): Promise<void> {
    await Message.findByIdAndUpdate(messageId, {
      $pull: { reactions: { user: userId } },
    });
  }

  /**
   * Get unread message count
   */
  async getUnreadCount(userId: string): Promise<number> {
    const count = await Message.countDocuments({
      receiver: userId,
      read: false,
      deleted: false,
    });

    return count;
  }

  /**
   * Search messages
   */
  async searchMessages(
    matchId: string,
    userId: string,
    query: string
  ): Promise<IMessageDocument[]> {
    const match = await Match.findOne({
      _id: matchId,
      $or: [{ user1: userId }, { user2: userId }],
    });

    if (!match) {
      throw new Error('Match not found');
    }

    const messages = await Message.find({
      match: matchId,
      type: 'text',
      content: { $regex: query, $options: 'i' },
      deleted: false,
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('sender receiver', 'firstName lastName profilePhoto');

    return messages;
  }
}

export default new MessageService();