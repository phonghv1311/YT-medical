import { registerAs } from '@nestjs/config';

/**
 * Database config.
 * - MySQL (default): DB_DRIVER=mysql or unset, port 3306
 * - PostgreSQL (new schema): DB_DRIVER=postgres, port 5432
 * Run backend/database/schema/*.sql on PostgreSQL to create the new schema.
 */
export default registerAs('database', () => {
  const driver = process.env.DB_DRIVER || 'mysql';
  const isPostgres = driver === 'postgres';
  return {
    driver,
    dialect: isPostgres ? 'postgres' : 'mysql',
    host: process.env.DB_HOST || (isPostgres ? 'localhost' : 'localhost'),
    port: parseInt(process.env.DB_PORT || (isPostgres ? '5432' : '3306'), 10),
    username: process.env.DB_USERNAME || (isPostgres ? 'postgres' : 'root'),
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'telemedicine',
  };
});
