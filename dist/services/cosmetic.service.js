"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Cosmetic_1 = require("../models/Cosmetic");
const User_1 = require("../models/User");
const points_service_1 = __importDefault(require("./points.service"));
const logger_1 = __importDefault(require("../utils/logger"));
class CosmeticService {
    /**
     * Get all active shop items, optionally filtered by type
     */
    async getShopItems(type) {
        const query = { isActive: true };
        if (type)
            query.type = type;
        return Cosmetic_1.Cosmetic.find(query).sort({ sortOrder: 1, rarity: 1 }).lean();
    }
    /**
     * Get user's owned cosmetics with full details
     */
    async getInventory(userId) {
        const user = await User_1.User.findById(userId).select('ownedCosmetics equippedCosmetics');
        if (!user)
            throw new Error('User not found');
        const ownedIds = user.ownedCosmetics || [];
        const owned = ownedIds.length > 0
            ? await Cosmetic_1.Cosmetic.find({ _id: { $in: ownedIds } }).lean()
            : [];
        const eq = user.equippedCosmetics || {};
        const equippedIds = [eq.profileFrame, eq.chatBubble, eq.badge, eq.nameEffect].filter((id) => !!id);
        logger_1.default.info(`Inventory for ${userId}: owned=${ownedIds.length}, equipped=[${equippedIds.join(',')}]`);
        const equippedDocs = equippedIds.length > 0
            ? await Cosmetic_1.Cosmetic.find({ _id: { $in: equippedIds } }).lean()
            : [];
        const equippedMap = new Map(equippedDocs.map(d => [d._id.toString(), d]));
        const result = {
            owned: owned,
            equipped: {
                profileFrame: (eq.profileFrame && equippedMap.get(eq.profileFrame.toString())) || null,
                chatBubble: (eq.chatBubble && equippedMap.get(eq.chatBubble.toString())) || null,
                badge: (eq.badge && equippedMap.get(eq.badge.toString())) || null,
                nameEffect: (eq.nameEffect && equippedMap.get(eq.nameEffect.toString())) || null,
            },
        };
        logger_1.default.info(`Equipped resolved: frame=${!!result.equipped.profileFrame}, bubble=${!!result.equipped.chatBubble}, badge=${!!result.equipped.badge}, name=${!!result.equipped.nameEffect}`);
        return result;
    }
    /**
     * Purchase a cosmetic item with points
     */
    async purchase(userId, cosmeticId) {
        const cosmetic = await Cosmetic_1.Cosmetic.findById(cosmeticId);
        if (!cosmetic)
            throw new Error('Cosmetic not found');
        if (!cosmetic.isActive)
            throw new Error('This item is no longer available');
        const user = await User_1.User.findById(userId);
        if (!user)
            throw new Error('User not found');
        // Check if already owned
        if (user.ownedCosmetics?.map(String).includes(cosmeticId)) {
            throw new Error('You already own this item');
        }
        // Check level requirement
        if (cosmetic.requiredLevel && user.gamification.level < cosmetic.requiredLevel) {
            throw new Error(`Requires level ${cosmetic.requiredLevel}`);
        }
        if (cosmetic.currency === 'points') {
            // Deduct points
            const result = await points_service_1.default.deductPoints({
                userId,
                amount: cosmetic.price,
                type: 'spent',
                reason: `Purchased cosmetic: ${cosmetic.name}`,
                metadata: { cosmeticId, cosmeticName: cosmetic.name, cosmeticType: cosmetic.type },
            });
            // Add to owned and auto-equip
            user.ownedCosmetics = [...(user.ownedCosmetics || []), cosmeticId];
            // Auto-equip to the matching slot
            const slotMap = {
                profile_frame: 'profileFrame',
                chat_bubble: 'chatBubble',
                badge: 'badge',
                name_effect: 'nameEffect',
            };
            const slot = slotMap[cosmetic.type];
            if (slot) {
                if (!user.equippedCosmetics)
                    user.equippedCosmetics = {};
                user.equippedCosmetics[slot] = cosmeticId;
            }
            await user.save();
            logger_1.default.info(`User ${userId} purchased & equipped cosmetic ${cosmetic.name} for ${cosmetic.price} points`);
            return { cosmetic, newBalance: result.newBalance };
        }
        // Money purchases would go through Paystack — not handled here
        throw new Error('Money purchases not supported yet');
    }
    /**
     * Equip a cosmetic item
     */
    async equip(userId, cosmeticId) {
        const cosmetic = await Cosmetic_1.Cosmetic.findById(cosmeticId);
        if (!cosmetic)
            throw new Error('Cosmetic not found');
        const user = await User_1.User.findById(userId).select('ownedCosmetics equippedCosmetics');
        if (!user)
            throw new Error('User not found');
        // Must own the item
        if (!user.ownedCosmetics?.map(String).includes(cosmeticId)) {
            throw new Error('You do not own this item');
        }
        // Map cosmetic type to equipped slot
        const slotMap = {
            profile_frame: 'profileFrame',
            chat_bubble: 'chatBubble',
            badge: 'badge',
            name_effect: 'nameEffect',
        };
        const slot = slotMap[cosmetic.type];
        if (!slot)
            throw new Error('Invalid cosmetic type');
        if (!user.equippedCosmetics)
            user.equippedCosmetics = {};
        user.equippedCosmetics[slot] = cosmeticId;
        await user.save();
        logger_1.default.info(`User ${userId} equipped cosmetic ${cosmetic.name} in slot ${slot}`);
    }
    /**
     * Unequip a cosmetic slot
     */
    async unequip(userId, type) {
        const slotMap = {
            profile_frame: 'profileFrame',
            chat_bubble: 'chatBubble',
            badge: 'badge',
            name_effect: 'nameEffect',
        };
        const slot = slotMap[type];
        if (!slot)
            throw new Error('Invalid cosmetic type');
        await User_1.User.findByIdAndUpdate(userId, {
            $unset: { [`equippedCosmetics.${slot}`]: '' },
        });
        logger_1.default.info(`User ${userId} unequipped ${type}`);
    }
    /**
     * Seed default cosmetics (call once or from admin)
     */
    async seedDefaults() {
        // Delete existing and reseed
        await Cosmetic_1.Cosmetic.deleteMany({});
        const defaults = [
            // ── Profile Frames ────────────────────────────────────────
            { name: 'Teal Ring', description: 'A clean teal border', type: 'profile_frame', rarity: 'common', icon: 'ellipse-outline', price: 60, currency: 'points', style: { borderColor: '#0d9488', borderWidth: 3, animation: 'none' }, sortOrder: 1 },
            { name: 'Rose Petal', description: 'Soft pink frame', type: 'profile_frame', rarity: 'common', icon: 'flower-outline', price: 75, currency: 'points', style: { borderColor: '#f43f5e', borderWidth: 3, animation: 'none' }, sortOrder: 2 },
            { name: 'Golden Glow', description: 'Warm golden frame with glow', type: 'profile_frame', rarity: 'rare', icon: 'sunny-outline', price: 300, currency: 'points', style: { borderColor: '#f59e0b', borderWidth: 3, glowColor: '#f59e0b40', animation: 'pulse' }, sortOrder: 3 },
            { name: 'Ocean Wave', description: 'Cool blue animated frame', type: 'profile_frame', rarity: 'rare', icon: 'water-outline', price: 350, currency: 'points', style: { borderColor: '#0ea5e9', borderWidth: 3, glowColor: '#0ea5e920', animation: 'pulse' }, sortOrder: 4 },
            { name: 'Purple Flame', description: 'Epic purple animated frame', type: 'profile_frame', rarity: 'epic', icon: 'flame-outline', price: 800, currency: 'points', style: { borderColor: '#8b5cf6', borderWidth: 4, glowColor: '#8b5cf620', animation: 'shimmer' }, sortOrder: 5, requiredLevel: 3 },
            { name: 'Emerald Crown', description: 'Regal emerald frame', type: 'profile_frame', rarity: 'epic', icon: 'shield-outline', price: 900, currency: 'points', style: { borderColor: '#059669', borderWidth: 4, glowColor: '#05966920', animation: 'shimmer' }, sortOrder: 6, requiredLevel: 3 },
            { name: 'Diamond Edge', description: 'Legendary diamond frame', type: 'profile_frame', rarity: 'legendary', icon: 'diamond-outline', price: 2500, currency: 'points', style: { borderColor: '#3b82f6', borderWidth: 4, glowColor: '#3b82f630', gradient: ['#3b82f6', '#8b5cf6', '#ec4899'], animation: 'sparkle' }, sortOrder: 7, requiredLevel: 8 },
            { name: 'Inferno', description: 'Blazing fire frame', type: 'profile_frame', rarity: 'legendary', icon: 'bonfire-outline', price: 3000, currency: 'points', style: { borderColor: '#ef4444', borderWidth: 4, glowColor: '#ef444430', gradient: ['#ef4444', '#f97316', '#fbbf24'], animation: 'sparkle' }, sortOrder: 8, requiredLevel: 8 },
            // ── Chat Bubbles ──────────────────────────────────────────
            { name: 'Mint Fresh', description: 'Cool mint chat bubbles', type: 'chat_bubble', rarity: 'common', icon: 'chatbubble-outline', price: 50, currency: 'points', style: { borderColor: '#10b981', gradient: ['#d1fae5', '#a7f3d0'] }, sortOrder: 1 },
            { name: 'Sky Blue', description: 'Light blue bubbles', type: 'chat_bubble', rarity: 'common', icon: 'chatbubble-outline', price: 50, currency: 'points', style: { borderColor: '#38bdf8', gradient: ['#e0f2fe', '#bae6fd'] }, sortOrder: 2 },
            { name: 'Peach Glow', description: 'Warm peach bubbles', type: 'chat_bubble', rarity: 'common', icon: 'chatbubble-outline', price: 60, currency: 'points', style: { borderColor: '#fb923c', gradient: ['#fff7ed', '#fed7aa'] }, sortOrder: 3 },
            { name: 'Sunset Vibes', description: 'Warm sunset gradient', type: 'chat_bubble', rarity: 'rare', icon: 'chatbubble-outline', price: 250, currency: 'points', style: { gradient: ['#fbbf24', '#f97316', '#ef4444'] }, sortOrder: 4 },
            { name: 'Lavender Dream', description: 'Soft purple gradient', type: 'chat_bubble', rarity: 'rare', icon: 'chatbubble-outline', price: 280, currency: 'points', style: { gradient: ['#e9d5ff', '#c4b5fd', '#a78bfa'] }, sortOrder: 5 },
            { name: 'Galaxy', description: 'Deep space themed', type: 'chat_bubble', rarity: 'epic', icon: 'planet-outline', price: 700, currency: 'points', style: { gradient: ['#1e1b4b', '#4c1d95', '#7c3aed'], textColor: '#fff' }, sortOrder: 6, requiredLevel: 3 },
            { name: 'Neon Pulse', description: 'Glowing neon bubbles', type: 'chat_bubble', rarity: 'epic', icon: 'flash-outline', price: 750, currency: 'points', style: { gradient: ['#0f172a', '#06b6d4', '#22d3ee'], textColor: '#fff' }, sortOrder: 7, requiredLevel: 3 },
            { name: 'Aurora', description: 'Northern lights effect', type: 'chat_bubble', rarity: 'legendary', icon: 'sparkles-outline', price: 2000, currency: 'points', style: { gradient: ['#064e3b', '#059669', '#34d399', '#6ee7b7'], textColor: '#fff', animation: 'shimmer' }, sortOrder: 8, requiredLevel: 8 },
            // ── Badges ────────────────────────────────────────────────
            { name: 'Early Bird', description: 'Here from the start', type: 'badge', rarity: 'common', icon: 'sunny', price: 40, currency: 'points', style: { borderColor: '#f59e0b' }, sortOrder: 1 },
            { name: 'Night Owl', description: 'Late night chatter', type: 'badge', rarity: 'common', icon: 'moon', price: 40, currency: 'points', style: { borderColor: '#6366f1' }, sortOrder: 2 },
            { name: 'Friendly', description: 'Always welcoming', type: 'badge', rarity: 'common', icon: 'happy', price: 50, currency: 'points', style: { borderColor: '#f97316' }, sortOrder: 3 },
            { name: 'Social Butterfly', description: 'Most active chatter', type: 'badge', rarity: 'rare', icon: 'chatbubbles', price: 200, currency: 'points', style: { borderColor: '#ec4899' }, sortOrder: 4 },
            { name: 'Gamer', description: 'Mini game champion', type: 'badge', rarity: 'rare', icon: 'game-controller', price: 250, currency: 'points', style: { borderColor: '#8b5cf6' }, sortOrder: 5 },
            { name: 'Explorer', description: 'Discovered everything', type: 'badge', rarity: 'epic', icon: 'compass', price: 600, currency: 'points', style: { borderColor: '#0ea5e9', animation: 'pulse' }, sortOrder: 6, requiredLevel: 3 },
            { name: 'VIP', description: 'Exclusive VIP badge', type: 'badge', rarity: 'epic', icon: 'diamond', price: 1000, currency: 'points', style: { borderColor: '#8b5cf6', animation: 'shimmer' }, sortOrder: 7, requiredLevel: 5 },
            { name: 'Legend', description: 'Ultimate status symbol', type: 'badge', rarity: 'legendary', icon: 'star', price: 2500, currency: 'points', style: { borderColor: '#f59e0b', animation: 'sparkle' }, sortOrder: 8, requiredLevel: 10 },
            // ── Name Effects ──────────────────────────────────────────
            { name: 'Teal Name', description: 'Your name in teal', type: 'name_effect', rarity: 'common', icon: 'text-outline', price: 35, currency: 'points', style: { textColor: '#0d9488', theme: 'teal' }, sortOrder: 1 },
            { name: 'Rose Name', description: 'Rose petals float around your name', type: 'name_effect', rarity: 'common', icon: 'rose-outline', price: 40, currency: 'points', style: { textColor: '#f43f5e', theme: 'rose', animation: 'pulse' }, sortOrder: 2 },
            { name: 'Ocean Name', description: 'Water droplets ripple from your name', type: 'name_effect', rarity: 'common', icon: 'water-outline', price: 45, currency: 'points', style: { gradient: ['#0ea5e9', '#06b6d4', '#22d3ee'], theme: 'ocean', animation: 'shimmer' }, sortOrder: 3 },
            { name: 'Golden Name', description: 'Golden sparkles shine on your name', type: 'name_effect', rarity: 'rare', icon: 'star-outline', price: 200, currency: 'points', style: { textColor: '#f59e0b', theme: 'golden', animation: 'shimmer' }, sortOrder: 4 },
            { name: 'Neon Green', description: 'Electric green glow', type: 'name_effect', rarity: 'rare', icon: 'flash-outline', price: 250, currency: 'points', style: { textColor: '#22c55e', theme: 'neon', animation: 'pulse' }, sortOrder: 5 },
            { name: 'Royal Purple', description: 'Majestic purple aura', type: 'name_effect', rarity: 'epic', icon: 'diamond-outline', price: 500, currency: 'points', style: { textColor: '#7c3aed', theme: 'purple', animation: 'pulse' }, sortOrder: 6, requiredLevel: 3 },
            { name: 'Rainbow Name', description: 'Rainbow colors dance across your name', type: 'name_effect', rarity: 'epic', icon: 'color-palette-outline', price: 600, currency: 'points', style: { gradient: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'], theme: 'rainbow', animation: 'shimmer' }, sortOrder: 7, requiredLevel: 5 },
            { name: 'Flame Name', description: 'Blazing fire erupts from your name', type: 'name_effect', rarity: 'legendary', icon: 'flame', price: 1800, currency: 'points', style: { gradient: ['#ef4444', '#f97316', '#fbbf24'], theme: 'flame', animation: 'sparkle' }, sortOrder: 8, requiredLevel: 8 },
        ];
        await Cosmetic_1.Cosmetic.insertMany(defaults);
        logger_1.default.info(`Seeded ${defaults.length} default cosmetics`);
        return defaults.length;
    }
}
exports.default = new CosmeticService();
//# sourceMappingURL=cosmetic.service.js.map