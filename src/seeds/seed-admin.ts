import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import Admin from '../models/Admin';

async function seed() {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/roomie';
  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoURI);
  console.log('Connected.');

  const admins = [
    {
      firstName: 'David',
      lastName: 'Adenusi',
      email: 'superadmin@roomie.com',
      password: 'Roomie@Admin2026!',
      role: 'super_admin' as const,
    },
  ];

  for (const admin of admins) {
    const existing = await Admin.findOne({ email: admin.email });
    if (existing) {
      console.log(`  [skip] ${admin.email} already exists`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(admin.password, 12);
    await Admin.create({
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email,
      password: hashedPassword,
      role: admin.role,
      isActive: true,
    });
    console.log(`  [added] ${admin.email} (${admin.role})`);
  }

  console.log('\nDone. Admin credentials:');
  console.log('  Email: superadmin@roomie.com');
  console.log('  Password: Roomie@Admin2026!');
  console.log('\n  CHANGE THIS PASSWORD AFTER FIRST LOGIN!\n');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
