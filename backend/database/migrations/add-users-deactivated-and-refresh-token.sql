-- Add columns to `users` table for Sequelize User model (MySQL).
-- Run this if you get: Unknown column 'User.deactivatedReason' in 'field list'
--
-- Usage:
--   mysql -u root -p telemedicine < backend/database/migrations/add-users-deactivated-and-refresh-token.sql
-- Or from MySQL client: USE telemedicine; then paste the ALTER statements below.
--
-- Run once. If a column already exists, MySQL will error "Duplicate column"; skip that line.

-- Deactivation tracking (used by admin deactivate user)
ALTER TABLE users ADD COLUMN deactivatedReason VARCHAR(1000) NULL;
ALTER TABLE users ADD COLUMN deactivatedAt DATETIME NULL;

-- Refresh token for JWT refresh (used by auth login)
ALTER TABLE users ADD COLUMN refreshToken VARCHAR(1000) NULL;
