-- Part 6: Appointments & Time Slots (must exist before medical_records)

CREATE TABLE IF NOT EXISTS appointments (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),

    patient_id      UUID            NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    doctor_id       UUID            NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
    hospital_id     UUID            REFERENCES hospitals(id),
    department_id   UUID            REFERENCES departments(id),

    appointment_date DATE           NOT NULL,
    time_slot       VARCHAR(10)     NOT NULL,
    duration_minutes INT            DEFAULT 30,

    appointment_type VARCHAR(20)    DEFAULT 'consultation'
                    CHECK (appointment_type IN ('consultation', 'followup', 'checkup', 'emergency')),
    is_followup     BOOLEAN         DEFAULT FALSE,
    parent_appointment_id UUID      REFERENCES appointments(id),

    status          VARCHAR(20)     DEFAULT 'pending'
                    CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),

    reason          TEXT,
    notes           TEXT,
    symptoms        TEXT,

    confirmed_at    TIMESTAMP,
    started_at      TIMESTAMP,
    completed_at    TIMESTAMP,
    cancelled_at    TIMESTAMP,
    cancelled_by    UUID,
    cancel_reason   TEXT,

    check_in_code   VARCHAR(10)     UNIQUE,
    checked_in_at   TIMESTAMP,

    is_paid         BOOLEAN         DEFAULT FALSE,
    payment_amount  DECIMAL(10,2),

    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_hospital_id ON appointments(hospital_id);
CREATE INDEX IF NOT EXISTS idx_appointments_appointment_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_check_in_code ON appointments(check_in_code);
CREATE INDEX IF NOT EXISTS idx_appointments_created_at ON appointments(created_at DESC);

CREATE TABLE IF NOT EXISTS time_slots (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id       UUID            NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    hospital_id     UUID            REFERENCES hospitals(id),

    date            DATE            NOT NULL,
    time_slot       VARCHAR(10)     NOT NULL,

    is_available    BOOLEAN         DEFAULT TRUE,
    appointment_id  UUID            REFERENCES appointments(id),

    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(doctor_id, date, time_slot)
);

CREATE INDEX IF NOT EXISTS idx_time_slots_doctor_date ON time_slots(doctor_id, date);
CREATE INDEX IF NOT EXISTS idx_time_slots_date ON time_slots(date);
