-- Part 12: Notifications & Audit

CREATE TABLE IF NOT EXISTS notifications (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    type            VARCHAR(50)     NOT NULL,
    title           VARCHAR(255)    NOT NULL,
    content         TEXT,
    data            JSONB,

    action_url      VARCHAR(500),
    action_type     VARCHAR(20),

    is_read         BOOLEAN         DEFAULT FALSE,
    read_at         TIMESTAMP,

    send_via        VARCHAR(20)     DEFAULT 'all',

    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

CREATE TABLE IF NOT EXISTS notification_settings (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    email_enabled   BOOLEAN         DEFAULT TRUE,
    push_enabled    BOOLEAN         DEFAULT TRUE,
    sms_enabled     BOOLEAN         DEFAULT FALSE,

    appointment_reminder BOOLEAN    DEFAULT TRUE,
    appointment_update  BOOLEAN     DEFAULT TRUE,
    new_message     BOOLEAN         DEFAULT TRUE,
    news_alerts     BOOLEAN         DEFAULT TRUE,
    promotions      BOOLEAN         DEFAULT TRUE,
    payment_alerts  BOOLEAN         DEFAULT TRUE,

    quiet_hours_start TIME,
    quiet_hours_end   TIME,

    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings(user_id);

CREATE TABLE IF NOT EXISTS notification_schedules (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    notification_type VARCHAR(50)   NOT NULL,
    title           VARCHAR(255)    NOT NULL,
    content         TEXT,
    data            JSONB,

    scheduled_at    TIMESTAMP       NOT NULL,
    sent_at         TIMESTAMP,

    status          VARCHAR(20)     DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),

    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_schedules_user_id ON notification_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_schedules_scheduled_at ON notification_schedules(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_notification_schedules_status ON notification_schedules(status);

-- Audit & Logs

CREATE TABLE IF NOT EXISTS audit_logs (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id         UUID            REFERENCES users(id),
    session_id      UUID,
    ip_address      VARCHAR(45),
    user_agent      VARCHAR(500),

    action          VARCHAR(100)    NOT NULL,
    entity_type     VARCHAR(50),
    entity_id       UUID,

    old_values      JSONB,
    new_values      JSONB,

    description     TEXT,

    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS api_logs (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id         UUID,
    method          VARCHAR(10)     NOT NULL,
    path            VARCHAR(500)    NOT NULL,
    query_params    JSONB,
    body            JSONB,

    response_status INT,
    response_time   INT,
    response_size   BIGINT,

    ip_address      VARCHAR(45),
    user_agent      VARCHAR(500),

    error_message   TEXT,

    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_api_logs_user_id ON api_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON api_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS login_history (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    ip_address      VARCHAR(45),
    user_agent      VARCHAR(500),
    device_info     VARCHAR(500),
    location        VARCHAR(255),

    status          VARCHAR(20)     NOT NULL CHECK (status IN ('success', 'failed', 'locked')),
    failure_reason  VARCHAR(100),

    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_created_at ON login_history(created_at DESC);
