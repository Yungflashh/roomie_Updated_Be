// src/services/confession.service.ts
import crypto from 'crypto';
import { Confession } from '../models/Confession';
import { RoommateGroup } from '../models/RoommateGroup';
import logger from '../utils/logger';

const HASH_SALT = 'roomie-anon-v1';
function anonHash(userId: string, confessionId: string): string {
  return crypto.createHash('sha256').update(`${HASH_SALT}:${userId}:${confessionId}`).digest('hex').slice(0, 16);
}

class ConfessionService {
  /**
   * Verify that a user is an active member of a group
   */
  private async verifyMembership(groupId: string, userId: string) {
    const group = await RoommateGroup.findById(groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    const member = group.members.find(
      (m) => m.user.toString() === userId && m.status === 'active'
    );

    if (!member) {
      throw new Error('You are not an active member of this group');
    }

    const activeCount = group.members.filter((m: any) => m.status === 'active').length;
    if (activeCount < 2) {
      throw new Error('Confessions require at least 2 active group members');
    }

    return { group, member };
  }

  /**
   * Create an anonymous confession (userId is NOT stored on the document)
   */
  async createConfession(groupId: string, userId: string, content: string, category: string) {
    try {
      // Verify membership only - userId is NOT stored
      await this.verifyMembership(groupId, userId);

      const confession = await Confession.create({
        group: groupId,
        content,
        category,
      });

      return confession;
    } catch (error: any) {
      logger.error('Create confession error:', error);
      throw new Error(error.message || 'Failed to create confession');
    }
  }

  /**
   * Get confessions for a group (paginated)
   */
  async getGroupConfessions(groupId: string, userId: string, page: number = 1, limit: number = 20, category?: string) {
    try {
      await this.verifyMembership(groupId, userId);

      const skip = (page - 1) * limit;
      const query: any = {
        group: groupId,
        isActive: true,
        isHidden: false,
      };

      if (category) {
        query.category = category;
      }

      const [confessions, total] = await Promise.all([
        Confession.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Confession.countDocuments(query),
      ]);

      return {
        confessions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      logger.error('Get group confessions error:', error);
      throw new Error(error.message || 'Failed to get confessions');
    }
  }

  /**
   * Add a reaction to a confession
   */
  async addReaction(confessionId: string, userId: string, emoji: string) {
    try {
      const confession = await Confession.findById(confessionId);
      if (!confession) {
        throw new Error('Confession not found');
      }

      await this.verifyMembership(confession.group.toString(), userId);

      const hash = anonHash(userId, confessionId);

      // Remove user's previous reaction on any other emoji (one reaction per user)
      for (const r of confession.reactions) {
        if (r.emoji !== emoji && r.reactedHashes?.includes(hash)) {
          r.count = Math.max(0, r.count - 1);
          r.reactedHashes = r.reactedHashes.filter((h: string) => h !== hash);
        }
      }

      const existingReaction = confession.reactions.find((r) => r.emoji === emoji);
      if (existingReaction) {
        if (existingReaction.reactedHashes?.includes(hash)) {
          // Already reacted with this emoji — toggle off
          existingReaction.count = Math.max(0, existingReaction.count - 1);
          existingReaction.reactedHashes = existingReaction.reactedHashes.filter((h: string) => h !== hash);
        } else {
          existingReaction.count += 1;
          existingReaction.reactedHashes = [...(existingReaction.reactedHashes || []), hash];
        }
      } else {
        confession.reactions.push({ emoji, count: 1, reactedHashes: [hash] } as any);
      }

      await confession.save();
      return confession;
    } catch (error: any) {
      logger.error('Add reaction error:', error);
      throw new Error(error.message || 'Failed to add reaction');
    }
  }

  /**
   * Add an anonymous reply to a confession
   */
  async addReply(confessionId: string, userId: string, content: string) {
    try {
      const confession = await Confession.findById(confessionId);
      if (!confession) {
        throw new Error('Confession not found');
      }

      // Verify membership - userId is NOT stored on the reply
      await this.verifyMembership(confession.group.toString(), userId);

      confession.replies.push({
        content,
        reactions: [],
        createdAt: new Date(),
      });

      await confession.save();
      return confession;
    } catch (error: any) {
      logger.error('Add reply error:', error);
      throw new Error(error.message || 'Failed to add reply');
    }
  }

  /**
   * Add a reaction to a reply
   */
  async addReplyReaction(confessionId: string, replyIndex: number, userId: string, emoji: string) {
    try {
      const confession = await Confession.findById(confessionId);
      if (!confession) {
        throw new Error('Confession not found');
      }

      await this.verifyMembership(confession.group.toString(), userId);

      const reply = confession.replies[replyIndex];
      if (!reply) {
        throw new Error('Reply not found');
      }

      const hash = anonHash(userId, `${confessionId}-reply-${replyIndex}`);
      const existingReaction = reply.reactions.find((r) => r.emoji === emoji);
      if (existingReaction) {
        if (existingReaction.reactedHashes?.includes(hash)) {
          existingReaction.count = Math.max(0, existingReaction.count - 1);
          existingReaction.reactedHashes = existingReaction.reactedHashes.filter((h: string) => h !== hash);
        } else {
          existingReaction.count += 1;
          existingReaction.reactedHashes = [...(existingReaction.reactedHashes || []), hash];
        }
      } else {
        reply.reactions.push({ emoji, count: 1, reactedHashes: [hash] } as any);
      }

      await confession.save();
      return confession;
    } catch (error: any) {
      logger.error('Add reply reaction error:', error);
      throw new Error(error.message || 'Failed to add reaction to reply');
    }
  }

  /**
   * Report a confession
   */
  async reportConfession(confessionId: string, userId: string) {
    try {
      const confession = await Confession.findById(confessionId);
      if (!confession) {
        throw new Error('Confession not found');
      }

      await this.verifyMembership(confession.group.toString(), userId);

      confession.reportCount += 1;

      // Auto-hide if report count exceeds threshold
      if (confession.reportCount > 5) {
        confession.isHidden = true;
      }

      await confession.save();
      return confession;
    } catch (error: any) {
      logger.error('Report confession error:', error);
      throw new Error(error.message || 'Failed to report confession');
    }
  }

  /**
   * Delete a confession (admin only)
   */
  async deleteConfession(confessionId: string, userId: string) {
    try {
      const confession = await Confession.findById(confessionId);
      if (!confession) {
        throw new Error('Confession not found');
      }

      // Verify user is an admin of the group
      const { member } = await this.verifyMembership(confession.group.toString(), userId);

      if (member.role !== 'admin') {
        throw new Error('Only group admins can delete confessions');
      }

      confession.isActive = false;
      await confession.save();

      return { deleted: true };
    } catch (error: any) {
      logger.error('Delete confession error:', error);
      throw new Error(error.message || 'Failed to delete confession');
    }
  }
}

export default new ConfessionService();
