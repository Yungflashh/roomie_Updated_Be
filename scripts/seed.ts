// scripts/seed.ts
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Load env from parent directory
dotenv.config({ path: path.join(__dirname, '../.env') });

import { User } from '../src/models/User';
import { Property } from '../src/models/Property';
import { Game } from '../src/models/Game';
import { Challenge } from '../src/models/Challenge';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/roomie';

// Sample users data - Updated to match your schema
const usersData = [
  {
    email: 'john.doe@example.com',
    password: 'Password123!',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: new Date('1995-05-15'),
    gender: 'male',
    phoneNumber: '+2341234567890',
    bio: 'Software engineer looking for a clean, quiet roommate. I work from home and value a peaceful environment.',
    occupation: 'Software Engineer',
    profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    photos: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
    ],
    location: {
      type: 'Point',
      coordinates: [3.3792, 6.5244], // Lagos
      address: '123 Ikorodu Road',
      city: 'Ikorodu',
      state: 'Lagos',
      country: 'Nigeria',
    },
    preferences: {
      budget: { min: 50000, max: 150000, currency: 'NGN' },
      leaseDuration: 12,
      roomType: 'private',
      gender: 'any',
      ageRange: { min: 22, max: 35 },
      petFriendly: true,
      smoking: false,
    },
    lifestyle: {
      sleepSchedule: 'early-bird',
      cleanliness: 4,
      socialLevel: 3,
      guestFrequency: 'sometimes',
      workFromHome: true,
    },
    interests: ['hiking', 'coding', 'reading', 'cooking', 'fitness'],
    verified: true,
    emailVerified: true,
  },
  {
    email: 'jane.smith@example.com',
    password: 'Password123!',
    firstName: 'Jane',
    lastName: 'Smith',
    dateOfBirth: new Date('1993-08-22'),
    gender: 'female',
    phoneNumber: '+2341234567891',
    bio: 'Marketing professional who loves yoga and cooking. Looking for someone who shares similar interests!',
    occupation: 'Marketing Manager',
    profilePhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    photos: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    ],
    location: {
      type: 'Point',
      coordinates: [3.4010, 6.4550], // Victoria Island
      address: '456 Adeola Odeku',
      city: 'Victoria Island',
      state: 'Lagos',
      country: 'Nigeria',
    },
    preferences: {
      budget: { min: 100000, max: 250000, currency: 'NGN' },
      leaseDuration: 12,
      roomType: 'private',
      gender: 'female',
      ageRange: { min: 25, max: 40 },
      petFriendly: false,
      smoking: false,
    },
    lifestyle: {
      sleepSchedule: 'night-owl',
      cleanliness: 5,
      socialLevel: 4,
      guestFrequency: 'often',
      workFromHome: false,
    },
    interests: ['yoga', 'cooking', 'travel', 'photography', 'fashion'],
    verified: true,
    emailVerified: true,
  },
  {
    email: 'mike.johnson@example.com',
    password: 'Password123!',
    firstName: 'Mike',
    lastName: 'Johnson',
    dateOfBirth: new Date('1997-03-10'),
    gender: 'male',
    phoneNumber: '+2341234567892',
    bio: 'Grad student studying architecture. Love sports and outdoor activities. Easy-going and friendly!',
    occupation: 'Graduate Student',
    profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    photos: [
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    ],
    location: {
      type: 'Point',
      coordinates: [3.3515, 6.6018], // Ikeja
      address: '789 Allen Avenue',
      city: 'Ikeja',
      state: 'Lagos',
      country: 'Nigeria',
    },
    preferences: {
      budget: { min: 40000, max: 100000, currency: 'NGN' },
      leaseDuration: 12,
      roomType: 'shared',
      gender: 'male',
      ageRange: { min: 20, max: 30 },
      petFriendly: true,
      smoking: false,
    },
    lifestyle: {
      sleepSchedule: 'flexible',
      cleanliness: 3,
      socialLevel: 5,
      guestFrequency: 'often',
      workFromHome: false,
    },
    interests: ['basketball', 'gaming', 'movies', 'hiking', 'music'],
    verified: false,
    emailVerified: true,
  },
  {
    email: 'sarah.williams@example.com',
    password: 'Password123!',
    firstName: 'Sarah',
    lastName: 'Williams',
    dateOfBirth: new Date('1994-11-30'),
    gender: 'female',
    phoneNumber: '+2341234567893',
    bio: 'Graphic designer and coffee enthusiast. Looking for a creative, organized roommate.',
    occupation: 'Graphic Designer',
    profilePhoto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    photos: [
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    ],
    location: {
      type: 'Point',
      coordinates: [3.3725, 6.5227], // Yaba
      address: '321 Herbert Macaulay Way',
      city: 'Yaba',
      state: 'Lagos',
      country: 'Nigeria',
    },
    preferences: {
      budget: { min: 60000, max: 120000, currency: 'NGN' },
      leaseDuration: 12,
      roomType: 'private',
      gender: 'any',
      ageRange: { min: 24, max: 35 },
      petFriendly: true,
      smoking: false,
    },
    lifestyle: {
      sleepSchedule: 'night-owl',
      cleanliness: 4,
      socialLevel: 3,
      guestFrequency: 'sometimes',
      workFromHome: true,
    },
    interests: ['art', 'coffee', 'design', 'reading', 'cycling'],
    verified: true,
    emailVerified: true,
  },
  {
    email: 'alex.brown@example.com',
    password: 'Password123!',
    firstName: 'Alex',
    lastName: 'Brown',
    dateOfBirth: new Date('1996-07-18'),
    gender: 'other',
    phoneNumber: '+2341234567894',
    bio: 'Musician and teacher. Respectful, quiet, and looking for the same in a roommate.',
    occupation: 'Music Teacher',
    profilePhoto: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400',
    photos: [
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400',
    ],
    location: {
      type: 'Point',
      coordinates: [3.3958, 6.4698], // Lekki
      address: '555 Lekki Phase 1',
      city: 'Lekki',
      state: 'Lagos',
      country: 'Nigeria',
    },
    preferences: {
      budget: { min: 80000, max: 180000, currency: 'NGN' },
      leaseDuration: 12,
      roomType: 'private',
      gender: 'any',
      ageRange: { min: 22, max: 40 },
      petFriendly: false,
      smoking: false,
    },
    lifestyle: {
      sleepSchedule: 'early-bird',
      cleanliness: 5,
      socialLevel: 2,
      guestFrequency: 'rarely',
      workFromHome: false,
    },
    interests: ['music', 'meditation', 'books', 'gardening', 'tea'],
    verified: true,
    emailVerified: true,
  },
  {
    email: 'emma.davis@example.com',
    password: 'Password123!',
    firstName: 'Emma',
    lastName: 'Davis',
    dateOfBirth: new Date('1998-02-14'),
    gender: 'female',
    phoneNumber: '+2341234567895',
    bio: 'Tech startup founder. Busy but friendly. Looking for a chill roommate who respects space.',
    occupation: 'Entrepreneur',
    profilePhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    photos: [
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    ],
    location: {
      type: 'Point',
      coordinates: [3.3792, 6.5244], // Lagos Island
      address: '100 Marina Road',
      city: 'Lagos Island',
      state: 'Lagos',
      country: 'Nigeria',
    },
    preferences: {
      budget: { min: 150000, max: 300000, currency: 'NGN' },
      leaseDuration: 12,
      roomType: 'private',
      gender: 'female',
      ageRange: { min: 23, max: 35 },
      petFriendly: true,
      smoking: false,
    },
    lifestyle: {
      sleepSchedule: 'night-owl',
      cleanliness: 4,
      socialLevel: 3,
      guestFrequency: 'sometimes',
      workFromHome: true,
    },
    interests: ['tech', 'startups', 'fitness', 'networking', 'travel'],
    verified: true,
    emailVerified: true,
  },
  {
    email: 'david.okonkwo@example.com',
    password: 'Password123!',
    firstName: 'David',
    lastName: 'Okonkwo',
    dateOfBirth: new Date('1995-09-05'),
    gender: 'male',
    phoneNumber: '+2341234567896',
    bio: 'Banker by day, footballer by weekend. Looking for an active roommate to share a great space.',
    occupation: 'Investment Banker',
    profilePhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
    photos: [
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
    ],
    location: {
      type: 'Point',
      coordinates: [3.4226, 6.4281], // Ikoyi
      address: '200 Bourdillon Road',
      city: 'Ikoyi',
      state: 'Lagos',
      country: 'Nigeria',
    },
    preferences: {
      budget: { min: 200000, max: 400000, currency: 'NGN' },
      leaseDuration: 12,
      roomType: 'private',
      gender: 'male',
      ageRange: { min: 25, max: 40 },
      petFriendly: false,
      smoking: false,
    },
    lifestyle: {
      sleepSchedule: 'early-bird',
      cleanliness: 5,
      socialLevel: 4,
      guestFrequency: 'sometimes',
      workFromHome: false,
    },
    interests: ['football', 'finance', 'fitness', 'cars', 'travel'],
    verified: true,
    emailVerified: true,
  },
  {
    email: 'amara.eze@example.com',
    password: 'Password123!',
    firstName: 'Amara',
    lastName: 'Eze',
    dateOfBirth: new Date('1999-04-20'),
    gender: 'female',
    phoneNumber: '+2341234567897',
    bio: 'Medical student at LUTH. Studious and organized. Need a quiet space to focus.',
    occupation: 'Medical Student',
    profilePhoto: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400',
    photos: [
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400',
    ],
    location: {
      type: 'Point',
      coordinates: [3.3467, 6.5175], // Surulere
      address: '50 Adeniran Ogunsanya Street',
      city: 'Surulere',
      state: 'Lagos',
      country: 'Nigeria',
    },
    preferences: {
      budget: { min: 40000, max: 80000, currency: 'NGN' },
      leaseDuration: 12,
      roomType: 'shared',
      gender: 'female',
      ageRange: { min: 20, max: 28 },
      petFriendly: false,
      smoking: false,
    },
    lifestyle: {
      sleepSchedule: 'flexible',
      cleanliness: 5,
      socialLevel: 2,
      guestFrequency: 'rarely',
      workFromHome: true,
    },
    interests: ['medicine', 'reading', 'movies', 'volunteering', 'cooking'],
    verified: false,
    emailVerified: true,
  },
];

// Sample properties data
const propertiesData = [
  {
    title: 'Spacious 2BR Apartment in Lekki Phase 1',
    description: 'Beautiful modern apartment with great views. Walking distance to restaurants and shopping.',
    type: 'apartment',
    price: 2500000,
    currency: 'NGN',
    address: '100 Admiralty Way',
    location: {
      type: 'Point',
      coordinates: [3.4747, 6.4392],
      city: 'Lekki',
      state: 'Lagos',
      country: 'Nigeria',
      zipCode: '101245',
    },
    photos: [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400',
    ],
    amenities: ['wifi', 'parking', 'gym', 'security', 'generator'],
    bedrooms: 2,
    bathrooms: 2,
    squareFeet: 1200,
    availableFrom: new Date('2024-02-01'),
    leaseDuration: 12,
    petFriendly: true,
    smokingAllowed: false,
    utilitiesIncluded: false,
    furnished: true,
    parkingAvailable: true,
  },
  {
    title: 'Cozy 1BR in Yaba',
    description: 'Charming apartment close to tech hubs. Perfect for young professionals.',
    type: 'apartment',
    price: 800000,
    currency: 'NGN',
    address: '200 Herbert Macaulay Way',
    location: {
      type: 'Point',
      coordinates: [3.3725, 6.5227],
      city: 'Yaba',
      state: 'Lagos',
      country: 'Nigeria',
      zipCode: '101212',
    },
    photos: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400',
    ],
    amenities: ['wifi', 'security'],
    bedrooms: 1,
    bathrooms: 1,
    squareFeet: 650,
    availableFrom: new Date('2024-01-15'),
    leaseDuration: 12,
    petFriendly: false,
    smokingAllowed: false,
    utilitiesIncluded: false,
    furnished: false,
    parkingAvailable: false,
  },
  {
    title: 'Modern 3BR House in Ikeja GRA',
    description: 'Newly renovated house in serene environment. Perfect for families or roommate groups.',
    type: 'house',
    price: 3500000,
    currency: 'NGN',
    address: '300 Joel Ogunnaike Street',
    location: {
      type: 'Point',
      coordinates: [3.3515, 6.6018],
      city: 'Ikeja',
      state: 'Lagos',
      country: 'Nigeria',
      zipCode: '100271',
    },
    photos: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400',
    ],
    amenities: ['wifi', 'parking', 'generator', 'security', 'garden'],
    bedrooms: 3,
    bathrooms: 3,
    squareFeet: 2000,
    availableFrom: new Date('2024-03-01'),
    leaseDuration: 24,
    petFriendly: true,
    smokingAllowed: false,
    utilitiesIncluded: false,
    furnished: false,
    parkingAvailable: true,
  },
  {
    title: 'Luxury Studio in Victoria Island',
    description: 'Premium building with 24/7 power and water. All amenities included.',
    type: 'apartment',
    price: 4000000,
    currency: 'NGN',
    address: '400 Adeola Odeku Street',
    location: {
      type: 'Point',
      coordinates: [3.4226, 6.4281],
      city: 'Victoria Island',
      state: 'Lagos',
      country: 'Nigeria',
      zipCode: '101241',
    },
    photos: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400',
    ],
    amenities: ['wifi', 'gym', 'pool', 'security', 'generator', 'elevator'],
    bedrooms: 0,
    bathrooms: 1,
    squareFeet: 500,
    availableFrom: new Date('2024-02-15'),
    leaseDuration: 12,
    petFriendly: false,
    smokingAllowed: false,
    utilitiesIncluded: true,
    furnished: true,
    parkingAvailable: true,
  },
];

// Sample games data
const gamesData = [
  {
    name: 'Trivia Master',
    description: 'Test your knowledge across various categories',
    category: 'Quiz',
    thumbnail: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=400',
    minPlayers: 1,
    maxPlayers: 10,
    difficulty: 'medium',
    pointsReward: 50,
    isActive: true,
  },
  {
    name: 'Word Scramble',
    description: 'Unscramble words as fast as you can',
    category: 'Puzzle',
    thumbnail: 'https://images.unsplash.com/photo-1632501641765-e568d28b0015?w=400',
    minPlayers: 1,
    maxPlayers: 4,
    difficulty: 'easy',
    pointsReward: 30,
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
    isActive: true,
  },
  {
    name: 'Speed Math',
    description: 'Solve math problems against the clock',
    category: 'Math',
    thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400',
    minPlayers: 1,
    maxPlayers: 8,
    difficulty: 'medium',
    pointsReward: 40,
    isActive: true,
  },
  {
    name: 'Emoji Guess',
    description: 'Guess the movie, song, or phrase from emojis',
    category: 'Puzzle',
    thumbnail: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=400',
    minPlayers: 1,
    maxPlayers: 6,
    difficulty: 'medium',
    pointsReward: 35,
    isActive: true,
  },
];

// Sample challenges data
const challengesData = [
  {
    title: 'Match Master',
    description: 'Get 5 matches today',
    type: 'daily',
    startDate: new Date(),
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    pointsReward: 100,
    badgeReward: 'match_master',
    requirements: [
      { action: 'match', target: 5 },
    ],
    isActive: true,
  },
  {
    title: 'Chat Champion',
    description: 'Send 20 messages today',
    type: 'daily',
    startDate: new Date(),
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    pointsReward: 50,
    requirements: [
      { action: 'message', target: 20 },
    ],
    isActive: true,
  },
  {
    title: 'Social Butterfly',
    description: 'Get 20 matches this week',
    type: 'weekly',
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    pointsReward: 500,
    badgeReward: 'social_butterfly',
    requirements: [
      { action: 'match', target: 20 },
    ],
    isActive: true,
  },
  {
    title: 'Property Hunter',
    description: 'View 30 properties this week',
    type: 'weekly',
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    pointsReward: 300,
    badgeReward: 'property_hunter',
    requirements: [
      { action: 'property_view', target: 30 },
    ],
    isActive: true,
  },
  {
    title: 'Game Master',
    description: 'Win 10 games this week',
    type: 'weekly',
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    pointsReward: 600,
    badgeReward: 'game_master',
    requirements: [
      { action: 'game_win', target: 10 },
    ],
    isActive: true,
  },
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seed...');
    console.log('📦 MongoDB URI:', MONGODB_URI?.substring(0, 30) + '...');

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Property.deleteMany({});
    await Game.deleteMany({});
    await Challenge.deleteMany({});
    console.log('✅ Existing data cleared');

    // Hash passwords for users
    console.log('🔐 Hashing passwords...');
    const usersWithHashedPasswords = await Promise.all(
      usersData.map(async (user) => ({
        ...user,
        password: await bcrypt.hash(user.password, 12),
      }))
    );
    console.log('✅ Passwords hashed');

    // Create users
    console.log('👥 Creating users...');
    const createdUsers = await User.insertMany(usersWithHashedPasswords);
    console.log(`✅ Created ${createdUsers.length} users`);

    // Assign landlord to properties (first user)
    console.log('🏘️  Creating properties...');
    const propertiesWithLandlord = propertiesData.map((property) => ({
      ...property,
      landlord: createdUsers[0]._id,
    }));
    const createdProperties = await Property.insertMany(propertiesWithLandlord);
    console.log(`✅ Created ${createdProperties.length} properties`);

    // Create games
    console.log('🎮 Creating games...');
    const createdGames = await Game.insertMany(gamesData);
    console.log(`✅ Created ${createdGames.length} games`);

    // Create challenges
    console.log('🏆 Creating challenges...');
    const createdChallenges = await Challenge.insertMany(challengesData);
    console.log(`✅ Created ${createdChallenges.length} challenges`);

    // Display created data summary
    console.log('\n📊 Database Seed Summary:');
    console.log('========================');
    console.log(`Users: ${createdUsers.length}`);
    console.log(`Properties: ${createdProperties.length}`);
    console.log(`Games: ${createdGames.length}`);
    console.log(`Challenges: ${createdChallenges.length}`);

    console.log('\n👤 Test User Credentials:');
    console.log('========================');
    usersData.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: Password123!`);
      console.log(`   Location: ${user.location.city}`);
      console.log('');
    });

    console.log('🎉 Database seed completed successfully!');
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run seed function
seedDatabase();