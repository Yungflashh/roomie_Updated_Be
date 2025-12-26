// scripts/createAdmin.ts
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../src/models';

dotenv.config();

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@roomie.com' });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log('Email:', existingAdmin.email);
      
      // Update password if needed
      const updatePassword = true; // Set to true to reset password
      if (updatePassword) {
        const hashedPassword = await bcrypt.hash('Admin@123', 10);
        existingAdmin.password = hashedPassword;
        await existingAdmin.save();
        console.log('✅ Admin password updated!');
      }
      
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('Admin@123', 10);

    // Create admin user
    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@roomie.com',
      password: hashedPassword,
      phoneNumber: '+1234567890',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'other',
      isActive: true,
      verified: true,
      emailVerified: true,
      provider: 'email',
      location: {
        type: 'Point',
        coordinates: [0, 0],
        city: 'Admin City',
        state: 'Admin State',
        country: 'Nigeria',
      },
      preferences: {
        budget: { min: 0, max: 1000000 },
        roomType: 'any',
        ageRange: { min: 18, max: 100 },
        gender: 'any',
      },
      lifestyle: {
        sleepSchedule: 'flexible',
        cleanliness: 5,
        socialLevel: 3,
        guestFrequency: 'sometimes',
        workFromHome: true,
      },
      interests: ['Technology', 'Management'],
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Password: Admin@123');
    console.log('');
    console.log('You can now login to the admin dashboard at:');
    console.log('http://localhost:3001');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();