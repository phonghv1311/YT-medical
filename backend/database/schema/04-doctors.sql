-- Part 4: Doctors

CREATE TABLE IF NOT EXISTS doctors (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    hospital_id     UUID            REFERENCES hospitals(id) ON DELETE SET NULL,
    department_id   UUID            REFERENCES departments(id) ON DELETE SET NULL,
    position_id     UUID            REFERENCES positions(id) ON DELETE SET NULL,
    specialty_id    UUID            REFERENCES specialties(id),

    license_number  VARCHAR(50),
    license_url     VARCHAR(500),
    experience_years INT            DEFAULT 0,
    education       TEXT,
    achievements    TEXT,
    bio             TEXT,

    schedule_preference JSONB        DEFAULT '{"morning": true, "afternoon": true, "evening": false}',

    approval_status VARCHAR(20)     DEFAULT 'pending'
                    CHECK (approval_status IN ('pending', 'approved', 'rejected', 'suspended')),
    approved_by     UUID            REFERENCES users(id),
    approved_at     TIMESTAMP,
    rejection_reason TEXT,

    rating          DECIMAL(3,2)    DEFAULT 0,
    review_count    INT             DEFAULT 0,

    is_available    BOOLEAN         DEFAULT TRUE,
    status          VARCHAR(20)     DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),

    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_hospital_id ON doctors(hospital_id);
CREATE INDEX IF NOT EXISTS idx_doctors_department_id ON doctors(department_id);
CREATE INDEX IF NOT EXISTS idx_doctors_specialty_id ON doctors(specialty_id);
CREATE INDEX IF NOT EXISTS idx_doctors_approval_status ON doctors(approval_status);
CREATE INDEX IF NOT EXISTS idx_doctors_rating ON doctors(rating DESC);
