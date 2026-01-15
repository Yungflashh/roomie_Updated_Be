// scripts/seedGamesWithPoints.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

import { Game } from '../src/models/Game';
import { PointsConfig } from '../src/models/PointsConfig';
import { log } from 'console';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/roomie';

    
    console.log("Deleted all games");
    

// Updated games data with points and level requirements
const gamesData = [
  {
    name: 'Trivia Master',
    description: 'Test your knowledge across various categories. Great for beginners!',
    category: 'Quiz',
    thumbnail: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=400',
    minPlayers: 1,
    maxPlayers: 10,
    difficulty: 'easy',
    pointsReward: 50,
    pointsCost: 5,
    levelRequired: 1,
    isActive: true,
  },
  {
    name: 'Word Scramble',
    description: 'Unscramble words as fast as you can. Entry level fun!',
    category: 'Puzzle',
    thumbnail: 'https://images.unsplash.com/photo-1632501641765-e568d28b0015?w=400',
    minPlayers: 1,
    maxPlayers: 4,
    difficulty: 'easy',
    pointsReward: 30,
    pointsCost: 3,
    levelRequired: 1,
    isActive: true,
  },
  {
    name: 'Memory Match',
    description: 'Find matching pairs in this classic memory game',
    category: 'Memory',
    thumbnail: 'https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=400',
    minPlayers: 1,
    maxPlayers: 2,
    difficulty: 'easy',
    pointsReward: 25,
    pointsCost: 3,
    levelRequired: 1,
    isActive: true,
  },
  {
    name: 'Speed Math',
    description: 'Solve math problems against the clock. Requires Level 3!',
    category: 'Math',
    thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400',
    minPlayers: 1,
    maxPlayers: 8,
    difficulty: 'medium',
    pointsReward: 60,
    pointsCost: 8,
    levelRequired: 3,
    isActive: true,
  },
  {
    name: 'Emoji Guess',
    description: 'Guess movies, songs, or phrases from emojis. Level 2 required!',
    category: 'Puzzle',
    thumbnail: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=400',
    minPlayers: 1,
    maxPlayers: 6,
    difficulty: 'medium',
    pointsReward: 50,
    pointsCost: 7,
    levelRequired: 2,
    isActive: true,
  },
  {
    name: 'Logic Master',
    description: 'Advanced logic puzzles for the brilliant minds. Level 5 required!',
    category: 'Logic',
    thumbnail: 'https://images.unsplash.com/photo-1516116412456-c860a6e5e2b5?w=400',
    minPlayers: 1,
    maxPlayers: 4,
    difficulty: 'hard',
    pointsReward: 100,
    pointsCost: 15,
    levelRequired: 5,
    isActive: true,
  },
  {
    name: 'Quick Draw',
    description: 'Test your reflexes in this fast-paced game. Level 4 required!',
    category: 'Action',
    thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400',
    minPlayers: 1,
    maxPlayers: 2,
    difficulty: 'hard',
    pointsReward: 80,
    pointsCost: 12,
    levelRequired: 4,
    isActive: true,
  },
  {
    name: 'Geography Quiz',
    description: 'Test your world knowledge. Level 2 required!',
    category: 'Quiz',
    thumbnail: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=400',
    minPlayers: 1,
    maxPlayers: 10,
    difficulty: 'medium',
    pointsReward: 45,
    pointsCost: 6,
    levelRequired: 2,
    isActive: true,
  },
  {
    name: 'Pattern Master',
    description: 'Identify and complete patterns. Advanced players only (Level 6)!',
    category: 'Logic',
    thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400',
    minPlayers: 1,
    maxPlayers: 4,
    difficulty: 'hard',
    pointsReward: 120,
    pointsCost: 20,
    levelRequired: 6,
    isActive: true,
  },
  {
    name: 'Color Challenge',
    description: 'Match colors and test your visual memory',
    category: 'Memory',
    thumbnail: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400',
    minPlayers: 1,
    maxPlayers: 4,
    difficulty: 'easy',
    pointsReward: 35,
    pointsCost: 4,
    levelRequired: 1,
    isActive: true,
  },
];

// Default points configuration
const defaultPointsConfig = {
  matchRequestCost: 10,
  matchRequestFreePerDay: 5,
  defaultGameEntryCost: 5,
  defaultGameReward: 10,
  pointsPerLevel: 100,
  baseLevelPoints: 0,
  levelMultiplier: 1.5,
  dailyLoginBonus: 10,
  weeklyStreakBonus: 50,
  profileCompletionBonus: 50,
  emailVerificationBonus: 20,
  phoneVerificationBonus: 20,
  idVerificationBonus: 100,
  firstMessageBonus: 5,
  firstMatchBonus: 25,
  firstGameBonus: 15,
  premiumMatchDiscount: 50,
  premiumGameDiscount: 30,
  premiumDailyBonus: 20,
  isActive: true,
};

async function seedGamesWithPoints() {
  try {
    console.log('🎮 Starting games and points system seed...');
    console.log('📦 MongoDB URI:', MONGODB_URI?.substring(0, 30) + '...');

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    

    // 1. Clear ONLY games and points config (preserve user data)
    console.log('🗑️  Clearing existing games and points config...');
    await Game.deleteMany({});
    await PointsConfig.deleteMany({});
    console.log('✅ Games and config cleared');

    // 2. Create points configuration
    console.log('⚙️  Creating points configuration...');
    const config = await PointsConfig.create(defaultPointsConfig);
    console.log('✅ Points configuration created');
    console.log('   - Match request cost:', config.matchRequestCost);
    console.log('   - Daily login bonus:', config.dailyLoginBonus);
    console.log('   - Premium match discount:', config.premiumMatchDiscount + '%');

    // 3. Create games
    console.log('🎮 Creating games with points...');
    const createdGames = await Game.insertMany(gamesData);
    console.log(`✅ Created ${createdGames.length} games`);

    // Display games by level
    console.log('\n📊 Games by Level:');
    console.log('========================');
    
    const gamesByLevel = createdGames.reduce((acc, game) => {
      if (!acc[game.levelRequired]) {
        acc[game.levelRequired] = [];
      }
      acc[game.levelRequired].push(game);
      return acc;
    }, {} as Record<number, typeof createdGames>);

    Object.keys(gamesByLevel).sort((a, b) => parseInt(a) - parseInt(b)).forEach(level => {
      console.log(`\nLevel ${level}:`);
      gamesByLevel[parseInt(level)].forEach(game => {
        console.log(`  - ${game.name}`);
        console.log(`    Cost: ${game.pointsCost} points | Reward: ${game.pointsReward} points`);
        console.log(`    Difficulty: ${game.difficulty}`);
      });
    });

    console.log('\n💰 Points System Summary:');
    console.log('========================');
    console.log('Match Request:', config.matchRequestCost, 'points');
    console.log('Free matches per day:', config.matchRequestFreePerDay);
    console.log('Daily login bonus:', config.dailyLoginBonus, 'points');
    console.log('Weekly streak bonus:', config.weeklyStreakBonus, 'points');
    console.log('Profile completion:', config.profileCompletionBonus, 'points');
    console.log('Email verification:', config.emailVerificationBonus, 'points');
    console.log('Phone verification:', config.phoneVerificationBonus, 'points');
    console.log('ID verification:', config.idVerificationBonus, 'points');
    console.log('First match bonus:', config.firstMatchBonus, 'points');
    console.log('\nPremium Benefits:');
    console.log('  - Match cost discount:', config.premiumMatchDiscount + '%');
    console.log('  - Game cost discount:', config.premiumGameDiscount + '%');
    console.log('  - Extra daily bonus: +' + config.premiumDailyBonus, 'points');

    console.log('\n🎉 Games and points system seeded successfully!');
    console.log('📝 Note: All existing user data, matches, and messages are preserved.');
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding games and points:', error);
    process.exit(1);
  }
}

// Run seed function
seedGamesWithPoints();