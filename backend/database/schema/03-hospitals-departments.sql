-- Part 3: Hospitals, Departments, Positions, Specialties

CREATE TABLE IF NOT EXISTS hospitals (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255)    NOT NULL,
    slug            VARCHAR(255)    UNIQUE,
    logo_url        VARCHAR(500),
    cover_image_url VARCHAR(500),
    address         VARCHAR(500)    NOT NULL,
    ward            VARCHAR(100),
    district        VARCHAR(100),
    city            VARCHAR(100)    DEFAULT 'Hà Nội',
    country         VARCHAR(100)    DEFAULT 'Vietnam',
    phone           VARCHAR(20)    NOT NULL,
    email           VARCHAR(255),
    website         VARCHAR(255),
    description     TEXT,
    operating_hours JSONB           DEFAULT '{"monday": "07:00-18:00", "tuesday": "07:00-18:00", "wednesday": "07:00-18:00", "thursday": "07:00-18:00", "friday": "07:00-18:00", "saturday": "07:00-14:00", "sunday": null}',
    latitude        DECIMAL(10, 8),
    longitude       DECIMAL(11, 8),
    admin_id        UUID            REFERENCES users(id),
    status          VARCHAR(20)    DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
    is_verified     BOOLEAN         DEFAULT FALSE,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hospitals_name ON hospitals(name);
CREATE INDEX IF NOT EXISTS idx_hospitals_slug ON hospitals(slug);
CREATE INDEX IF NOT EXISTS idx_hospitals_city ON hospitals(city);
CREATE INDEX IF NOT EXISTS idx_hospitals_status ON hospitals(status);
CREATE INDEX IF NOT EXISTS idx_hospitals_admin_id ON hospitals(admin_id);

CREATE TABLE IF NOT EXISTS departments (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id     UUID            NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    name            VARCHAR(255)    NOT NULL,
    slug            VARCHAR(255),
    icon            VARCHAR(100),
    description     TEXT,
    parent_id       UUID            REFERENCES departments(id),
    display_order   INT             DEFAULT 0,
    status          VARCHAR(20)     DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(hospital_id, name)
);

CREATE INDEX IF NOT EXISTS idx_departments_hospital_id ON departments(hospital_id);
CREATE INDEX IF NOT EXISTS idx_departments_parent_id ON departments(parent_id);

CREATE TABLE IF NOT EXISTS positions (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id     UUID            REFERENCES hospitals(id) ON DELETE SET NULL,
    name            VARCHAR(255)    NOT NULL,
    description     TEXT,
    level           INT             DEFAULT 0,
    status          VARCHAR(20)     DEFAULT 'active',
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(hospital_id, name)
);

CREATE INDEX IF NOT EXISTS idx_positions_hospital_id ON positions(hospital_id);

CREATE TABLE IF NOT EXISTS specialties (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255)    NOT NULL UNIQUE,
    name_en         VARCHAR(255),
    icon            VARCHAR(100),
    description     TEXT,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);
