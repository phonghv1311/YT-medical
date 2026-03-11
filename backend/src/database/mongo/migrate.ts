/**
 * MongoDB migration: ensures collections and indexes exist for all Mongo schemas.
 * Run: npm run mongo:migrate
 * Requires: MongoDB running, MONGO_URI in .env
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import mongoose from 'mongoose';
import {
  SeedUserSchema,
  SeedDoctorSchema,
  SeedAppointmentSchema,
  SeedNotificationSchema,
  SeedPackageSchema,
} from './schemas/seed-schemas';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/telemedicine';

const models = [
  { name: 'SeedUser', schema: SeedUserSchema },
  { name: 'SeedDoctor', schema: SeedDoctorSchema },
  { name: 'SeedAppointment', schema: SeedAppointmentSchema },
  { name: 'SeedNotification', schema: SeedNotificationSchema },
  { name: 'SeedPackage', schema: SeedPackageSchema },
];

async function run() {
  console.log('Connecting to MongoDB at', MONGO_URI.replace(/\/\/[^@]+@/, '//***@'));
  await mongoose.connect(MONGO_URI);
  console.log('Connected.');

  for (const { name, schema } of models) {
    const M = mongoose.models[name] || mongoose.model(name, schema);
    try {
      await M.syncIndexes();
      console.log('Synced indexes for', name);
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'code' in err ? (err as { code?: number }).code : null;
      if (msg === 86) {
        console.log('Indexes already exist for', name, '(skipped)');
      } else {
        throw err;
      }
    }
  }

  console.log('Migration done.');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
