/**
 * Admin Seed Script — CyberShield Campus
 *
 * Creates a single admin user using credentials from environment variables.
 * Run with: npm run seed:admin
 *
 * Requirements:
 *   - ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FULL_NAME must be set in .env
 *   - MONGODB_URI must be set in .env
 *
 * This script is NEVER called through any HTTP endpoint.
 * It must be run manually by a system administrator with direct server access.
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { User } from '../models/User';
import { env } from '../config/env';

async function seedAdmin(): Promise<void> {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FULL_NAME } = env;

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error(
      '❌  ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env to run this script.',
    );
    process.exit(1);
  }

  console.log('🔗  Connecting to MongoDB…');
  await mongoose.connect(env.MONGODB_URI);
  console.log('✅  Connected.');

  const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });

  if (existing) {
    if (existing.role === 'admin') {
      console.log(`ℹ️   Admin account already exists for ${ADMIN_EMAIL}. No changes made.`);
    } else {
      // Upgrade existing student account to admin — only via this script
      existing.role = 'admin';
      await existing.save();
      console.log(`✅  Existing account ${ADMIN_EMAIL} promoted to admin.`);
    }
  } else {
    const admin = new User({
      fullName: ADMIN_FULL_NAME,
      email: ADMIN_EMAIL.toLowerCase(),
      passwordHash: ADMIN_PASSWORD, // pre-save hook hashes this
      role: 'admin',
    });
    await admin.save();
    console.log(`✅  Admin account created: ${ADMIN_EMAIL}`);
  }

  await mongoose.disconnect();
  console.log('🔌  Disconnected. Done.');
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error('❌  Seed script failed:', err);
  process.exit(1);
});
