-- =====================================================
-- MEDICAL APP - PostgreSQL Schema
-- Part 1: Users & Authentication
-- Run order: 01 -> 02 -> 03 -> ... -> 12
-- =====================================================

-- USERS
CREATE TABLE IF NOT EXISTS users (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255)    NOT NULL UNIQUE,
    password_hash   VARCHAR(255)    NOT NULL,
    phone           VARCHAR(20)     UNIQUE,
    role            VARCHAR(20)     NOT NULL DEFAULT 'customer'
                    CHECK (role IN ('superadmin', 'admin', 'doctor', 'customer')),
    status          VARCHAR(20)     NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
    email_verified  BOOLEAN         DEFAULT FALSE,
    phone_verified  BOOLEAN         DEFAULT FALSE,
    last_login_at   TIMESTAMP,
    last_login_ip   VARCHAR(45),
    failed_login_attempts INT       DEFAULT 0,
    locked_until    TIMESTAMP,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- USER PROFILES
CREATE TABLE IF NOT EXISTS user_profiles (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    full_name       VARCHAR(255)    NOT NULL,
    avatar_url      VARCHAR(500),
    date_of_birth   DATE,
    gender          VARCHAR(10)     CHECK (gender IN ('male', 'female', 'other')),
    address         TEXT,
    city            VARCHAR(100),
    country         VARCHAR(100)    DEFAULT 'Vietnam',
    cccd_number     VARCHAR(12),
    cccd_front_url  VARCHAR(500),
    cccd_back_url   VARCHAR(500),
    bio             TEXT,
    language        VARCHAR(10)     DEFAULT 'vi',
    timezone        VARCHAR(50)     DEFAULT 'Asia/Ho_Chi_Minh',
    notification_settings JSONB     DEFAULT '{"email": true, "push": true, "sms": false}',
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- SESSIONS
CREATE TABLE IF NOT EXISTS sessions (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      VARCHAR(255)    NOT NULL,
    device_info     VARCHAR(500),
    ip_address      VARCHAR(45),
    user_agent      VARCHAR(500),
    expires_at      TIMESTAMP       NOT NULL,
    is_revoked      BOOLEAN         DEFAULT FALSE,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- PASSWORD RESETS
CREATE TABLE IF NOT EXISTS password_resets (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    otp             VARCHAR(6)     NOT NULL,
    otp_hash        VARCHAR(255)   NOT NULL,
    purpose         VARCHAR(20)    DEFAULT 'reset' CHECK (purpose IN ('reset', 'verify')),
    attempts        INT            DEFAULT 0,
    max_attempts    INT            DEFAULT 5,
    expires_at      TIMESTAMP      NOT NULL,
    used_at         TIMESTAMP,
    created_at      TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets(user_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_otp ON password_resets(otp_hash);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires ON password_resets(expires_at);
