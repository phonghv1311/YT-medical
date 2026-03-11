import { Sequelize } from 'sequelize-typescript';
import * as bcrypt from 'bcrypt';
import { Role } from '../models/role.model.js';
import { Permission } from '../models/permission.model.js';
import { RolePermission } from '../models/role-permission.model.js';
import { User } from '../models/user.model.js';

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_USER = process.env.DB_USERNAME || 'root';
const DB_PASS = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_DATABASE || 'telemedicine';

const PERMISSIONS = [
  'manage_users', 'view_users', 'manage_hospitals', 'view_hospitals',
  'manage_departments', 'view_departments', 'manage_packages', 'view_packages',
  'view_reports', 'manage_roles', 'view_logs',
  'manage_appointments', 'view_appointments', 'view_patients',
  'manage_schedule', 'prescribe_medication', 'view_medical_records', 'manage_availability',
  'view_own_appointments', 'view_own_records', 'book_appointments', 'view_doctors', 'manage_family',
  'manage_news',
];

async function seed() {
  const sequelize = new Sequelize({
    dialect: 'mysql',
    host: DB_HOST,
    port: DB_PORT,
    username: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
    models: [Role, Permission, RolePermission, User],
    logging: false,
  });

  await sequelize.sync();

  // Only superadmin role
  const [superadminRole] = await Role.findOrCreate({ where: { name: 'superadmin' }, defaults: { name: 'superadmin' } as Partial<Role> });

  const permissionRecords: Permission[] = [];
  for (const name of PERMISSIONS) {
    const [p] = await Permission.findOrCreate({ where: { name }, defaults: { name } as Partial<Permission> });
    permissionRecords.push(p);
  }

  for (const perm of permissionRecords) {
    await RolePermission.findOrCreate({
      where: { roleId: superadminRole.id, permissionId: perm.id },
      defaults: { roleId: superadminRole.id, permissionId: perm.id } as Partial<RolePermission>,
    });
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

  console.log('Seed completed (superadmin only)');
  await sequelize.close();
}

seed().catch(console.error);
