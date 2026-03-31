import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { Game } from '../models/Game';

const newGames = [
  {
    name: 'Reaction Race',
    description: 'Test your reflexes! Tap when the screen turns green, but don\'t fall for the fake-outs. Fastest fingers win!',
    category: 'reflex',
    thumbnail: 'https://img.icons8.com/3d-fluency/200/lightning-bolt.png',
    minPlayers: 2,
    maxPlayers: 6,
    difficulty: 'easy',
    pointsReward: 5,
    pointsCost: 3,
    levelRequired: 1,
    isActive: true,
  },
  {
    name: 'Riddle Rush',
    description: 'Brain teasers at lightning speed! Solve riddles before your opponent. The faster you answer, the more points you earn.',
    category: 'brain',
    thumbnail: 'https://img.icons8.com/3d-fluency/200/brain.png',
    minPlayers: 2,
    maxPlayers: 6,
    difficulty: 'medium',
    pointsReward: 6,
    pointsCost: 4,
    levelRequired: 1,
    isActive: true,
  },
  {
    name: 'Word Chain',
    description: 'Keep the chain going! Type a word starting with the last letter of the previous word. Don\'t break the chain or run out of time!',
    category: 'word',
    thumbnail: 'https://img.icons8.com/3d-fluency/200/chain.png',
    minPlayers: 2,
    maxPlayers: 4,
    difficulty: 'medium',
    pointsReward: 5,
    pointsCost: 3,
    levelRequired: 1,
    isActive: true,
  },
];

async function seed() {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/roomie';
  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoURI);
  console.log('Connected.');

  for (const game of newGames) {
    const existing = await Game.findOne({ name: game.name });
    if (existing) {
      console.log(`  [skip] ${game.name} already exists`);
    } else {
      await Game.create(game);
      console.log(`  [added] ${game.name}`);
    }
  }

  console.log('Done.');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
