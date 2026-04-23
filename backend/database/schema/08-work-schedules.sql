-- Part 8: Work Schedules

CREATE TABLE IF NOT EXISTS work_schedules (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id       UUID            NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    hospital_id     UUID            REFERENCES hospitals(id),

    date            DATE            NOT NULL,
    shift           VARCHAR(20)     NOT NULL CHECK (shift IN ('morning', 'afternoon', 'evening', 'night')),
    start_time      TIME            NOT NULL,
    end_time        TIME            NOT NULL,

    status          VARCHAR(20)     DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'working', 'completed', 'cancelled')),
    notes           TEXT,

    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(doctor_id, date, shift)
);

CREATE INDEX IF NOT EXISTS idx_work_schedules_doctor_date ON work_schedules(doctor_id, date);
CREATE INDEX IF NOT EXISTS idx_work_schedules_date ON work_schedules(date);
CREATE INDEX IF NOT EXISTS idx_work_schedules_hospital_id ON work_schedules(hospital_id);

CREATE TABLE IF NOT EXISTS schedule_requests (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id       UUID            NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    work_schedule_id UUID           REFERENCES work_schedules(id),

    request_type    VARCHAR(20)     NOT NULL CHECK (request_type IN ('change', 'swap', 'leave', 'add')),
    new_date        DATE,
    new_shift       VARCHAR(20),
    new_start_time  TIME,
    new_end_time    TIME,

    reason          TEXT,
    status          VARCHAR(20)     DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by     UUID            REFERENCES users(id),
    approved_at     TIMESTAMP,
    rejection_reason TEXT,

    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_schedule_requests_doctor_id ON schedule_requests(doctor_id);
CREATE INDEX IF NOT EXISTS idx_schedule_requests_status ON schedule_requests(status);
