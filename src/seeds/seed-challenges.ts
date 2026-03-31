import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { Challenge } from '../models/Challenge';

async function seed() {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/roomie';
  await mongoose.connect(mongoURI);
  console.log('Connected to MongoDB');

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const tomorrowEnd = new Date(todayStart); tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
  const weekEnd = new Date(todayStart); weekEnd.setDate(weekEnd.getDate() + 7);
  const monthEnd = new Date(todayStart); monthEnd.setMonth(monthEnd.getMonth() + 1);

  const challenges = [
    // ── Daily Challenges ──
    {
      title: 'Match Master',
      description: 'Get 5 matches today to earn points!',
      type: 'daily',
      category: 'matching',
      icon: 'heart',
      startDate: todayStart,
      endDate: tomorrowEnd,
      pointsReward: 20,
      requirements: [{ action: 'match', target: 5 }],
      tierRewards: [
        { tier: 'Gold', minRank: 1, maxRank: 1, points: 20, badge: 'match_master_gold', title: 'Match Master' },
        { tier: 'Silver', minRank: 2, maxRank: 3, points: 10, badge: 'match_master_silver' },
        { tier: 'Bronze', minRank: 4, maxRank: 10, points: 5 },
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
      pointsReward: 15,
      requirements: [{ action: 'message', target: 20 }],
      tierRewards: [
        { tier: 'Gold', minRank: 1, maxRank: 1, points: 15, badge: 'chat_champion' },
        { tier: 'Silver', minRank: 2, maxRank: 5, points: 8 },
        { tier: 'Bronze', minRank: 6, maxRank: 10, points: 3 },
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
      pointsReward: 10,
      requirements: [
        { action: 'profile_update', target: 1 },
        { action: 'photo_upload', target: 2 },
      ],
      tierRewards: [
        { tier: 'Gold', minRank: 1, maxRank: 3, points: 10 },
        { tier: 'Silver', minRank: 4, maxRank: 10, points: 5 },
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
      pointsReward: 80,
      badgeReward: 'social_butterfly',
      requirements: [{ action: 'match', target: 20 }],
      tierRewards: [
        { tier: 'Gold', minRank: 1, maxRank: 1, points: 80, cash: 1000, badge: 'social_butterfly_gold', title: 'Social Butterfly' },
        { tier: 'Silver', minRank: 2, maxRank: 5, points: 40, badge: 'social_butterfly_silver' },
        { tier: 'Bronze', minRank: 6, maxRank: 15, points: 15 },
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
      pointsReward: 50,
      badgeReward: 'property_hunter',
      requirements: [{ action: 'property_view', target: 30 }],
      tierRewards: [
        { tier: 'Gold', minRank: 1, maxRank: 1, points: 50, badge: 'property_hunter_gold', title: 'Property Hunter' },
        { tier: 'Silver', minRank: 2, maxRank: 5, points: 25, badge: 'property_hunter_silver' },
        { tier: 'Bronze', minRank: 6, maxRank: 15, points: 10 },
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
      pointsReward: 100,
      badgeReward: 'game_master',
      requirements: [{ action: 'game_win', target: 10 }],
      tierRewards: [
        { tier: 'Gold', minRank: 1, maxRank: 1, points: 100, cash: 2000, badge: 'game_master_gold', title: 'Game Master' },
        { tier: 'Silver', minRank: 2, maxRank: 5, points: 50, badge: 'game_master_silver' },
        { tier: 'Bronze', minRank: 6, maxRank: 15, points: 20 },
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
      pointsReward: 60,
      badgeReward: 'event_explorer',
      requirements: [{ action: 'event_rsvp', target: 5 }],
      tierRewards: [
        { tier: 'Gold', minRank: 1, maxRank: 1, points: 60, badge: 'event_explorer_gold', title: 'Event Explorer' },
        { tier: 'Silver', minRank: 2, maxRank: 5, points: 30 },
        { tier: 'Bronze', minRank: 6, maxRank: 10, points: 10 },
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
      pointsReward: 300,
      cashReward: 5000,
      cashCurrency: 'NGN',
      badgeReward: 'roomie_royale',
      requirements: [{ action: 'points_earned', target: 5000 }],
      tierRewards: [
        { tier: 'Diamond', minRank: 1, maxRank: 1, points: 300, cash: 5000, badge: 'roomie_royale_diamond', title: 'Roomie Royale Champion' },
        { tier: 'Gold', minRank: 2, maxRank: 3, points: 150, cash: 2500, badge: 'roomie_royale_gold' },
        { tier: 'Silver', minRank: 4, maxRank: 10, points: 75, cash: 1000, badge: 'roomie_royale_silver' },
        { tier: 'Bronze', minRank: 11, maxRank: 25, points: 30 },
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
      pointsReward: 200,
      badgeReward: 'chore_champion',
      requirements: [{ action: 'chore_complete', target: 50 }],
      tierRewards: [
        { tier: 'Gold', minRank: 1, maxRank: 1, points: 200, cash: 3000, badge: 'chore_champion_gold', title: 'Chore Champion' },
        { tier: 'Silver', minRank: 2, maxRank: 5, points: 100, badge: 'chore_champion_silver' },
        { tier: 'Bronze', minRank: 6, maxRank: 15, points: 40 },
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
      pointsReward: 250,
      cashReward: 4000,
      cashCurrency: 'NGN',
      badgeReward: 'social_star',
      requirements: [
        { action: 'message', target: 200 },
        { action: 'match', target: 15 },
      ],
      tierRewards: [
        { tier: 'Diamond', minRank: 1, maxRank: 1, points: 250, cash: 4000, badge: 'social_star_diamond', title: 'Social Star' },
        { tier: 'Gold', minRank: 2, maxRank: 3, points: 120, cash: 2000, badge: 'social_star_gold' },
        { tier: 'Silver', minRank: 4, maxRank: 10, points: 60, badge: 'social_star_silver' },
        { tier: 'Bronze', minRank: 11, maxRank: 25, points: 25 },
      ],
      isActive: true,
    },
  ];

  for (const challenge of challenges) {
    const existing = await Challenge.findOne({ title: challenge.title });
    if (existing) {
      console.log(`  [skip] ${challenge.title} already exists`);
    } else {
      await Challenge.create(challenge);
      console.log(`  [added] ${challenge.title}`);
    }
  }

  console.log('Done.');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
