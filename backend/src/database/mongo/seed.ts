/**
 * MongoDB seed: no fake data. Kept for compatibility; run npm run mongo:seed to no-op.
 * Use MySQL seed for the single superadmin user.
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/telemedicine';

async function run() {
  console.log('MongoDB seed: no fake data (skipped).');
  await mongoose.connect(MONGO_URI).catch(() => {});
  await mongoose.disconnect().catch(() => {});
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
