-- Part 5: Patients

CREATE TABLE IF NOT EXISTS patients (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            UNIQUE REFERENCES users(id) ON DELETE SET NULL,

    blood_type      VARCHAR(5)      CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown')),
    height          DECIMAL(5,2),
    weight          DECIMAL(5,2),
    allergies       TEXT,
    chronic_diseases TEXT,
    medical_history TEXT,
    family_history  TEXT,

    health_insurance_number VARCHAR(50),
    health_insurance_expiry DATE,
    health_insurance_url    VARCHAR(500),

    emergency_name   VARCHAR(255),
    emergency_phone  VARCHAR(20),
    emergency_relationship VARCHAR(50),

    status           VARCHAR(20)    DEFAULT 'active',
    created_at       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_blood_type ON patients(blood_type);
