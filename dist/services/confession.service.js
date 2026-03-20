"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/services/confession.service.ts
const crypto_1 = __importDefault(require("crypto"));
const Confession_1 = require("../models/Confession");
const RoommateGroup_1 = require("../models/RoommateGroup");
const logger_1 = __importDefault(require("../utils/logger"));
const HASH_SALT = 'roomie-anon-v1';
function anonHash(userId, confessionId) {
    return crypto_1.default.createHash('sha256').update(`${HASH_SALT}:${userId}:${confessionId}`).digest('hex').slice(0, 16);
}
class ConfessionService {
    /**
     * Verify that a user is an active member of a group
     */
    async verifyMembership(groupId, userId) {
        const group = await RoommateGroup_1.RoommateGroup.findById(groupId);
        if (!group) {
            throw new Error('Group not found');
        }
        const member = group.members.find((m) => m.user.toString() === userId && m.status === 'active');
        if (!member) {
            throw new Error('You are not an active member of this group');
        }
        const activeCount = group.members.filter((m) => m.status === 'active').length;
        if (activeCount < 2) {
            throw new Error('Confessions require at least 2 active group members');
        }
        return { group, member };
    }
    /**
     * Create an anonymous confession (userId is NOT stored on the document)
     */
    async createConfession(groupId, userId, content, category) {
        try {
            // Verify membership only - userId is NOT stored
            await this.verifyMembership(groupId, userId);
            const confession = await Confession_1.Confession.create({
                group: groupId,
                content,
                category,
            });
            return confession;
        }
        catch (error) {
            logger_1.default.error('Create confession error:', error);
            throw new Error(error.message || 'Failed to create confession');
        }
    }
    /**
     * Get confessions for a group (paginated)
     */
    async getGroupConfessions(groupId, userId, page = 1, limit = 20, category) {
        try {
            await this.verifyMembership(groupId, userId);
            const skip = (page - 1) * limit;
            const query = {
                group: groupId,
                isActive: true,
                isHidden: false,
            };
            if (category) {
                query.category = category;
            }
            const [confessions, total] = await Promise.all([
                Confession_1.Confession.find(query)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                Confession_1.Confession.countDocuments(query),
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
        }
        catch (error) {
            logger_1.default.error('Get group confessions error:', error);
            throw new Error(error.message || 'Failed to get confessions');
        }
    }
    /**
     * Add a reaction to a confession
     */
    async addReaction(confessionId, userId, emoji) {
        try {
            const confession = await Confession_1.Confession.findById(confessionId);
            if (!confession) {
                throw new Error('Confession not found');
            }
            await this.verifyMembership(confession.group.toString(), userId);
            const hash = anonHash(userId, confessionId);
            // Remove user's previous reaction on any other emoji (one reaction per user)
            for (const r of confession.reactions) {
                if (r.emoji !== emoji && r.reactedHashes?.includes(hash)) {
                    r.count = Math.max(0, r.count - 1);
                    r.reactedHashes = r.reactedHashes.filter((h) => h !== hash);
                }
            }
            const existingReaction = confession.reactions.find((r) => r.emoji === emoji);
            if (existingReaction) {
                if (existingReaction.reactedHashes?.includes(hash)) {
                    // Already reacted with this emoji — toggle off
                    existingReaction.count = Math.max(0, existingReaction.count - 1);
                    existingReaction.reactedHashes = existingReaction.reactedHashes.filter((h) => h !== hash);
                }
                else {
                    existingReaction.count += 1;
                    existingReaction.reactedHashes = [...(existingReaction.reactedHashes || []), hash];
                }
            }
            else {
                confession.reactions.push({ emoji, count: 1, reactedHashes: [hash] });
            }
            await confession.save();
            return confession;
        }
        catch (error) {
            logger_1.default.error('Add reaction error:', error);
            throw new Error(error.message || 'Failed to add reaction');
        }
    }
    /**
     * Add an anonymous reply to a confession
     */
    async addReply(confessionId, userId, content) {
        try {
            const confession = await Confession_1.Confession.findById(confessionId);
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
        }
        catch (error) {
            logger_1.default.error('Add reply error:', error);
            throw new Error(error.message || 'Failed to add reply');
        }
    }
    /**
     * Add a reaction to a reply
     */
    async addReplyReaction(confessionId, replyIndex, userId, emoji) {
        try {
            const confession = await Confession_1.Confession.findById(confessionId);
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
                    existingReaction.reactedHashes = existingReaction.reactedHashes.filter((h) => h !== hash);
                }
                else {
                    existingReaction.count += 1;
                    existingReaction.reactedHashes = [...(existingReaction.reactedHashes || []), hash];
                }
            }
            else {
                reply.reactions.push({ emoji, count: 1, reactedHashes: [hash] });
            }
            await confession.save();
            return confession;
        }
        catch (error) {
            logger_1.default.error('Add reply reaction error:', error);
            throw new Error(error.message || 'Failed to add reaction to reply');
        }
    }
    /**
     * Report a confession
     */
    async reportConfession(confessionId, userId) {
        try {
            const confession = await Confession_1.Confession.findById(confessionId);
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
        }
        catch (error) {
            logger_1.default.error('Report confession error:', error);
            throw new Error(error.message || 'Failed to report confession');
        }
    }
    /**
     * Delete a confession (admin only)
     */
    async deleteConfession(confessionId, userId) {
        try {
            const confession = await Confession_1.Confession.findById(confessionId);
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
        }
        catch (error) {
            logger_1.default.error('Delete confession error:', error);
            throw new Error(error.message || 'Failed to delete confession');
        }
    }
}
exports.default = new ConfessionService();
//# sourceMappingURL=confession.service.js.map