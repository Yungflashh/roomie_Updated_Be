"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
const Challenge_1 = require("../models/Challenge");
const now = new Date();
const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const tomorrowEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
const weekEnd = new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000);
const monthEnd = new Date(todayStart.getTime() + 30 * 24 * 60 * 60 * 1000);
const challenges = [
    // ── Daily Challenges ──
    {
        title: 'Match Master',
        description: 'Get 5 new matches today and expand your network!',
        type: 'daily',
        category: 'matching',
        icon: 'heart',
        startDate: todayStart,
        endDate: tomorrowEnd,
        pointsReward: 100,
        requirements: [{ action: 'match', target: 5 }],
        tierRewards: [
            { tier: 'Gold', minRank: 1, maxRank: 1, points: 100, badge: 'match_master_gold', title: 'Match Master' },
            { tier: 'Silver', minRank: 2, maxRank: 3, points: 50, badge: 'match_master_silver' },
            { tier: 'Bronze', minRank: 4, maxRank: 10, points: 25 },
        ],
        isActive: true,
    },
    {
        title: 'Chat Champion',
        description: 'Send 20 messages to your matches today',
        type: 'daily',
        category: 'social',
        icon: 'chatbubbles',
        startDate: todayStart,
        endDate: tomorrowEnd,
        pointsReward: 75,
        requirements: [{ action: 'message', target: 20 }],
        tierRewards: [
            { tier: 'Gold', minRank: 1, maxRank: 1, points: 75, badge: 'chat_champion' },
            { tier: 'Silver', minRank: 2, maxRank: 5, points: 40 },
            { tier: 'Bronze', minRank: 6, maxRank: 10, points: 20 },
        ],
        isActive: true,
    },
    {
        title: 'Profile Perfectionist',
        description: 'Update your profile and add 2 new photos',
        type: 'daily',
        category: 'general',
        icon: 'person-circle',
        startDate: todayStart,
        endDate: tomorrowEnd,
        pointsReward: 50,
        requirements: [
            { action: 'profile_update', target: 1 },
            { action: 'photo_upload', target: 2 },
        ],
        tierRewards: [
            { tier: 'Gold', minRank: 1, maxRank: 3, points: 50 },
            { tier: 'Silver', minRank: 4, maxRank: 10, points: 25 },
        ],
        isActive: true,
    },
    // ── Weekly Challenges ──
    {
        title: 'Social Butterfly',
        description: 'Get 20 matches this week and become the most connected roomie!',
        type: 'weekly',
        category: 'matching',
        icon: 'people',
        startDate: todayStart,
        endDate: weekEnd,
        pointsReward: 500,
        badgeReward: 'social_butterfly',
        requirements: [{ action: 'match', target: 20 }],
        tierRewards: [
            { tier: 'Gold', minRank: 1, maxRank: 1, points: 500, cash: 1000, badge: 'social_butterfly_gold', title: 'Social Butterfly' },
            { tier: 'Silver', minRank: 2, maxRank: 5, points: 250, badge: 'social_butterfly_silver' },
            { tier: 'Bronze', minRank: 6, maxRank: 15, points: 100 },
        ],
        isActive: true,
    },
    {
        title: 'Property Hunter',
        description: 'View 30 property listings this week',
        type: 'weekly',
        category: 'listings',
        icon: 'home',
        startDate: todayStart,
        endDate: weekEnd,
        pointsReward: 300,
        badgeReward: 'property_hunter',
        requirements: [{ action: 'property_view', target: 30 }],
        tierRewards: [
            { tier: 'Gold', minRank: 1, maxRank: 1, points: 300, badge: 'property_hunter_gold', title: 'Property Hunter' },
            { tier: 'Silver', minRank: 2, maxRank: 5, points: 150, badge: 'property_hunter_silver' },
            { tier: 'Bronze', minRank: 6, maxRank: 15, points: 75 },
        ],
        isActive: true,
    },
    {
        title: 'Game Master',
        description: 'Win 10 games against your matches this week',
        type: 'weekly',
        category: 'games',
        icon: 'game-controller',
        startDate: todayStart,
        endDate: weekEnd,
        pointsReward: 600,
        badgeReward: 'game_master',
        requirements: [{ action: 'game_win', target: 10 }],
        tierRewards: [
            { tier: 'Gold', minRank: 1, maxRank: 1, points: 600, cash: 2000, badge: 'game_master_gold', title: 'Game Master' },
            { tier: 'Silver', minRank: 2, maxRank: 5, points: 300, badge: 'game_master_silver' },
            { tier: 'Bronze', minRank: 6, maxRank: 15, points: 150 },
        ],
        isActive: true,
    },
    {
        title: 'Event Explorer',
        description: 'Attend or RSVP to 5 events this week',
        type: 'weekly',
        category: 'events',
        icon: 'calendar',
        startDate: todayStart,
        endDate: weekEnd,
        pointsReward: 400,
        badgeReward: 'event_explorer',
        requirements: [{ action: 'event_rsvp', target: 5 }],
        tierRewards: [
            { tier: 'Gold', minRank: 1, maxRank: 1, points: 400, badge: 'event_explorer_gold', title: 'Event Explorer' },
            { tier: 'Silver', minRank: 2, maxRank: 5, points: 200 },
            { tier: 'Bronze', minRank: 6, maxRank: 10, points: 100 },
        ],
        isActive: true,
    },
    // ── Monthly Challenges ──
    {
        title: 'Roomie Royale',
        description: 'Earn the most points this month across all activities. Top performers win cash prizes!',
        type: 'monthly',
        category: 'general',
        icon: 'trophy',
        startDate: todayStart,
        endDate: monthEnd,
        pointsReward: 2000,
        cashReward: 5000,
        cashCurrency: 'NGN',
        badgeReward: 'roomie_royale',
        requirements: [{ action: 'points_earned', target: 5000 }],
        tierRewards: [
            { tier: 'Diamond', minRank: 1, maxRank: 1, points: 2000, cash: 5000, badge: 'roomie_royale_diamond', title: 'Roomie Royale Champion' },
            { tier: 'Gold', minRank: 2, maxRank: 3, points: 1000, cash: 2500, badge: 'roomie_royale_gold' },
            { tier: 'Silver', minRank: 4, maxRank: 10, points: 500, cash: 1000, badge: 'roomie_royale_silver' },
            { tier: 'Bronze', minRank: 11, maxRank: 25, points: 250 },
        ],
        isActive: true,
    },
    {
        title: 'Chore Champion',
        description: 'Complete 50 chores in your roommate group this month',
        type: 'monthly',
        category: 'chores',
        icon: 'checkmark-done',
        startDate: todayStart,
        endDate: monthEnd,
        pointsReward: 1500,
        badgeReward: 'chore_champion',
        requirements: [{ action: 'chore_complete', target: 50 }],
        tierRewards: [
            { tier: 'Gold', minRank: 1, maxRank: 1, points: 1500, cash: 3000, badge: 'chore_champion_gold', title: 'Chore Champion' },
            { tier: 'Silver', minRank: 2, maxRank: 5, points: 750, badge: 'chore_champion_silver' },
            { tier: 'Bronze', minRank: 6, maxRank: 15, points: 300 },
        ],
        isActive: true,
    },
    {
        title: 'Social Star',
        description: 'Send 200 messages and get 15 matches this month to become the ultimate social star!',
        type: 'monthly',
        category: 'social',
        icon: 'globe',
        startDate: todayStart,
        endDate: monthEnd,
        pointsReward: 1800,
        cashReward: 4000,
        cashCurrency: 'NGN',
        badgeReward: 'social_star',
        requirements: [
            { action: 'message', target: 200 },
            { action: 'match', target: 15 },
        ],
        tierRewards: [
            { tier: 'Gold', minRank: 1, maxRank: 1, points: 1800, cash: 4000, badge: 'social_star_gold', title: 'Social Star' },
            { tier: 'Silver', minRank: 2, maxRank: 5, points: 900, cash: 2000, badge: 'social_star_silver' },
            { tier: 'Bronze', minRank: 6, maxRank: 15, points: 400 },
        ],
        isActive: true,
    },
];
async function seed() {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/roomie';
    console.log('Connecting to MongoDB...');
    await mongoose_1.default.connect(mongoURI);
    console.log('Connected.');
    // Remove old seeded challenges (optional - only active ones with no participants)
    const deleted = await Challenge_1.Challenge.deleteMany({ participants: { $size: 0 } });
    console.log(`Cleared ${deleted.deletedCount} empty challenges.`);
    const result = await Challenge_1.Challenge.insertMany(challenges);
    console.log(`Seeded ${result.length} challenges:`);
    result.forEach((c) => console.log(`  [${c.type}] ${c.title} - ${c.pointsReward} pts`));
    await mongoose_1.default.disconnect();
    console.log('Done.');
}
seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
//# sourceMappingURL=seed-challenges.js.map