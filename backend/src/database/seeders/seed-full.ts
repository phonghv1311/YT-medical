/**
 * Minimal database seed: sync tables, then create only the superadmin role,
 * permissions, and one superadmin user with full permissions.
 * Run: npm run seed:full
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { Sequelize } from 'sequelize-typescript';
import * as bcrypt from 'bcrypt';

import { Role } from '../models/role.model.js';
import { Permission } from '../models/permission.model.js';
import { RolePermission } from '../models/role-permission.model.js';
import { User } from '../models/user.model.js';
import { Customer } from '../models/customer.model.js';
import { Doctor } from '../models/doctor.model.js';
import { Staff } from '../models/staff.model.js';
import { Hospital } from '../models/hospital.model.js';
import { Department } from '../models/department.model.js';
import { Specialization } from '../models/specialization.model.js';
import { DoctorDepartment } from '../models/doctor-department.model.js';
import { DoctorQualification } from '../models/doctor-qualification.model.js';
import { DoctorSpecialization } from '../models/doctor-specialization.model.js';
import { Schedule } from '../models/schedule.model.js';
import { AvailabilitySlot } from '../models/availability-slot.model.js';
import { FamilyMember } from '../models/family-member.model.js';
import { Appointment } from '../models/appointment.model.js';
import { MedicalRecord } from '../models/medical-record.model.js';
import { Prescription } from '../models/prescription.model.js';
import { PatientStatus } from '../models/patient-status.model.js';
import { PaymentMethod } from '../models/payment-method.model.js';
import { Package } from '../models/package.model.js';
import { UserPackage } from '../models/user-package.model.js';
import { Transaction } from '../models/transaction.model.js';
import { Tip } from '../models/tip.model.js';
import { Notification } from '../models/notification.model.js';
import { Review } from '../models/review.model.js';
import { Feedback } from '../models/feedback.model.js';
import { ChatMessage } from '../models/chat-message.model.js';
import { ActivityLog } from '../models/activity-log.model.js';

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_USER = process.env.DB_USERNAME || 'root';
const DB_PASS = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_DATABASE || 'telemedicine';

// All roles required for app (register/login); only superadmin user is created by this seed.
const ROLES = ['superadmin', 'admin', 'doctor', 'staff', 'customer'];
const PERMISSIONS = [
  'manage_users', 'view_users', 'manage_hospitals', 'view_hospitals',
  'manage_departments', 'view_departments', 'manage_packages', 'view_packages',
  'view_reports', 'manage_roles', 'view_logs',
  'manage_appointments', 'view_appointments', 'view_patients',
  'manage_schedule', 'prescribe_medication', 'view_medical_records', 'manage_availability',
  'view_own_appointments', 'view_own_records', 'book_appointments', 'view_doctors', 'manage_family',
  'manage_news',
];

// Permission names by role (each role gets this subset; superadmin gets all via separate loop).
const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [
    'manage_users', 'view_users', 'manage_hospitals', 'view_hospitals',
    'manage_departments', 'view_departments', 'manage_packages', 'view_packages',
    'view_reports', 'manage_roles', 'view_logs', 'manage_appointments', 'view_appointments',
    'view_patients', 'manage_news',
  ],
  doctor: [
    'view_patients', 'manage_schedule', 'view_appointments', 'prescribe_medication',
    'view_medical_records', 'manage_availability',
  ],
  staff: [
    'view_users', 'view_hospitals', 'view_departments', 'view_appointments',
    'view_patients', 'view_reports',
  ],
  customer: [
    'view_own_appointments', 'view_own_records', 'book_appointments', 'view_doctors', 'manage_family',
  ],
};

const allModels = [
  Role, Permission, RolePermission, User, Customer, Doctor, Staff,
  Hospital, Department, DoctorDepartment, DoctorQualification, DoctorSpecialization,
  Specialization, Schedule, AvailabilitySlot, FamilyMember, Appointment,
  MedicalRecord, Prescription, PatientStatus, PaymentMethod, Package, UserPackage,
  Transaction, Tip, Notification, Review, Feedback, ChatMessage, ActivityLog,
];

async function run() {
  const sequelize = new Sequelize({
    dialect: 'mysql',
    host: DB_HOST,
    port: DB_PORT,
    username: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
    models: allModels as unknown as (typeof Role)[],
    logging: false,
  });

  // Use sync() without alter to avoid ALTER TABLE errors (e.g. prescriptions.appointmentId NOT NULL vs SET NULL).
  // Creates missing tables; does not modify existing columns. For schema changes, run migrations or fix DB manually.
  console.log('Syncing database...');
  await sequelize.sync();

  console.log('Seeding roles (required for login/register)...');
  for (const name of ROLES) {
    await Role.findOrCreate({ where: { name }, defaults: { name } });
  }
  const superadminRole = await Role.findOne({ where: { name: 'superadmin' } });
  if (!superadminRole) throw new Error('superadmin role not found');

  console.log('Seeding permissions...');
  const permissionRecords: Permission[] = [];
  for (const name of PERMISSIONS) {
    const [p] = await Permission.findOrCreate({ where: { name }, defaults: { name } });
    permissionRecords.push(p);
  }

  const permByName = new Map(permissionRecords.map((p) => [p.name, p]));

  console.log('Assigning all permissions to superadmin role...');
  for (const perm of permissionRecords) {
    await RolePermission.findOrCreate({
      where: { roleId: superadminRole.id, permissionId: perm.id },
      defaults: { roleId: superadminRole.id, permissionId: perm.id },
    });
  }

  console.log('Assigning permissions to admin, doctor, staff, customer...');
  for (const [roleName, permNames] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await Role.findOne({ where: { name: roleName } });
    if (!role) continue;
    for (const name of permNames) {
      const perm = permByName.get(name);
      if (!perm) continue;
      await RolePermission.findOrCreate({
        where: { roleId: role.id, permissionId: perm.id },
        defaults: { roleId: role.id, permissionId: perm.id },
      });
    }
  }

  await User.findOrCreate({
    where: { email: 'admin@telemedicine.com' },
    defaults: {
      email: 'admin@telemedicine.com',
      password: await bcrypt.hash('admin123', 10),
      firstName: 'Super',
      lastName: 'Admin',
      roleId: superadminRole.id,
    } as Partial<User>,
  });
  console.log('Superadmin user: admin@telemedicine.com (password: admin123) — full permissions');

  console.log('Seed completed (superadmin only).');
  await sequelize.close();
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
