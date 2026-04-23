/**
 * Add missing columns to match Sequelize models (users, departments, hospitals).
 * Fixes 500 on /api/users, /api/hospitals/:id, /api/departments?hospitalId=...
 * Loads backend/.env. Run: cd backend && node database/scripts/run-users-migration.js
 */
const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  });
}

const host = process.env.DB_HOST || 'localhost';
const port = parseInt(process.env.DB_PORT || '3306', 10);
const user = process.env.DB_USERNAME || 'root';
const password = process.env.DB_PASSWORD || '';
const database = process.env.DB_DATABASE || 'telemedicine';

async function getColumns(conn, table) {
  const [rows] = await conn.query(
    'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?',
    [database, table],
  );
  return new Set((rows || []).map((r) => r.COLUMN_NAME));
}

async function addIfMissing(conn, table, toAdd) {
  const existing = await getColumns(conn, table);
  for (const { name, sql } of toAdd) {
    if (existing.has(name)) {
      console.log(table + '.' + name + ' already exists, skip');
    } else {
      await conn.query('ALTER TABLE ' + table + ' ' + sql);
      console.log('Added ' + table + '.' + name);
    }
  }
}

async function main() {
  const mysql = require('mysql2/promise');
  let conn;
  try {
    conn = await mysql.createConnection({ host, port, user, password, database });
    console.log('Connected to MySQL', database);

    await addIfMissing(conn, 'users', [
      { name: 'deactivatedReason', sql: 'ADD COLUMN deactivatedReason VARCHAR(1000) NULL' },
      { name: 'deactivatedAt', sql: 'ADD COLUMN deactivatedAt DATETIME NULL' },
      { name: 'refreshToken', sql: 'ADD COLUMN refreshToken VARCHAR(1000) NULL' },
    ]);

    await addIfMissing(conn, 'departments', [
      { name: 'headId', sql: 'ADD COLUMN headId INT NULL' },
      { name: 'isActive', sql: 'ADD COLUMN isActive TINYINT(1) NOT NULL DEFAULT 1' },
    ]);

    await addIfMissing(conn, 'hospitals', [
      { name: 'isActive', sql: 'ADD COLUMN isActive TINYINT(1) NOT NULL DEFAULT 1' },
      { name: 'headId', sql: 'ADD COLUMN headId INT NULL' },
      { name: 'operatingDate', sql: 'ADD COLUMN operatingDate DATE NULL' },
      { name: 'operatingHours', sql: 'ADD COLUMN operatingHours VARCHAR(255) NULL' },
      { name: 'recordsUrl', sql: 'ADD COLUMN recordsUrl VARCHAR(500) NULL' },
      { name: 'contractUrl', sql: 'ADD COLUMN contractUrl VARCHAR(500) NULL' },
      { name: 'backgroundImageUrl', sql: 'ADD COLUMN backgroundImageUrl VARCHAR(500) NULL' },
      { name: 'website', sql: 'ADD COLUMN website VARCHAR(255) NULL' },
    ]);

    await addIfMissing(conn, 'activity_logs', [
      { name: 'reason', sql: 'ADD COLUMN reason VARCHAR(1000) NULL' },
    ]);

    console.log('Schema sync done.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

main();
