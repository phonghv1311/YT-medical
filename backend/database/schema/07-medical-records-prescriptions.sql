-- Part 7: Medical Records & Prescriptions

CREATE TABLE IF NOT EXISTS medical_records (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id      UUID            NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id       UUID            NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
    appointment_id  UUID            REFERENCES appointments(id) ON DELETE SET NULL,
    hospital_id     UUID            REFERENCES hospitals(id),
    department_id   UUID            REFERENCES departments(id),

    visit_date      DATE            NOT NULL,
    chief_complaint TEXT,
    symptoms        TEXT,
    diagnosis       TEXT,
    diagnosis_codes JSONB,

    vital_signs     JSONB           DEFAULT '{"blood_pressure": null, "heart_rate": null, "temperature": null, "breathing_rate": null, "spo2": null}',
    physical_exam   TEXT,

    treatment_plan  TEXT,
    follow_up_date  DATE,
    follow_up_notes TEXT,

    status          VARCHAR(20)     DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),

    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_doctor_id ON medical_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_visit_date ON medical_records(visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_medical_records_appointment_id ON medical_records(appointment_id);

CREATE TABLE IF NOT EXISTS prescriptions (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    medical_record_id UUID          NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
    patient_id      UUID            NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id       UUID            NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,

    prescription_date DATE          NOT NULL,
    diagnosis        TEXT,

    medicines        JSONB          NOT NULL,

    instructions     TEXT,
    notes            TEXT,

    status           VARCHAR(20)    DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
    is_printed       BOOLEAN        DEFAULT FALSE,

    created_at       TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_medical_record_id ON prescriptions(medical_record_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor_id ON prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_prescription_date ON prescriptions(prescription_date DESC);
